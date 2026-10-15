/**
 * The island's trees and the holders' seals. Everything here is worked out from a number or an
 * address alone, so the same tree always has the same name and the same wallet the same seal.
 */

/** Hardwoods of the islands. Tree n is always the same species. */
export const SPECIES = [
  "Ironwood", "Ebony", "Teak", "Mahogany", "Camphor", "Agarwood", "Sandalwood", "Rosewood",
  "Kapok", "Banyan", "Strangler fig", "Red cedar", "Honey tree", "Silk cotton", "Breadfruit", "Black kauri",
];

export function fnv(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export const speciesOf = (n: number) => SPECIES[fnv(`tree:${n}`) % SPECIES.length];

/** A tree's age in years, for the ticker: old growth, 40 to 400 years. */
export const ageOf = (n: number) => 40 + (fnv(`age:${n}`) % 361);

/* ───────── seals: a holder's mark on the board ───────── */

/** Part counts per slot. Must match MUGSHOT_PARTS in bot/byline.ts: [ink, frame, sign, ground]. */
export const PARTS = [5, 5, 6, 6] as const;
export type Seal = [ink: number, frame: number, sign: number, ground: number];

export const PART_NAMES = {
  ink: ["Ember", "Palm", "Ash", "Bone", "Sap"],
  frame: ["Round", "Square", "Diamond", "Shield", "Leaf"],
  sign: ["Palm", "Flame", "Axe", "Drop", "Stump", "Torch"],
  ground: ["Forest", "Soil", "Night", "Haze", "Clay", "Moss"],
};

export const INKS = ["#ff6a2b", "#c9d86b", "#b9b4a8", "#f3ecd8", "#e8b04a"];
export const GROUNDS = ["#173a25", "#4a3423", "#0f1a24", "#5b5a55", "#8a4a2c", "#3d5a2a"];

export function sealFor(addr: string): Seal {
  const h = fnv(addr.toLowerCase() + ":seal");
  return [h % 5, Math.floor(h / 5) % 5, Math.floor(h / 25) % 6, Math.floor(h / 150) % 6];
}

export function validSeal(t: unknown): t is Seal {
  return Array.isArray(t) && t.length === 4 && t.every((v, i) => Number.isInteger(v) && v >= 0 && v < PARTS[i]);
}

export const sealOf = (addr: string, pp?: number[] | null): Seal => (validSeal(pp) ? pp : sealFor(addr));
