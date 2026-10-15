/**
 * Behind the plantation, the mill. Trading fees pour into its tank; when the tank reaches the next
 * step, the valve opens and the oil runs down one of two pipes: the Reward to the ten, or the
 * Treasury. Then the weighbridge office, where every round is printed on a ticket, and the haze that
 * rolls over everything: every wallet that sold.
 */
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "@phosphor-icons/react";
import { DEFAULT_STEPS, STEP, dateWib, demoGraveyard, eth, stepShare, txUrl, usePoll, type Graveyard, type RoundRow, type Status } from "../lib/api";
import { nameFor } from "../lib/alias";
import { span } from "../lib/clock";
import { ISLAND } from "../lib/brand";
import { prefersReducedMotion } from "../lib/motion";
import { Face, Head, openPlot } from "../ui/Bits";
import { MillEdge, RoofEdge, SmokeEdge } from "../world/Edges";

export function Mill({ status }: { status: Status | null }) {
  const root = useRef<HTMLElement>(null);
  const live = !!status?.tokenAddress;
  const steps = status?.cycle.steps ?? DEFAULT_STEPS;
  const idx = live ? (status?.cycle.index ?? 0) : 0;
  const step = steps[idx] ?? steps[0];
  const escrow = live ? parseFloat(status?.escrowETH ?? "0") : 0;
  const target = parseFloat(step.thresholdETH);
  const pct = target > 0 ? Math.max(0, Math.min(1, escrow / target)) : 0;
  const toTen = stepShare(steps, "feeding");
  const t = status?.totals;
  const reward = steps.find((s) => s.kind === "feeding");
  const treasury = steps.find((s) => s.kind === "keeper");

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(".tank__oil", { scaleY: 0 }, { scaleY: 1, transformOrigin: "50% 100%", ease: "none", scrollTrigger: { trigger: ".tank", start: "top 80%", end: "center 45%", scrub: 0.6 } });
      gsap.from(".outlet", { x: 50, opacity: 0, duration: 0.6, ease: "back.out(1.6)", stagger: 0.15, scrollTrigger: { trigger: ".works", start: "top 70%" } });
      gsap.from(".plate", { y: 30, opacity: 0, duration: 0.5, ease: "power2.out", stagger: 0.08, scrollTrigger: { trigger: ".plates", start: "top 88%" } });
    },
    { scope: root },
  );

  return (
    <section className="place mill" id="mill" ref={root} aria-labelledby="mill-h">
      <MillEdge />
      <div className="wrap">
        <Head
          kicker="Stop 04 · the mill"
          id="mill-h"
          title={
            <>
              Fees in. <em>ETH out.</em>
            </>
          }
          lead="Every trade pays a fee into the mill's tank. When it reaches the size of the next step, the valve opens and the engine runs that step, in this order, forever."
        />
        <div className="works">
          <div className="tank" role="meter" aria-valuemin={0} aria-valuemax={target} aria-valuenow={escrow} aria-label={`${STEP[step.kind].name}: ${escrow.toFixed(4)} of ${step.thresholdETH} ETH`}>
            <p className="tank__k num">Tank · now filling {STEP[step.kind].name}</p>
            <div className="tank__body">
              <span className="tank__oil" style={{ height: `${Math.max(4, pct * 100)}%` }} />
              <span className="tank__marks" aria-hidden="true" />
              <span className="tank__pct num">{Math.round(pct * 100)}%</span>
            </div>
            <p className="tank__v num">
              {escrow.toFixed(4)} <small>/ {step.thresholdETH} ETH</small>
            </p>
          </div>
          <svg className="pipes" viewBox="0 0 200 300" preserveAspectRatio="none" aria-hidden="true">
            <path className="pipes__pipe" d="M0 230 H90 V70 H200" />
            <path className="pipes__pipe" d="M0 230 H200" />
            <path className={`pipes__oil ${step.kind === "feeding" && live ? "is-flow" : ""}`} d="M0 230 H90 V70 H200" />
            <path className={`pipes__oil ${step.kind === "keeper" && live ? "is-flow" : ""}`} d="M0 230 H200" />
          </svg>
          <ol className="outlets">
            <li className={`outlet is-reward ${live && step.kind === "feeding" ? "is-now" : ""}`}>
              <span className="outlet__valve" aria-hidden="true" />
              <span className="outlet__n num">01</span>
              <b>Reward</b>
              <span className="num">{reward?.thresholdETH ?? "0.02"} ETH</span>
              <span>{STEP.feeding.does}, split by estate and by balance.</span>
            </li>
            <li className={`outlet is-treasury ${live && step.kind === "keeper" ? "is-now" : ""}`}>
              <span className="outlet__valve" aria-hidden="true" />
              <span className="outlet__n num">02</span>
              <b>Treasury</b>
              <span className="num">{treasury?.thresholdETH ?? "0.025"} ETH</span>
              <span>{STEP.keeper.does}. Then back to 01.</span>
            </li>
          </ol>
        </div>
        <div className="plates">
          <div className="plate is-split">
            <p className="num">Over one full loop</p>
            <span className="split__bar" aria-hidden="true">
              <i className="is-ten" style={{ width: `${toTen}%` }} />
              <i className="is-tr" style={{ width: `${100 - toTen}%` }} />
            </span>
            <p className="split__legend num">
              <span>{toTen}% to the ten</span>
              <span>{100 - toTen}% to the treasury</span>
            </p>
          </div>
          <div className="plate">
            <p className="num">Fees claimed</p>
            <b className="num">{eth(live ? (t?.feesClaimedETH ?? "0") : "0")}</b>
          </div>
          <div className="plate">
            <p className="num">Paid to holders</p>
            <b className="num">{eth(live ? (t?.fedETH ?? "0") : "0")}</b>
          </div>
          <div className="plate">
            <p className="num">To treasury</p>
            <b className="num">{eth(live ? (t?.keeperETH ?? "0") : "0")}</b>
          </div>
          <div className="plate">
            <p className="num">Rounds run</p>
            <b className="num">{live ? (status?.rounds ?? 0) : 0}</b>
          </div>
        </div>
        <p className="mill__fine">No buyback, no token burn. The only thing that burns here is the forest.</p>
      </div>
    </section>
  );
}

