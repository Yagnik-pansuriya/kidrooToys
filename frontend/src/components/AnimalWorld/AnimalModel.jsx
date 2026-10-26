import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import { Box3, CanvasTexture, LoopOnce, LoopRepeat, MathUtils, Vector3 } from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';

const MODEL_SIZE = 1.5; // longest side of every animal, in world units
const WALK_RANGE = 0.55; // how far left/right an animal may wander inside its spot
const HOP_TIME = 0.6;
const HOP_HEIGHT = 0.3;
const FADE = 0.3;

const rand = (min, max) => min + Math.random() * (max - min);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

// 'Idle' matches 'AnimalArmature|Idle' (Quaternius naming)
const findAction = (actions, name) => {
  if (!name) return null;
  const key = Object.keys(actions).find((k) => k === name || k.endsWith(`|${name}`));
  return key ? actions[key] : null;
};

// Soft round contact shadow, shared by every animal
let shadowTexture = null;
const getShadowTexture = () => {
  if (!shadowTexture) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(60, 40, 20, 0.42)');
    gradient.addColorStop(1, 'rgba(60, 40, 20, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    shadowTexture = new CanvasTexture(canvas);
  }
  return shadowTexture;
};

const AnimalModel = forwardRef(({ animal, faceDir = 1 }, ref) => {
  const { scene, animations } = useGLTF(animal.model);
  const rigRef = useRef(null);
  const moveRef = useRef(null);
  const bodyRef = useRef(null);
  const shadowRef = useRef(null);

  // Each spot gets its own skeleton, scaled to a common size and placed on the ground
  const { model, fit } = useMemo(() => {
    const clone = cloneSkinned(scene);
    clone.traverse((obj) => {
      if (obj.isMesh) obj.frustumCulled = false;
    });
    clone.updateMatrixWorld(true);
    const box = new Box3().setFromObject(clone);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const scale = MODEL_SIZE / Math.max(size.x, size.y, size.z);
    return {
      model: clone,
      fit: { scale, position: [-center.x * scale, -box.min.y * scale, -center.z * scale] },
    };
  }, [scene]);

  const { actions, mixer } = useAnimations(animations, rigRef);
  const brain = useRef({ mode: 'idle', action: null, nextAt: rand(2, 5), targetX: 0, hop: -1, t: 0 });
  const restAngle = faceDir * 0.6; // 3/4 view, looking toward the page content

  const play = useCallback(
    (name, once = false) => {
      const next = findAction(actions, name) || findAction(actions, animal.idles[0]);
      if (!next) return null;
      const b = brain.current;
      if (next === b.action && !once) return next;
      next.reset();
      next.setLoop(once ? LoopOnce : LoopRepeat, once ? 1 : Infinity);
      next.clampWhenFinished = once;
      next.fadeIn(FADE).play();
      if (b.action && b.action !== next) b.action.fadeOut(FADE);
      b.action = next;
      return next;
    },
    [actions, animal]
  );

  const backToIdle = useCallback(
    (delay = [3, 6]) => {
      const b = brain.current;
      b.mode = 'idle';
      b.nextAt = b.t + rand(delay[0], delay[1]);
      play(pick(animal.idles));
    },
    [play, animal]
  );

  // Start idling, and return to idle whenever a one-shot gesture finishes
  useEffect(() => {
    play(animal.idles[0]);
    const onFinished = (e) => {
      const b = brain.current;
      if (e.action !== b.action) return;
      if (b.mode === 'hover') play(animal.idles[0]);
      else backToIdle();
    };
    mixer.addEventListener('finished', onFinished);
    return () => mixer.removeEventListener('finished', onFinished);
  }, [mixer, play, backToIdle, animal]);

  useImperativeHandle(
    ref,
    () => ({
      perform() {
        const b = brain.current;
        b.mode = 'perform';
        b.hop = 0;
        const action = play(animal.click, true);
        if (!action) setTimeout(backToIdle, 1200);
      },
      hover(on) {
        const b = brain.current;
        if (on && (b.mode === 'idle' || b.mode === 'walk')) {
          b.mode = 'hover';
          play(animal.hover, animal.hover === animal.click || animal.id === 'frog');
        } else if (!on && b.mode === 'hover') {
          backToIdle([1.5, 3]);
        }
      },
    }),
    [play, backToIdle, animal]
  );

  useFrame((state, delta) => {
    const b = brain.current;
    const mover = moveRef.current;
    const body = bodyRef.current;
    if (!mover || !body) return;
    const dt = Math.min(delta, 0.05);
    b.t = state.clock.elapsedTime;

    // Idle brain: every few seconds either change gesture or wander somewhere new
    if (b.mode === 'idle' && b.t > b.nextAt) {
      if (animal.walk && Math.random() < 0.45) {
        let target = rand(-WALK_RANGE, WALK_RANGE);
        if (Math.abs(target - mover.position.x) < 0.3) target = -Math.sign(mover.position.x || 1) * WALK_RANGE;
        b.targetX = target;
        b.mode = 'walk';
        play(animal.walk);
      } else {
        play(pick(animal.idles));
        b.nextAt = b.t + rand(3.5, 7);
      }
    }

    let targetAngle = restAngle;
    if (b.mode === 'walk') {
      const dx = b.targetX - mover.position.x;
      targetAngle = Math.sign(dx) * (Math.PI / 2);
      mover.position.x += Math.sign(dx) * Math.min(Math.abs(dx), animal.walkSpeed * dt);
      if (Math.abs(dx) < 0.01) backToIdle();
    } else if (b.mode === 'hover' || b.mode === 'perform') {
      targetAngle = 0; // turn to look at the child
    }
    body.rotation.y = MathUtils.damp(body.rotation.y, targetAngle, b.mode === 'walk' ? 5 : 7, dt);

    // Happy hop with a little squash & stretch when tapped
    let lift = 0;
    if (b.hop >= 0) {
      b.hop += dt / HOP_TIME;
      if (b.hop >= 1) {
        b.hop = -1;
      } else {
        lift = Math.sin(b.hop * Math.PI) * HOP_HEIGHT;
      }
    }
    body.position.y = lift;
    const stretch = 1 + lift * 0.35;
    body.scale.set(1 / Math.sqrt(stretch), stretch, 1 / Math.sqrt(stretch));

    if (shadowRef.current) {
      const s = 1 - lift * 1.2;
      shadowRef.current.scale.set(s, s, s);
      shadowRef.current.material.opacity = 0.9 * s;
    }
  });

  return (
    <group ref={moveRef}>
      <mesh ref={shadowRef} rotation-x={-Math.PI / 2} position-y={0.005}>
        <planeGeometry args={[1.5, 1.5]} />
        <meshBasicMaterial map={getShadowTexture()} transparent depthWrite={false} />
      </mesh>
      <group ref={bodyRef} rotation-y={restAngle}>
        <group ref={rigRef} scale={fit.scale} position={fit.position}>
          <primitive object={model} />
        </group>
      </group>
    </group>
  );
});

AnimalModel.displayName = 'AnimalModel';

export default AnimalModel;
