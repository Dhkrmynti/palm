/**
 * The cards, 1200 by 630: one tree that burned, the island as a whole (the site's link preview), and
 * the last tree. Drawn the same in the browser (Save the card) and in the engine (link previews on X
 * and Telegram), so nothing here touches the DOM: the caller hands in a way to make a canvas.
 */
import { paintIsland, type Ctx } from "../map/paint";
import { ISLAND, TICKER } from "../lib/brand";
import { ageOf, speciesOf } from "../lib/trees";
import { amount } from "../lib/format";

export interface CardTree {
  /** The tree's number: 1 is the first that burned. */
  n: number;
  /** Whole tokens bought, or "" when unknown. */
  amount: string;
  /** Unix seconds of the buy, or 0 when unknown. */
  t: number;
  /** Trees on the island at launch. */
  total: number;
  /** How the buyer is shown: X handle, name, or short address. "" when unknown. */
  who: string;
}

/** Anything with a 2D context: a browser canvas or the server's. */
export interface Surface {
  width: number;
  height: number;
  getContext(kind: "2d"): unknown;
}
export type Make = (w: number, h: number) => Surface;

export const W = 1200;
export const H = 630;
const SANS = '"Bricolage Grotesque Variable", "Bricolage Grotesque", system-ui, sans-serif';
const SERIF = '"Instrument Serif", Georgia, serif';
const MONO = '"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, monospace';

const an = (word: string) => (/^[aeiou]/i.test(word) ? "an" : "a");
const ctx = (s: Surface) => s.getContext("2d") as Ctx;
const isLast = (t: CardTree) => t.total > 0 && t.n >= t.total;

function start(make: Make, scale: number) {
  const c = make(W * scale, H * scale);
  const g = ctx(c);
  g.scale(scale, scale);
  g.fillStyle = "#07131a";
  g.fillRect(0, 0, W, H);
  return { c, g };
}

/** The island on the right as it stood after `burned` trees, faded into the night. Returns the last cell. */
function island(g: Ctx, make: Make, burned: number, total: number, scale: number) {
  const mx = 470;
  const mw = W - mx - 10;
  const mh = H - 40;
  const map = make(Math.round(mw * scale), Math.round(mh * scale));
  const spot = paintIsland(ctx(map), mw, mh, burned, total, scale);
  g.drawImage(map as unknown as CanvasImageSource, mx, 20, mw, mh);
  const fade = g.createLinearGradient(mx, 0, mx + 240, 0);
  fade.addColorStop(0, "#07131a");
  fade.addColorStop(1, "rgba(7, 19, 26, 0)");
  g.fillStyle = fade;
  g.fillRect(mx, 0, 240, H);
  const vig = g.createRadialGradient(mx + mw / 2, H / 2, mh * 0.35, mx + mw / 2, H / 2, mw * 0.75);
  vig.addColorStop(0, "rgba(7, 19, 26, 0)");
  vig.addColorStop(1, "rgba(7, 19, 26, 0.85)");
  g.fillStyle = vig;
  g.fillRect(mx, 0, W - mx, H);
  return { x: mx + spot.x, y: 20 + spot.y };
}

function flame(g: Ctx, x: number, y: number, label: string) {
  const glow = g.createRadialGradient(x, y, 0, x, y, 70);
  glow.addColorStop(0, "rgba(255, 200, 80, 0.95)");
  glow.addColorStop(0.3, "rgba(255, 90, 30, 0.55)");
  glow.addColorStop(1, "rgba(255, 60, 20, 0)");
  g.fillStyle = glow;
  g.fillRect(x - 70, y - 70, 140, 140);
  g.strokeStyle = "#ffad3b";
  g.lineWidth = 2.5;
  g.beginPath();
  g.arc(x, y, 16, 0, Math.PI * 2);
  g.stroke();
  g.font = `700 17px ${MONO}`;
  const tw = g.measureText(label).width + 22;
  const tx = Math.min(x + 26, W - tw - 16);
  const ty = Math.max(y - 52, 16);
  g.strokeStyle = "rgba(255, 173, 59, 0.7)";
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(x + 12, y - 12);
  g.lineTo(tx, ty + 30);
  g.stroke();
  g.fillStyle = "#ff5a1f";
  roundRect(g, tx, ty, tw, 32, 6);
  g.fill();
  g.fillStyle = "#1a0d05";
  g.textBaseline = "middle";
  g.fillText(label, tx + 11, ty + 17);
  g.textBaseline = "alphabetic";
}

