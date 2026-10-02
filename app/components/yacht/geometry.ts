/**
 * Procedural point cloud of a flybridge motor yacht: surfaces are a dense,
 * dim glitter with bright contour lines (deck edges, rails, frames) on top.
 * Surface points carry a normal so the shader can fade the far side of the
 * boat, which keeps it reading as a solid shape. Pure and deterministic
 * (seeded), so the shape is identical on every load and node-testable.
 *
 * Model space: x runs stern (−3) → bow (+3.2), y is up (waterline ≈ −0.32),
 * z is the beam. `kind` 0 = the boat itself, 1 = ambience (dust, stars).
 */

export type YachtCloud = {
  count: number;
  positions: Float32Array;
  normals: Float32Array; // (0,0,0) = always visible (lines, dust)
  colors: Float32Array;
  sizes: Float32Array;
  seeds: Float32Array;
  kinds: Float32Array;
};

type RGB = readonly [number, number, number];
type Range = readonly [number, number];
export type Vec = [number, number, number];

const DEEP: RGB = [0.08, 0.2, 0.66];
const BLUE: RGB = [0.27, 0.5, 1];
const ICE: RGB = [0.68, 0.82, 1];
const WHITE: RGB = [1, 1, 1];
const GOLD: RGB = [1, 0.71, 0.3];
const NONE: Vec = [0, 0, 0];
const UP: Vec = [0, 1, 0];

const STERN = -3;
const BOW = 3.2;
const LENGTH = BOW - STERN;
const RAIL_H = 0.14;

export const xAt = (u: number) => STERN + LENGTH * u;

/** Half-beam in plan: full aft, then a fine entry to a sharp bow. */
export const beam = (u: number) =>
  u <= 0.32 ? 0.82 + 0.08 * Math.sin((u / 0.32) * (Math.PI / 2)) : 0.9 * Math.max(0, 1 - ((u - 0.32) / 0.68) ** 2.5);

/** Deck edge height, sweeping up toward the bow. */
export const sheer = (u: number) => 0.5 + 0.28 * u * u;

/** Hull bottom; forward it sweeps up into a raked stem. */
const keel = (u: number) => (u < 0.62 ? -0.32 : -0.32 + (sheer(1) - 0.04 + 0.32) * ((u - 0.62) / 0.38) ** 2.2);

/** Flared cross-section: 0 at the keel, 1 at the deck edge. */
const flare = (s: number) => 1 - (1 - s) ** 2.4;

const hull = (u: number, s: number, zs: number): Vec => [xAt(u), keel(u) + (sheer(u) - keel(u)) * s, zs * beam(u) * flare(s)];

/** Outward hull normal: horizontal at the deck edge, turning down toward the
 *  keel, leaning forward where the bow narrows. */
const hullNormal = (u: number, s: number, zs: number): Vec => {
  const h = sheer(u) - keel(u);
  const fwd = u > 0.55 ? (u - 0.55) * 2.2 * h : 0;
  return [fwd, -beam(u) * 2.4 * (1 - s) ** 1.4, zs * h];
};

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

/** A deckhouse: straight sides that follow the hull, a nearly flat front
 *  that rakes back with height, and walls that lean in slightly. */
type Cabin = {
  back: number; // u of the aft wall
  front: number; // u of the front, centreline, at the base
  rake: number; // how far (u) the front top sits behind the base
  curve: number; // how far (u) the front corners sit behind the centreline
  width: number; // share of the hull half-beam
  taper: number; // walls lean in by this share at the top
  base: (u: number) => number;
  h: number;
  windows: readonly (readonly [number, number, number, number])[]; // side glass: [from, to] along back→corner, [low, high] height
  shield?: { band: Range; mullions: number }; // glass across the front
  overhang: number; // roof visor projects this far (u) past the front
  wallN: number;
  roofN: number;
  baseEdge: RGB;
  roofEdge: RGB;
};

function cabinAt(c: Cabin, v: number, grow = 0) {
  const back = c.back + 0.012 * v;
  const front = c.front - c.rake * v + grow;
  const corner = front - c.curve;
  const lean = 1 - c.taper * v;
  const side = (u: number) => c.width * beam(Math.min(u, c.front)) * lean + grow * 0.6;
  return {
    back,
    front,
    corner,
    side,
    cornerHalf: side(corner),
    frontU: (zp: number) => front - c.curve * zp * zp, // zp ∈ [-1, 1] across the front
    y: (u: number) => c.base(u) + c.h * v,
  };
}