export function Ledger({ rounds, live }: { rounds: RoundRow[] | null; live: boolean }) {
  const root = useRef<HTMLElement>(null);
  const rows = live ? (rounds ?? []).filter((r) => r.stage === "done").slice(0, 14) : [];
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(".ticket", { clipPath: "inset(0 0 100% 0)", y: -40 }, { clipPath: "inset(0 0 0% 0)", y: 0, ease: "none", scrollTrigger: { trigger: ".counter", start: "top 75%", end: "center 50%", scrub: 0.6 } });
      gsap.fromTo(".ticket__stamp", { scale: 3, opacity: 0, rotate: 30 }, { scale: 1, opacity: 1, rotate: -12, duration: 0.35, ease: "power4.in", scrollTrigger: { trigger: ".ticket", start: "bottom 85%", toggleActions: "play none none reverse" } });
    },
    { scope: root, dependencies: [rows.length > 0] },
  );
  return (
    <section className="place office" id="ledger" ref={root} aria-labelledby="ledger-h">
      <RoofEdge />
      <div className="wrap">
        <Head kicker="Stop 05 · the weighbridge" id="ledger-h" title={<>Every round, <em>on a ticket.</em></>} lead="The weighbridge prints one line per round, and each line links to its transaction. Nobody has to take our word for it." />
        <div className="counter">
          {rows.length ? (
            <div className="ticket" role="table" aria-label="Rounds">
              <div className="ticket__head num" aria-hidden="true">
                <b>{ISLAND.toUpperCase()} PALM OIL MILL</b>
                <span>Weighbridge ticket</span>
              </div>
              <div className="ticket__row is-head num" role="row">
                <span role="columnheader">No.</span>
                <span role="columnheader">Step</span>
                <span role="columnheader">When (UTC+7)</span>
                <span role="columnheader">ETH</span>
                <span role="columnheader">To</span>
                <span role="columnheader">Tx</span>
              </div>
              {rows.map((r) => (
                <div key={r.n} className={`ticket__row num is-${r.kind}`} role="row">
                  <span role="cell">#{r.n}</span>
                  <span role="cell">
                    <b>{STEP[r.kind].name}</b>
                  </span>
                  <span role="cell">{dateWib(r.doneAt || r.at)}</span>
                  <span role="cell">{parseFloat(r.kind === "feeding" ? r.fedETH : r.spentETH).toFixed(4)}</span>
                  <span role="cell">{r.kind === "feeding" ? `${r.recipients} holders` : "treasury"}</span>
                  <span role="cell">
                    {r.tx ? (
                      <a href={txUrl(r.tx)} target="_blank" rel="noreferrer">
                        {r.tx.slice(0, 8)}… <ArrowUpRight weight="bold" aria-hidden="true" />
                      </a>
                    ) : (
                      "-"
                    )}
                  </span>
                </div>
              ))}
              <p className="ticket__foot num" aria-hidden="true">
                ********** all on chain **********
              </p>
              <span className="ticket__stamp num" aria-hidden="true">
                Paid
                <br />
                on chain
              </span>
            </div>
          ) : (
            <p className="empty">{live ? "No round yet. The first runs when the tank reaches its first step." : "The weighbridge opens at launch."}</p>
          )}
        </div>
      </div>
    </section>
  );
}

