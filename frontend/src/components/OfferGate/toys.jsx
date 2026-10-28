/* eslint-disable react/no-unknown-property, react/prop-types */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, ExtrudeGeometry, Shape, SRGBColorSpace } from 'three';

// Every toy here is built from primitives, so the gate needs no model downloads.

const textureCache = new Map();
const cachedTexture = (key, draw, width = 256, height = 256) => {
  if (!textureCache.has(key)) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    draw(canvas.getContext('2d'), width, height);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 4;
    textureCache.set(key, texture);
  }
  return textureCache.get(key);
};

const letterTexture = (letter, color) =>
  cachedTexture(`letter:${letter}:${color}`, (ctx, w, h) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 14;
    ctx.strokeRect(18, 18, w - 36, h - 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 150px "Fredoka", "Nunito", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowOffsetY = 8;
    ctx.fillText(letter, w / 2, h / 2 + 8);
  });

const BALL_COLORS = ['#ff5c5c', '#ffffff', '#feca57', '#ffffff', '#54a0ff', '#ffffff'];
const beachBallTexture = () =>
  cachedTexture('beachball', (ctx, w, h) => {
    const stripe = w / BALL_COLORS.length;
    BALL_COLORS.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(i * stripe, 0, stripe + 1, h);
    });
  }, 512, 256);

export const LetterBlock = ({ letter, color, size = 1, ...props }) => (
  <mesh {...props}>
    <boxGeometry args={[size, size, size]} />
    <meshStandardMaterial map={letterTexture(letter, color)} roughness={0.55} />
  </mesh>
);

export const BeachBall = ({ size = 0.5, ...props }) => (
  <mesh {...props}>
    <sphereGeometry args={[size, 32, 24]} />
    <meshStandardMaterial map={beachBallTexture()} roughness={0.35} />
  </mesh>
);

export const Crayon = ({ color, length = 2.8, radius = 0.13, ...props }) => (
  <group {...props}>
    <mesh position={[0, length / 2, 0]}>
      <cylinderGeometry args={[radius, radius, length, 16]} />
      <meshStandardMaterial color={color} roughness={0.6} />
    </mesh>
    {/* paper wrapper bands */}
    {[0.25, 0.75].map((f) => (
      <mesh key={f} position={[0, length * f, 0]}>
        <cylinderGeometry args={[radius * 1.06, radius * 1.06, 0.12, 16]} />
        <meshStandardMaterial color="#2d2d44" roughness={0.8} />
      </mesh>
    ))}
    <mesh position={[0, length + 0.17, 0]}>
      <coneGeometry args={[radius, 0.34, 16]} />
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
  </group>
);

const RING_COLORS = ['#ff5c5c', '#ff9f43', '#feca57', '#1dd1a1', '#54a0ff'];
export const RingStack = (props) => (
  <group {...props}>
    <mesh position={[0, 0.05, 0]}>
      <cylinderGeometry args={[0.5, 0.55, 0.12, 24]} />
      <meshStandardMaterial color="#f5d0a9" roughness={0.7} />
    </mesh>
    <mesh position={[0, 0.65, 0]}>
      <cylinderGeometry args={[0.06, 0.06, 1.2, 12]} />
      <meshStandardMaterial color="#f5d0a9" roughness={0.7} />
    </mesh>
    {RING_COLORS.map((c, i) => (
      <mesh key={c} position={[0, 0.2 + i * 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.38 - i * 0.055, 0.1, 14, 32]} />
        <meshStandardMaterial color={c} roughness={0.4} />
      </mesh>
    ))}
    <mesh position={[0, 1.3, 0]}>
      <sphereGeometry args={[0.13, 16, 12]} />
      <meshStandardMaterial color="#ff6bcb" roughness={0.4} />
    </mesh>
  </group>
);

