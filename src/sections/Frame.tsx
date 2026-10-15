/** The top bar and the closing screen. */
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight, Flame, XLogo } from "@phosphor-icons/react";
import { prefersReducedMotion } from "../lib/motion";
import { OrenFace } from "./Story";
import { ForestEdge } from "../world/Edges";
import { DEMO, X_URL, dexUrl, type Status } from "../lib/api";
import { CHAIN, ISLAND, NAME, TICKER } from "../lib/brand";
import { BuyButton, CaCopy, ConnectButton, openPlot, useMedia } from "../ui/Bits";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** The walk down the island, one stop per place. The flame marks where you are. */
const STOPS: [id: string, label: string][] = [
  ["top", "Orbit"],
  ["rules", "Fire line"],
  ["board", "Plantation"],
  ["mill", "Mill"],
  ["ledger", "Weighbridge"],
  ["haze", "Haze"],
  ["plot", "Land office"],
  ["end", "Last tree"],
];

export function Journey() {
  const [on, setOn] = useState("top");
  useEffect(() => {
    const st = STOPS.map(([id]) => ScrollTrigger.create({ trigger: `#${id}`, start: "top 55%", end: "bottom 55%", onToggle: (x) => x.isActive && setOn(id) }));
    return () => st.forEach((x) => x.kill());
  }, []);
  const at = STOPS.findIndex(([id]) => id === on);
  return (
    <nav className={`journey ${on === "top" ? "is-away" : ""}`} aria-label="Where you are on the island">
      <span className="journey__line" aria-hidden="true">
        <i style={{ height: `${(at / (STOPS.length - 1)) * 100}%` }} />
      </span>
      <ol>
        {STOPS.map(([id, label], i) => (
          <li key={id} className={i === at ? "is-on" : i < at ? "is-past" : ""}>
            <a href={`#${id}`} aria-current={i === at ? "location" : undefined}>
              <span className="journey__dot" aria-hidden="true">
                {i === at ? <Flame weight="fill" /> : null}
              </span>
              <span className="journey__label num">{label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

const LINKS: [string, string][] = [
  ["#rules", "Rules"],
  ["#board", "Concessions"],
  ["#mill", "Mill"],
  ["#ledger", "Log"],
  ["#haze", "Haze"],
  ["#plot", "My plot"],
];

/** The mark: a palm standing in a ring of fire. */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill="#10241a" stroke="#ff6a2b" strokeWidth="2" />
      <g fill="none" stroke="#c9d86b" strokeWidth="2.2" strokeLinecap="round">
        <path d="M16 25V14" />
        <path d="M16 14c-2-3.4-5.4-4.4-8.6-4M16 14c2-3.4 5.4-4.4 8.6-4M16 14c-.8-3.6.3-6.8 3.2-9M16 14c-3.6-1.3-6.8-.3-9.2 2.4M16 14c3.6-1.3 6.8-.3 9.2 2.4" />
      </g>
    </svg>
  );
}

export function TopBar({ status }: { status: Status | null }) {
  return (
    <header className="bar">
      <a className="bar__brand" href="#top" aria-label={`${NAME}, back to the top`}>
        <Mark />
        <span className="bar__word">{NAME}</span>
        <span className="bar__tick num">{TICKER}</span>
      </a>
      <nav className="bar__nav" aria-label="Sections">
        {LINKS.map(([h, l]) => (
          <a key={h} href={h}>
            {l}
          </a>
        ))}
      </nav>
      <div className="bar__acts">
        {X_URL ? (
          <a className="bar__x" href={X_URL} target="_blank" rel="noreferrer noopener" aria-label={`${NAME} on X`}>
            <XLogo weight="bold" aria-hidden="true" />
          </a>
        ) : null}
        <ConnectButton />
        <BuyButton status={status} className="is-small" />
      </div>
    </header>
  );
}

export function Closing({ status, orenAddr }: { status: Status | null; orenAddr?: string }) {
  const root = useRef<HTMLElement>(null);
  const narrow = useMedia("(max-width: 760px)");
  const ca = DEMO ? "" : status?.tokenAddress;
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(".night__moon", { y: 120, opacity: 0, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "top 30%", scrub: 0.6 } });
      gsap.from(".night__oren", { y: 30, opacity: 0, duration: 0.8, ease: "back.out(2)", scrollTrigger: { trigger: ".night__tree", start: "top 75%" } });
      gsap.from(".end__h", { y: 50, opacity: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: ".end__h", start: "top 88%" } });
    },
    { scope: root },
  );
  return (
    <footer className="place end" id="end" ref={root} aria-label="Closing">
      <ForestEdge />
      <div className="night" aria-hidden="true">
        <span className="night__moon" />
        <svg className="night__land" viewBox="0 0 1440 420" preserveAspectRatio="xMidYMax meet">
          <path fill="#0b1712" d="M0 420 V300 C220 280 420 320 640 300 S1100 270 1440 300 V420 Z" />
          <g stroke="#0b1712" strokeLinecap="round" fill="none">
            {Array.from({ length: 22 }, (_, k) => {
              const x = 20 + k * 52;
              const top = 250 + (k % 3) * 6;
              return (
                <g key={k}>
                  <path d={`M${x} 300 V${top}`} strokeWidth="4" />
                  <path d={`M${x} ${top} q-14 -8 -26 6 M${x} ${top} q14 -8 26 6 M${x} ${top} q-6 -16 -20 -14 M${x} ${top} q6 -16 20 -14`} strokeWidth="3" />
                </g>
              );
            })}
          </g>
          <g className="night__tree" fill="#0b1712">
            <rect x="1196" y="120" width="16" height="190" />
            <path d="M1204 210 L1160 160 M1204 180 L1250 140" stroke="#0b1712" strokeWidth="8" />
            <circle cx="1204" cy="104" r="64" />
            <circle cx="1150" cy="140" r="44" />
            <circle cx="1262" cy="132" r="50" />
            <circle cx="1220" cy="60" r="40" />
          </g>
          <g className="night__oren" transform="translate(1176 66)">
            <svg width="56" height="56" viewBox="0 0 64 64">
              <OrenFace size={64} />
            </svg>
          </g>
        </svg>
      </div>
      {orenAddr ? (
        <button type="button" className="night__who num" onClick={() => openPlot(orenAddr)}>
          Oren · dev wallet · open the record
        </button>
      ) : null}
      <div className="wrap end__wrap">
        <p className="head__k num">Stop 08 · the last tree</p>
        <p className="end__h">
          The forest
          <br />
          <em>doesn't come back.</em>
        </p>
        <p className="end__sub">
          Oren still sits in the last tree, the one the fire reaches last. That is the dev wallet: it watches, it is never ranked, never paid from the harvest. Buy and a
          tree burns. Hold and the palms are yours. Sell and you are smoke.
        </p>
        <div className="end__acts">
          <BuyButton status={status} />
          <CaCopy status={status} compact={narrow} />
        </div>
        <nav className="end__links num" aria-label="Elsewhere">
          {X_URL ? (
            <a href={X_URL} target="_blank" rel="noreferrer">
              <XLogo weight="bold" aria-hidden="true" /> {NAME} on X
            </a>
          ) : null}
          {ca ? (
            <a href={dexUrl(ca)} target="_blank" rel="noreferrer">
              Chart <ArrowUpRight weight="bold" aria-hidden="true" />
            </a>
          ) : null}
          <a href="/terms.html">Terms</a>
          <a href="/privacy.html">Privacy</a>
        </nav>
        <p className="end__fine">
          {NAME} · {TICKER} · {CHAIN}. {ISLAND} is made up and so are its trees: this is satire, and no real forest is touched by this token. Real ones are
          cleared for palm oil every day. A memecoin with no promise of value; the Rewards depend on trading fees and can stop.
        </p>
      </div>
    </footer>
  );
}
