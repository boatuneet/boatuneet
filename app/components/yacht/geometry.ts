/**
 * Procedural point cloud of a motor yacht, built from parametric surfaces
 * instead of a 3D model file. Pure and deterministic (seeded), so the shape is
 * identical on every load and can be checked by a plain node test.
 *
 * Model space: x runs stern (−3) → bow (+3.2), y is up (waterline ≈ −0.4),
 * z is the beam. `kind` 0 = the boat itself, 1 = ambience (water, wake, stars).
 */

export type YachtCloud = {
  count: number;
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  seeds: Float32Array;
  kinds: Float32Array;
};

type RGB = readonly [number, number, number];
type Range = readonly [number, number];

const DEEP: RGB = [0.1, 0.26, 0.78];
const BLUE: RGB = [0.31, 0.55, 1];
const ICE: RGB = [0.74, 0.85, 1];
const WHITE: RGB = [1, 1, 1];
const GOLD: RGB = [1, 0.7, 0.26];

const STERN = -3;
const BOW = 3.2;

const xAt = (u: number) => STERN + (BOW - STERN) * u;

/** Half-beam: near-parallel aft, rounding to a point at the bow. */
export const beam = (u: number) =>
  u < 0.35 ? 0.95 + 0.1 * (u / 0.35) : 1.05 * Math.sqrt(Math.max(0, 1 - ((u - 0.35) / 0.65) ** 2.4));

/** Deck edge height, rising toward the bow. */
const sheer = (u: number) => 0.55 + 0.25 * u * u;

/** Keel line, sweeping up into a raked stem. */
const keel = (u: number) => (u < 0.55 ? -0.35 : -0.35 + (sheer(1) * 0.92 + 0.35) * ((u - 0.55) / 0.45) ** 2);

/** Flared cross-section: 0 at the keel, 1 at the deck edge. */
const flare = (s: number) => 1 - (1 - s) ** 2.2;

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const dim = (c: RGB, k: number): RGB => [c[0] * k, c[1] * k, c[2] * k];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** 0 = outside every window, 1 = on a window frame, 2 = inside the glass. */
function windowHit(a: number, v: number, segments: readonly Range[], band: Range, frame = 0.012) {
  if (v < band[0] || v > band[1]) return 0;
  for (const [a0, a1] of segments) {
    if (a < a0 || a > a1) continue;
    const nearEdge = a - a0 < frame || a1 - a < frame || v - band[0] < frame * 2.2 || band[1] - v < frame * 2.2;
    return nearEdge ? 1 : 2;
  }
  return 0;
}

type Tier = {
  u0: number;
  u1: number;
  base: (u: number) => number;
  h: number;
  w: number; // share of the hull's half-beam
  rake: number; // how far the front face leans back over the full height
  taper: number; // how much narrower the roof is than the base
  windows: readonly Range[];
  band: Range;
  sideN: number;
  roofN: number;
};

