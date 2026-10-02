/**
 * Procedural point cloud of a motor yacht, drawn like a particle wireframe:
 * bright contour lines (deck edges, rails, frames) carry the shape and the
 * surfaces are only sparsely filled. Pure and deterministic (seeded), so the
 * shape is identical on every load and can be checked by a plain node test.
 *
 * Model space: x runs stern (−3) → bow (+3.2), y is up (waterline ≈ −0.4),
 * z is the beam. `kind` 0 = the boat itself, 1 = ambience (dust, stars).
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
type Vec = [number, number, number];

const DEEP: RGB = [0.1, 0.24, 0.72];
const BLUE: RGB = [0.3, 0.52, 1];
const ICE: RGB = [0.72, 0.84, 1];
const WHITE: RGB = [1, 1, 1];
const GOLD: RGB = [1, 0.7, 0.28];

const STERN = -3;
const BOW = 3.2;
const LENGTH = BOW - STERN;

const xAt = (u: number) => STERN + LENGTH * u;

/** Half-beam: near-parallel aft, tapering to a sharp point at the bow
 *  (the taper ends linearly, so the tip is pointed rather than rounded). */
export const beam = (u: number) =>
  u < 0.35 ? 0.95 + 0.1 * (u / 0.35) : 1.05 * Math.max(0, 1 - ((u - 0.35) / 0.65) ** 1.7);

/** Deck edge height, rising toward the bow. */
const sheer = (u: number) => 0.55 + 0.25 * u * u;

/** Keel line, sweeping up into a raked stem. */
const keel = (u: number) => (u < 0.55 ? -0.35 : -0.35 + (sheer(1) * 0.92 + 0.35) * ((u - 0.55) / 0.45) ** 2);

/** Flared cross-section: 0 at the keel, 1 at the deck edge. */
const flare = (s: number) => 1 - (1 - s) ** 2.2;

/** A point on the hull skin: u along the length, s keel → deck edge. */
const hull = (u: number, s: number, side: number): Vec => [xAt(u), keel(u) + (sheer(u) - keel(u)) * s, side * beam(u) * flare(s)];

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

/** A deck level with a rounded front (plan view): straight sides aft, an
 *  elliptical cap forward. The walls lean in and the cap retreats with height. */
type Level = {
  u0: number;
  u1: number;
  cap: number; // where the rounded front begins
  base: (u: number) => number;
  h: number;
  w: number; // share of the hull's half-beam
  rake: number;
  taper: number;
  windows: readonly Range[]; // along the straight sides, 0 = aft, 1 = cap start
  band: Range; // window band, share of wall height
  mullions: number; // vertical frames across the windshield cap
  wallN: number;
  roofN: number;
};

function footprint(l: Level, v: number) {
  const back = l.u0 + 0.015 * v;
  const front = l.u1 - l.rake * v;
  const capStart = Math.min(front - 0.02, l.cap - l.rake * v * 0.4);
  const width = (u: number) => Math.min(beam(u), beam(l.u1)) * l.w * (1 - l.taper * v);
  const half = (u: number) =>
    u <= capStart ? width(u) : width(u) * Math.sqrt(Math.max(0, 1 - ((u - capStart) / (front - capStart)) ** 2));
  return { back, front, capStart, width, half };
}

