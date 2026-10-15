/** Small shared pieces: the buy button, the contract address, a holder's face, the wallet button. */
import { useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight, Check, Copy, SealCheck, Wallet } from "@phosphor-icons/react";
import { DEMO, demoPond, ponsUrl, short, type Status, type XProfile } from "../lib/api";
import { connectWallet, hasWallet, pretendAccount, useAccount } from "../lib/wallet";
import { TICKER } from "../lib/brand";
import { SealOf } from "./Seal";

export function useMedia(query: string) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setMatch(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, [query]);
  return match;
}

/** Other parts of the page open a wallet's plot through this event. */
export function openPlot(addr: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("w", addr);
  window.history.replaceState(null, "", url);
  window.dispatchEvent(new CustomEvent("palm:plot", { detail: addr }));
}

/** The one primary action on the page. The demo edition never prints a buy link: a made-up CA is a trap. */
export function BuyButton({ status, className = "" }: { status: Status | null; className?: string }) {
  const ca = DEMO ? "" : status?.tokenAddress;
  if (!ca)
    return (
      <span className={`btn is-fire is-waiting ${className}`} aria-disabled="true">
        Opens at launch
      </span>
    );
  return (
    <a className={`btn is-fire ${className}`} href={ponsUrl(ca)} target="_blank" rel="noreferrer">
      Buy {TICKER}, burn a tree <ArrowUpRight weight="bold" aria-hidden="true" />
    </a>
  );
}

export function CaCopy({ status, compact = false }: { status: Status | null; compact?: boolean }) {
  const ca = DEMO ? "" : status?.tokenAddress || "";
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!ca) return;
    try {
      await navigator.clipboard.writeText(ca);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked: the address is still selectable */
    }
  };
  return (
    <button type="button" className="ca" onClick={copy} disabled={!ca} aria-label={ca ? `Copy contract address ${ca}` : "Contract address not live yet"}>
      <span className="ca__k">CA</span>
      <span className="ca__v num">{ca ? (compact ? short(ca) : ca) : "at launch"}</span>
      <span className="ca__a" aria-hidden="true">
        {copied ? <Check weight="bold" /> : <Copy weight="bold" />}
      </span>
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </button>
  );
}

/** A linked X account shows its own picture; everyone else their seal. */
export function Face({ addr, pp, x, size, className = "" }: { addr: string; pp?: number[] | null; x?: XProfile | null; size: number; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (x?.avatar && !broken) return <img className={`xface ${className}`} src={x.avatar} width={size} height={size} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} />;
  return <SealOf addr={addr} pp={pp} size={size} className={className} />;
}

const BADGE: Record<string, string> = { blue: "Verified on X", business: "Verified organization on X", government: "Government account on X" };

export function XCheck({ x }: { x: XProfile }) {
  if (!BADGE[x.verified]) return null;
  return <SealCheck className={`xcheck is-${x.verified}`} weight="fill" aria-label={BADGE[x.verified]} role="img" />;
}

/** The header's wallet button. Connecting opens the holder's own plot. It never asks for a transaction. */
export function ConnectButton() {
  const account = useAccount();
  const [busy, setBusy] = useState(false);
  const press = async () => {
    if (account) return openPlot(account);
    if (DEMO && !hasWallet()) {
      const rows = demoPond().rows;
      const a = (rows.find((r) => r.inTop && !r.x && !r.nickname) ?? rows[3]).addr;
      pretendAccount(a);
      return openPlot(a);
    }
    if (!hasWallet()) return openPlot("");
    try {
      setBusy(true);
      openPlot(await connectWallet());
    } catch {
      /* closed the popup */
    } finally {
      setBusy(false);
    }
  };
  return (
    <button type="button" className={`connect ${account ? "is-on" : ""}`} onClick={press} disabled={busy} aria-label={account ? `Connected as ${account}. Open my plot` : "Connect wallet"}>
      {account ? <span className="connect__dot" aria-hidden="true" /> : <Wallet weight="bold" aria-hidden="true" />}
      <span className="num">{busy ? "Connecting" : account ? short(account) : "Connect"}</span>
    </button>
  );
}

/** A place's heading: where you are on the walk, what it says, a short lead. Colours come from the place. */
export function Head({ kicker, title, lead, id }: { kicker: string; title: ReactNode; lead?: ReactNode; id: string }) {
  return (
    <header className="head">
      <p className="head__k num">{kicker}</p>
      <h2 className="head__t" id={id}>
        {title}
      </h2>
      {lead ? <p className="head__lead">{lead}</p> : null}
    </header>
  );
}
