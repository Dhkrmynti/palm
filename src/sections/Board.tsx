/**
 * The plantation: the land the fire left behind, in rows. The ten biggest holders who never sold own
 * it, five blocks in the core estate and five in the outer estate, each block marked with a concrete
 * stake and its palm drawn to the size of the holding. Below: No. 11-50 at the forest edge, the
 * wallets still waiting, and a tab for the oldest roots (held longest).
 */
import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CaretDown, Flame } from "@phosphor-icons/react";
import { DEFAULT_STEPS, DEFAULT_TIERS, amount, demoDiamond, splitInheritance, usePoll, type Diamond, type Pond, type PondRow, type Status } from "../lib/api";
import { nameFor } from "../lib/alias";
import { Countdown, Held } from "../lib/clock";
import { TICKER } from "../lib/brand";
import { prefersReducedMotion } from "../lib/motion";
import { Face, Head, XCheck, openPlot } from "../ui/Bits";
import { Glyph } from "../ui/Seal";
import { PalmEdge } from "../world/Edges";

function Row({ r, share, max }: { r: PondRow; share: number; max: number }) {
  const n = nameFor(r.addr, r.nickname, r.x);
  const bal = parseFloat(r.balance);
  const inti = r.rank <= 5;
  const block = r.rank <= 10 ? `${inti ? "A" : "B"}${inti ? r.rank : r.rank - 5}` : `C${r.rank - 10}`;
  const size = max > 0 ? 18 + Math.sqrt(bal / max) * 26 : 18;
  return (
    <li className={`plot-row ${r.rank === 1 ? "is-one" : ""} ${inti ? "is-inti" : r.rank <= 10 ? "is-plasma" : "is-edge"}`}>
      <button type="button" onClick={() => openPlot(r.addr)} aria-label={`No. ${r.rank}, ${n.name}. Open the plot`}>
        <span className="stake num" aria-hidden="true">
          {r.rank === 1 ? <Flame weight="fill" /> : r.rank}
        </span>
        <span className="plot-row__block num">Block {block}</span>
        <span className="plot-row__palm" aria-hidden="true">
          <Glyph sign={0} size={size} />
        </span>
        <Face addr={r.addr} pp={r.pp} x={r.x} size={34} className="plot-row__face" />
        <span className="plot-row__who">
          <b className={n.claimed ? "" : "num"}>
            {n.name} {r.x ? <XCheck x={r.x} /> : null}
          </b>
          <span className="num">
            held <Held since={r.firstIn} />
          </span>
        </span>
        <span className="plot-row__bal num">
          {amount(r.balance)} <small>{TICKER}</small>
        </span>
        <span className="plot-row__next num">{r.inTop ? `+${share.toFixed(4)}` : "-"}</span>
        <span className="plot-row__paid num">{parseFloat(r.received) > 0 ? parseFloat(r.received).toFixed(4) : "-"}</span>
      </button>
    </li>
  );
}