/** Three readings in a box, like the meter on the map. */
function readings(g: Ctx, x: number, y: number, cells: [string, string, string][]) {
  const bw = 136;
  g.strokeStyle = "rgba(143, 211, 207, 0.22)";
  g.lineWidth = 1;
  roundRect(g, x, y, bw * cells.length, 96, 14);
  g.stroke();
  cells.forEach(([k, v, col], i) => {
    const cx = x + i * bw + 18;
    if (i) {
      g.beginPath();
      g.moveTo(x + i * bw, y + 14);
      g.lineTo(x + i * bw, y + 82);
      g.stroke();
    }
    g.fillStyle = "rgba(239, 232, 214, 0.55)";
    g.font = `500 12px ${MONO}`;
    g.fillText(k, cx, y + 32);
    g.fillStyle = col;
    fitText(g, v, `600 VALUEpx ${MONO}`, 30, bw - 30, cx, y + 72);
  });
}

function footer(g: Ctx, x: number, host: string) {
  drawMark(g, x, 548, 34);
  g.fillStyle = "#efe8d6";
  g.font = `700 24px ${SANS}`;
  g.fillText(TICKER, x + 46, 573);
  g.fillStyle = "rgba(239, 232, 214, 0.65)";
  g.font = `400 18px ${SANS}`;
  g.fillText("every buy burns a tree", x + 46 + g.measureText(TICKER).width + 40, 572);
  if (host) {
    g.fillStyle = "rgba(239, 232, 214, 0.45)";
    g.font = `500 14px ${MONO}`;
    g.fillText(host, x, 610);
  }
}

const pctText = (n: number, total: number) => {
  const p = total > 0 ? (n / total) * 100 : 0;
  return `${p.toFixed(p < 10 ? 2 : 1)}%`;
};

/** One tree that burned. */
export function drawTreeCard(make: Make, tree: CardTree, host: string, scale = 2) {
  const { c, g } = start(make, scale);
  const last = isLast(tree);
  const spot = island(g, make, tree.n, tree.total, scale);
  flame(g, spot.x, spot.y, last ? `The last tree · #${tree.n.toLocaleString("en-US")}` : `${speciesOf(tree.n)} #${tree.n.toLocaleString("en-US")}`);

  const x = 56;
  g.fillStyle = "#8fd3cf";
  g.font = `500 16px ${MONO}`;
  const when = tree.t ? " · " + new Date(tree.t * 1000).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).toUpperCase() : "";
  g.fillText(`${ISLAND.toUpperCase()} · TREE #${tree.n.toLocaleString("en-US")}${when}`, x, 78);

  const species = speciesOf(tree.n);
  g.fillStyle = "#efe8d6";
  g.font = `700 76px ${SANS}`;
  g.fillText("I burned", x, 170);
  g.fillStyle = "#ff5a1f";
  fitText(g, last ? "the last tree." : `${an(species)} ${species}.`, `italic 400 VALUEpx ${SERIF}`, 104, 520 - x, x, 262);

  g.fillStyle = "rgba(239, 232, 214, 0.8)";
  g.font = `400 26px ${SANS}`;
  g.fillText(last ? "Oren's tree. The forest doesn't come back." : `${ageOf(tree.n)} years old. Gone in one buy.`, x, 318);

  const left = Math.max(0, tree.total - tree.n);
  readings(g, x, 372, [
    ["TREES LEFT", left.toLocaleString("en-US"), "#7fc48a"],
    tree.amount ? ["BOUGHT", amount(tree.amount), "#c9d86b"] : ["TREE", `#${tree.n.toLocaleString("en-US")}`, "#c9d86b"],
    ["CLEARED", pctText(tree.n, tree.total), "#ff5a1f"],
  ]);
  if (tree.who) {
    g.fillStyle = "rgba(239, 232, 214, 0.55)";
    g.font = `500 13px ${MONO}`;
    g.fillText(`${TICKER} bought by ${tree.who}`, x, 494);
  }
  footer(g, x, host);
  return c;
}

