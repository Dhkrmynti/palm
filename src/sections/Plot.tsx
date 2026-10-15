/**
 * Your plot: look up any wallet and see where it stands. The holder of the wallet can set a name and
 * a seal, or link X, by signing one plain message. No transaction is ever asked for.
 * Opens as a drawer from anywhere (a pin, a row, the Connect button) and lives as a section too.
 */
import { useEffect, useRef, useState, type FormEvent } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight, CaretLeft, CaretRight, MagnifyingGlass, X as Close, XLogo } from "@phosphor-icons/react";
import { DEMO, addrUrl, amount, bylineNonce, claimByline, demoSaveByline, eth, fetchWallet, short, startXLink, txUrl, unlinkX, type WalletInfo } from "../lib/api";
import { nameFor } from "../lib/alias";
import { Countdown, Held } from "../lib/clock";
import { ISLAND, TICKER } from "../lib/brand";
import { PARTS, PART_NAMES, sealOf, type Seal } from "../lib/trees";
import { connectWallet, hasWallet, signText, useAccount } from "../lib/wallet";
import { Head, XCheck, openPlot } from "../ui/Bits";
import { prefersReducedMotion } from "../lib/motion";
import { SealMark } from "../ui/Seal";
import { openShare } from "../ui/ShareCard";
import { ageOf, speciesOf } from "../lib/trees";

const VALID = /^0x[0-9a-fA-F]{40}$/;

const STAMP: Record<WalletInfo["status"], { word: string; tone: string; line: string }> = {
  sitting: { word: "In the register", tone: "palm", line: "You hold land on the island. Hold more to reach a concession." },
  waiting: { word: "At the edge", tone: "fire", line: "Over the minimum. Your first buy is still too fresh; you join the register soon." },
  "too-small": { word: "Too small", tone: "fire", line: `Under the minimum. Hold more ${TICKER} to get into the register.` },
  hopped: { word: "Smoke", tone: "ash", line: "This wallet sold. It went up in smoke and is out for good." },
  excluded: { word: "Island works", tone: "ash", line: "Engine, curve, treasury or dead address. Never ranked, never paid." },
  "not-holding": { word: "Not on the island", tone: "ash", line: `This wallet holds no ${TICKER}.` },
};

const NO_WALLET = "No wallet in this browser. Open this site inside your wallet app (MetaMask, Rabby, OKX) to connect.";

const SLOTS: [keyof typeof PART_NAMES, string][] = [
  ["ink", "Ink"],
  ["frame", "Frame"],
  ["sign", "Sign"],
  ["ground", "Ground"],
];

