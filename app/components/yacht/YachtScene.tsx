"use client";

import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildYacht } from "./geometry";

const BASE_ROT_Y = -2.56; // bow toward the viewer and the copy on the left
const BASE_ROT_X = 0.26; // tipped toward the camera: more deck, bow lower
const SHIP_BOX = new THREE.Box3(new THREE.Vector3(-3.4, -0.45, -1.1), new THREE.Vector3(3.25, 2.45, 1.1));

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uScatter;
  uniform float uFade;
  uniform float uHover;
  uniform float uGlow;
  uniform vec2 uPointer;
  uniform float uAspect;
  uniform float uSize;
  uniform float uPixelRatio;

  attribute vec3 color;
  attribute float aSize;
  attribute float aSeed;
  attribute float aKind;

  varying vec3 vColor;
  varying float vAlpha;

  vec3 hash3(float n) {
    return fract(sin(vec3(n * 127.1, n * 311.7, n * 74.7)) * 43758.5453) * 2.0 - 1.0;
  }

  void main() {
    vec3 p = position;

    // Gentle shimmer so the cloud never looks frozen.
    p += hash3(aSeed) * 0.012 * sin(uTime * 1.3 + aSeed * 6.2831);

    // Scatter: each particle flies along its own direction, staggered by seed.
    float s = clamp(uScatter * 1.3 - fract(aSeed * 3.7) * 0.3, 0.0, 1.0);
    s = s * s * (3.0 - 2.0 * s);
    p += normalize(hash3(aSeed + 0.37)) * (2.0 + 7.0 * fract(aSeed * 7.13)) * s;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec4 clip = projectionMatrix * mv;

    // Cursor bulge in screen space: a magnifier lens over the boat. The push
    // grows with distance from the cursor (zero at its centre), so points
    // spread apart and swell instead of leaving a hole.
    const float R = 0.3;
    vec2 ndc = clip.xy / clip.w;
    vec2 d = (ndc - uPointer) * vec2(uAspect, 1.0);
    float falloff = max(0.0, 1.0 - length(d) / R);
    float push = uHover * (1.0 - aKind) * falloff * falloff;
    ndc += d * push * 1.0 / vec2(uAspect, 1.0);
    clip.xy = ndc * clip.w;
    gl_Position = clip;

    float twinkle = 0.78 + 0.22 * sin(uTime * (1.4 + fract(aSeed * 5.3) * 2.6) + aSeed * 40.0);
    gl_PointSize = uSize * aSize * uPixelRatio * (1.0 + push * 0.9 + s * 0.6) / -mv.z;
    vColor = color * twinkle * uGlow * (1.0 + push * 0.7);
    vAlpha = (1.0 - s) * (1.0 - uFade);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    // Gaussian falloff: a bright core with a soft halo, so dense areas glow.
    float a = exp(-d * d * 16.0) * vAlpha;
    gl_FragColor = vec4(vColor * a, a);
  }