/** The island as it stands: the site's own link preview. */
export function drawSiteCard(make: Make, burned: number, total: number, host: string, scale = 1) {
  const { c, g } = start(make, scale);
  const spot = island(g, make, Math.max(1, burned), total, scale);
  if (burned > 0 && burned < total) flame(g, spot.x, spot.y, "Fire front");
  const x = 56;
  g.fillStyle = "#8fd3cf";
  g.font = `500 16px ${MONO}`;
  g.fillText(`${ISLAND.toUpperCase()} · A FOREST ISLAND`, x, 78);
  g.fillStyle = "#efe8d6";
  g.font = `700 84px ${SANS}`;
  if (burned >= total) {
    g.fillText("The forest", x, 178);
    g.fillStyle = "#ff5a1f";
    fitText(g, "is gone.", `italic 400 VALUEpx ${SERIF}`, 110, 420, x, 278);
  } else {
    g.fillText("Every buy", x, 178);
    g.fillText("burns", x, 266);
    const after = x + g.measureText("burns ").width;
    g.fillStyle = "#ff5a1f";
    g.font = `italic 400 100px ${SERIF}`;
    g.fillText("a tree.", after, 266);
  }
  readings(g, x, 336, [
    ["TREES LEFT", Math.max(0, total - burned).toLocaleString("en-US"), "#7fc48a"],
    ["PALMS", burned.toLocaleString("en-US"), "#c9d86b"],
    ["CLEARED", pctText(burned, total), "#ff5a1f"],
  ]);
  g.fillStyle = "rgba(239, 232, 214, 0.7)";
  g.font = `400 20px ${SANS}`;
  g.fillText("The ten biggest holders own the plantation.", x, 480);
  footer(g, x, host);
  return c;
}

/** Shrinks a line until it fits `max` wide; `font` carries VALUE where the size goes. */
function fitText(g: Ctx, text: string, font: string, size: number, max: number, x: number, y: number) {
  let s = size;
  g.font = font.replace("VALUE", String(s));
  while (g.measureText(text).width > max && s > 12) {
    s -= 2;
    g.font = font.replace("VALUE", String(s));
  }
  g.fillText(text, x, y);
}

function roundRect(g: Ctx, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** The palm in a ring of fire, as on the top bar. Lines only, so no Path2D is needed. */
export function drawMark(g: Ctx, x: number, y: number, size: number) {
  g.save();
  g.translate(x, y);
  g.scale(size / 32, size / 32);
  g.fillStyle = "#10241a";
  g.strokeStyle = "#ff6a2b";
  g.lineWidth = 2;
  g.beginPath();
  g.arc(16, 16, 15, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.strokeStyle = "#c9d86b";
  g.lineWidth = 2.2;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(16, 25);
  g.lineTo(16, 14);
  for (const [cx, cy, ex, ey] of [
    [11, 9, 7.4, 10],
    [21, 9, 24.6, 10],
    [15.6, 8, 19.2, 5],
    [11, 11.6, 6.8, 16.4],
    [21, 11.6, 25.2, 16.4],
  ]) {
    g.moveTo(16, 14);
    g.quadraticCurveTo(cx, cy, ex, ey);
  }
  g.stroke();
  g.restore();
}

/** The words that go with a tree's card. */
export function postText(tree: CardTree) {
  if (isLast(tree)) return `I burned the last tree on ${ISLAND}. Tree #${tree.n.toLocaleString("en-US")}, Oren's tree. The forest doesn't come back. ${TICKER}`;
  const species = speciesOf(tree.n);
  const left = Math.max(0, tree.total - tree.n).toLocaleString("en-US");
  return `I burned ${an(species)} ${species} on ${ISLAND}. Tree #${tree.n.toLocaleString("en-US")}, ${ageOf(tree.n)} years old, gone in one buy. ${left} trees left. ${TICKER}`;
}