function Dress({ info, onSaved }: { info: WalletInfo; onSaved: (p: Partial<WalletInfo>) => void }) {
  const account = useAccount();
  const mine = DEMO || (!!account && account.toLowerCase() === info.addr.toLowerCase());
  const [name, setName] = useState(info.nickname || "");
  const [seal, setSeal] = useState<Seal>(sealOf(info.addr, info.pp));
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const turn = (i: number, by: number) => {
    const next = [...seal] as Seal;
    next[i] = (next[i] + by + PARTS[i]) % PARTS[i];
    setSeal(next);
  };
  const fail = (e: any, what: string) => setNote({ ok: false, text: e?.code === 4001 ? "You cancelled the signature. Nothing changed." : e?.message || what });

  const connect = async () => {
    setNote(null);
    if (!hasWallet()) return setNote({ ok: false, text: NO_WALLET });
    try {
      const a = await connectWallet();
      if (a.toLowerCase() !== info.addr.toLowerCase()) setNote({ ok: false, text: `This plot belongs to ${short(info.addr)}; your wallet is ${short(a)}.` });
    } catch (e) {
      fail(e, "The wallet didn't connect.");
    }
  };

  const save = async () => {
    setNote(null);
    const clean = name.replace(/\s+/g, " ").trim();
    if (DEMO) {
      if (clean.length < 3 || clean.length > 18 || !/^[A-Za-z0-9 _'-]+$/.test(clean)) return setNote({ ok: false, text: "Names are 3 to 18 letters, numbers, spaces, - ' or _." });
      demoSaveByline(info.addr, { nickname: clean, pp: seal });
      onSaved({ nickname: clean, pp: seal });
      return setNote({ ok: true, text: `Saved as "${clean}". (Demo page: kept on this page only.)` });
    }
    try {
      setBusy(true);
      const { nonce, template } = await bylineNonce(info.addr);
      const signature = await signText(account, template.replace("{nickname}", clean).replace("{mugshot}", seal.join("-")));
      const saved = await claimByline(info.addr, clean, seal, nonce, signature);
      onSaved({ nickname: saved.nickname, pp: saved.pp });
      setNote({ ok: true, text: `Saved. The register shows "${saved.nickname}" now.` });
      window.dispatchEvent(new Event("rbank:refresh"));
    } catch (e) {
      fail(e, "Couldn't save the name.");
    } finally {
      setBusy(false);
    }
  };

  const linkX = async () => {
    setNote(null);
    if (DEMO) return setNote({ ok: false, text: "X sign-in works on the live site only." });
    try {
      setBusy(true);
      const { nonce, linkX: text } = await bylineNonce(info.addr);
      const { url } = await startXLink(info.addr, nonce, await signText(account, text));
      window.location.assign(url);
    } catch (e) {
      fail(e, "Couldn't start X sign-in.");
      setBusy(false);
    }
  };

  const dropX = async () => {
    setNote(null);
    try {
      setBusy(true);
      const { nonce, unlinkX: text } = await bylineNonce(info.addr);
      await unlinkX(info.addr, nonce, await signText(account, text));
      onSaved({ x: null });
      setNote({ ok: true, text: "X unlinked. The register shows your name and seal again." });
      window.dispatchEvent(new Event("rbank:refresh"));
    } catch (e) {
      fail(e, "Couldn't unlink X.");
    } finally {
      setBusy(false);
    }
  };

  if (info.status === "not-holding" || info.status === "excluded") return null;
  return (
    <div className="dress">
      <p className="dress__k num">Your mark in the register · one free signature, no transaction</p>
      {!mine ? (
        <button type="button" className="btn is-ghost-dark" onClick={connect}>
          Connect this wallet to edit
        </button>
      ) : info.x ? (
        <div className="dress__x">
          <p>
            Showing your X account <b>@{info.x.username}</b> <XCheck x={info.x} />.
          </p>
          <button type="button" className="btn is-ghost-dark" onClick={dropX} disabled={busy}>
            Unlink X
          </button>
        </div>
      ) : (
        <>
          <div className="dress__seal">
            <SealMark seal={seal} size={92} />
            <ul>
              {SLOTS.map(([k, label], i) => (
                <li key={k}>
                  <span className="num">{label}</span>
                  <button type="button" onClick={() => turn(i, -1)} aria-label={`Previous ${label}`}>
                    <CaretLeft weight="bold" />
                  </button>
                  <b>{PART_NAMES[k][seal[i]]}</b>
                  <button type="button" onClick={() => turn(i, 1)} aria-label={`Next ${label}`}>
                    <CaretRight weight="bold" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <label className="field">
            <span className="num">Name, 3 to 18 characters</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={18} placeholder="palmking" autoComplete="off" />
          </label>
          <div className="dress__acts">
            <button type="button" className="btn is-fire" onClick={save} disabled={busy}>
              {busy ? "Waiting for the wallet" : "Sign & save"}
            </button>
            {info.xLogin ? (
              <button type="button" className="btn is-ghost-dark" onClick={linkX} disabled={busy}>
                <XLogo weight="bold" aria-hidden="true" /> Link X instead
              </button>
            ) : null}
          </div>
        </>
      )}
      {note ? <p className={`note ${note.ok ? "is-ok" : "is-bad"}`}>{note.text}</p> : null}
    </div>
  );
}

function Card({ addr }: { addr: string }) {
  const [info, setInfo] = useState<WalletInfo | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    setInfo(null);
    setErr("");
    fetchWallet(addr)
      .then(setInfo)
      .catch((e) => setErr(e.message || "The engine didn't answer."));
  }, [addr]);
  if (err) return <p className="note is-bad">{err}</p>;
  if (!info) return <p className="plot__loading num">Reading the register…</p>;
  const n = nameFor(info.addr, info.nickname, info.x);
  const st = STAMP[info.status];
  return (
    <div className="plot__card">
      <div className="plot__id">
        {info.x?.avatar ? <img className="xface" src={info.x.avatar} width={64} height={64} alt="" referrerPolicy="no-referrer" /> : <SealMark seal={sealOf(info.addr, info.pp)} size={64} />}
        <div>
          <p className="plot__name">{n.name}</p>
          <a className="plot__addr num" href={addrUrl(info.addr)} target="_blank" rel="noreferrer">
            {short(info.addr)} <ArrowUpRight weight="bold" aria-hidden="true" />
          </a>
        </div>
        <span className={`stamp is-${st.tone}`}>{info.house ? "Oren" : st.word}</span>
      </div>
      <p className="plot__line">
        {info.house
          ? "The dev wallet. Lives in the last tree. Never ranked, never paid."
          : info.inTop && info.status === "sitting"
            ? `You own a concession in the ${info.rank && info.rank <= 5 ? "core" : "outer"} estate. Every Reward is shared with you, in ETH.`
            : st.line}
      </p>
      <dl className="plot__facts">
        <div>
          <dt>Holds</dt>
          <dd className="num">
            {amount(info.balance)} {TICKER}
          </dd>
        </div>
        <div>
          <dt>Rank</dt>
          <dd className="num">{info.rank ? `No. ${info.rank}${info.inTop ? (info.rank <= 5 ? " · core" : " · outer") : ""}` : "-"}</dd>
        </div>
        <div>
          <dt>Held for</dt>
          <dd>{info.firstIn && info.status !== "hopped" ? <Held since={info.firstIn} /> : <span className="num">-</span>}</dd>
        </div>
        <div>
          <dt>Next Reward</dt>
          <dd className="num">{info.inTop ? eth(info.estNext) : "-"}</dd>
        </div>
        <div>
          <dt>Paid so far</dt>
          <dd className="num">{eth(info.received)}</dd>
        </div>
        <div>
          <dt>{info.status === "waiting" ? "Joins in" : info.status === "hopped" ? "Sold" : "Status"}</dt>
          <dd className="num">
            {info.status === "waiting" ? (
              <Countdown to={info.eligibleAt} />
            ) : info.status === "hopped" && info.hoppedTx ? (
              <a href={txUrl(info.hoppedTx)} target="_blank" rel="noreferrer">
                sale tx
              </a>
            ) : (
              st.word
            )}
          </dd>
        </div>
      </dl>
      {info.trees?.length ? (
        <div className="burns">
          <p className="burns__k num">
            {(info.treeCount ?? info.trees.length).toLocaleString("en-US")} {(info.treeCount ?? info.trees.length) === 1 ? "tree" : "trees"} burned by this wallet · the latest
          </p>
          <ul>
            {info.trees.slice(0, 4).map((t) => (
              <li key={t.n}>
                <span className="burns__name">
                  <b>
                    {speciesOf(t.n)} #{t.n.toLocaleString("en-US")}
                  </b>
                  <span className="num">
                    {ageOf(t.n)} yrs old · {amount(t.amount)} {TICKER}
                  </span>
                </span>
                <button type="button" className="btn is-fire is-small" onClick={() => openShare({ n: t.n, amount: t.amount, t: t.t, total: info.forestTotal ?? 5000, who: n.name })}>
                  Share card
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <Dress key={info.addr} info={info} onSaved={(p) => setInfo({ ...info, ...p })} />
    </div>
  );
}

function Lookup({ onFind }: { onFind: (a: string) => void }) {
  const [q, setQ] = useState("");
  const [bad, setBad] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const a = q.trim();
    if (!VALID.test(a)) return setBad(true);
    setBad(false);
    onFind(a);
  };
  return (
    <form className="lookup" onSubmit={submit}>
      <label className="sr-only" htmlFor="lookup">
        Wallet address
      </label>
      <input id="lookup" value={q} onChange={(e) => setQ(e.target.value)} placeholder="0x… any wallet" autoComplete="off" spellCheck={false} className="num" aria-invalid={bad} />
      <button type="submit" className="btn is-fire" aria-label="Look up">
        <MagnifyingGlass weight="bold" aria-hidden="true" /> Look up
      </button>
      {bad ? <p className="note is-bad">That isn't a wallet address.</p> : null}
    </form>
  );
}

/** The drawer, opened from anywhere on the page. */
export function PlotDrawer() {
  const [addr, setAddr] = useState<string | null>(() => {
    const w = new URLSearchParams(window.location.search).get("w") || "";
    return VALID.test(w) ? w : null;
  });
  useEffect(() => {
    const on = (e: Event) => setAddr((e as CustomEvent<string>).detail ?? "");
    window.addEventListener("palm:plot", on);
    return () => window.removeEventListener("palm:plot", on);
  }, []);
  useEffect(() => {
    if (addr === null) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  });
  const close = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("w");
    window.history.replaceState(null, "", url);
    setAddr(null);
  };
  if (addr === null) return null;
  return (
    <div className="drawer" role="dialog" aria-modal="true" aria-label="Plot">
      <button type="button" className="drawer__scrim" onClick={close} aria-label="Close" />
      <div className="drawer__panel">
        <div className="drawer__top">
          <p className="num">Plot record</p>
          <button type="button" className="drawer__x" onClick={close} aria-label="Close">
            <Close weight="bold" />
          </button>
        </div>
        {addr ? <Card addr={addr} /> : <p className="note is-bad">{NO_WALLET}</p>}
        <Lookup onFind={(a) => openPlot(a)} />
      </div>
    </div>
  );
}

/** The land office: a concession certificate with a blank to fill. Looking a wallet up opens its record. */
export function PlotSection() {
  const root = useRef<HTMLElement>(null);
  const account = useAccount();
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(".cert", { rotateX: 70, y: 60, opacity: 0, transformPerspective: 1200, transformOrigin: "50% 100%", duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".cert", start: "top 85%" } });
      gsap.fromTo(".cert__stamp", { scale: 3, opacity: 0, rotate: 40 }, { scale: 1, opacity: 1, rotate: -14, duration: 0.35, ease: "power4.in", delay: 0.7, scrollTrigger: { trigger: ".cert", start: "top 80%" } });
    },
    { scope: root },
  );
  return (
    <section className="place office2" id="plot" ref={root} aria-labelledby="plot-h">
      <div className="wrap">
        <Head kicker="Stop 07 · the land office" id="plot-h" title={<>Where do you <em>stand?</em></>} lead="Every wallet on the island has a record. Paste one to see its rank, how long it has held, what it has been paid and what the next Reward would bring it." />
        <div className="cert">
          <div className="cert__inner">
            <p className="cert__k num">{ISLAND} · land office</p>
            <p className="cert__h">Concession certificate</p>
            <p className="cert__en">Land title · valid until the first sale</p>
            <p className="cert__line">This certifies that the wallet written below holds land on the island, for as long as it never sells.</p>
            <div className="cert__field">
              <span className="num">Wallet</span>
              <Lookup onFind={(a) => openPlot(a)} />
            </div>
            {account ? (
              <button type="button" className="btn is-ghost-dark" onClick={() => openPlot(account)}>
                Open my record · {short(account)}
              </button>
            ) : null}
            <p className="cert__sig num">Signed with a free signature. No transaction, ever.</p>
          </div>
          <span className="cert__stamp" aria-hidden="true">
            <SealMark seal={[0, 0, 0, 0]} size={110} />
          </span>
        </div>
      </div>
    </section>
  );
}
