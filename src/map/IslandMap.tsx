/**
 * The satellite pass over Canopy Island. A canvas of the island: old forest in loose dark canopy,
 * cleared land in strict rows of palms, and the fire front glowing between them. When a buy lands,
 * the next patch catches, burns, goes to ash and comes back as a palm. Pins mark the ten concession
 * holders; Oren (the dev wallet) sits in the last tree.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Flame } from "@phosphor-icons/react";
import { clearedCells, island } from "./island";
import { drawForest, drawPalm, drawSoil, layoutFor, paintBase, paintCleared, paintGround, type Layout } from "./paint";
import { prefersReducedMotion } from "../lib/motion";

export type Pin = { id: string; addr: string; name: string };

const BURN_MS = 2600;

/** One buy on the map. `convert` turns its cell into a palm; otherwise the patch only flares up
 *  (the island has fewer cells than trees, so some buys burn part of a patch that is already alight). */
type Burning = { rank: number; at: number; convert: boolean };
type Puff = { x: number; y: number; vx: number; vy: number; r: number; life: number; age: number };

export function IslandMap({
  burned,
  total,
  pins,
  oren,
  gone,
  onPick,
}: {
  burned: number;
  total: number;
  pins: Pin[];
  oren: Pin | null;
  /** Ids that just sold, to puff into smoke where their pin stood. */
  gone: Set<string>;
  onPick: (addr: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [L, setL] = useState<Layout | null>(null);
  const cleared = clearedCells(burned, total);
  const state = useRef({ shown: -1, lastBurned: -1, burning: [] as Burning[], puffs: [] as Puff[], base: null as HTMLCanvasElement | null, ground: null as HTMLCanvasElement | null, baseFor: -1, L: null as Layout | null, dpr: 1 });

  // size
  useEffect(() => {
    const el = host.current!;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      if (r.width && r.height) setL(layoutFor(r.width, r.height));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // every new buy shows: queue one burn per tree, one after another. A buy that clears a new cell
  // turns it into a palm; a buy that doesn't makes the next cell on the front flare up.
  useEffect(() => {
    const st = state.current;
    if (st.lastBurned === -1) {
      // first look: the last few trees burn in, so the front is seen moving
      st.lastBurned = Math.max(0, burned - (prefersReducedMotion() ? 0 : 5));
      st.shown = clearedCells(st.lastBurned, total);
    }
    if (burned < st.lastBurned) {
      st.lastBurned = burned;
      st.shown = cleared;
      return;
    }
    const fresh = Math.min(burned - st.lastBurned, 60);
    const now = performance.now();
    for (let i = 0; i < fresh; i++) {
      const n = burned - fresh + i + 1;
      const c = clearedCells(n, total);
      if (c > st.shown) {
        for (let r = st.shown; r < c; r++) st.burning.push({ rank: r, at: now + i * 220, convert: true });
        st.shown = c;
      } else st.burning.push({ rank: st.shown, at: now + i * 220, convert: false });
    }
    st.lastBurned = burned;
  }, [burned, total, cleared]);

  // drawing
  useEffect(() => {
    if (!L) return;
    const c = canvas.current!;
    const st = state.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(L.w * dpr);
    c.height = Math.round(L.h * dpr);
    c.style.width = `${L.w}px`;
    c.style.height = `${L.h}px`;
    st.L = L;
    st.dpr = dpr;
    st.baseFor = -1;
    const still = prefersReducedMotion();
    const isl = island();
    const g = c.getContext("2d")!;
    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(c);

    const settled = () => {
      const now = performance.now();
      // a cell counts as palm in the base picture once its burn is over
      let n = st.shown;
      for (const b of st.burning) if (b.convert && now - b.at < BURN_MS) n = Math.min(n, b.rank);
      return n;
    };

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden) return;
      draw(t);
    };
    const draw = (t: number) => {
      const base = settled();
      if (!st.ground || st.ground.width !== c.width || st.ground.height !== c.height) {
        st.ground ||= document.createElement("canvas");
        st.ground.width = c.width;
        st.ground.height = c.height;
        paintGround(st.ground.getContext("2d")!, L, dpr);
        st.baseFor = -1;
      }
      if (st.base && st.baseFor >= 0 && base > st.baseFor && base - st.baseFor <= 40) {
        // a few more palms: paint just their patch
        paintCleared(st.base.getContext("2d")!, L, dpr, st.baseFor, base, st.ground);
        st.baseFor = base;
      } else if (!st.base || st.baseFor !== base) {
        st.base ||= document.createElement("canvas");
        st.base.width = c.width;
        st.base.height = c.height;
        paintBase(st.base.getContext("2d")!, L, dpr, base, st.ground);
        st.baseFor = base;
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(st.base, 0, 0);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const { s, ox, oy } = L;

      // the fire front: the next cells in line smoulder
      if (st.shown < isl.order.length) {
        for (let i = 0; i < 26; i++) {
          const cell = isl.order[st.shown + i];
          if (!cell) break;
          const flick = still ? 0.5 : 0.5 + 0.5 * Math.sin(t / 180 + cell.x * 1.7 + cell.y);
          g.fillStyle = `rgba(255, ${90 + Math.floor(flick * 60)}, 30, ${(0.32 - i * 0.011) * (0.6 + flick * 0.4)})`;
          g.fillRect(ox + cell.x * s, oy + cell.y * s, s, s);
          if (!still && Math.random() < 0.004) st.puffs.push({ x: ox + (cell.x + 0.5) * s, y: oy + cell.y * s, vx: 0.08 + Math.random() * 0.1, vy: -0.18 - Math.random() * 0.1, r: s * 0.8, life: 3200, age: 0 });
        }
      }

      // trees on fire: flame, then ash, then the palm fades in
      const now = performance.now();
      st.burning = st.burning.filter((b) => now - b.at < BURN_MS);
      for (const b of st.burning) {
        const cell = isl.order[b.rank];
        if (!cell) continue;
        const p = (now - b.at) / BURN_MS;
        const cx = ox + (cell.x + 0.5) * s;
        const cy = oy + (cell.y + 0.5) * s;
        if (p < 0) {
          if (b.convert) drawForest(g, cell.x, cell.y, L);
          continue;
        }
        if (p < 0.5) {
          const f = p / 0.5;
          const glow = g.createRadialGradient(cx, cy, 0, cx, cy, s * 3.2);
          glow.addColorStop(0, `rgba(255, 200, 80, ${0.9 - f * 0.4})`);
          glow.addColorStop(0.4, `rgba(255, 90, 30, ${0.55 - f * 0.3})`);
          glow.addColorStop(1, "rgba(255, 60, 20, 0)");
          g.fillStyle = glow;
          g.fillRect(cx - s * 3.2, cy - s * 3.2, s * 6.4, s * 6.4);
          g.fillStyle = `rgba(255, ${170 + Math.floor(Math.random() * 60)}, 60, 1)`;
          g.beginPath();
          g.arc(cx, cy, s * (0.5 + Math.random() * 0.25), 0, Math.PI * 2);
          g.fill();
          if (Math.random() < 0.25) st.puffs.push({ x: cx, y: cy - s * 0.5, vx: 0.05 + Math.random() * 0.12, vy: -0.25 - Math.random() * 0.15, r: s * 1.1, life: 3800, age: 0 });
        } else if (!b.convert) {
          // only a flare: the glow dies back and the patch stays forest, scorched, for now
          const f = (p - 0.5) / 0.5;
          g.fillStyle = `rgba(255, 120, 40, ${0.45 * (1 - f)})`;
          g.beginPath();
          g.arc(cx, cy, s * (0.8 + f), 0, Math.PI * 2);
          g.fill();
        } else if (p < 0.75) {
          g.fillStyle = "#5c5853";
          g.fillRect(ox + cell.x * s, oy + cell.y * s, s, s);
        } else {
          drawSoil(g, cell.x, cell.y, L);
          drawPalm(g, cell.x, cell.y, L, (p - 0.75) / 0.25);
        }
      }

      // the mill never stops: a thin plume from its chimney
      if (!still && Math.random() < 0.06) {
        const m = isl.mill;
        st.puffs.push({ x: ox + (m.x + 1.7) * s, y: oy + (m.y + 0.5) * s, vx: 0.1 + Math.random() * 0.05, vy: -0.12, r: s * 0.5, life: 4200, age: 0 });
      }

      // smoke, drifting east with the wind
      const dt = 16;
      st.puffs = st.puffs.filter((q) => (q.age += dt) < q.life);
      for (const q of st.puffs) {
        q.x += q.vx * dt * 0.06 * s;
        q.y += q.vy * dt * 0.06 * s;
        const a = 1 - q.age / q.life;
        const rad = q.r * (1 + (q.age / q.life) * 2.4);
        const puff = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, rad);
        puff.addColorStop(0, `rgba(190, 184, 172, ${0.2 * a})`);
        puff.addColorStop(1, "rgba(190, 184, 172, 0)");
        g.fillStyle = puff;
        g.fillRect(q.x - rad, q.y - rad, rad * 2, rad * 2);
      }
      if (st.puffs.length > 220) st.puffs.splice(0, st.puffs.length - 220);

      // cloud shadows sliding over the island
      const drift = still ? 0 : t / 1000;
      for (let k = 0; k < 3; k++) {
        const w = L.w * (0.22 + k * 0.06);
        const x = ((drift * (6 + k * 3) + k * L.w * 0.45) % (L.w + w * 2)) - w;
        const y = L.h * (0.2 + k * 0.28);
        const sh = g.createRadialGradient(x, y, 0, x, y, w);
        sh.addColorStop(0, "rgba(2, 8, 10, 0.22)");
        sh.addColorStop(1, "rgba(2, 8, 10, 0)");
        g.fillStyle = sh;
        g.beginPath();
        g.ellipse(x, y, w, w * 0.45, 0, 0, Math.PI * 2);
        g.fill();
      }
    };
    draw(performance.now());
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [L]);

  // where pins stand, in px
  const isl = island();
  const pos = (x: number, y: number) => (L ? { left: L.ox + (x + 0.5) * L.s, top: L.oy + (y + 0.5) * L.s } : { left: -999, top: -999 });
  const last = isl.order[isl.order.length - 1];
  const orenAlive = cleared < isl.order.length;

  // a pin that left the ten because it sold: a puff of smoke where it stood
  const [puffs, setPuffs] = useState<{ key: string; left: number; top: number; name: string }[]>([]);
  const prev = useRef<Map<string, { left: number; top: number; name: string }>>(new Map());
  const posKey = useMemo(() => pins.map((p) => p.id).join(","), [pins]);
  useEffect(() => {
    const now = new Map<string, { left: number; top: number; name: string }>();
    pins.slice(0, 10).forEach((p, i) => now.set(p.id, { ...pos(isl.stakes[i].x, isl.stakes[i].y), name: p.name }));
    const fresh: typeof puffs = [];
    for (const [id, at] of prev.current) if (!now.has(id) && gone.has(id)) fresh.push({ key: `${id}:${Date.now()}`, ...at });
    prev.current = now;
    if (fresh.length) {
      setPuffs((p) => [...p, ...fresh]);
      setTimeout(() => setPuffs((p) => p.filter((x) => !fresh.includes(x))), 3600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posKey, L]);

  return (
    <div className="map" ref={host}>
      <ul className="map__legend num" aria-hidden="true">
        <li>
          <i className="is-forest" /> Old forest
        </li>
        <li>
          <i className="is-front" /> Fire front
        </li>
        <li>
          <i className="is-palm" /> Palm, one per buy
        </li>
      </ul>
      <canvas ref={canvas} className="map__canvas" role="img" aria-label={`Satellite view of the island: ${cleared} of ${isl.order.length} patches cleared for palms`} />
      {L ? (
        <div className="map__pins">
          {pins.slice(0, 10).map((p, i) => {
            const c = isl.stakes[i];
            return (
              <button key={p.id} type="button" className={`pin ${i < 5 ? "is-inti" : "is-plasma"} ${i === 0 ? "is-one" : ""}`} style={pos(c.x, c.y)} onClick={() => onPick(p.addr)} aria-label={`No. ${i + 1}, ${p.name}. Open the plot`}>
                <span className="pin__flag num">{i === 0 ? <Flame weight="fill" aria-hidden="true" /> : null}{i + 1}</span>
                <span className="pin__name">{p.name}</span>
              </button>
            );
          })}
          {oren && last && orenAlive ? (
            <button type="button" className="pin is-oren" style={pos(last.x, last.y)} onClick={() => onPick(oren.addr)} aria-label={`Oren, the dev wallet, in the last tree. Open the plot`}>
              <span className="pin__flag num">Oren</span>
              <span className="pin__name">the last tree · dev wallet</span>
            </button>
          ) : null}
          <span className="pin is-mill" style={pos(isl.mill.x, isl.mill.y)} aria-hidden="true">
            <span className="pin__flag num">Mill</span>
          </span>
          {puffs.map((p) => (
            <span key={p.key} className="smokeout" style={{ left: p.left, top: p.top }}>
              <span className="num">{p.name} sold · went up in smoke</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