export function buildYacht(seed = 7): YachtCloud {
  const rand = mulberry32(seed);
  const jitter = (s: number) => (rand() - 0.5) * s;
  const side = () => (rand() < 0.5 ? -1 : 1);

  const P: number[] = [];
  const C: number[] = [];
  const S: number[] = [];
  const K: number[] = [];
  const add = (x: number, y: number, z: number, c: RGB, size = 1, kind = 0) => {
    P.push(x, y, z);
    C.push(c[0], c[1], c[2]);
    S.push(size);
    K.push(kind);
  };
  const line = (n: number, at: (t: number) => [number, number, number], c: RGB, size = 1.1, spread = 0.012) => {
    for (let i = 0; i < n; i++) {
      const [x, y, z] = at(rand());
      add(x + jitter(spread), y + jitter(spread), z + jitter(spread), c, size * (0.8 + rand() * 0.5));
    }
  };

  // ---- hull sides, with a long dark window band near the deck
  const hullWindows: Range[] = [[0.17, 0.3], [0.33, 0.47], [0.5, 0.6]];
  for (let i = 0; i < 16000; ) {
    const u = rand();
    const s = rand();
    const height = sheer(u) - keel(u);
    if (rand() > height / 0.95) continue;
    const hit = windowHit(u, s, hullWindows, [0.62, 0.76]);
    if (hit === 2 && rand() < 0.94) continue;
    i++;
    const z = side() * beam(u) * flare(s);
    add(xAt(u) + jitter(0.01), keel(u) + height * s, z, hit === 1 ? GOLD : mix(DEEP, ICE, s ** 1.4), 0.75 + rand() * 0.6);
  }

  // Deck-edge highlight and a spray rail lower down.
  line(2600, (u) => { const z = side() * beam(u); return [xAt(u), sheer(u), z]; }, GOLD, 1.15);
  line(1200, (u) => { const s = 0.32; return [xAt(u), keel(u) + (sheer(u) - keel(u)) * s, side() * beam(u) * flare(s)]; }, ICE, 0.9, 0.008);

  // Transom, deck and swim platform.
  for (let i = 0; i < 900; i++) {
    const s = rand();
    add(STERN, keel(0) + (sheer(0) - keel(0)) * s, (rand() * 2 - 1) * beam(0) * flare(s), mix(DEEP, ICE, s), 0.8);
  }
  for (let i = 0; i < 3000; i++) {
    const u = rand();
    add(xAt(u), sheer(u) + jitter(0.01), (rand() * 2 - 1) * beam(u) * 0.97, dim(mix(BLUE, ICE, 0.5), 0.55), 0.7);
  }
  for (let i = 0; i < 700; i++) {
    add(STERN - 0.05 - rand() * 0.32, 0.02 + jitter(0.02), (rand() * 2 - 1) * 0.92, dim(ICE, 0.8), 0.75);
  }

  // ---- superstructure tiers
  const t1Top = (u: number) => sheer(u) + 0.46;
  const t2Top = (u: number) => t1Top(u) + 0.38;
  const tiers: Tier[] = [
    { u0: 0.08, u1: 0.7, base: sheer, h: 0.46, w: 0.88, rake: 0.2, taper: 0.07, windows: [[0.06, 0.3], [0.34, 0.6], [0.64, 0.84]], band: [0.3, 0.82], sideN: 7000, roofN: 2000 },
    { u0: 0.16, u1: 0.56, base: t1Top, h: 0.38, w: 0.74, rake: 0.18, taper: 0.1, windows: [[0.1, 0.44], [0.5, 0.82]], band: [0.28, 0.85], sideN: 5000, roofN: 1600 },
  ];

  for (const t of tiers) {
    const uBack = (v: number) => t.u0 + 0.02 * v;
    const uFront = (v: number) => t.u1 - t.rake * v;
    const half = (u: number, v: number) => Math.min(beam(u), beam(t.u1)) * t.w * (1 - t.taper * v);
    const y = (u: number, v: number) => t.base(u) + t.h * v;

    // Sides: dark glass inside the window frames.
    for (let i = 0; i < t.sideN; ) {
      const a = rand();
      const v = rand();
      const hit = windowHit(a, v, t.windows, t.band);
      if (hit === 2 && rand() < 0.93) continue;
      i++;
      const u = lerp(uBack(v), uFront(v), a);
      add(xAt(u), y(u, v), side() * half(u, v), hit === 1 ? GOLD : mix(ICE, WHITE, v), 0.75 + rand() * 0.55);
    }

    // Raked windshield: mostly glass, framed at the edges.
    for (let i = 0; i < t.sideN * 0.22; ) {
      const v = rand();
      const across = rand() * 2 - 1;
      const frame = Math.abs(across) > 0.9 || v < 0.12 || v > 0.9;
      if (!frame && rand() < 0.88) continue;
      i++;
      const u = uFront(v);
      add(xAt(u), y(u, v), across * half(u, v), frame ? GOLD : dim(ICE, 0.7), 0.85);
    }

    // Aft wall.
    for (let i = 0; i < t.sideN * 0.12; i++) {
      const v = rand();
      const u = uBack(v);
      add(xAt(u), y(u, v), (rand() * 2 - 1) * half(u, v), dim(ICE, 0.75), 0.75);
    }

    // Roof, slightly overhanging.
    for (let i = 0; i < t.roofN; i++) {
      const u = lerp(uBack(1), uFront(1), rand());
      add(xAt(u), y(u, 1) + jitter(0.01), (rand() * 2 - 1) * half(u, 1) * 1.05, mix(ICE, WHITE, 0.6), 0.8);
    }

    // Gold roof edge and white base edge.
    line(900, (a) => { const u = lerp(uBack(1), uFront(1), a); return [xAt(u), y(u, 1), side() * half(u, 1) * 1.05]; }, GOLD, 1.15);
    line(500, (a) => { const u = lerp(uBack(0), uFront(0), a); return [xAt(u), y(u, 0) + 0.01, side() * half(u, 0)]; }, WHITE, 0.95);
  }

  // ---- flybridge hardtop on posts, mast and radar domes
  const hardtop = (u: number) => t2Top(u) + 0.36;
  const htHalf = (u: number) => Math.min(beam(u), beam(0.5)) * 0.72;
  for (let i = 0; i < 1600; i++) {
    const u = lerp(0.24, 0.5, rand());
    add(xAt(u), hardtop(u) + jitter(0.015), (rand() * 2 - 1) * htHalf(u), mix(ICE, WHITE, 0.7), 0.8);
  }
  line(700, (a) => { const u = lerp(0.24, 0.5, a); return [xAt(u), hardtop(u), side() * htHalf(u)]; }, GOLD, 1.2);
  for (const u of [0.27, 0.47]) {
    for (const zs of [-1, 1]) {
      line(110, (v) => [xAt(u), lerp(t2Top(u), hardtop(u), v), zs * htHalf(u) * 0.85], ICE, 0.9, 0.006);
    }
  }

  const mastU = 0.4;
  const mastBase = hardtop(mastU);
  line(380, (v) => [xAt(mastU), mastBase + v * 0.5, 0], WHITE, 1, 0.008);
  line(180, (t) => [xAt(mastU), mastBase + 0.36, (t * 2 - 1) * 0.28], GOLD, 1.05, 0.008);
  for (let i = 0; i < 40; i++) add(xAt(mastU) + jitter(0.03), mastBase + 0.52 + jitter(0.03), jitter(0.03), GOLD, 1.8);

  for (const zs of [-1, 1]) {
    const cx = xAt(0.32);
    const cz = zs * 0.3;
    const cy = hardtop(0.32) + 0.12;
    for (let i = 0; i < 650; i++) {
      // Upper hemisphere of a radar dome.
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(rand());
      const r = 0.11;
      add(cx + r * Math.sin(phi) * Math.cos(theta), cy + r * Math.cos(phi) - 0.02, cz + r * Math.sin(phi) * Math.sin(theta), WHITE, 0.85);
    }
  }

  // ---- foredeck and aft railings with posts
  const railH = 0.13;
  line(1300, (t) => { const u = lerp(0.7, 0.985, t); return [xAt(u), sheer(u) + railH, side() * beam(u) * 0.95]; }, GOLD, 1.05, 0.006);
  line(500, (t) => { const u = lerp(0.0, 0.08, t); return [xAt(u), sheer(u) + railH, side() * beam(u) * 0.95]; }, GOLD, 1.05, 0.006);
  for (let u = 0.71; u < 0.98; u += 0.034) {
    for (const zs of [-1, 1]) line(26, (v) => [xAt(u), sheer(u) + v * railH, zs * beam(u) * 0.95], GOLD, 0.9, 0.004);
  }

  // ---- ambience: water glow, wake, drifting sparkles, stars (kind 1)
  for (let i = 0; i < 3500; i++) {
    const u = rand() * 1.1 - 0.05;
    const spread = Math.abs(jitter(2)) ** 0.7;
    add(xAt(u), -0.42 + jitter(0.06), side() * (beam(Math.min(1, Math.max(0, u))) * 0.8 + spread * 1.1), dim(mix(DEEP, BLUE, rand()), 0.5), 0.6 + rand() * 0.4, 1);
  }
  for (let i = 0; i < 1300; i++) {
    const t = rand();
    add(STERN - 0.2 - t * 2.6, -0.42 + jitter(0.04), side() * (0.85 + t * 1.3) + jitter(0.18 + t * 0.3), dim(ICE, 0.55 * (1 - t * 0.7)), 0.7, 1);
  }
  for (let i = 0; i < 1200; i++) {
    add(lerp(STERN - 0.6, BOW + 0.6, rand()), lerp(-0.6, 2.6, rand()), jitter(3.2), rand() < 0.4 ? GOLD : ICE, 0.5 + rand() * 0.8, 1);
  }
  for (let i = 0; i < 1700; i++) {
    add(jitter(30), jitter(16) + 1, -3 - rand() * 14, rand() < 0.25 ? GOLD : WHITE, 0.5 + rand() ** 3 * 1.6, 1);
  }

  const count = P.length / 3;
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) seeds[i] = rand();

  return {
    count,
    positions: new Float32Array(P),
    colors: new Float32Array(C),
    sizes: new Float32Array(S),
    seeds,
    kinds: new Float32Array(K),
  };
}
