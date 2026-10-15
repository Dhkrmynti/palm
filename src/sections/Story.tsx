/**
 * Ground level, at the fire line: the burn ticker (every recent tree, by name), then the rules on
 * the boards that stand where the forest ends. The big one is the forest's own warning sign,
 * half burned, with the island's new rule sprayed over it.
 */
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { amount, short, type Forest, type Status } from "../lib/api";
import { nameFor } from "../lib/alias";
import { ISLAND, TICKER } from "../lib/brand";
import { ageOf, speciesOf } from "../lib/trees";
import { prefersReducedMotion } from "../lib/motion";
import { Head } from "../ui/Bits";
import { Glyph } from "../ui/Seal";
import { openShare } from "../ui/ShareCard";

gsap.registerPlugin(useGSAP);

export function Ticker({ forest, live }: { forest: Forest | null; live: boolean }) {
  const rows = live ? (forest?.recent ?? []).slice(0, 14) : [];
  if (!rows.length)
    return (
      <div className="ticker is-empty num" aria-label="Recent burns">
        <span>No tree has burned yet. The first buy lights the first one.</span>
      </div>
    );
  const strip = (hidden: boolean) => (
    <ul className="ticker__run" aria-hidden={hidden || undefined}>
      {rows.map((b) => {
        const who = nameFor(b.buyer, b.nickname, b.x).name || short(b.buyer);
        return (
          <li key={`${hidden}-${b.n}`}>
            <button
              type="button"
              tabIndex={hidden ? -1 : undefined}
              onClick={() => openShare({ n: b.n, amount: b.amount, t: b.t, total: forest?.total ?? 5000, who })}
              aria-label={hidden ? undefined : `${speciesOf(b.n)} #${b.n}, burned by ${who}. Open its share card`}
            >
              <b>
                {speciesOf(b.n)} #{b.n.toLocaleString("en-US")}
              </b>
              <span>{ageOf(b.n)} yrs old</span>
              <span>
                burned by {who} · {amount(b.amount)} {TICKER}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
  return (
    <div className="ticker num" aria-label="Recent burns">
      <div className="ticker__track">
        {strip(false)}
        {strip(true)}
      </div>
    </div>
  );
}

export function FireLine({ status, forest }: { status: Status | null; forest: Forest | null }) {
  const root = useRef<HTMLElement>(null);
  const min = amount(status?.rules.minBalance ?? "100000");
  const treeMin = amount(forest?.minTokens ?? "10000");
  const out = status?.tokenAddress ? status.counts.hopped : 0;
  const boards = [
    { n: "01", sign: 1, t: "Buy, and a tree burns.", b: `One buy of at least ${treeMin} ${TICKER} clears one tree and plants one palm. It shows on the map within seconds, with the tree's name and age. Nothing grows back.` },
    { n: "02", sign: 0, t: "Hold, and stake a concession.", b: `Hold ${min} ${TICKER} or more and never sell. The ten biggest wallets own the plantation: No. 1 to 5 in the core estate, No. 6 to 10 in the outer estate. No. 1 holds the torch.` },
    { n: "03", sign: 3, t: "The harvest is paid in ETH.", b: "Trading fees fill the mill. Each time they reach the next step, the engine pays it out: the Reward straight to the ten, then a step to the Treasury, then the Reward again." },
    { n: "04", sign: 4, t: "Sell once, and you are smoke.", b: `A wallet that sells is out for good: no concession, no harvest, ever. Moving ${TICKER} between your own wallets is not a sale.${out ? ` ${out} have gone up in smoke so far.` : ""}` },
  ];

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(".warn", { rotate: -9, y: -60, opacity: 0, duration: 0.9, ease: "back.out(1.4)", scrollTrigger: { trigger: ".warn", start: "top 85%" } });
      gsap.fromTo(".warn__spray path", { strokeDashoffset: 420 }, { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut", stagger: 0.25, delay: 0.6, scrollTrigger: { trigger: ".warn", start: "top 80%" } });
      gsap.from(".warn__tag", { scale: 2.4, opacity: 0, rotate: 14, duration: 0.4, ease: "power4.in", delay: 1.3, scrollTrigger: { trigger: ".warn", start: "top 80%" } });
      gsap.from(".board", { y: 80, rotate: (i) => (i % 2 ? 6 : -6), opacity: 0, duration: 0.8, ease: "back.out(1.5)", stagger: 0.12, scrollTrigger: { trigger: ".boards", start: "top 85%" } });
      gsap.to(".fire__glow", { yPercent: 30, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.6 } });
    },
    { scope: root },
  );

  return (
    <section className="place fire" id="rules" ref={root} aria-labelledby="rules-h">
      <div className="fire__glow" aria-hidden="true" />
      <div className="wrap">
        <Head kicker="Stop 02 · the fire line" id="rules-h" title={<>Four rules. <em>No regrowth.</em></>} lead={`This is where the forest of ${ISLAND} ends today. The boards say all there is to say.`} />
        <div className="fire__grid">
          <figure className="warn" aria-label="A forest warning sign, half burned, sprayed over: 1 buy, 1 tree">
            <div className="warn__board">
              <p className="warn__k num">Warning · protected forest</p>
              <p className="warn__h">
                Do not
                <br />
                burn the
                <br />
                forest
              </p>
              <p className="warn__en">By order of nobody, apparently</p>
              <svg className="warn__spray" viewBox="0 0 300 200" aria-hidden="true">
                <path d="M24 30 L276 176" />
                <path d="M276 30 L24 176" />
              </svg>
              <span className="warn__char" aria-hidden="true" />
            </div>
            <figcaption className="warn__tag">1 buy = 1 tree</figcaption>
            <span className="warn__post" aria-hidden="true" />
          </figure>
          <ol className="boards">
            {boards.map((b) => (
              <li key={b.n} className="board">
                <span className="board__nail" aria-hidden="true" />
                <span className="board__top">
                  <span className="board__n num">{b.n}</span>
                  <Glyph sign={b.sign} size={28} />
                </span>
                <h3>{b.t}</h3>
                <p>{b.b}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/** Oren, the last orangutan: a flat face, drawn here. */
export function OrenFace({ size = 64 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill="#b4531f" />
      <circle cx="5" cy="15" r="3.4" fill="#8f3e15" />
      <circle cx="27" cy="15" r="3.4" fill="#8f3e15" />
      <ellipse cx="16" cy="18" rx="9" ry="8.4" fill="#e7b48a" />
      <circle cx="12.4" cy="15.4" r="1.6" fill="#1b1410" />
      <circle cx="19.6" cy="15.4" r="1.6" fill="#1b1410" />
      <ellipse cx="16" cy="21.8" rx="4.2" ry="2.4" fill="#c98e63" />
      <path d="M13.6 21.4h4.8" stroke="#1b1410" strokeWidth="1" strokeLinecap="round" />
      <path d="M9 8c2-3 5-4 7-4s5 1 7 4" stroke="#8f3e15" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
