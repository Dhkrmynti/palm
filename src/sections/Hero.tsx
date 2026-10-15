/**
 * The first screen: the satellite pass. The island fills the screen; the headline, the forest
 * counter and the radio log sit over it like the readouts on a monitoring feed.
 */
import { useMemo, useRef } from "react";
import { ArrowDown } from "@phosphor-icons/react";
import { DEMO, type Forest, type Pond, type Status } from "../lib/api";
import { nameFor } from "../lib/alias";
import { ISLAND, TICKER } from "../lib/brand";
import { useNow } from "../lib/clock";
import type { Line } from "../lib/feed";
import { IslandMap, type Pin } from "../map/IslandMap";
import { BuyButton, openPlot } from "../ui/Bits";

const ago = (sec: number) => (sec < 60 ? `${Math.max(1, Math.floor(sec))}s` : sec < 3600 ? `${Math.floor(sec / 60)}m` : `${Math.floor(sec / 3600)}h`);

export function Hero({ status, pond, forest, feed }: { status: Status | null; pond: Pond | null; forest: Forest | null; feed: Line[] }) {
  const live = !!status?.tokenAddress;
  const total = forest?.total ?? status?.forest?.total ?? 5000;
  const burned = live ? (forest?.burned ?? status?.forest?.burned ?? 0) : 0;
  const left = Math.max(0, total - burned);
  const pct = total > 0 ? (burned / total) * 100 : 0;

  const pins: Pin[] = useMemo(
    () => (live ? (pond?.rows ?? []).slice(0, 10) : []).map((r) => ({ id: r.addr.toLowerCase(), addr: r.addr, name: nameFor(r.addr, r.nickname, r.x).name })),
    [pond, live],
  );
  const house = live && pond?.house ? pond.house : null;
  const oren = useMemo(() => (house ? { id: house.addr, addr: house.addr, name: nameFor(house.addr, house.nickname, house.x).name } : null), [house?.addr, house?.nickname, house?.x?.username]);
  const gone = useRef(new Set<string>());
  for (const a of pond?.sold ?? []) gone.current.add(a.toLowerCase());
  for (const o of pond?.out ?? []) gone.current.add(o.addr.toLowerCase());

  const now = useNow();
  const lastBurn = forest?.recent[0];
  const clock = new Date(now * 1000).toLocaleTimeString("en-GB", { timeZone: "Asia/Jakarta", hour12: false });

  return (
    <section className="hero" id="top" aria-label="The island">
      <div className="hero__map">
        <IslandMap burned={burned} total={total} pins={pins} oren={oren} gone={gone.current} onPick={openPlot} />
        <div className="hero__scan" aria-hidden="true" />
      </div>

      <div className="hero__hud num" aria-hidden="true">
        <span>SAT-07 · {ISLAND.toUpperCase()}</span>
        <span>0°48′S 112°05′E</span>
        <span>{clock} UTC+7</span>
        <span className="hero__rec">● LIVE PASS</span>
      </div>

      <div className="hero__copy">
        <p className="hero__k num">{ISLAND} · a forest island · {TICKER}</p>
        <h1 className="hero__h">
          Every buy
          <br />
          burns <em>a tree.</em>
        </h1>
        <p className="hero__sub">
          {left === 0 && live
            ? "The last tree is gone. The island is all palm now. Holding still pays; nothing grows back."
            : `${ISLAND} was old forest, edge to edge. Each ${TICKER} buy clears one tree and a palm goes in, in a straight row. The ten biggest holders own the plantation and get paid in ETH from the fees. Sell once and you go up in smoke.`}
          {DEMO ? <em className="demo"> Demo data.</em> : null}
        </p>
        <div className="hero__acts">
          <BuyButton status={status} />
          <a className="btn is-ghost" href="#board">
            The concessions <ArrowDown weight="bold" aria-hidden="true" />
          </a>
        </div>
      </div>

      <dl className="meter" aria-label="The forest">
        <div className="meter__cell">
          <dt>Trees left</dt>
          <dd className="num is-forest" key={`l${left}`}>
            {left.toLocaleString("en-US")}
          </dd>
        </div>
        <div className="meter__cell">
          <dt>Palms planted</dt>
          <dd className="num is-palm is-bump" key={`b${burned}`}>
            {burned.toLocaleString("en-US")}
          </dd>
        </div>
        <div className="meter__cell is-wide">
          <dt>Island cleared</dt>
          <dd className="num is-fire">{pct.toFixed(pct < 10 ? 2 : 1)}%</dd>
          <span className="meter__bar" aria-hidden="true">
            <i style={{ width: `${Math.min(100, pct)}%` }} />
          </span>
        </div>
        <div className="meter__cell">
          <dt>Last tree</dt>
          <dd className="num">{lastBurn && live ? `${ago(now - lastBurn.t)} ago` : "not yet"}</dd>
        </div>
      </dl>

      <aside className="radio" aria-label="Radio log">
        <p className="radio__k num">Radio · what just happened</p>
        <ol aria-live="polite">
          {feed.length ? (
            feed.map((l) => (
              <li key={l.id} className={`radio__line is-${l.tone}`}>
                {l.who ? <b>{l.who}</b> : null} {l.text}
              </li>
            ))
          ) : (
            <li className="radio__line is-ash">{live ? "Quiet over the canopy." : "Radio opens at launch."}</li>
          )}
        </ol>
      </aside>
    </section>
  );
}