export function buildYacht(seed = 11): YachtCloud {
  const rand = mulberry32(seed);
  const jitter = (s: number) => (rand() - 0.5) * s;
  const side = () => (rand() < 0.5 ? -1 : 1);

  const P: number[] = [];
  const C: number[] = [];
  const S: number[] = [];
  const K: number[] = [];
  const add = ([x, y, z]: Vec, c: RGB, size = 1, kind = 0) => {
    P.push(x, y, z);
    C.push(c[0], c[1], c[2]);
    S.push(size);
    K.push(kind);
  };
  /** n points along a curve, with a little spread so it reads as particles. */
  const line = (n: number, at: (t: number) => Vec, c: RGB, size = 1, spread = 0.01) => {
    for (let i = 0; i < n; i++) {
      const [x, y, z] = at(rand());
      add([x + jitter(spread), y + jitter(spread), z + jitter(spread)], c, size * (0.75 + rand() * 0.5));
    }
  };
  const both = (fn: (zs: number) => void) => {
    fn(-1);
    fn(1);
  };

  // ---- hull skin: sparse, densest near the deck edge, fading toward the keel
  const hullWindows: Range[] = [[0.18, 0.3], [0.33, 0.46], [0.5, 0.58]];
  const hullBand: Range = [0.62, 0.76];
  for (let i = 0; i < 15000; ) {
    const u = rand();
    const s = rand();
    if (rand() > ((sheer(u) - keel(u)) / 0.95) * (0.08 + 0.92 * s ** 1.8)) continue;
    const inWindow = s > hullBand[0] && s < hullBand[1] && hullWindows.some(([a, b]) => u > a && u < b);
    if (inWindow && rand() < 0.9) continue;
    i++;
    add(hull(u, s, side()), mix(DEEP, ICE, s ** 1.3), 0.65 + rand() * 0.5);
  }

  // Hull contours: deck edge (gold), rub rail, chine, keel/stem, window frames.
  both((zs) => {
    line(1700, (u) => hull(u, 1, zs), GOLD, 1.1, 0.008);
    line(900, (u) => hull(u, 0.93, zs), WHITE, 0.95, 0.006);
    line(700, (u) => hull(u, 0.32, zs), dim(ICE, 0.75), 0.8, 0.008);
    for (const [a, b] of hullWindows) {
      for (const s of hullBand) line(70, (t) => hull(lerp(a, b, t), s, zs), ICE, 0.9, 0.004);
      for (const u of [a, b]) line(18, (t) => hull(u, lerp(hullBand[0], hullBand[1], t), zs), ICE, 0.9, 0.004);
    }
  });
  line(900, (t) => { const u = lerp(0.5, 1, t); return [xAt(u), keel(u), 0]; }, ICE, 0.95, 0.008);

  // Transom outline and a sparse face.
  both((zs) => line(260, (s) => hull(0, s, zs), WHITE, 0.95, 0.006));
  for (let i = 0; i < 500; i++) {
    const s = rand();
    add([STERN, keel(0) + (sheer(0) - keel(0)) * s, (rand() * 2 - 1) * beam(0) * flare(s)], dim(ICE, 0.45), 0.7);
  }

  // Deck: sparse fill, swim platform.
  for (let i = 0; i < 2600; i++) {
    const u = rand();
    add([xAt(u), sheer(u) + jitter(0.006), (rand() * 2 - 1) * beam(u) * 0.96], dim(ICE, 0.42), 0.65);
  }
  for (let i = 0; i < 500; i++) add([STERN - 0.05 - rand() * 0.3, 0.02, (rand() * 2 - 1) * 0.9], dim(ICE, 0.55), 0.7);
  line(320, (t) => [STERN - 0.35, 0.02, (t * 2 - 1) * 0.9], WHITE, 0.9, 0.005);

  // ---- foredeck details: two hatches, a sunpad, the windlass
  const deckY = (u: number) => sheer(u) + 0.015;
  const rect = (ua: number, ub: number, hz: number, lift: number, c: RGB, fill: number) => {
    const y = (u: number) => deckY(u) + lift;
    both((zs) => line(110, (t) => { const u = lerp(ua, ub, t); return [xAt(u), y(u), zs * hz]; }, c, 0.9, 0.004));
    for (const u of [ua, ub]) line(Math.round(220 * hz), (t) => [xAt(u), y(u), (t * 2 - 1) * hz], c, 0.9, 0.004);
    for (let i = 0; i < fill; i++) { const u = lerp(ua, ub, rand()); add([xAt(u), y(u), (rand() * 2 - 1) * hz], dim(c, 0.5), 0.7); }
  };
  rect(0.68, 0.77, 0.42, 0.07, WHITE, 420); // sunpad
  rect(0.8, 0.85, 0.17, 0.03, ICE, 90); // hatches
  rect(0.88, 0.915, 0.13, 0.03, ICE, 60);
  for (let i = 0; i < 70; i++) add([xAt(0.95) + jitter(0.08), deckY(0.95) + 0.03 + jitter(0.04), jitter(0.12)], GOLD, 1.1);

  // ---- superstructure levels with rounded fronts and a curved windshield
  const t1Top = (u: number) => sheer(u) + 0.46;
  const t2Top = (u: number) => t1Top(u) + 0.36;
  const levels: Level[] = [
    { u0: 0.07, u1: 0.66, cap: 0.5, base: sheer, h: 0.46, w: 0.86, rake: 0.08, taper: 0.06, windows: [[0.05, 0.32], [0.38, 0.68], [0.74, 0.96]], band: [0.26, 0.84], mullions: 4, wallN: 5200, roofN: 1500 },
    { u0: 0.15, u1: 0.55, cap: 0.4, base: t1Top, h: 0.36, w: 0.72, rake: 0.08, taper: 0.08, windows: [[0.06, 0.45], [0.52, 0.94]], band: [0.24, 0.86], mullions: 3, wallN: 3600, roofN: 1100 },
  ];

  for (const l of levels) {
    const y = (u: number, v: number) => l.base(u) + l.h * v;

    // One wall point at height v; `along` picks the spot on the perimeter.
    const wall = (v: number, along: number, zs: number) => {
      const f = footprint(l, v);
      const straight = LENGTH * (f.capStart - f.back);
      const a = LENGTH * (f.front - f.capStart);
      const b = f.width(f.capStart);
      const cap = (Math.PI / 2) * Math.sqrt((a * a + b * b) / 2);
      const total = straight + cap + f.width(f.back);
      const d = along * total;
      if (d < straight) {
        const u = lerp(f.back, f.capStart, d / straight);
        return { p: [xAt(u), y(u, v), zs * f.half(u)] as Vec, part: "side" as const, at: d / straight };
      }
      if (d < straight + cap) {
        const phi = ((d - straight) / cap) * (Math.PI / 2);
        const u = f.capStart + (f.front - f.capStart) * Math.sin(phi);
        return { p: [xAt(u), y(u, v), zs * f.half(u)] as Vec, part: "cap" as const, at: phi / (Math.PI / 2) };
      }
      return { p: [xAt(f.back), y(f.back, v), zs * f.width(f.back) * ((d - straight - cap) / f.width(f.back))] as Vec, part: "back" as const, at: 0 };
    };

    // Walls: dark glass in the window band, the cap is all windshield.
    const inBand = (v: number) => v > l.band[0] && v < l.band[1];
    for (let i = 0; i < l.wallN; ) {
      const v = rand();
      const w = wall(v, rand(), side());
      const glass = inBand(v) && (w.part === "cap" || (w.part === "side" && l.windows.some(([a, b]) => w.at > a && w.at < b)));
      if (glass && rand() < 0.92) continue;
      i++;
      add(w.p, glass ? dim(ICE, 0.6) : mix(ICE, WHITE, v * 0.6), 0.7 + rand() * 0.45);
    }

    both((zs) => {
      // Window frames: band edges, side-window ends, windshield mullions.
      for (const v of l.band) line(900, (t) => wall(v, t * 0.97, zs).p, ICE, 0.9, 0.004);
      for (const [a, b] of l.windows) {
        for (const at of [a, b]) {
          line(60, (t) => {
            const v = lerp(l.band[0], l.band[1], t);
            const f = footprint(l, v);
            const u = lerp(f.back, f.capStart, at);
            return [xAt(u), y(u, v), zs * f.half(u)];
          }, ICE, 0.9, 0.004);
        }
      }
      for (let m = 1; m <= l.mullions; m++) {
        const phi = (m / (l.mullions + 1)) * (Math.PI / 2);
        line(70, (t) => {
          const v = lerp(l.band[0], l.band[1], t);
          const f = footprint(l, v);
          const u = f.capStart + (f.front - f.capStart) * Math.sin(phi);
          return [xAt(u), y(u, v), zs * f.half(u)];
        }, ICE, 0.9, 0.004);
      }
      // Gold base edge, bright roof edge.
      line(1100, (t) => wall(0, t * 0.97, zs).p, GOLD, 1.05, 0.006);
      line(1300, (t) => { const p = wall(1, t * 0.97, zs).p; return [p[0], p[1], p[2] * 1.04]; }, WHITE, 1.05, 0.006);
    });

    // Roof: sparse fill.
    const roof = footprint(l, 1);
    for (let i = 0; i < l.roofN; i++) {
      const u = lerp(roof.back, roof.front, rand());
      add([xAt(u), y(u, 1) + jitter(0.006), (rand() * 2 - 1) * roof.half(u)], dim(ICE, 0.5), 0.7);
    }
  }

  // ---- flybridge hardtop on posts, radar dome and mast
  const ht: Level = { u0: 0.22, u1: 0.47, cap: 0.38, base: (u) => t2Top(u) + 0.32, h: 0.04, w: 0.68, rake: 0, taper: 0, windows: [], band: [0, 0], mullions: 0, wallN: 0, roofN: 0 };
  const htF = footprint(ht, 0);
  const htY = (u: number) => ht.base(u) + ht.h;
  both((zs) => {
    line(900, (t) => { const u = lerp(htF.back, htF.front, t); return [xAt(u), htY(u), zs * htF.half(u)]; }, WHITE, 1.05, 0.005);
    line(500, (t) => { const u = lerp(htF.back, htF.front, t); return [xAt(u), ht.base(u), zs * htF.half(u)]; }, ICE, 0.85, 0.005);
    for (const u of [0.25, 0.42]) line(90, (t) => [xAt(u), lerp(t2Top(u), ht.base(u), t), zs * htF.half(u) * 0.86], ICE, 0.85, 0.004);
  });
  line(260, (t) => [xAt(htF.back), htY(htF.back), (t * 2 - 1) * htF.width(htF.back)], WHITE, 1, 0.005);
  for (let i = 0; i < 900; i++) {
    const u = lerp(htF.back, htF.front, rand());
    add([xAt(u), htY(u) + jitter(0.006), (rand() * 2 - 1) * htF.half(u)], dim(ICE, 0.5), 0.7);
  }

  const dome: Vec = [xAt(0.34), htY(0.34) + 0.13, 0];
  for (let i = 0; i < 1300; i++) {
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(rand() * 1.1 - 0.1); // a little past the equator
    const r = 0.15;
    const rim = Math.abs(Math.cos(phi)) < 0.08;
    add([dome[0] + r * Math.sin(phi) * Math.cos(theta), dome[1] + r * Math.cos(phi), dome[2] + r * Math.sin(phi) * Math.sin(theta)], rim ? WHITE : mix(ICE, WHITE, 0.5), rim ? 1 : 0.75);
  }
  const mastX = xAt(0.27);
  const mastY = htY(0.27);
  line(340, (t) => [mastX, mastY + t * 0.55, 0], WHITE, 1, 0.006);
  line(160, (t) => [mastX, mastY + 0.4, (t * 2 - 1) * 0.3], WHITE, 1, 0.006);
  line(90, (t) => [mastX + (t - 0.5) * 0.18, mastY + 0.5, 0], ICE, 0.9, 0.005);
  for (let i = 0; i < 30; i++) add([mastX + jitter(0.03), mastY + 0.57 + jitter(0.03), jitter(0.03)], GOLD, 1.7);

  // ---- railings: top rail, mid rail and posts, gold
  const rail = (u0: number, u1: number, inset: number) => {
    both((zs) => {
      const at = (u: number, h: number): Vec => [xAt(u), sheer(u) + h, zs * beam(u) * inset];
      line(Math.round(1500 * (u1 - u0)), (t) => at(lerp(u0, u1, t), 0.15), GOLD, 1.05, 0.004);
      line(Math.round(900 * (u1 - u0)), (t) => at(lerp(u0, u1, t), 0.075), dim(GOLD, 0.7), 0.85, 0.004);
      for (let u = u0; u <= u1; u += 0.026) line(22, (t) => at(u, t * 0.15), GOLD, 0.85, 0.003);
    });
  };
  rail(0.63, 0.995, 0.94);
  rail(0.0, 0.07, 0.94);

  // ---- ambience: the hull dissolving into blue dust, sparkles, stars (kind 1)
  for (let i = 0; i < 4200; i++) {
    const u = rand();
    const s = rand() * 0.55;
    const [x, y, z] = hull(u, s, side());
    const fall = rand() ** 1.6 * 1.1;
    add([x + jitter(0.25), y - fall, z * (1 + fall * 0.25) + jitter(0.2)], dim(mix(DEEP, BLUE, rand()), 0.55 * (1 - fall * 0.6)), 0.55 + rand() * 0.5, 1);
  }
  for (let i = 0; i < 900; i++) {
    add([lerp(STERN - 0.5, BOW + 0.5, rand()), lerp(-1, 2.8, rand()), jitter(3)], rand() < 0.35 ? GOLD : ICE, 0.45 + rand() * 0.7, 1);
  }
  for (let i = 0; i < 1500; i++) {
    add([jitter(34), jitter(18) + 1, -4 - rand() * 14], rand() < 0.25 ? GOLD : WHITE, 0.45 + rand() ** 3 * 1.5, 1);
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
