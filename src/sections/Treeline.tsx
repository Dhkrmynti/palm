/**
 * The horizon between the map and the report: old forest on the left, palms in a row on the right,
 * and the fire between them. Where the fire stands is live: the share of the island already cleared.
 */
import { useMemo } from "react";
import { fnv } from "../lib/trees";

const W = 1440;
const H = 240;
const GROUND = 214;

const rand = (k: number) => (fnv(`line:${k}`) % 10000) / 10000;

/** A rainforest tree: a tall trunk and a crown of a few overlapping lobes. */
function tree(x: number, k: number) {
  const tall = 70 + rand(k) * 110 + (rand(k + 9) > 0.86 ? 50 : 0);
  const top = GROUND - tall;
  const w = 26 + rand(k + 3) * 34;
  const lobes = [
    [x, top + w * 0.35, w * 0.55],
    [x - w * 0.42, top + w * 0.55, w * 0.42],
    [x + w * 0.45, top + w * 0.5, w * 0.45],
    [x - w * 0.1, top + w * 0.1, w * 0.4],
  ];
  return { x, top, w, lobes, trunk: 2 + rand(k + 5) * 3 };
}

/** A palm: a slightly bent trunk and arching fronds. */
function palm(x: number, k: number) {
  const tall = 78 + rand(k + 50) * 14;
  const top = GROUND - tall;
  const lean = (rand(k + 51) - 0.5) * 6;
  const fronds = Array.from({ length: 7 }, (_, i) => {
    const a = -Math.PI + (i / 6) * Math.PI;
    const len = 34 + rand(k * 7 + i) * 10;
    const ex = x + lean + Math.cos(a) * len;
    const ey = top + Math.sin(a) * len * 0.45 + 16;
    const cx = x + lean + Math.cos(a) * len * 0.5;
    const cy = top + Math.sin(a) * len * 0.6 - 6;
    return `M${x + lean} ${top} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
  });
  return { x, top, lean, fronds };
}

export function Treeline({ pct }: { pct: number }) {
  // the fire walks from right (the mill's side) to left as the island is cleared
  const cut = W * (1 - Math.max(0.02, Math.min(0.98, pct / 100)));
  const trees = useMemo(() => Array.from({ length: 78 }, (_, i) => tree(i * 19 + rand(i + 100) * 10, i)), []);
  const palms = useMemo(() => Array.from({ length: 24 }, (_, i) => palm(30 + i * 62, i)), []);
  const forest = trees.filter((t) => t.x + t.w * 0.5 < cut - 30);
  const rows = palms.filter((p) => p.x > cut + 40);
  const stumps = Array.from({ length: 6 }, (_, i) => cut - 20 + i * 12);

  return (
    <div className="treeline" aria-hidden="true">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice">
        <defs>
          <radialGradient id="tl-glow" cx="0.5" cy="1" r="0.6">
            <stop offset="0" stopColor="#ff8a3a" stopOpacity="1" />
            <stop offset="0.45" stopColor="#ff5a1f" stopOpacity="0.42" />
            <stop offset="1" stopColor="#ff5a1f" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="tl-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#07131a" />
            <stop offset="0.55" stopColor="#13262a" />
            <stop offset="1" stopColor="#2a3a33" />
          </linearGradient>
          <filter id="tl-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>
        <rect width={W} height={H} fill="url(#tl-sky)" />
        <ellipse className="treeline__glow" cx={cut} cy={GROUND} rx="340" ry="230" fill="url(#tl-glow)" />
        {/* smoke over the fire, leaning east */}
        <g className="treeline__smoke" fill="#b9b4a8" filter="url(#tl-blur)">
          <ellipse cx={cut + 40} cy={GROUND - 120} rx="70" ry="26" opacity="0.32" />
          <ellipse cx={cut + 110} cy={GROUND - 160} rx="95" ry="30" opacity="0.22" />
          <ellipse cx={cut + 200} cy={GROUND - 190} rx="120" ry="28" opacity="0.14" />
        </g>
        <g fill="#0a1410">
          {forest.map((t, i) => (
            <g key={i}>
              <rect x={t.x - t.trunk / 2} y={t.top + t.w * 0.4} width={t.trunk} height={GROUND - t.top} />
              {t.lobes.map(([cx, cy, r], j) => (
                <circle key={j} cx={cx} cy={cy} r={r} />
              ))}
            </g>
          ))}
        </g>
        <g stroke="#0a1410" strokeLinecap="round" fill="none">
          {rows.map((p, i) => (
            <g key={i}>
              <path d={`M${p.x} ${GROUND} Q${p.x + p.lean * 0.3} ${(GROUND + p.top) / 2} ${p.x + p.lean} ${p.top}`} strokeWidth="4" />
              {p.fronds.map((d, j) => (
                <path key={j} d={d} strokeWidth="3" />
              ))}
            </g>
          ))}
        </g>
        {/* what the fire leaves: stumps and embers */}
        <g fill="#0a1410">
          {stumps.map((x, i) => (
            <rect key={i} x={x} y={GROUND - 8 - (i % 3) * 5} width="5" height={14 + (i % 3) * 5} />
          ))}
        </g>
        <g className="treeline__embers" fill="#ffad3b">
          {Array.from({ length: 14 }, (_, i) => (
            <circle key={i} cx={cut - 40 + rand(i + 300) * 120} cy={GROUND - 10 - rand(i + 400) * 90} r={1 + rand(i + 500) * 1.6} style={{ animationDelay: `${(rand(i + 600) * 3).toFixed(2)}s` }} />
          ))}
        </g>
        <rect y={GROUND} width={W} height={H - GROUND} fill="#140d09" />
      </svg>
      <div className="treeline__tags num">
        <span>Old forest</span>
        <span className="is-fire" style={{ left: `${(cut / W) * 100}%` }}>
          fire front
        </span>
        <span className="is-palm">Palms · one per buy</span>
      </div>
    </div>
  );
}