/** Point on the cabin outline at height v; t runs once around (0..1). */
function cabinLoop(c: Cabin, v: number, t: number, grow = 0) {
  const k = cabinAt(c, v, grow);
  const sideLen = LENGTH * (k.corner - k.back);
  const frontLen = 2 * k.cornerHalf;
  const backLen = 2 * k.side(k.back);
  const faceUp = (LENGTH * c.rake) / c.h; // how much a raked front faces the sky
  let d = t * (2 * sideLen + frontLen + backLen);
  if (d < sideLen) {
    const a = d / sideLen;
    const u = lerp(k.back, k.corner, a);
    return { p: [xAt(u), k.y(u), k.side(u)] as Vec, n: [0, c.taper, 1] as Vec, part: "side" as const, a };
  }
  d -= sideLen;
  if (d < frontLen) {
    const zp = 1 - 2 * (d / frontLen);
    const u = k.frontU(zp);
    return { p: [xAt(u), k.y(u), zp * k.cornerHalf] as Vec, n: [1, faceUp, zp * 0.5] as Vec, part: "front" as const, a: zp };
  }
  d -= frontLen;
  if (d < sideLen) {
    const a = 1 - d / sideLen;
    const u = lerp(k.back, k.corner, a);
    return { p: [xAt(u), k.y(u), -k.side(u)] as Vec, n: [0, c.taper, -1] as Vec, part: "side" as const, a };
  }
  d -= sideLen;
  const zp = -1 + 2 * (d / backLen);
  return { p: [xAt(k.back), k.y(k.back), zp * k.side(k.back)] as Vec, n: [-1, 0, 0] as Vec, part: "back" as const, a: zp };
}

// ---- the boat's layout, shared by the builder and the key points below
const S1_TOP = 0.42; // main deckhouse height above the deck edge
const S2_TOP = 0.22; // upper deck height above that
const HARDTOP_GAP = 0.2;
const DOME_U = 0.45;
const DOME_R = 0.15;

const main: Cabin = {
  back: 0.12, front: 0.71, rake: 0.11, curve: 0.012, width: 0.9, taper: 0.05,
  base: sheer, h: S1_TOP,
  windows: [[0.05, 0.36, 0.22, 0.78], [0.42, 0.93, 0.22, 0.78]],
  shield: { band: [0.1, 0.8], mullions: 3 },
  overhang: 0.035, wallN: 16000, roofN: 13000, baseEdge: GOLD, roofEdge: WHITE,
};
const upper: Cabin = {
  back: 0.2, front: 0.6, rake: 0.05, curve: 0.06, width: 0.74, taper: 0.07,
  base: (u) => sheer(u) + S1_TOP, h: S2_TOP,
  windows: [[0.1, 0.8, 0.35, 0.8]],
  shield: { band: [0.3, 0.86], mullions: 0 },
  overhang: 0.015, wallN: 7000, roofN: 6000, baseEdge: GOLD, roofEdge: WHITE,
};
const hardtopY = (u: number) => sheer(u) + S1_TOP + S2_TOP + HARDTOP_GAP;
const hardtop: Cabin = {
  back: 0.28, front: 0.54, rake: 0, curve: 0.05, width: 0.64, taper: 0,
  base: hardtopY, h: 0.035, windows: [], overhang: 0, wallN: 1200, roofN: 5000, baseEdge: ICE, roofEdge: WHITE,
};
const domeCentre: Vec = [xAt(DOME_U), hardtopY(DOME_U) + 0.035 + DOME_R * 0.85, 0];
const railCorner = main.front - main.curve; // where the rails pass the windshield corners

/** Windshield corner at band height `v`, on side `zs` (+1 = starboard). */
const shieldCorner = (v: number, zs: number): Vec => {
  const k = cabinAt(main, v);
  return [xAt(k.corner), k.y(k.corner), zs * k.cornerHalf];
};