export function Haze({ status }: { status: Status | null }) {
  const root = useRef<HTMLElement>(null);
  const live = !!status?.tokenAddress;
  const { data } = usePoll<Graveyard>(live ? "/api/graveyard?limit=24" : null, 30000, demoGraveyard);
  const rows = live ? (data?.rows ?? []) : [];
  const shortest = rows.length ? rows.reduce((a, b) => (b.hoppedAt - b.firstIn < a.hoppedAt - a.firstIn ? b : a)) : null;
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.to(".haze__cloud", { xPercent: (i) => (i % 2 ? -18 : 18), ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.8 } });
      gsap.from(".puff", { y: 60, opacity: 0, filter: "blur(10px)", duration: 0.9, ease: "power2.out", stagger: 0.07, scrollTrigger: { trigger: ".puffs", start: "top 85%" } });
    },
    { scope: root, dependencies: [rows.length > 0] },
  );
  return (
    <section className="place haze" id="haze" ref={root} aria-labelledby="haze-h">
      <SmokeEdge />
      <span className="haze__cloud is-a" aria-hidden="true" />
      <span className="haze__cloud is-b" aria-hidden="true" />
      <span className="haze__cloud is-c" aria-hidden="true" />
      <div className="wrap">
        <Head
          kicker="Stop 06 · the haze"
          id="haze-h"
          title={
            <>
              They sold. <em>Now they are smoke.</em>
            </>
          }
          lead={`${live ? (data?.total ?? 0) : 0} wallets have drifted off the island. Out for good: no concession, no harvest.${shortest ? ` Shortest stay: ${span(shortest.hoppedAt - shortest.firstIn)}.` : ""}`}
        />
        {rows.length ? (
          <ul className="puffs">
            {rows.map((g) => {
              const n = nameFor(g.addr, g.nickname, g.x);
              return (
                <li key={g.addr} className="puff">
                  <button type="button" onClick={() => openPlot(g.addr)}>
                    <Face addr={g.addr} pp={g.pp} x={g.x} size={30} className="puff__face" />
                    <b className={n.claimed ? "" : "num"}>{n.name}</b>
                    <span className="num">held {span(g.hoppedAt - g.firstIn)}</span>
                    <span className="num">{parseFloat(g.received) > 0 ? `paid ${parseFloat(g.received).toFixed(4)} ETH before` : "never paid"}</span>
                  </button>
                  {g.hoppedTx ? (
                    <a className="puff__tx num" href={txUrl(g.hoppedTx)} target="_blank" rel="noreferrer" aria-label="The sale's transaction">
                      sale tx <ArrowUpRight weight="bold" aria-hidden="true" />
                    </a>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="empty">{live ? "Clear skies. Nobody has sold yet." : "Clear skies until launch."}</p>
        )}
      </div>
    </section>
  );
}