`;

type Pointer = { x: number; y: number; inside: boolean };

function Yacht({ glow, pointer, reduce }: { glow: boolean; pointer: React.RefObject<Pointer>; reduce: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { camera, size, gl } = useThree();

  const geometry = useMemo(() => {
    const cloud = buildYacht();
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(cloud.positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(cloud.colors, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(cloud.sizes, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(cloud.seeds, 1));
    g.setAttribute("aKind", new THREE.BufferAttribute(cloud.kinds, 1));
    return g;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uScatter: { value: reduce ? 0 : 1 },
          uFade: { value: 0 },
          uHover: { value: 0 },
          uGlow: { value: 1 },
          uPointer: { value: new THREE.Vector2(9, 9) },
          uAspect: { value: 1 },
          uSize: { value: 44 },
          uPixelRatio: { value: 1 },
        },
      }),
    [reduce],
  );

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  // Wide screens: boat on the right, text on the left. Narrow: centred and
  // scaled to the width.
  const layout = useMemo(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const dist = cam.position.length();
    const visibleH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const visibleW = visibleH * (size.width / size.height);
    const wide = size.width / size.height > 1.15;
    // Wide: a big bow-forward close-up, stern running off the top right.
    // Narrow: the whole boat, centred above the copy.
    const scale = wide ? Math.min(1.25, (visibleW * 0.74) / 6.6) : (visibleW * 0.8) / 6.6;
    // Particles are sized in pixels; keep their footprint in step with the
    // boat's on-screen size so a small boat doesn't saturate to white.
    const pointScale = Math.min(1.2, Math.max(0.35, (scale * size.height) / visibleH / 170));
    return { scale, pointScale, x: wide ? visibleW * 0.31 : 0, y: wide ? 0.02 : 0.1 };
  }, [camera, size]);

  const scratch = useMemo(() => ({ corner: new THREE.Vector3(), min: new THREE.Vector2(), max: new THREE.Vector2() }), []);
  const motion = useRef({ intro: reduce ? 0 : 1, hover: 0, glow: 1, rotX: BASE_ROT_X, rotY: BASE_ROT_Y });

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const m = motion.current;
    const u = material.uniforms;
    const t = reduce ? 0 : state.clock.elapsedTime;
    const ease = (rate: number) => 1 - Math.exp(-dt * rate);

    // Scroll progress through the hero drives the scatter (or a plain fade).
    const hero = document.getElementById("intro");
    const progress = hero ? Math.min(1, Math.max(0, window.scrollY / (hero.offsetHeight * 0.85))) : 0;
    m.intro = Math.max(0, m.intro - dt / 2.6);
    u.uScatter.value = reduce ? 0 : Math.max(m.intro ** 3, progress);
    u.uFade.value = reduce ? progress : 0;

    // Is the pointer over the boat? Test against its projected bounding box.
    scratch.min.set(Infinity, Infinity);
    scratch.max.set(-Infinity, -Infinity);
    for (let i = 0; i < 8; i++) {
      scratch.corner
        .set(i & 1 ? SHIP_BOX.max.x : SHIP_BOX.min.x, i & 2 ? SHIP_BOX.max.y : SHIP_BOX.min.y, i & 4 ? SHIP_BOX.max.z : SHIP_BOX.min.z)
        .applyMatrix4(g.matrixWorld)
        .project(camera);
      scratch.min.set(Math.min(scratch.min.x, scratch.corner.x), Math.min(scratch.min.y, scratch.corner.y));
      scratch.max.set(Math.max(scratch.max.x, scratch.corner.x), Math.max(scratch.max.y, scratch.corner.y));
    }
    const p = pointer.current;
    const over = p.inside && p.x > scratch.min.x && p.x < scratch.max.x && p.y > scratch.min.y && p.y < scratch.max.y;
    m.hover += ((over && progress < 0.2 ? 1 : 0) - m.hover) * ease(5);

    // Lean away from the pointer, like pressing a floating card.
    const cx = (scratch.min.x + scratch.max.x) / 2;
    const cy = (scratch.min.y + scratch.max.y) / 2;
    const relX = Math.max(-1, Math.min(1, (p.x - cx) / ((scratch.max.x - scratch.min.x) / 2 || 1)));
    const relY = Math.max(-1, Math.min(1, (p.y - cy) / ((scratch.max.y - scratch.min.y) / 2 || 1)));
    const targetY = BASE_ROT_Y + 0.16 * relX * m.hover + Math.sin(t * 0.35) * 0.04;
    const targetX = BASE_ROT_X - 0.1 * relY * m.hover;
    m.rotY += (targetY - m.rotY) * ease(3);
    m.rotX += (targetX - m.rotX) * ease(3);
    g.rotation.set(m.rotX, m.rotY, Math.sin(t * 0.6) * 0.012);
    g.position.set(layout.x, layout.y + Math.sin(t * 0.8) * 0.05, 0);
    g.scale.setScalar(layout.scale);

    m.glow += ((glow ? 1.45 : 1) - m.glow) * ease(4);
    u.uTime.value = t;
    u.uHover.value = m.hover;
    u.uGlow.value = m.glow;
    u.uPointer.value.set(p.x, p.y);
    u.uAspect.value = size.width / size.height;
    u.uPixelRatio.value = gl.getPixelRatio();
    u.uSize.value = 40 * layout.pointScale;
  });

  return (
    <group ref={group}>
      <points geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}

/** Particle yacht hero background: assembles on load, bulges and leans away
 *  from the cursor, scatters as the hero scrolls away. */
export function YachtScene({ glow = false }: { glow?: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const pointer = useRef<Pointer>({ x: 9, y: 9, inside: false });
  const [active, setActive] = useState(true);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = wrap.current;
    if (!el) return;

    // Track the pointer on the window: the hero copy sits above the canvas.
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.current.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      pointer.current.inside = e.clientY >= r.top && e.clientY <= r.bottom;
    };
    const leave = () => {
      pointer.current.inside = false;
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);

    // Stop rendering once the hero is fully off screen.
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting));
    observer.observe(el);

    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        frameloop={active ? "always" : "never"}
        dpr={[1, 1.75]}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 3.6, 6.6], fov: 44, near: 0.1, far: 60 }}
        onCreated={({ camera }) => camera.lookAt(0, 0.3, 0)}
        resize={{ scroll: false }}
      >
        <Yacht glow={glow} pointer={pointer} reduce={reduce} />
      </Canvas>
    </div>
  );
}
