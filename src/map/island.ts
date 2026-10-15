/**
 * Canopy Island, as a grid. Every land cell is one patch of forest. The fire front starts at the mill
 * on the south-west coast and works inland along a ragged line; the cell that burns last is the
 * tree Oren lives in. Everything is seeded, so every visitor sees the same island.
 */

export const GW = 112;
export const GH = 70;

function hash2(x: number, y: number, seed: number) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

function noise(x: number, y: number, seed: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = smooth(x - xi);
  const fy = smooth(y - yi);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

function fbm(x: number, y: number, seed: number) {
  let v = 0;
  let amp = 0.5;
  let f = 1;
  for (let o = 0; o < 4; o++) {
    v += amp * noise(x * f, y * f, seed + o * 31);
    amp *= 0.5;
    f *= 2;
  }
  return v;
}

export type Cell = { x: number; y: number; h: number };

export interface Island {
  /** 0 ocean, 1 beach, 2 land */
  kind: Uint8Array;
  /** Land cells, in the order they burn. */
  order: Cell[];
  /** Rank in the burn order for every grid index, -1 off land. */
  rankAt: Int32Array;
  mill: Cell;
  /** The highest ground: where the torch bearer stands. */
  peak: Cell;
  /** Where the ten concessions are staked, in rank order. */
  stakes: Cell[];
}

let cached: Island | null = null;

export function island(): Island {
  if (cached) return cached;
  const kind = new Uint8Array(GW * GH);
  const height = new Float32Array(GW * GH);
  const land: Cell[] = [];
  for (let y = 0; y < GH; y++)
    for (let x = 0; x < GW; x++) {
      const u = (x / (GW - 1) - 0.5) * 2;
      const v = (y / (GH - 1) - 0.5) * 2;
      const d = Math.sqrt((u * 0.92) ** 2 + (v * 1.08) ** 2);
      const m = 1.05 - d + 0.62 * (fbm(x / 17, y / 17, 7) - 0.5) + 0.18 * (fbm(x / 6, y / 6, 19) - 0.5);
      height[y * GW + x] = m;
      if (m > 0.34) {
        kind[y * GW + x] = 2;
        land.push({ x, y, h: m });
      } else if (m > 0.29) kind[y * GW + x] = 1;
    }

  const near = (tx: number, ty: number) => land.reduce((best, c) => ((c.x - tx) ** 2 + (c.y - ty) ** 2 < (best.x - tx) ** 2 + (best.y - ty) ** 2 ? c : best), land[0]);
  const mill = near(GW * 0.16, GH * 0.86);
  // a ragged front: distance from the mill, stretched and squeezed by noise
  const score = (c: Cell) => Math.hypot(c.x - mill.x, (c.y - mill.y) * 1.25) * (0.7 + 0.6 * fbm(c.x / 11, c.y / 11, 43));
  const order = land.slice().sort((a, b) => score(a) - score(b));
  const rankAt = new Int32Array(GW * GH).fill(-1);
  order.forEach((c, i) => (rankAt[c.y * GW + c.x] = i));
  const peak = land.reduce((a, b) => (b.h > a.h ? b : a));

  // ten stakes spread over the island, the torch bearer on the peak
  const anchors: [number, number][] = [
    [0.36, 0.3], [0.62, 0.24], [0.74, 0.46], [0.26, 0.56], [0.5, 0.66],
    [0.84, 0.66], [0.66, 0.8], [0.3, 0.78], [0.14, 0.42], [0.88, 0.32],
  ];
  const stakes = [peak, ...anchors.slice(1).map(([u, v]) => near(GW * u, GH * v))];

  cached = { kind, order, rankAt, mill, peak, stakes };
  return cached;
}

/** How many land cells are cleared for `burned` of `total` trees. */
export function clearedCells(burned: number, total: number) {
  const L = island().order.length;
  if (!(total > 0) || burned <= 0) return 0;
  if (burned >= total) return L;
  return Math.max(1, Math.floor((burned / total) * L));
}

/** A small seeded random per cell, for colour and jitter. */
export const cellRand = (x: number, y: number, k = 0) => hash2(x, y, 101 + k);
