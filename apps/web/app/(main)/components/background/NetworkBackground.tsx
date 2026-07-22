'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 80;
const CONNECT_DISTANCE = 2.4;
// Line buffer is pre-allocated to this many segments; once hit, no more
// connections are drawn for that frame (silent cap, not an error).
const MAX_CONNECTIONS = 150;
// Roughly matches the camera's visible area at z=10 with fov=50, so particles
// wander across the whole viewport instead of clustering in the middle.
const BOUNDS = { x: 9, y: 5, z: 3 };
const PARTICLE_COLOR = '#5b8bd2';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function randomInRange(range: number) {
  return (Math.random() * 2 - 1) * range;
}

function subscribeReducedMotion(callback: () => void) {
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

// Assumes reduced-motion=false on the server, so SSR ships the Canvas
// immediately and there's no flash-without-background on first paint.
// Trade-off: a user who actually has reduced-motion enabled briefly sees
// the animation before useSyncExternalStore reconciles to the real
// preference right after hydration and unmounts it.
function getReducedMotionServerSnapshot() {
  return false;
}

function ParticleNetwork() {
  const groupRef = useRef<THREE.Group>(null);
  const pointsGeometryRef = useRef<THREE.BufferGeometry | null>(null);
  const lineGeometryRef = useRef<THREE.BufferGeometry | null>(null);
  const pointer = useRef({ x: 0, y: 0 });

  // Tracked via a raw window listener rather than R3F's onPointerMove: the
  // wrapping div is pointer-events-none (so clicks reach the page content
  // behind it), which also blocks the canvas from ever receiving its own
  // pointer events.
  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      // Normalized to [-1, 1] on both axes, same convention as R3F's own
      // pointer/NDC coordinates.
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  // Plain useRef (not useMemo): its contents are mutated every frame in
  // useFrame, and the React Compiler forbids mutating values that came from
  // useMemo across renders. Refs are the sanctioned escape hatch for mutable
  // state that lives outside React's render cycle.
  const particlesRef = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      position: new THREE.Vector3(
        randomInRange(BOUNDS.x),
        randomInRange(BOUNDS.y),
        randomInRange(BOUNDS.z),
      ),
      velocity: new THREE.Vector3(randomInRange(0.15), randomInRange(0.15), randomInRange(0.08)),
    })),
  );

  // Raw vertex buffers behind the geometries below; written into directly
  // each frame instead of replacing the array, so no re-allocation per tick.
  const positionsRef = useRef(new Float32Array(PARTICLE_COUNT * 3));
  const linePositionsRef = useRef(new Float32Array(MAX_CONNECTIONS * 2 * 3));

  // Callback refs attach the position buffer synchronously at commit time —
  // before useFrame can possibly tick — so there's no race with the render
  // loop, and no `useEffect` in the middle for the compiler to flag.
  const attachPointsGeometry = (geometry: THREE.BufferGeometry | null) => {
    pointsGeometryRef.current = geometry;
    if (geometry && !geometry.attributes.position) {
      geometry.setAttribute('position', new THREE.BufferAttribute(positionsRef.current, 3));
    }
  };

  const attachLineGeometry = (geometry: THREE.BufferGeometry | null) => {
    lineGeometryRef.current = geometry;
    if (geometry && !geometry.attributes.position) {
      geometry.setAttribute('position', new THREE.BufferAttribute(linePositionsRef.current, 3));
    }
  };

  useFrame((_, delta) => {
    // Clamp so a stalled/backgrounded tab (huge delta on resume) doesn't
    // make particles jump across the screen in one tick.
    const dt = Math.min(delta, 1 / 30);
    const particles = particlesRef.current;
    const positions = positionsRef.current;
    const linePositions = linePositionsRef.current;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      p.position.addScaledVector(p.velocity, dt);

      // Reflect velocity at the bounding box edges so particles drift
      // indefinitely inside view instead of flying off-screen forever.
      if (p.position.x > BOUNDS.x || p.position.x < -BOUNDS.x) p.velocity.x *= -1;
      if (p.position.y > BOUNDS.y || p.position.y < -BOUNDS.y) p.velocity.y *= -1;
      if (p.position.z > BOUNDS.z || p.position.z < -BOUNDS.z) p.velocity.z *= -1;

      positions[i * 3] = p.position.x;
      positions[i * 3 + 1] = p.position.y;
      positions[i * 3 + 2] = p.position.z;
    }

    if (pointsGeometryRef.current) {
      const attr = pointsGeometryRef.current.attributes.position as THREE.BufferAttribute;
      // Tells three.js to re-upload this buffer to the GPU this frame —
      // writing into the typed array above doesn't do that on its own.
      attr.needsUpdate = true;
    }

    // O(n²) proximity check over 80 particles (~3.2k pairs) — cheap on CPU,
    // and it's what lets the constellation look organic (real-time nearest-
    // neighbor connections) rather than a fixed, pre-baked topology.
    let segmentCount = 0;
    for (let i = 0; i < PARTICLE_COUNT && segmentCount < MAX_CONNECTIONS; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT && segmentCount < MAX_CONNECTIONS; j++) {
        const dx = particles[i].position.x - particles[j].position.x;
        const dy = particles[i].position.y - particles[j].position.y;
        const dz = particles[i].position.z - particles[j].position.z;
        // Compare squared distances — skips a sqrt() per pair, and squaring
        // CONNECT_DISTANCE once outside the loop is cheaper than sqrt-ing
        // distSq every time.
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < CONNECT_DISTANCE * CONNECT_DISTANCE) {
          const base = segmentCount * 6;
          linePositions[base] = particles[i].position.x;
          linePositions[base + 1] = particles[i].position.y;
          linePositions[base + 2] = particles[i].position.z;
          linePositions[base + 3] = particles[j].position.x;
          linePositions[base + 4] = particles[j].position.y;
          linePositions[base + 5] = particles[j].position.z;
          segmentCount++;
        }
      }
    }

    if (lineGeometryRef.current) {
      const attr = lineGeometryRef.current.attributes.position as THREE.BufferAttribute;
      attr.needsUpdate = true;
      // The line buffer is sized for MAX_CONNECTIONS segments, but most
      // frames use fewer — drawRange hides the unused, stale tail instead
      // of rendering leftover segments from a previous frame.
      lineGeometryRef.current.setDrawRange(0, segmentCount * 2);
    }

    if (groupRef.current) {
      // Mouse parallax: tilt the whole group toward the pointer. Axes are
      // swapped (pointer.y drives rotation.x) because tilting "up/down"
      // visually is a rotation around the horizontal axis, and vice versa.
      const targetX = pointer.current.y * 0.15;
      const targetY = pointer.current.x * 0.15;
      // Exponential ease toward the target instead of snapping straight to
      // it — each frame closes 3% of the remaining gap, so the tilt settles
      // smoothly rather than jittering with every mouse-move event.
      groupRef.current.rotation.x += (targetX - groupRef.current.rotation.x) * 0.03;
      groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * 0.03;
    }
  });

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry ref={attachPointsGeometry} />
        <pointsMaterial
          color={PARTICLE_COLOR}
          size={0.06}
          sizeAttenuation
          transparent
          opacity={0.7}
          depthWrite={false}
        />
      </points>
      <lineSegments>
        <bufferGeometry ref={attachLineGeometry} />
        <lineBasicMaterial color={PARTICLE_COLOR} transparent opacity={0.12} depthWrite={false} />
      </lineSegments>
    </group>
  );
}

export default function NetworkBackground() {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  if (prefersReducedMotion) return null;

  return (
    // -z-10 (not z-0): fixed + z-index:0 would paint *above* plain static
    // page content (it falls in the "positioned, z:0" stacking bucket,
    // which paints after non-positioned in-flow content) — negative z-index
    // is what actually keeps it behind normal page content by spec.
    <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        // Capped at 1.5 rather than the real device pixel ratio (can be 3
        // on some phones) — this is a full-viewport background, not the
        // focal point, so it doesn't need native retina sharpness.
        dpr={[1, 1.5]}
      >
        <ParticleNetwork />
      </Canvas>
    </div>
  );
}