/** Reference points for framing the camera (see the pose fit). */
export const YACHT_KEYS = {
  bow: [xAt(1), sheer(1) + RAIL_H * 0.6, 0] as Vec,
  railUpper: [xAt(railCorner), sheer(railCorner) + RAIL_H, beam(railCorner) * 0.965] as Vec,
  railLower: [xAt(railCorner), sheer(railCorner) + RAIL_H, -beam(railCorner) * 0.965] as Vec,
  shieldBase: [xAt(main.front), sheer(main.front), 0] as Vec,
  shieldTopL: shieldCorner(main.shield!.band[1], 1),
  shieldTopR: shieldCorner(main.shield!.band[1], -1),
  shieldBotL: shieldCorner(main.shield!.band[0], 1),
  shieldBotR: shieldCorner(main.shield!.band[0], -1),
  dome: domeCentre,
};

/** Loose bounds of the boat itself, for hover hit-testing and framing. */
export const YACHT_BOX = { min: [-3.4, -0.4, -0.95] as Vec, max: [3.25, domeCentre[1] + 0.7, 0.95] as Vec };

function builder(seed: number) {
  const rand = mulberry32(seed);
  const P: number[] = [];
  const N: number[] = [];
  const C: number[] = [];
  const S: number[] = [];
  const K: number[] = [];
  const jitter = (s: number) => (rand() - 0.5) * s;
  const side = () => (rand() < 0.5 ? -1 : 1);
  const add = ([x, y, z]: Vec, c: RGB, size = 1, n: Vec = NONE, kind = 0) => {
    P.push(x, y, z);
    N.push(n[0], n[1], n[2]);
    C.push(c[0], c[1], c[2]);
    S.push(size);
    K.push(kind);
  };
  /** Dim surface glitter with the odd bright sparkle. */
  const glitter = (p: Vec, n: Vec, base: RGB, k: number, size = 0.5) => {
    const spark = rand() < 0.07;
    add(p, spark ? dim(mix(base, WHITE, 0.6), 0.95) : dim(base, k * (0.7 + rand() * 0.6)), spark ? size * 1.5 : size * (0.75 + rand() * 0.5), n);
  };
  /** n points along a curve; a few become brighter glints. Pass `normal`
   *  for lines on the hull underside, so they hide like the surfaces do. */
  const line = (n: number, at: (t: number) => Vec, c: RGB, size = 1, spread = 0.006, normal?: (t: number) => Vec) => {
    for (let i = 0; i < n; i++) {
      const t = rand();
      const [x, y, z] = at(t);
      const glint = rand() < 0.03;
      add([x + jitter(spread), y + jitter(spread), z + jitter(spread)], glint ? mix(c, WHITE, 0.5) : c, size * (glint ? 2 : 0.9 + rand() * 0.45), normal ? normal(t) : NONE);
    }
  };
  const both = (fn: (zs: number) => void) => {
    fn(1);
    fn(-1);
  };
  const done = (): YachtCloud => {
    const count = P.length / 3;
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) seeds[i] = rand();
    return {
      count,
      positions: new Float32Array(P),
      normals: new Float32Array(N),
      colors: new Float32Array(C),
      sizes: new Float32Array(S),
      seeds,
      kinds: new Float32Array(K),
    };
  };
  return { rand, jitter, side, add, glitter, line, both, done };
}

