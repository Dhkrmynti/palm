/**
 * The forest, kept apart from the rest of the engine so it can be tested without a chain.
 * Display only: nothing here claims, sends or holds funds.
 *
 * A Transfer is a buy (one tree) when tokens leave the market (the curve, a pool, a router, a relay
 * or any contract) and land in a plain wallet that is not excluded, and the buy is big enough. One
 * transaction burns at most one tree. The book keeps every tree that burned, so any tree can get its
 * card later; the marks are the moments worth telling the world about.
 */

/** One tree in the book: who burned it, raw tokens bought, when, the transaction. */
export type BookEntry = [buyer: string, amount: string, t: number, tx: string];

export interface Burn {
  n: number;
  tx: string;
  buyer: string;
  amount: string;
  t: number;
}

export interface ForestState {
  burned: number;
  recent: Burn[];
  seen: string[];
  /** Every tree that burned, tree n at index n - 1. */
  book: BookEntry[];
  /** Marks already passed (see MARKS), so each is told once. */
  marks: string[];
}

export const freshForest = (): ForestState => ({ burned: 0, recent: [], seen: [], book: [], marks: [] });

export { MARKS, marksAt, type Mark } from "../src/lib/marks";
import { marksAt, type Mark } from "../src/lib/marks";

export interface BuyCheck {
  src: string;
  dst: string;
  /** Raw token units. */
  value: bigint;
  tx: string;
}

export interface BuyRules {
  /** Raw token units: smaller buys burn nothing. */
  minUnits: bigint;
  /** Optional: smallest buy in USD; only applied once a price is known. */
  minUSD?: number;
  /** USD per whole token, 0 when unknown. */
  tokenUSD?: number;
  decimals: number;
  excluded: Set<string>;
  sinks: Set<string>;
  router: string;
  dead: string;
  isRelay: (addr: string) => boolean;
  isContract: (addr: string) => Promise<boolean>;
}

/** Why a transfer burns no tree, or null when it burns one. */
export async function whyNotATree(f: ForestState, total: number, b: BuyCheck, r: BuyRules): Promise<string | null> {
  if (f.burned >= total) return "the forest is gone";
  if (f.seen.includes(b.tx)) return "this transaction already burned a tree";
  if (r.excluded.has(b.dst) || r.sinks.has(b.dst) || b.dst === r.dead) return "tokens went to the market or an excluded address";
  if (b.value < r.minUnits) return "smaller than the smallest buy";
  if (r.minUSD && r.tokenUSD && r.tokenUSD > 0) {
    const usd = (Number(b.value) / 10 ** r.decimals) * r.tokenUSD;
    if (usd < r.minUSD) return `worth $${usd.toFixed(2)}, under $${r.minUSD}`;
  }
  const fromMarket = r.sinks.has(b.src) || b.src === r.router || r.isRelay(b.src) || (await r.isContract(b.src));
  if (!fromMarket) return "a wallet-to-wallet transfer, not a buy";
  if (await r.isContract(b.dst)) return "tokens landed in a contract";
  return null;
}

/** Writes one burned tree into the forest. Returns the marks this tree passed. */
export function recordTree(f: ForestState, total: number, b: { buyer: string; amount: string; t: number; tx: string }): { n: number; marks: Mark[] } {
  f.burned++;
  const n = f.burned;
  f.seen.unshift(b.tx);
  if (f.seen.length > 400) f.seen.length = 400;
  f.recent.unshift({ n, tx: b.tx, buyer: b.buyer, amount: b.amount, t: b.t });
  if (f.recent.length > 60) f.recent.length = 60;
  f.book[n - 1] = [b.buyer, b.amount, b.t, b.tx];
  const passed = marksAt(n, total).filter((m) => !f.marks.includes(m));
  f.marks.push(...passed);
  return { n, marks: passed };
}

/** One tree from the book, or null if it has not burned (or burned before the book was kept). */
export function treeAt(f: ForestState, n: number) {
  const e = f.book[n - 1];
  if (!e) return null;
  return { n, buyer: e[0], amount: e[1], t: e[2], tx: e[3] };
}
