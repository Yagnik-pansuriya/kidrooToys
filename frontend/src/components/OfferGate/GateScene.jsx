/* eslint-disable react/no-unknown-property, react/prop-types */
import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import { AdditiveBlending, Color, DoubleSide, MathUtils, Object3D, Vector3 } from 'three';
import {
  BeachBall, Cloud, Crayon, Duck, Gift, LetterBlock, RingStack, SpinningTop, Star, useIdleMotion,
} from './toys';

// ── Scroll timeline (progress 0 → 1 across the gate section) ─────────
const BOW_UNTIE = [0.04, 0.18];
const DOORS_OPEN = [0.14, 0.5];
const CAMERA_PUSH = [0.22, 0.95];
const BOX_OPEN = [0.6, 0.8];
const BURST_AT = 0.62;

const DOOR_SWING = 1.95; // radians each leaf swings inward
const HALF_OPENING = 2.1; // gate opening is 4.2 units wide
const PILLAR_X = 2.65;
const BOX_Z = -6.5;
const FOV = 45;

const seg = (p, [a, b]) => MathUtils.clamp((p - a) / (b - a), 0, 1);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOutBack = (t) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;

const CRAYON_COLORS = ['#ff5c5c', '#ff9f43', '#feca57', '#1dd1a1', '#54a0ff', '#5f27cd', '#ff6bcb'];
const RAINBOW = ['#ff5c5c', '#ff9f43', '#feca57', '#1dd1a1', '#54a0ff'];
const BLOCK_COLORS = ['#ff6b6b', '#4ecdc4', '#feca57', '#5f27cd'];

// ── Gate ──────────────────────────────────────────────────────────────
const DoorLeaf = ({ side, leafRef }) => {
  // side -1 = left leaf (hinge on the left), +1 = right leaf
  const crayons = CRAYON_COLORS.map((color, i) => {
    const fromHinge = (i + 0.5) * (HALF_OPENING / CRAYON_COLORS.length);
    return { color, x: -side * fromHinge, length: 2.5 + (i / 6) * 0.7 };
  });
  return (
    <group ref={leafRef} position={[side * HALF_OPENING, 0, 0]}>
      {crayons.map((c) => (
        <Crayon key={c.color} color={c.color} length={c.length} position={[c.x, 0.08, 0]} />
      ))}
      {[0.85, 2.35].map((y) => (
        <mesh key={y} position={[-side * HALF_OPENING / 2, y, 0.17]}>
          <boxGeometry args={[HALF_OPENING, 0.18, 0.14]} />
          <meshStandardMaterial color="#f5d0a9" roughness={0.75} />
        </mesh>
      ))}
      {/* ribbon wrapped across the doors */}
      <mesh position={[-side * HALF_OPENING / 2, 1.6, 0.26]}>
        <boxGeometry args={[HALF_OPENING, 0.26, 0.04]} />
        <meshStandardMaterial color="#ff3b5c" roughness={0.4} />
      </mesh>
    </group>
  );
};

const Bow = ({ bowRef }) => (
  <group ref={bowRef} position={[0, 1.6, 0.36]}>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 0.36, 0.08, 0]} rotation={[0, 0, s * 0.35]} scale={[1.35, 0.85, 1]}>
        <torusGeometry args={[0.26, 0.085, 12, 32]} />
        <meshStandardMaterial color="#ff3b5c" roughness={0.35} />
      </mesh>
    ))}
    {[-1, 1].map((s) => (
      <mesh key={`tail${s}`} position={[s * 0.18, -0.35, 0]} rotation={[0, 0, s * 0.35]}>
        <boxGeometry args={[0.16, 0.6, 0.04]} />
        <meshStandardMaterial color="#ff3b5c" roughness={0.35} />
      </mesh>
    ))}
    <mesh>
      <sphereGeometry args={[0.15, 20, 16]} />
      <meshStandardMaterial color="#e8173f" roughness={0.3} />
    </mesh>
  </group>
);

const Pillar = ({ x, word }) => (
  <group position={[x, 0, 0]}>
    {word.split('').reverse().map((letter, i) => (
      <LetterBlock
        key={i}
        letter={letter}
        color={BLOCK_COLORS[(i + (x > 0 ? 2 : 0)) % BLOCK_COLORS.length]}
        size={0.96}
        position={[(i % 2 ? 0.05 : -0.04), 0.48 + i * 0.98, 0]}
        rotation={[0, (i % 2 ? 0.08 : -0.06), 0]}
      />
    ))}
    <Cloud position={[0, 4.15, 0.25]} scale={0.95} />
  </group>
);

const RainbowArch = () => (
  <group position={[0, 4.05, 0]}>
    {RAINBOW.map((color, i) => (
      <mesh key={color}>
        <torusGeometry args={[PILLAR_X + 0.4 - i * 0.2, 0.105, 12, 72, Math.PI]} />
        <meshStandardMaterial color={color} roughness={0.45} />
      </mesh>
    ))}
  </group>
);

