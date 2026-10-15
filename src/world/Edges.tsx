/**
 * The edges between places. Each sits on top of a section, in that section's ground colour, and
 * rises into the place above it: palms over the fire line, the mill's roofline over the plantation,
 * a tin roof over the weighbridge, smoke over the office, the last forest over the night.
 */
import { fnv } from "../lib/trees";

const r = (k: number) => (fnv(`edge:${k}`) % 1000) / 1000;
const W = 1440;

/** A row of palms, planted on the same spacing, as the plantation's top edge. */
export function PalmEdge() {
  const palms = Array.from({ length: 26 }, (_, i) => {
    const x = 10 + i * 56 + (i % 2) * 6;
    const h = 64 + r(i) * 18;
    const top = 120 - h;
    const fronds = Array.from({ length: 7 }, (_, j) => {
      const a = -Math.PI + (j / 6) * Math.PI;
      const len = 26 + r(i * 9 + j) * 8;
      return `M${x} ${top} Q${(x + Math.cos(a) * len * 0.5).toFixed(1)} ${(top + Math.sin(a) * len * 0.6 - 5).toFixed(1)} ${(x + Math.cos(a) * len).toFixed(1)} ${(top + Math.sin(a) * len * 0.4 + 13).toFixed(1)}`;
    });
    return { x, top, fronds };
  });
  return (
    <svg className="edge edge--palms" viewBox={`0 0 ${W} 120`} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <g stroke="currentColor" fill="none" strokeLinecap="round">
        {palms.map((p, i) => (
          <g key={i} className="edge__palm">
            <path d={`M${p.x} 120 L${p.x} ${p.top}`} strokeWidth="5" />
            {p.fronds.map((d, j) => (
              <path key={j} d={d} strokeWidth="3.4" />
            ))}
          </g>
        ))}
      </g>
      <rect y="112" width={W} height="8" fill="currentColor" />
    </svg>
  );
}

/** The mill's roofline: sheds, a tank, the chimney, the conveyor. */
export function MillEdge() {
  return (
    <svg className="edge edge--mill" viewBox={`0 0 ${W} 150`} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <path
        fill="currentColor"
        d={`M0 150 V120 H120 V96 L190 70 L260 96 V120 H330 V84 H350 V22 H372 V84 H400 V110
            A50 18 0 0 1 500 110 V78 A50 16 0 0 1 600 78 V120 H660 V100 L760 62 L860 100 V120
            H930 L1010 88 H1100 V120 H1160 V90 L1230 66 L1300 90 V120 H1440 V150 Z`}
      />
      <g className="edge__smoke" fill="currentColor" opacity="0.5">
        <circle cx="361" cy="12" r="9" />
        <circle cx="378" cy="0" r="12" />
      </g>
    </svg>
  );
}

/** A corrugated tin roof: the weighbridge office. */
export function RoofEdge() {
  const ridges = Array.from({ length: 49 }, (_, i) => `L${i * 30 + 15} 40 L${i * 30 + 30} 48`).join(" ");
  return (
    <svg className="edge edge--roof" viewBox={`0 0 ${W} 60`} preserveAspectRatio="none" aria-hidden="true">
      <path fill="currentColor" d={`M0 60 V48 ${ridges} V60 Z`} />
    </svg>
  );
}

/** The last of the old forest, crowns against the sky: the night's top edge. */
export function ForestEdge() {
  const crowns = Array.from({ length: 40 }, (_, i) => ({ cx: i * 37 + r(i + 120) * 20, cy: 70 + r(i + 140) * 40, rad: 26 + r(i + 160) * 30 }));
  return (
    <svg className="edge edge--forest" viewBox={`0 0 ${W} 140`} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <g fill="currentColor">
        {crowns.map((c, i) => (
          <circle key={i} cx={c.cx} cy={c.cy} r={c.rad} />
        ))}
        <rect y="86" width={W} height="54" />
      </g>
    </svg>
  );
}

/** Billows of smoke rolling in over the office. */
export function SmokeEdge() {
  const puffs = Array.from({ length: 22 }, (_, i) => ({ cx: i * 70 + r(i + 40) * 30, cy: 70 + r(i + 60) * 30, rad: 40 + r(i + 80) * 36 }));
  return (
    <svg className="edge edge--smoke" viewBox={`0 0 ${W} 120`} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <g fill="currentColor">
        {puffs.map((p, i) => (
          <circle key={i} cx={p.cx} cy={p.cy} r={p.rad} />
        ))}
        <rect y="90" width={W} height="30" />
      </g>
    </svg>
  );
}