function addCabin(b: ReturnType<typeof builder>, c: Cabin) {
  const { rand, glitter, line, both } = b;
  const isGlass = (w: ReturnType<typeof cabinLoop>, v: number) =>
    (w.part === "front" && !!c.shield && v > c.shield.band[0] && v < c.shield.band[1]) ||
    (w.part === "side" && c.windows.some(([a0, a1, v0, v1]) => w.a > a0 && w.a < a1 && v > v0 && v < v1));

  // Walls: glitter, with the glass left dark.
  for (let i = 0; i < c.wallN; ) {
    const v = rand();
    const w = cabinLoop(c, v, rand());
    if (isGlass(w, v) && rand() < 0.95) continue;
    i++;
    glitter(w.p, w.n, mix(ICE, WHITE, 0.2 + 0.4 * v), 0.62, 0.65);
  }

  // Roof with its visor: the densest, brightest surface on the boat.
  const roof = cabinAt(c, 1, c.overhang);
  for (let i = 0; i < c.roofN; i++) {
    const u = lerp(roof.back, roof.front, rand());
    const half = u <= roof.corner ? roof.side(u) : roof.cornerHalf * Math.sqrt(Math.max(0, (roof.front - u) / c.curve));
    glitter([xAt(u), roof.y(u) + b.jitter(0.004), (rand() * 2 - 1) * half], UP, mix(ICE, WHITE, 0.3), 0.6, 0.65);
  }

  // Contours: base, roof edge, and a visor band just below it.
  const loopN = Math.round(4400 * (c.front - c.back));
  line(loopN, (t) => cabinLoop(c, 0, t).p, c.baseEdge, 0.95);
  line(loopN, (t) => cabinLoop(c, 1, t, c.overhang).p, c.roofEdge, 1.05);
  line(Math.round(loopN * 0.7), (t) => cabinLoop(c, 0.92, t, c.overhang * 0.6).p, dim(c.roofEdge, 0.8), 0.9);

  // Side window frames and the A-pillar where each side meets the front.
  both((zs) => {
    for (const [a0, a1, v0, v1] of c.windows) {
      const at = (a: number, v: number): Vec => {
        const k = cabinAt(c, v);
        const u = lerp(k.back, k.corner, a);
        return [xAt(u), k.y(u), zs * k.side(u)];
      };
      for (const v of [v0, v1]) line(Math.round(2100 * (a1 - a0) * (c.front - c.back)), (t) => at(lerp(a0, a1, t), v), ICE, 0.85);
      for (const a of [a0, a1]) line(60, (t) => at(a, lerp(v0, v1, t)), ICE, 0.85);
    }
    line(140, (t) => { const k = cabinAt(c, t); return [xAt(k.corner), k.y(k.corner), zs * k.cornerHalf]; }, WHITE, 1.05);
  });

  // Windshield frame (gold sill, ice head) and mullions.
  if (c.shield) {
    const { band, mullions } = c.shield;
    const at = (zp: number, v: number): Vec => {
      const k = cabinAt(c, v);
      const u = k.frontU(zp);
      return [xAt(u), k.y(u), zp * k.cornerHalf];
    };
    line(Math.round(1000 * c.width), (t) => at(t * 2 - 1, band[0]), GOLD, 0.95);
    line(Math.round(1000 * c.width), (t) => at(t * 2 - 1, band[1]), ICE, 0.95);
    for (let m = 1; m <= mullions; m++) {
      const zp = -1 + (2 * m) / (mullions + 1);
      line(90, (t) => at(zp, lerp(band[0], band[1], t)), dim(ICE, 0.8), 0.85);
    }
  }
}