function Roots() {
  const { data } = usePoll<Diamond>("/api/diamond?limit=20", 20000, demoDiamond);
  const rows = data?.rows ?? [];
  if (!rows.length) return <p className="empty">No roots yet.</p>;
  return (
    <ol className="roots">
      {rows.map((r) => {
        const n = nameFor(r.addr, r.nickname, r.x);
        return (
          <li key={r.addr}>
            <button type="button" onClick={() => openPlot(r.addr)}>
              <span className="num roots__n">{r.rank}</span>
              <Face addr={r.addr} pp={r.pp} x={r.x} size={28} />
              <b className={n.claimed ? "" : "num"}>{n.name}</b>
              <Held since={r.firstIn} className="roots__t" />
              <span className="num roots__b">No. {r.balanceRank} by holdings</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function EstateSign({ name, sub }: { name: string; sub: string }) {
  return (
    <p className="estate">
      <span className="estate__board">
        <b>{name}</b>
        <span className="num">{sub}</span>
      </span>
      <span className="estate__legs" aria-hidden="true" />
    </p>
  );
}

export function Board({ status, pond }: { status: Status | null; pond: Pond | null }) {
  const root = useRef<HTMLElement>(null);
  const [tab, setTab] = useState<"land" | "roots">("land");
  const [more, setMore] = useState(false);
  const live = !!status?.tokenAddress;
  const rows = live ? (pond?.rows ?? []) : [];
  const top = rows.filter((r) => r.inTop);
  const reward = parseFloat((status?.cycle.steps ?? DEFAULT_STEPS).find((s) => s.kind === "feeding")?.thresholdETH ?? "0.02");
  const tiers = status?.rules.tiers ?? DEFAULT_TIERS;
  const shares = splitInheritance(reward, top.map((r) => parseFloat(r.balance)), tiers);
  const max = parseFloat(rows[0]?.balance ?? "0");
  const waiting = live ? (pond?.waiting ?? []) : [];

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(".edge--palms .edge__palm", { scaleY: 0, transformOrigin: "50% 100%", duration: 0.6, ease: "back.out(2)", stagger: 0.03, scrollTrigger: { trigger: root.current, start: "top 95%" } });
      gsap.from(".estate", { y: -30, opacity: 0, duration: 0.6, ease: "back.out(2)", stagger: 0.2, scrollTrigger: { trigger: ".rows", start: "top 85%" } });
      gsap.from(".rows .plot-row", { x: -40, opacity: 0, duration: 0.5, ease: "power2.out", stagger: 0.05, scrollTrigger: { trigger: ".rows", start: "top 80%" } });
    },
    { scope: root, dependencies: [rows.length > 0] },
  );

  return (
    <section className="place farm" id="board" ref={root} aria-labelledby="board-h">
      <PalmEdge />
      <div className="wrap">
        <Head
          kicker="Stop 03 · the plantation"
          id="board-h"
          title={
            <>
              Ten own the plantation. <em>Everyone else watches.</em>
            </>
          }
          lead={`Ranked by ${TICKER} held, never sold. The next Reward of ${reward} ETH splits ${tiers.map((t) => `${t.pct}% to No. ${t.from}-${t.to}`).join(" and ")}, by balance inside each estate. Each block's palm is drawn to the size of what it holds.`}
        />
        <div className="tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "land"} className={tab === "land" ? "is-on" : ""} onClick={() => setTab("land")}>
            By land held
          </button>
          <button type="button" role="tab" aria-selected={tab === "roots"} className={tab === "roots" ? "is-on" : ""} onClick={() => setTab("roots")}>
            Oldest roots
          </button>
        </div>
        {tab === "roots" ? (
          <Roots />
        ) : !rows.length ? (
          <p className="empty">{live ? "No concessions yet. The first wallet over the minimum takes the torch." : "The plantation opens at launch."}</p>
        ) : (
          <div className="rows">
            <div className="rows__cols num" aria-hidden="true">
              <span>Stake</span>
              <span>Block</span>
              <span />
              <span>Holder</span>
              <span>Holds</span>
              <span>Next Reward</span>
              <span>Paid so far</span>
            </div>
            <EstateSign name="Core estate" sub={`No. 1-5 · ${tiers[0]?.eth ?? "0.014"} ETH per Reward`} />
            <ol>
              {top.slice(0, 5).map((r, i) => (
                <Row key={r.addr} r={r} share={shares[i] ?? 0} max={max} />
              ))}
            </ol>
            {top.length > 5 ? (
              <>
                <EstateSign name="Outer estate" sub={`No. 6-10 · ${tiers[1]?.eth ?? "0.006"} ETH per Reward`} />
                <ol>
                  {top.slice(5, 10).map((r, i) => (
                    <Row key={r.addr} r={r} share={shares[i + 5] ?? 0} max={max} />
                  ))}
                </ol>
              </>
            ) : null}
            {rows.length > 10 ? (
              <>
                <button type="button" className="rows__more num" aria-expanded={more} onClick={() => setMore(!more)}>
                  {more ? "Hide" : "Show"} No. 11-{rows.length}, still at the forest edge <CaretDown weight="bold" aria-hidden="true" className={more ? "is-up" : ""} />
                </button>
                {more ? (
                  <ol className="rows__rest">
                    {rows.slice(10).map((r) => (
                      <Row key={r.addr} r={r} share={0} max={max} />
                    ))}
                  </ol>
                ) : null}
              </>
            ) : null}
            {waiting.length ? (
              <div className="rows__wait">
                <p className="num">Waiting at the gate: over the minimum, first buy still too fresh</p>
                <ul>
                  {waiting.map((w) => (
                    <li key={w.addr}>
                      <button type="button" onClick={() => openPlot(w.addr)}>
                        <Face addr={w.addr} pp={w.pp} x={w.x} size={24} />
                        <span className="num">{nameFor(w.addr, w.nickname, w.x).name}</span>
                        <span className="num">{amount(w.balance)}</span>
                        <Countdown to={w.eligibleAt} done="in" className="rows__cd" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
        <p className="farm__foot num">
          {live && status ? `${status.counts.sitters} wallets on the land · ${status.counts.holders} holders · ${status.counts.hopped} gone up in smoke` : ""}
        </p>
      </div>
    </section>
  );
}