const TopStar = () => {
  const ref = useRef(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 1.2;
    ref.current.position.y = 7.35 + Math.sin(clock.elapsedTime * 2) * 0.08;
  });
  return (
    <group ref={ref} position={[0, 7.35, 0]}>
      <Star scale={1.3} emissive={0.45} />
    </group>
  );
};

// ── Ground & path ─────────────────────────────────────────────────────
const PATH_TILES = Array.from({ length: 15 }, (_, i) => ({
  z: 9 - i * 1.15,
  color: ['#ffb3c7', '#b8e1ff', '#fff1a8', '#c3f5d1'][i % 4],
  rot: ((i * 37) % 9 - 4) * 0.03,
}));

const Ground = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -4]}>
      <circleGeometry args={[42, 64]} />
      <meshStandardMaterial color="#c9f2d8" roughness={1} />
    </mesh>
    {PATH_TILES.map((t) => (
      <mesh key={t.z} position={[0, 0.03, t.z]} rotation={[0, t.rot, 0]}>
        <boxGeometry args={[1.05, 0.06, 1.05]} />
        <meshStandardMaterial color={t.color} roughness={0.8} />
      </mesh>
    ))}
  </group>
);

// ── Floating toys around the scene ────────────────────────────────────
const Floater = ({ seed, children, motion, ...props }) => {
  const ref = useIdleMotion(seed, motion);
  return <group ref={ref} {...props}>{children}</group>;
};

const FLOATERS = [
  // in front of the gate
  { pos: [-5.2, 2.6, 3.5], el: <BeachBall size={0.55} /> },
  { pos: [5.4, 3.4, 2.5], el: <LetterBlock letter="A" color="#ff6b6b" size={0.8} /> },
  { pos: [4.6, 1.2, 5], el: <LetterBlock letter="B" color="#4ecdc4" size={0.7} /> },
  { pos: [-4.5, 4.4, 1.5], el: <Star color="#ff6bcb" /> },
  { pos: [6.5, 5.6, -1], el: <Star color="#54a0ff" scale={0.8} /> },
  { pos: [-6.8, 5.8, -2], el: <Cloud scale={1.3} />, motion: { bob: 0.12, spin: 0, sway: 0.02 } },
  { pos: [7.5, 6.5, -4], el: <Cloud scale={1.1} />, motion: { bob: 0.1, spin: 0, sway: 0.02 } },
  // behind the gate, around the gift
  { pos: [-2.6, 2.3, -5.4], el: <LetterBlock letter="C" color="#feca57" size={0.6} /> },
  { pos: [2.7, 2.8, -6], el: <BeachBall size={0.4} /> },
  { pos: [-3.4, 1.4, -8], el: <Duck scale={0.9} /> },
  { pos: [3.2, 1.2, -8.5], el: <Gift color="#54a0ff" ribbon="#ffffff" /> },
  { pos: [-1.8, 3.6, -9], el: <Star color="#feca57" scale={0.7} /> },
  { pos: [1.9, 3.8, -7.4], el: <Star color="#1dd1a1" scale={0.55} /> },
  { pos: [-5.5, 2.2, -10], el: <Gift color="#1dd1a1" ribbon="#ff5c5c" size={0.9} /> },
  { pos: [5.6, 2.6, -11], el: <LetterBlock letter="Z" color="#5f27cd" size={0.8} /> },
];

const GroundToys = () => (
  <>
    <RingStack position={[-4.2, 0, 4.2]} rotation={[0, 0.4, 0]} />
    <SpinningTop position={[3.8, 0, 6.2]} color="#ff6b6b" />
    <Duck position={[-3.4, 0.35, 6.5]} rotation={[0, 0.9, 0]} scale={0.8} />
    <RingStack position={[3.6, 0, -9.5]} scale={0.9} />
    <SpinningTop position={[-2.4, 0, -7.2]} color="#54a0ff" speed={8} />
    <SpinningTop position={[2.2, 0, -5.4]} color="#ff9f43" speed={5} scale={0.8} />
    <Gift position={[-1.6, 0, -4.4]} color="#ff9f43" ribbon="#5f27cd" size={0.55} />
  </>
);