export const SpinningTop = ({ color = '#5f27cd', speed = 6, ...props }) => {
  const ref = useRef(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * speed;
  });
  return (
    <group {...props}>
      <group ref={ref} rotation={[0.12, 0, 0.08]}>
        <mesh position={[0, 0.3, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.38, 0.6, 24]} />
          <meshStandardMaterial color={color} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.62, 0]}>
          <cylinderGeometry args={[0.4, 0.38, 0.1, 24]} />
          <meshStandardMaterial color="#feca57" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.82, 0]}>
          <cylinderGeometry args={[0.04, 0.05, 0.32, 10]} />
          <meshStandardMaterial color="#2d2d44" />
        </mesh>
      </group>
    </group>
  );
};

export const Duck = (props) => (
  <group {...props}>
    <mesh scale={[1.25, 0.85, 1]}>
      <sphereGeometry args={[0.42, 24, 18]} />
      <meshStandardMaterial color="#ffd23f" roughness={0.35} />
    </mesh>
    <mesh position={[0.32, 0.42, 0]}>
      <sphereGeometry args={[0.26, 24, 18]} />
      <meshStandardMaterial color="#ffd23f" roughness={0.35} />
    </mesh>
    <mesh position={[0.6, 0.38, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[1, 1, 0.6]}>
      <coneGeometry args={[0.1, 0.22, 16]} />
      <meshStandardMaterial color="#ff8c1a" roughness={0.4} />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[0.45, 0.5, s * 0.15]}>
        <sphereGeometry args={[0.04, 10, 8]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
    ))}
    <mesh position={[-0.5, 0.15, 0]} rotation={[0, 0, 0.7]}>
      <coneGeometry args={[0.14, 0.3, 12]} />
      <meshStandardMaterial color="#ffd23f" roughness={0.35} />
    </mesh>
  </group>
);

let starGeometry = null;
const getStarGeometry = () => {
  if (!starGeometry) {
    const shape = new Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 0.5 : 0.22;
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    starGeometry = new ExtrudeGeometry(shape, {
      depth: 0.12, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 3,
    });
    starGeometry.center();
  }
  return starGeometry;
};

export const Star = ({ color = '#feca57', emissive = 0.25, ...props }) => (
  <mesh geometry={getStarGeometry()} {...props}>
    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissive} roughness={0.3} metalness={0.1} />
  </mesh>
);

const CLOUD_PUFFS = [
  [0, 0, 0, 0.55], [0.5, -0.08, 0.05, 0.42], [-0.5, -0.1, 0, 0.4], [0.22, 0.28, -0.05, 0.38], [-0.25, 0.22, 0.05, 0.34],
];
export const Cloud = (props) => (
  <group {...props}>
    {CLOUD_PUFFS.map(([x, y, z, r]) => (
      <mesh key={`${x}${y}`} position={[x, y, z]}>
        <sphereGeometry args={[r, 20, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
    ))}
  </group>
);

export const Gift = ({ color = '#ff6bcb', ribbon = '#feca57', size = 0.7, ...props }) => {
  const h = size * 0.85;
  return (
    <group {...props}>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[size, h, size]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[size * 1.01, h * 1.01, size * 0.2]} />
        <meshStandardMaterial color={ribbon} roughness={0.4} />
      </mesh>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[size * 0.2, h * 1.01, size * 1.01]} />
        <meshStandardMaterial color={ribbon} roughness={0.4} />
      </mesh>
      <mesh position={[0, h + size * 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[size * 0.16, size * 0.05, 10, 24]} />
        <meshStandardMaterial color={ribbon} roughness={0.4} />
      </mesh>
    </group>
  );
};

// Small hook for the "bob & spin" idle motion shared by floating toys
export const useIdleMotion = (seed, { bob = 0.25, spin = 0.4, sway = 0.15 } = {}) => {
  const ref = useRef(null);
  const base = useMemo(() => ({ phase: seed * 1.7, y: null }), [seed]);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    if (base.y === null) base.y = g.position.y;
    const t = clock.elapsedTime + base.phase;
    g.position.y = base.y + Math.sin(t * 1.1) * bob;
    g.rotation.y += spin * 0.01;
    g.rotation.z = Math.sin(t * 0.8) * sway;
  });
  return ref;
};