export function buildYacht(seed = 11): YachtCloud {
  const b = builder(seed);
  const { rand, jitter, side, add, glitter, line, both } = b;

  // ---- hull skin: dense under the deck edge, thinning toward the keel
  const hullWindows: Range[] = [[0.24, 0.36], [0.38, 0.5]];
  const hullBand: Range = [0.62, 0.75];
  for (let i = 0; i < 46000; ) {
    const u = rand();
    const s = rand();
    if (rand() > ((sheer(u) - keel(u)) / 0.85) * (0.06 + 0.94 * s ** 1.25)) continue;
    const inWindow = s > hullBand[0] && s < hullBand[1] && hullWindows.some(([a, z]) => u > a && u < z);
    if (inWindow && rand() < 0.93) continue;
    i++;
    const zs = side();
    glitter(hull(u, s, zs), hullNormal(u, s, zs), mix(DEEP, ICE, s ** 1.2), 0.85, 0.7);
  }
  both((zs) => {
    line(2800, (u) => hull(u, 1, zs), WHITE, 1); // deck edge
    line(1300, (u) => hull(u, 0.9, zs), ICE, 0.85); // rub rail
    line(700, (u) => hull(u, 0.34, zs), dim(BLUE, 0.7), 0.75, 0.006, (u) => hullNormal(u, 0.34, zs)); // chine
    for (const [a, z] of hullWindows) {
      for (const s of hullBand) line(110, (t) => hull(lerp(a, z, t), s, zs), ICE, 0.8);
      for (const u of [a, z]) line(24, (t) => hull(u, lerp(hullBand[0], hullBand[1], t), zs), ICE, 0.8);
    }
  });
  // Keel and stem: the normal turns from straight down (hidden from above)
  // to forward as the stem rises, so only the bow's leading edge shows.
  const keelAt = (t: number) => lerp(0.6, 1, t);
  const keelSlope = (u: number) => (keel(Math.min(1, u + 0.005)) - keel(u - 0.005)) / (0.01 * LENGTH);
  line(1000, (t) => { const u = keelAt(t); return [xAt(u), keel(u), 0]; }, ICE, 0.9, 0.006, (t) => [keelSlope(keelAt(t)), -1, 0]);
  both((zs) => line(260, (s) => hull(0, s, zs), WHITE, 0.9)); // transom edge
  for (let i = 0; i < 800; i++) {
    const s = rand();
    glitter([STERN, keel(0) + (sheer(0) - keel(0)) * s, (rand() * 2 - 1) * beam(0) * flare(s)], [-1, 0, 0], ICE, 0.4);
  }

  // ---- deck: dense glitter weighted by width, swim platform
  for (let i = 0; i < 42000; ) {
    const u = rand();
    if (rand() > beam(u) / 0.9) continue;
    i++;
    glitter([xAt(u), sheer(u) + jitter(0.004), (rand() * 2 - 1) * beam(u) * 0.96], UP, mix(BLUE, ICE, rand()), 0.46, 0.6);
  }
  for (let i = 0; i < 900; i++) glitter([STERN - 0.04 - rand() * 0.28, 0.02, (rand() * 2 - 1) * 0.8], UP, ICE, 0.4);
  line(260, (t) => [STERN - 0.32, 0.02, (t * 2 - 1) * 0.8], WHITE, 0.9);

  // ---- foredeck: sunpad and hatches as raised boxes with dark tops
  const deckY = (u: number) => sheer(u) + 0.01;
  const box = (ua: number, ub: number, hz: number, lift: number, edge: RGB, fillN: number) => {
    const top = (u: number) => deckY(u) + lift;
    both((zs) => {
      line(Math.round(1800 * (ub - ua)), (t) => { const u = lerp(ua, ub, t); return [xAt(u), top(u), zs * hz]; }, edge, 0.95);
      line(Math.round(800 * (ub - ua)), (t) => { const u = lerp(ua, ub, t); return [xAt(u), deckY(u), zs * hz]; }, dim(edge, 0.55), 0.8);
      for (const u of [ua, ub]) line(16, (t) => [xAt(u), lerp(deckY(u), top(u), t), zs * hz], edge, 0.85);
      for (let i = 0; i < fillN * 0.3; i++) {
        const u = lerp(ua, ub, rand());
        glitter([xAt(u), lerp(deckY(u), top(u), rand()), zs * hz], [0, 0, zs], ICE, 0.4);
      }
    });
    for (const u of [ua, ub]) line(Math.round(280 * hz), (t) => [xAt(u), top(u), (t * 2 - 1) * hz], edge, 0.95);
    for (let i = 0; i < fillN; i++) {
      const u = lerp(ua, ub, rand());
      glitter([xAt(u), top(u), (rand() * 2 - 1) * hz], UP, ICE, 0.3, 0.55);
    }
  };
  box(0.725, 0.815, 0.34, 0.07, WHITE, 1400); // sunpad
  box(0.835, 0.875, 0.13, 0.045, ICE, 240); // hatches
  box(0.895, 0.922, 0.09, 0.035, ICE, 120);
  for (let i = 0; i < 110; i++) add([xAt(0.955) + jitter(0.07), deckY(0.955) + 0.03 + jitter(0.04), jitter(0.1)], i % 3 ? WHITE : GOLD, 0.85);
  for (const u of [0.2, 0.45, 0.78]) {
    both((zs) => {
      for (let i = 0; i < 16; i++) add([xAt(u) + jitter(0.06), sheer(u) + 0.02, zs * beam(u) * 0.9 + jitter(0.02)], GOLD, 0.85);
    });
  }

  // ---- railings: a strong gold top rail and stanchions, a faint mid rail
  const rail = (u0: number, u1: number) => {
    both((zs) => {
      const at = (u: number, h: number): Vec => [xAt(u), sheer(u) + h, zs * beam(u) * 0.965];
      line(Math.round(4400 * (u1 - u0)), (t) => at(lerp(u0, u1, t), RAIL_H), GOLD, 1.05, 0.004);
      line(Math.round(1200 * (u1 - u0)), (t) => at(lerp(u0, u1, t), RAIL_H * 0.5), dim(GOLD, 0.45), 0.75, 0.004);
      for (let u = u0; u <= u1 + 1e-6; u += 0.026) line(24, (t) => at(u, t * RAIL_H), GOLD, 0.85, 0.003);
    });
  };
  rail(0.3, 0.995);
  rail(0.0, 0.08);
  // Flybridge rail along the upper deck's sides.
  both((zs) => {
    const k = cabinAt(upper, 1);
    const at = (u: number): Vec => [xAt(u), k.y(u) + 0.11, zs * k.side(u) * 0.97];
    line(700, (t) => at(lerp(k.back, k.corner - 0.02, t)), GOLD, 1, 0.004);
    for (let u = k.back; u <= k.corner - 0.02; u += 0.03) line(16, (t) => { const p = at(u); return [p[0], p[1] - 0.11 * t, p[2]]; }, GOLD, 0.8, 0.003);
  });

  // ---- deckhouses: main deck, upper deck, hardtop on posts
  for (const c of [main, upper, hardtop]) addCabin(b, c);
  const htBase = cabinAt(hardtop, 0);
  both((zs) => {
    for (const u of [0.3, 0.41, 0.52]) {
      line(100, (t) => [xAt(u), lerp(sheer(u) + S1_TOP + S2_TOP, hardtopY(u), t), zs * htBase.side(u) * 0.9], ICE, 0.9);
    }
  });

  // ---- radar dome, mast with antenna bar
  for (let i = 0; i < 2600; i++) {
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(rand() * 1.15 - 0.15); // a little past the equator
    const n: Vec = [Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta)];
    const rim = Math.abs(n[1]) < 0.06;
    const p: Vec = [domeCentre[0] + DOME_R * n[0], domeCentre[1] + DOME_R * n[1], DOME_R * n[2]];
    if (rim) add(p, WHITE, 0.95);
    else glitter(p, n, mix(ICE, WHITE, 0.5), 0.6, 0.55);
  }
  const mastX = xAt(0.37);
  const mastY = hardtopY(0.37) + 0.035;
  line(380, (t) => [mastX, mastY + t * 0.46, 0], WHITE, 1);
  line(200, (t) => [mastX, mastY + 0.34, (t * 2 - 1) * 0.26], WHITE, 0.95);
  line(120, (t) => [mastX + (t - 0.5) * 0.26, mastY + 0.44, 0], ICE, 0.9);
  for (let i = 0; i < 26; i++) add([mastX + jitter(0.03), mastY + 0.48 + jitter(0.03), jitter(0.03)], GOLD, 1.6);

  // ---- ambience: the lower hull dissolving into blue dust, sparkles (kind 1)
  for (let i = 0; i < 4500; i++) {
    const [x, y, z] = hull(0.55 + 0.45 * rand() ** 0.5, rand() * 0.55, side());
    const fall = rand() ** 1.8 * 0.85;
    add([x + jitter(0.3), y - fall, z * (1 + fall * 0.3) + jitter(0.25)], dim(mix(DEEP, BLUE, rand()), 0.8 * (1 - fall * 0.5)), 0.5 + rand() * 0.55, NONE, 1);
  }
  for (let i = 0; i < 1100; i++) {
    add([lerp(STERN - 0.5, BOW + 0.5, rand()), lerp(-1.2, 2.8, rand()), jitter(2.6)], rand() < 0.35 ? GOLD : ICE, 0.4 + rand() * 0.6, NONE, 1);
  }

  return b.done();
}

/** A deep star field in world space, around the camera's view. */
export function buildStars(seed = 5): YachtCloud {
  const b = builder(seed);
  for (let i = 0; i < 1800; i++) {
    b.add([b.jitter(46), b.jitter(26), -6 - b.rand() * 22], b.rand() < 0.25 ? GOLD : WHITE, 0.4 + b.rand() ** 3 * 1.5, NONE, 1);
  }
  return b.done();
}