// ── The big prize box behind the gate ────────────────────────────────
const PrizeBox = ({ lidRef, boxRef, beamRef }) => (
  <group ref={boxRef} position={[0, 0, BOX_Z]}>
    <mesh position={[0, 0.65, 0]}>
      <boxGeometry args={[1.5, 1.3, 1.5]} />
      <meshStandardMaterial color="#6c3ce1" roughness={0.45} />
    </mesh>
    <mesh position={[0, 0.65, 0]}>
      <boxGeometry args={[1.52, 1.31, 0.3]} />
      <meshStandardMaterial color="#feca57" roughness={0.35} />
    </mesh>
    <mesh position={[0, 0.65, 0]}>
      <boxGeometry args={[0.3, 1.31, 1.52]} />
      <meshStandardMaterial color="#feca57" roughness={0.35} />
    </mesh>
    <group ref={lidRef} position={[0, 1.3, 0]}>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[1.66, 0.24, 1.66]} />
        <meshStandardMaterial color="#7d4dff" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.3, 0.25, 1.68]} />
        <meshStandardMaterial color="#feca57" roughness={0.35} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.28, 0.4, 0]} rotation={[0, 0, s * 0.5]} scale={[1.3, 0.85, 1]}>
          <torusGeometry args={[0.22, 0.07, 12, 28]} />
          <meshStandardMaterial color="#feca57" roughness={0.35} />
        </mesh>
      ))}
    </group>
    <mesh ref={beamRef} position={[0, 3.6, 0]} rotation={[Math.PI, 0, 0]}>
      <coneGeometry args={[2.2, 5, 40, 1, true]} />
      <meshBasicMaterial color="#fff3b0" transparent opacity={0} blending={AdditiveBlending} depthWrite={false} side={DoubleSide} />
    </mesh>
  </group>
);

// ── Confetti burst ────────────────────────────────────────────────────
const CONFETTI_COUNT = 220;
const CONFETTI_COLORS = ['#ff5c5c', '#ff9f43', '#feca57', '#1dd1a1', '#54a0ff', '#5f27cd', '#ff6bcb', '#ffffff'];
const GRAVITY = -4.2;
const CONFETTI_LIFE = 5;

const Confetti = ({ burstRef }) => {
  const meshRef = useRef(null);
  const dummy = useMemo(() => new Object3D(), []);
  const pieces = useMemo(() => Array.from({ length: CONFETTI_COUNT }, () => {
    const a = Math.random() * Math.PI * 2;
    const spread = 0.6 + Math.random() * 2.4;
    return {
      v: new Vector3(Math.cos(a) * spread, 3 + Math.random() * 2.6, Math.sin(a) * spread * 0.7 + 0.8),
      spin: new Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8),
      flutter: Math.random() * Math.PI * 2,
    };
  }), []);

  const colorsSet = useRef(false);
  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    if (!colorsSet.current) {
      const c = new Color();
      pieces.forEach((_, i) => mesh.setColorAt(i, c.set(CONFETTI_COLORS[i % CONFETTI_COLORS.length])));
      mesh.instanceColor.needsUpdate = true;
      colorsSet.current = true;
    }
    const start = burstRef.current;
    const t = start === null ? Infinity : clock.elapsedTime - start;
    const alive = t < CONFETTI_LIFE;
    mesh.visible = alive;
    if (!alive) return;
    pieces.forEach((p, i) => {
      const drag = 1 - Math.exp(-t * 1.4);
      dummy.position.set(
        p.v.x * drag / 1.4 + Math.sin(t * 3 + p.flutter) * 0.15,
        1.4 + p.v.y * t + 0.5 * GRAVITY * t * t,
        BOX_Z + p.v.z * drag / 1.4,
      );
      if (dummy.position.y < 0.02) dummy.position.y = 0.02;
      dummy.rotation.set(p.spin.x * t, p.spin.y * t, p.spin.z * t);
      dummy.scale.setScalar(Math.min(1, (CONFETTI_LIFE - t) * 1.5));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, CONFETTI_COUNT]} frustumCulled={false} visible={false}>
      <planeGeometry args={[0.14, 0.08]} />
      <meshBasicMaterial side={DoubleSide} toneMapped={false} />
    </instancedMesh>
  );
};

// ── Director: maps scroll progress to everything that moves ──────────
const lookTarget = new Vector3();

