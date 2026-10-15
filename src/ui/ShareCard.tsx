/**
 * The share card window and the toast that offers it. Anything on the page that shows a burned tree
 * can open the card with `openShare`; when the connected wallet's own buy burns a tree, the toast
 * offers the card on its own.
 */
import { useEffect, useRef, useState } from "react";
import { DownloadSimple, Flame, ShareNetwork, X as Close, XLogo } from "@phosphor-icons/react";
import { DEMO, type Forest } from "../lib/api";
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
    const site = DEMO ? "" : ` ${window.location.origin}`;
    window.open(`https://x.com/intent/post?text=${encodeURIComponent(text + site)}`, "_blank", "noopener");
    setNote("X can't take a picture from a link: save the card first, then add it to the post.");
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
