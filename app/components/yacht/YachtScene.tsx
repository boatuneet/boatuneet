"use client";

import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { YACHT_BOX, YACHT_KEYS, buildStars, buildYacht, type YachtCloud } from "./geometry";

/** Pose fitted to the design mockup (1667×943) by projecting YACHT_KEYS onto
 *  where the mockup draws them: bow low toward the copy, stern running off
 *  the top right. Rotation order ZXY = yaw, then tilt, then roll. */
const POSE = { fov: 44.07, yaw: -2.1201, tilt: 0.5324, roll: 0.0085, dist: 5.471, dy: 0.0277 };

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
  attribute vec3 aNormal;
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
    p += hash3(aSeed) * 0.006 * sin(uTime * 1.3 + aSeed * 6.2831);

    // Scatter: each particle flies along its own direction, staggered by seed.
    float s = clamp(uScatter * 1.3 - fract(aSeed * 3.7) * 0.3, 0.0, 1.0);
    s = s * s * (3.0 - 2.0 * s);
    p += normalize(hash3(aSeed + 0.37)) * (2.0 + 7.0 * fract(aSeed * 7.13)) * s;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec4 clip = projectionMatrix * mv;

    // Fade surfaces that face away from the camera, so the far hull side and
    // inner walls don't clutter the near side. Lines and dust have no normal.
    float facing = 1.0;
    if (dot(aNormal, aNormal) > 0.0) {
      vec3 n = normalize(normalMatrix * aNormal);
      facing = mix(0.08, 1.0, smoothstep(-0.2, 0.3, dot(n, normalize(-mv.xyz))));
    }

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

    float twinkle = 0.8 + 0.2 * sin(uTime * (1.4 + fract(aSeed * 5.3) * 2.6) + aSeed * 40.0);
    gl_PointSize = uSize * aSize * uPixelRatio * (1.0 + push * 0.9 + s * 0.6) / -mv.z;
    vColor = color * twinkle * uGlow * (1.0 + push * 0.7);
    vAlpha = (1.0 - s) * (1.0 - uFade) * facing;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    // Gaussian falloff: a crisp core with a soft halo, so dense lines glow.
    float a = exp(-d * d * 20.0) * vAlpha;
    gl_FragColor = vec4(vColor * a, a);
  }
