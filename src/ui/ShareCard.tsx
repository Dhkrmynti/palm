/**
 * The share card window and the toast that offers it. Anything on the page that shows a burned tree
 * can open the card with `openShare`; when the connected wallet's own buy burns a tree, the toast
 * offers the card on its own.
 */
import { useEffect, useRef, useState } from "react";
import { DownloadSimple, Flame, ShareNetwork, X as Close, XLogo } from "@phosphor-icons/react";
import { DEMO, demoTree, type Forest } from "../lib/api";
import { markTree, type Mark } from "../lib/marks";
import { nameFor } from "../lib/alias";
import { drawCard, postText, type CardTree } from "../lib/sharecard";
import { speciesOf } from "../lib/trees";
import { useAccount } from "../lib/wallet";

export const openShare = (tree: CardTree) => window.dispatchEvent(new CustomEvent<CardTree>("palm:share", { detail: tree }));

export function ShareCard() {
  const [tree, setTree] = useState<CardTree | null>(null);
  const [url, setUrl] = useState("");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [note, setNote] = useState("");
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const on = (e: Event) => setTree((e as CustomEvent<CardTree>).detail);
    window.addEventListener("palm:share", on);
    return () => window.removeEventListener("palm:share", on);
  }, []);

  useEffect(() => {
    if (!tree) return;
    let alive = true;
    let made = "";
    setUrl("");
    setBlob(null);
    setNote("");
    drawCard(tree).then((c) =>
      c.toBlob((b) => {
        if (!alive || !b) return;
        made = URL.createObjectURL(b);
        setBlob(b);
        setUrl(made);
      }, "image/png"),
    );
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setTree(null);
    window.addEventListener("keydown", esc);
    closeBtn.current?.focus();
    return () => {
      alive = false;
      window.removeEventListener("keydown", esc);
      if (made) URL.revokeObjectURL(made);
    };
  }, [tree]);

  if (!tree) return null;
  const file = `palm-tree-${tree.n}.png`;
  const text = postText(tree);
  const canShareFile = !!blob && typeof navigator.canShare === "function" && navigator.canShare({ files: [new File([blob], file, { type: "image/png" })] });

  const share = async () => {
    if (!blob) return;
    try {
      await navigator.share({ files: [new File([blob], file, { type: "image/png" })], text });
    } catch {
      /* closed the share sheet */
    }
  };
  const post = () => {
    // the tree's own page carries the card as its preview, so the post shows the picture by itself
    const link = DEMO ? "" : ` ${window.location.origin}/tree/${tree.n}`;
    window.open(`https://x.com/intent/post?text=${encodeURIComponent(text + link)}`, "_blank", "noopener");
    setNote(DEMO ? "This is the demo: save the card and add it to the post yourself." : "The link shows the card on X once the post is up. You can still add the saved picture if you like.");
  };

  return (
    <div className="share" role="dialog" aria-modal="true" aria-label={`Share card for ${speciesOf(tree.n)} #${tree.n}`}>
      <button type="button" className="share__scrim" onClick={() => setTree(null)} aria-label="Close" />
      <div className="share__panel">
        <div className="share__top">
          <p className="num">
            <Flame weight="fill" aria-hidden="true" /> Share card · {speciesOf(tree.n)} #{tree.n.toLocaleString("en-US")}
          </p>
          <button type="button" ref={closeBtn} className="drawer__x" onClick={() => setTree(null)} aria-label="Close">
            <Close weight="bold" />
          </button>
        </div>
        <div className="share__pic">{url ? <img src={url} width={1200} height={630} alt={text} /> : <span className="num">Drawing the card…</span>}</div>
        <div className="share__acts">
          <a className={`btn is-fire ${url ? "" : "is-waiting"}`} href={url || undefined} download={file} aria-disabled={!url}>
            <DownloadSimple weight="bold" aria-hidden="true" /> Save the card
          </a>
          {canShareFile ? (
            <button type="button" className="btn is-ghost" onClick={share}>
              <ShareNetwork weight="bold" aria-hidden="true" /> Share
            </button>
          ) : null}
          <button type="button" className="btn is-ghost" onClick={post}>
            <XLogo weight="bold" aria-hidden="true" /> Post on X
          </button>
        </div>
        <p className="share__text">{text}</p>
        {note ? <p className="share__note num">{note}</p> : null}
      </div>
    </div>
  );
}

/** Opens any burned tree's card: from the engine's book, or made up in the demo. */
export async function openTree(n: number, total: number) {
  if (DEMO) {
    const d = demoTree(n);
    return openShare({ n, amount: d.amount.replace(/,/g, ""), t: d.t, total, who: nameFor(d.buyer, d.nickname, d.x).name });
  }
  const j = await fetch(`/api/tree/${n}`)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  if (j?.data) openShare({ n, amount: j.data.amount, t: j.data.t, total: j.data.total, who: j.data.who });
}

