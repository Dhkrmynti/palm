/**
 * The radio log: what just happened on the island, one line each. Read off the changes between two
 * boards (a new torch bearer, a new concession, a sale), the trees that burned and the rounds the
 * engine reports. Nothing here is stored or sent.
 */
import { useEffect, useRef, useState } from "react";
import { nameFor } from "./alias";
import { amount, short, type Forest, type Pond, type RoundRow } from "./api";
import { speciesOf } from "./trees";
import { TICKER } from "./brand";

export type Tone = "fire" | "palm" | "ash" | "gold";
export interface Line {
  id: number;
  at: number;
  tone: Tone;
  who?: string;
  text: string;
}

export interface RewardDrop {
  eth: number;
  n: number;
}
export const dropReward = (d: RewardDrop) => window.dispatchEvent(new CustomEvent<RewardDrop>("palm:reward", { detail: d }));

let next = 1;

export function useFeed(pond: Pond | null, rounds: RoundRow[] | null, forest: Forest | null, live: boolean) {
  const [lines, setLines] = useState<Line[]>([]);
  const push = (l: Omit<Line, "id" | "at">[]) => l.length && setLines((all) => [...l.map((x) => ({ ...x, id: next++, at: Date.now() })).reverse(), ...all].slice(0, 7));

  const lastBurn = useRef<number | null>(null);
  useEffect(() => {
    if (!forest) return;
    const fresh = lastBurn.current === null ? forest.recent.slice(0, 4) : forest.recent.filter((b) => b.n > lastBurn.current!);
    push(
      fresh
        .slice(0, 6)
        .reverse()
        .map((b) => ({ tone: "fire" as const, who: nameFor(b.buyer, b.nickname, b.x).name, text: `bought ${amount(b.amount)} ${TICKER}. ${speciesOf(b.n)} #${b.n.toLocaleString("en-US")} burned.` })),
    );
    lastBurn.current = forest.recent[0]?.n ?? lastBurn.current ?? 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forest]);

  const top = useRef<string[] | null>(null);
  const names = useRef(new Map<string, string>());
  const sold = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!live || !pond) return;
    const rows = pond.rows.slice(0, 10);
    rows.forEach((r) => names.current.set(r.addr.toLowerCase(), nameFor(r.addr, r.nickname, r.x).name));
    const ids = rows.map((r) => r.addr.toLowerCase());
    const out: Omit<Line, "id" | "at">[] = [];
    if (top.current) {
      if (ids[0] && ids[0] !== top.current[0]) out.push({ tone: "gold", who: names.current.get(ids[0]), text: "took the torch. No. 1 now." });
      ids.forEach((id, i) => {
        if (i === 0 || top.current!.includes(id)) return;
        out.push({ tone: "palm", who: names.current.get(id), text: `staked a concession in the ${i < 5 ? "core" : "outer"} estate` });
      });
    }
    top.current = ids;
    const gone = [...(pond.sold ?? []), ...(pond.out ?? []).map((o) => o.addr)].map((a) => a.toLowerCase());
    if (sold.current) {
      for (const a of gone)
        if (!sold.current.has(a)) {
          sold.current.add(a);
          out.push({ tone: "ash", who: names.current.get(a) ?? short(a), text: "sold. Went up in smoke." });
        }
    } else sold.current = new Set(gone);
    push(out);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pond, live]);

  const lastRound = useRef<number | null>(null);
  useEffect(() => {
    if (!rounds?.length) return;
    const done = rounds.filter((r) => r.stage === "done").sort((a, b) => a.n - b.n);
    const say = (r: RoundRow): Omit<Line, "id" | "at"> =>
      r.kind === "feeding"
        ? { tone: "gold", text: `Harvest #${r.n}: ${parseFloat(r.fedETH).toFixed(4)} ETH to ${r.recipients || 10} concessions` }
        : { tone: "palm", text: `Mill #${r.n}: ${parseFloat(r.spentETH).toFixed(4)} ETH to the treasury` };
    if (lastRound.current !== null) {
      const fresh = done.filter((r) => r.n > lastRound.current!);
      push(fresh.map(say));
      fresh.filter((r) => r.kind === "feeding").forEach((r) => dropReward({ eth: parseFloat(r.fedETH), n: r.n }));
    }
    lastRound.current = done.at(-1)?.n ?? 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rounds]);

  return lines;
}
