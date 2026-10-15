/**
 * Link previews. The engine draws the same cards as the page (src/card/draw.ts) on a server canvas,
 * so a link to the site or to one tree shows its picture on X, Telegram and Discord.
 *
 *   /api/card/site.png        the island as it stands (drawn again at most every 20 seconds)
 *   /api/card/tree/<n>.png    one tree's card (a tree's card never changes, kept for good)
 *   /tree/<n>                 a page whose preview is that card; people who open it land on the site
 *
 * Display only. A tree that has not burned yet gets no card.
 */
import fs from "fs";
import path from "path";
import { Canvas, GlobalFonts } from "@napi-rs/canvas";
import { drawSiteCard, drawTreeCard, postText, type CardTree, type Make } from "../src/card/draw";
import { ISLAND, NAME, TICKER } from "../src/lib/brand";
import { speciesOf } from "../src/lib/trees";

const fontDir = path.join(process.cwd(), "node_modules");
// static weights: a server canvas reads only one weight out of a variable font
const FONTS: [string, string][] = [
  ...[400, 700].map((w): [string, string] => [`@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-${w}-normal.woff2`, "Bricolage Grotesque Variable"]),
  ["@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2", "Instrument Serif"],
  ...[500, 600, 700].map((w): [string, string] => [`@fontsource/jetbrains-mono/files/jetbrains-mono-latin-${w}-normal.woff2`, "JetBrains Mono Variable"]),
];
let fontsReady = false;
export function loadFonts() {
  if (fontsReady) return;
  fontsReady = true;
  for (const [file, family] of FONTS) {
    const p = path.join(fontDir, file);
    if (!fs.existsSync(p) || !GlobalFonts.registerFromPath(p, family)) console.warn(`card font missing: ${family}`);
  }
}

const make: Make = (w, h) => new Canvas(w, h);
const png = (c: unknown) => (c as Canvas).toBuffer("image/png");

const treeCache = new Map<number, Buffer>();
let siteCache: { key: string; at: number; png: Buffer } | null = null;

export function treePng(tree: CardTree, host: string) {
  const hit = treeCache.get(tree.n);
  if (hit) return hit;
  loadFonts();
  const out = png(drawTreeCard(make, tree, host, 1));
  treeCache.set(tree.n, out);
  if (treeCache.size > 300) treeCache.delete(treeCache.keys().next().value!);
  return out;
}

/** The site's card. Drawn again at most every 20 seconds while trees burn, so a busy hour costs little. */
export function sitePng(burned: number, total: number, host: string) {
  const key = `${burned}/${total}`;
  if (siteCache && (siteCache.key === key || Date.now() - siteCache.at < 20_000)) return siteCache.png;
  siteCache = { key, at: Date.now(), png: drawSite(burned, total, host) };
  return siteCache.png;
}

/** The site's card, drawn now (no cache). */
export function drawSite(burned: number, total: number, host: string) {
  loadFonts();
  return png(drawSiteCard(make, burned, total, host, 1));
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** The page behind /tree/<n>: a preview for crawlers, and a hop to the site for people. */
export function treePage(tree: CardTree, site: string) {
  const title = tree.n >= tree.total ? `The last tree on ${ISLAND}` : `${speciesOf(tree.n)} #${tree.n.toLocaleString("en-US")} burned on ${ISLAND}`;
  const desc = postText(tree);
  const img = `${site}/api/card/tree/${tree.n}.png`;
  const to = `${site}/?tree=${tree.n}`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(title)} · ${esc(TICKER)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(NAME)} · ${esc(TICKER)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:url" content="${esc(`${site}/tree/${tree.n}`)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(img)}">
<meta http-equiv="refresh" content="0; url=${esc(to)}">
<link rel="canonical" href="${esc(`${site}/tree/${tree.n}`)}">
</head><body style="background:#07131a;color:#efe8d6;font-family:system-ui;padding:40px">
<p><a style="color:#ff5a1f" href="${esc(to)}">${esc(title)}. Open the island.</a></p>
</body></html>`;
}