const World = ({ progressRef, hasOffers }) => {
  const { camera, size } = useThree();
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const bowRef = useRef(null);
  const lidRef = useRef(null);
  const boxRef = useRef(null);
  const beamRef = useRef(null);
  const burstRef = useRef(null);
  const smooth = useRef(0);

  // Pull the camera back on narrow screens so the whole gate fits
  const [startZ, endZ] = useMemo(() => {
    const aspect = size.width / Math.max(1, size.height);
    const halfTan = Math.tan(MathUtils.degToRad(FOV / 2));
    const start = Math.max(13.5, 4 / (halfTan * aspect) + 1.5);
    return [start, 0.2 + (start - 13.5) * 0.25];
  }, [size.width, size.height]);

  useFrame(({ clock, pointer }, dt) => {
    const t = clock.elapsedTime;
    smooth.current = MathUtils.damp(smooth.current, progressRef.current.target, 4, Math.min(dt, 0.1));
    const p = smooth.current;

    // Bow unties and flies away
    const bow = easeInOut(seg(p, BOW_UNTIE));
    if (bowRef.current) {
      bowRef.current.position.set(0, 1.6 + bow * 3, 0.36 + bow * 1.5);
      bowRef.current.rotation.z = bow * Math.PI * 3;
      bowRef.current.scale.setScalar(Math.max(0.0001, (1 - bow) * (1 + Math.sin(t * 3) * 0.05)));
    }

    // Doors rattle invitingly while locked, then swing inward
    const open = easeInOut(seg(p, DOORS_OPEN));
    const locked = 1 - seg(p, [0, BOW_UNTIE[1]]);
    const rattle = locked * (Math.sin(t * 1.4) > 0.8 ? Math.sin(t * 38) * 0.025 : 0);
    if (leftRef.current) leftRef.current.rotation.y = open * DOOR_SWING + rattle;
    if (rightRef.current) rightRef.current.rotation.y = -open * DOOR_SWING - rattle;

    // Camera glides along the path, through the gate, up to the prize box
    const push = easeInOut(seg(p, CAMERA_PUSH));
    camera.position.set(
      pointer.x * 0.5 * (1 - push * 0.6),
      MathUtils.lerp(2.6, 2.5, push) + pointer.y * 0.25,
      MathUtils.lerp(startZ, endZ, push),
    );
    lookTarget.set(0, MathUtils.lerp(3.3, 0.6, push), MathUtils.lerp(0, BOX_Z, push));
    camera.lookAt(lookTarget);

    // Prize box: bursts open when there are deals, dozes when there are none
    const reveal = seg(p, BOX_OPEN);
    if (lidRef.current && boxRef.current) {
      if (hasOffers) {
        const lid = easeOutBack(reveal);
        lidRef.current.position.set(-lid * 1.1, 1.3 + lid * 1.2, -lid * 0.8);
        lidRef.current.rotation.set(-lid * 0.5, 0, lid * 0.7);
        const hop = reveal > 0 && reveal < 1 ? Math.sin(reveal * Math.PI) * 0.12 : 0;
        boxRef.current.scale.set(1 + hop, 1 - hop, 1 + hop);
      } else {
        lidRef.current.position.set(0, 1.3 + Math.max(0, Math.sin(t * 1.6)) * 0.05, 0);
        lidRef.current.rotation.set(0, 0, 0);
        const breathe = Math.sin(t * 1.6) * 0.02;
        boxRef.current.scale.set(1 + breathe, 1 - breathe, 1 + breathe);
      }
    }
    if (beamRef.current) {
      beamRef.current.material.opacity = hasOffers ? reveal * (0.28 + Math.sin(t * 2.5) * 0.06) : 0;
    }

    // Fire confetti each time the reveal threshold is crossed going forward
    if (hasOffers) {
      if (p >= BURST_AT && burstRef.current === null) burstRef.current = t;
      else if (p < BURST_AT - 0.05) burstRef.current = null;
    }
  });

  return (
    <>
      <Ground />
      <Pillar x={-PILLAR_X} word="TOYS" />
      <Pillar x={PILLAR_X} word="JOY!" />
      <RainbowArch />
      <TopStar />
      <DoorLeaf side={-1} leafRef={leftRef} />
      <DoorLeaf side={1} leafRef={rightRef} />
      <Bow bowRef={bowRef} />

      {FLOATERS.map((f, i) => (
        <Floater key={i} seed={i} position={f.pos} motion={f.motion}>{f.el}</Floater>
      ))}
      <GroundToys />

      <PrizeBox lidRef={lidRef} boxRef={boxRef} beamRef={beamRef} />
      <Confetti burstRef={burstRef} />
      <Sparkles count={70} scale={[7, 4, 6]} position={[0, 2.2, BOX_Z]} size={5} speed={0.5} color="#ffe27a" />
      <Sparkles count={50} scale={[14, 6, 10]} position={[0, 3, 3]} size={3} speed={0.3} color="#ffffff" />
    </>
  );
};

const GateScene = ({ progressRef, hasOffers, active }) => (
  <Canvas
    dpr={[1, 1.75]}
    frameloop={active ? 'always' : 'never'}
    camera={{ fov: FOV, position: [0, 2.7, 12], near: 0.1, far: 80 }}
    gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
  >
    <fog attach="fog" args={['#fdeef6', 16, 40]} />
    <hemisphereLight args={['#ffffff', '#ffd6e8', 1.15]} />
    <directionalLight position={[5, 9, 7]} intensity={1.7} />
    <directionalLight position={[-6, 4, -8]} intensity={0.6} color="#b8e1ff" />
    <World progressRef={progressRef} hasOffers={hasOffers} />
  </Canvas>
);

export default GateScene;