/** A link to /?tree=<n> (where /tree/<n> sends people) opens that tree's card. */
export function useTreeFromLink(live: boolean, total: number) {
  useEffect(() => {
    const n = parseInt(new URLSearchParams(window.location.search).get("tree") || "", 10);
    if (!(n > 0) || (!DEMO && !live)) return;
    const u = new URL(window.location.href);
    u.searchParams.delete("tree");
    window.history.replaceState(null, "", u.pathname + u.search + u.hash);
    openTree(n, total);
  }, [live, total]);
}

const MARK_LINE: Record<string, string> = {
  "10%": "A tenth of the island is cleared.",
  "25%": "A quarter of the island is cleared.",
  "50%": "Half the island is palm now.",
  "75%": "Three quarters cleared. The forest is a strip.",
  "90%": "Nine in ten trees are gone.",
  last100: "A hundred trees left. Oren's tree is the last one.",
  gone: "The last tree burned. The forest is gone.",
};

/** When the island passes a mark while someone is watching, the page says so. */
export function MarkBanner({ forest }: { forest: Forest | null }) {
  const seen = useRef<Set<string> | null>(null);
  const [mark, setMark] = useState<{ m: string; n: number } | null>(null);
  useEffect(() => {
    if (!forest?.marks) return;
    if (!seen.current) {
      seen.current = new Set(forest.marks);
      return;
    }
    const fresh = forest.marks.filter((m) => !seen.current!.has(m));
    fresh.forEach((m) => seen.current!.add(m));
    if (fresh.length) {
      const m = fresh[fresh.length - 1];
      setMark({ m, n: markTree(m as Mark, forest.total) });
    }
  }, [forest]);
  useEffect(() => {
    if (!mark) return;
    const t = window.setTimeout(() => setMark(null), 20000);
    return () => clearTimeout(t);
  }, [mark]);
  if (!mark || !forest) return null;
  const gone = mark.m === "gone";
  return (
    <div className={`markbar ${gone ? "is-gone" : ""}`} role="status">
      <span className="markbar__k num">{gone ? "The end" : mark.m === "last100" ? "Last 100" : `${mark.m} cleared`}</span>
      <p>{MARK_LINE[mark.m] ?? ""}</p>
      <button type="button" className="btn is-fire is-small" onClick={() => openTree(mark.n, forest.total)}>
        {gone ? "The last tree's card" : `Tree #${mark.n.toLocaleString("en-US")}'s card`}
      </button>
      <button type="button" className="toast__x" onClick={() => setMark(null)} aria-label="Dismiss">
        <Close weight="bold" />
      </button>
    </div>
  );
}

/** When the connected wallet's own buy burns a tree, say so and offer the card. */
export function BurnToast({ forest }: { forest: Forest | null }) {
  const account = useAccount().toLowerCase();
  const [mine, setMine] = useState<CardTree | null>(null);
  const seen = useRef<number | null>(null);
  useEffect(() => {
    if (!forest) return;
    const newest = forest.recent[0]?.n ?? 0;
    // the first board only sets the mark: nothing that burned before this visit is announced
    if (seen.current === null) {
      seen.current = newest;
      return;
    }
    const fresh = forest.recent.filter((b) => b.n > seen.current! && account && b.buyer.toLowerCase() === account);
    seen.current = Math.max(seen.current, newest);
    if (!fresh.length) return;
    const b = fresh[0];
    setMine({ n: b.n, amount: b.amount, t: b.t, total: forest.total, who: nameFor(b.buyer, b.nickname, b.x).name });
  }, [forest, account]);
  useEffect(() => {
    if (!mine) return;
    const t = window.setTimeout(() => setMine(null), 15000);
    return () => clearTimeout(t);
  }, [mine]);
  if (!mine) return null;
  return (
    <div className="toast" role="status">
      <span className="toast__flame" aria-hidden="true">
        <Flame weight="fill" />
      </span>
      <p>
        <b>
          {speciesOf(mine.n)} #{mine.n.toLocaleString("en-US")} burned.
        </b>{" "}
        That was you.
      </p>
      <button
        type="button"
        className="btn is-fire is-small"
        onClick={() => {
          openShare(mine);
          setMine(null);
        }}
      >
        Make the card
      </button>
      <button type="button" className="toast__x" onClick={() => setMine(null)} aria-label="Dismiss">
        <Close weight="bold" />
      </button>
    </div>
  );
}