`;

type Pointer = { x: number; y: number; inside: boolean };

function toGeometry(cloud: YachtCloud) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(cloud.positions, 3));
  g.setAttribute("color", new THREE.BufferAttribute(cloud.colors, 3));
  g.setAttribute("aNormal", new THREE.BufferAttribute(cloud.normals, 3));
  g.setAttribute("aSize", new THREE.BufferAttribute(cloud.sizes, 1));
  g.setAttribute("aSeed", new THREE.BufferAttribute(cloud.seeds, 1));
  g.setAttribute("aKind", new THREE.BufferAttribute(cloud.kinds, 1));
  return g;
}

const BOX_CORNERS = Array.from({ length: 8 }, (_, i) =>
  new THREE.Vector3(
    i & 1 ? YACHT_BOX.max[0] : YACHT_BOX.min[0],
    i & 2 ? YACHT_BOX.max[1] : YACHT_BOX.min[1],
    i & 4 ? YACHT_BOX.max[2] : YACHT_BOX.min[2],
  ),
);

function poseMatrix(dist: number) {
  const o = new THREE.Object3D();
  o.rotation.order = "ZXY";
  o.rotation.set(POSE.tilt, POSE.yaw, POSE.roll);
  o.position.set(0, 0, -dist);
  o.updateMatrixWorld();
  return o.matrixWorld;
}

/** Desktop (copy beside the boat): the fitted close-up, with the bow tip
 *  where the mockup puts it (46.5% across) but never under the copy, whose
 *  column ends ~620px into the centred 1480px content box. Smaller screens
 *  (boat above the copy): the whole boat, centred and fitted. */
function frame(width: number, height: number, closeUp: boolean) {
  const cam = new THREE.PerspectiveCamera(POSE.fov, width / height, 0.1, 100);
  cam.updateMatrixWorld();
  const v = new THREE.Vector3();

  if (closeUp) {
    const anchorPx = 0.465 * width;
    const bowPx = Math.max(anchorPx, Math.max(0, (width - 1480) / 2) + 668);
    // When the copy pushes the bow right, shrink the boat so the same crop
    // fits the narrower space, and keep the bow at its fitted height.
    const dist = (POSE.dist * (width - anchorPx)) / (width - bowPx);
    const fitted = v.set(...YACHT_KEYS.bow).applyMatrix4(poseMatrix(POSE.dist)).project(cam).y;
    const bow = v.set(...YACHT_KEYS.bow).applyMatrix4(poseMatrix(dist)).project(cam);
    return { dist, dx: (bowPx / width) * 2 - 1 - bow.x, dy: POSE.dy + fitted - bow.y };
  }

  let dist = 12;
  let box = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  for (let i = 0; i < 4; i++) {
    const m = poseMatrix(dist);
    box = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
    for (const c of BOX_CORNERS) {
      v.copy(c).applyMatrix4(m).project(cam);
      box = { minX: Math.min(box.minX, v.x), maxX: Math.max(box.maxX, v.x), minY: Math.min(box.minY, v.y), maxY: Math.max(box.maxY, v.y) };
    }
    // The box is loose (its corners overshoot the hull), so let it overflow.
    dist *= Math.max((box.maxX - box.minX) / 2.3, (box.maxY - box.minY) / 2.1);
  }
  return { dist, dx: -(box.minX + box.maxX) / 2, dy: -(box.minY + box.maxY) / 2 };
}

function Yacht({ glow, pointer, reduce }: { glow: boolean; pointer: React.RefObject<Pointer>; reduce: boolean }) {
  const lean = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const { camera, size, gl } = useThree();

  const boat = useMemo(() => toGeometry(buildYacht()), []);
  const stars = useMemo(() => toGeometry(buildStars()), []);
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
          uSize: { value: 20 },
          uPixelRatio: { value: 1 },
        },
      }),
    [reduce],
  );

  useEffect(() => () => {
    boat.dispose();
    stars.dispose();
    material.dispose();
  }, [boat, stars, material]);

  const layout = useMemo(() => {
    // Matches the CSS breakpoint where the copy moves beside the boat.
    const f = frame(size.width, size.height, window.matchMedia("(min-width: 1024px)").matches);
    // Particles are sized in pixels; keep them in step with the boat's
    // on-screen scale so a small boat doesn't saturate to white.
    const pxPerUnit = size.height / (2 * f.dist * Math.tan(THREE.MathUtils.degToRad(POSE.fov / 2)));
    return { ...f, pointScale: Math.min(1.25, Math.max(0.35, pxPerUnit / 176)) };
  }, [size]);

  // Lens shift: move the boat across the frame without changing perspective.
  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = POSE.fov;
    cam.setViewOffset(size.width, size.height, (-layout.dx * size.width) / 2, (layout.dy * size.height) / 2, size.width, size.height);
    cam.updateProjectionMatrix();
  }, [camera, size, layout]);

  const scratch = useMemo(() => new THREE.Vector3(), []);
  const motion = useRef({ intro: reduce ? 0 : 1, hover: 0, glow: 1, leanX: 0, leanY: 0 });

  useFrame((state, delta) => {
    const outer = lean.current;
    const inner = body.current;
    if (!outer || !inner) return;
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

    // Is the pointer over the boat? Test against its projected bounds.
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const c of BOX_CORNERS) {
      const v = scratch.copy(c).applyMatrix4(inner.matrixWorld).project(camera);
      minX = Math.min(minX, v.x);
      maxX = Math.max(maxX, v.x);
      minY = Math.min(minY, v.y);
      maxY = Math.max(maxY, v.y);
    }
    minX = Math.max(minX, -1);
    maxX = Math.min(maxX, 1);
    minY = Math.max(minY, -1);
    maxY = Math.min(maxY, 1);
    const p = pointer.current;
    const over = p.inside && p.x > minX && p.x < maxX && p.y > minY && p.y < maxY;
    m.hover += ((over && progress < 0.2 ? 1 : 0) - m.hover) * ease(5);

    // Lean away from the pointer, like pressing a floating card, plus a slow
    // idle sway. The outer group rotates in screen space around the boat.
    const relX = Math.max(-1, Math.min(1, (p.x - (minX + maxX) / 2) / 0.6));
    const relY = Math.max(-1, Math.min(1, (p.y - (minY + maxY) / 2) / 0.6));
    m.leanY += (0.12 * relX * m.hover + Math.sin(t * 0.35) * 0.025 - m.leanY) * ease(3);
    m.leanX += (-0.08 * relY * m.hover - m.leanX) * ease(3);
    outer.position.set(0, 0, -layout.dist);
    outer.rotation.set(m.leanX, m.leanY, 0);
    inner.position.y = Math.sin(t * 0.8) * 0.03;

    m.glow += ((glow ? 1.45 : 1) - m.glow) * ease(4);
    u.uTime.value = t;
    u.uHover.value = m.hover;
    u.uGlow.value = m.glow;
    u.uPointer.value.set(p.x, p.y);
    u.uAspect.value = size.width / size.height;
    u.uPixelRatio.value = gl.getPixelRatio();
    u.uSize.value = 26 * layout.pointScale;
  });

  return (
    <>
      <points geometry={stars} material={material} frustumCulled={false} />
      <group ref={lean}>
        <group ref={body} rotation={[POSE.tilt, POSE.yaw, POSE.roll, "ZXY"]}>
          <points geometry={boat} material={material} frustumCulled={false} />
        </group>
      </group>
    </>
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
        camera={{ position: [0, 0, 0], rotation: [0, 0, 0], fov: POSE.fov, near: 0.1, far: 80 }}
        resize={{ scroll: false }}
      >
        <Yacht glow={glow} pointer={pointer} reduce={reduce} />
      </Canvas>
    </div>
  );
}
