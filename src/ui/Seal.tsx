/**
 * A holder's seal: the stamp on a concession. Four parts (ink, frame, sign, ground), generated from
 * the address until the holder picks their own. The part counts are fixed by the engine.
 */
import { GROUNDS, INKS, sealOf, type Seal } from "../lib/trees";

const FRAMES = [
  <circle key="f" cx="12" cy="12" r="11" />,
  <rect key="f" x="1.5" y="1.5" width="21" height="21" rx="2" />,
  <path key="f" d="M12 .8 23.2 12 12 23.2.8 12Z" />,
  <path key="f" d="M12 1 22 4.5v7c0 6-4.3 10-10 11.5C6.3 21.5 2 17.5 2 11.5v-7Z" />,
  <path key="f" d="M12 1c7 3 10.5 8 10.5 13.5C22.5 19.5 17.8 23 12 23S1.5 19.5 1.5 14.5C1.5 9 5 4 12 1Z" />,
];

const SIGNS = [
  // palm
  <g key="s">
    <path d="M12 20v-8" />
    <path d="M12 12c-1.5-2.5-4-3.4-6.5-3M12 12c1.5-2.5 4-3.4 6.5-3M12 12c-.6-2.8.2-5.2 2.4-7M12 12c-2.8-1-5.2-.2-7 1.8M12 12c2.8-1 5.2-.2 7 1.8" />
  </g>,
  // flame
  <path key="s" d="M12 20c-3.3 0-5.5-2.2-5.5-5.2 0-3.4 3-4.7 3.6-8.3 2.5 1.4 3.4 3.3 3.2 5.2 1-.5 1.6-1.5 1.8-2.6 1.7 1.6 2.4 3.4 2.4 5.6 0 3.1-2.2 5.3-5.5 5.3Z" />,
  // axe
  <g key="s">
    <path d="M8 20 15.5 6" />
    <path d="M13.5 4.8c2.6-.6 5 .6 6.2 2.9l-4.6 2.5-2.7-1.4Z" />
  </g>,
  // drop of oil
  <path key="s" d="M12 4.5c2.6 3.6 5 6.4 5 9.3a5 5 0 0 1-10 0c0-2.9 2.4-5.7 5-9.3Z" />,
  // stump
  <g key="s">
    <path d="M7 19.5h10M8.5 19.5V11h7v8.5" />
    <ellipse cx="12" cy="11" rx="3.5" ry="1.4" />
    <path d="M15.5 13.5 18 11" />
  </g>,
  // torch
  <g key="s">
    <path d="m10 20 2.6-9" />
    <path d="M12.6 11c-2-.5-2.8-2.3-2-4.2.6 1 1.4 1.3 1.9 1.1-.2-1.6.4-3 1.8-3.9.2 1.5 1.6 2.4 1.6 4 0 1.9-1.4 3.4-3.3 3Z" />
  </g>,
];

export function SealMark({ seal, size = 36, className = "", title }: { seal: Seal; size?: number; className?: string; title?: string }) {
  const [ink, frame, sign, ground] = seal;
  return (
    <svg
      className={`seal ${className}`}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <g fill={GROUNDS[ground]} stroke={INKS[ink]} strokeWidth="1.2">
        {FRAMES[frame]}
      </g>
      <g fill="none" stroke={INKS[ink]} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {SIGNS[sign]}
      </g>
    </svg>
  );
}

/** One of the seal's signs on its own, in the current text colour: 0 palm, 1 flame, 2 axe, 3 drop, 4 stump, 5 torch. */
export function Glyph({ sign, size = 28, className = "" }: { sign: number; size?: number; className?: string }) {
  return (
    <svg className={`glyph ${className}`} viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {SIGNS[sign]}
    </svg>
  );
}

/** A wallet's seal: the one it picked, else the one its address gives. */
export function SealOf({ addr, pp, size, className }: { addr: string; pp?: number[] | null; size?: number; className?: string }) {
  return <SealMark seal={sealOf(addr, pp)} size={size} className={className} />;
}
