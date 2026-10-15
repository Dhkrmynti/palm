/**
 * The share card: a 1200 by 630 picture of one tree that burned, drawn in the browser. The island as
 * it stood the moment that tree went, a flame on its cell, the tree's name and age, what the buy was
 * and how much of the forest is left. Nothing is sent anywhere; the picture is made on this page.
 */
import { paintIsland } from "../map/IslandMap";
import { ISLAND, TICKER } from "./brand";
import { ageOf, speciesOf } from "./trees";
import { amount } from "./api";

export interface CardTree {
  /** The tree's number: 1 is the first that burned. */
  n: number;
  /** Whole tokens bought. */
  amount: string;
  /** Unix seconds of the buy. */
  t: number;
  /** Trees on the island at launch. */
  total: number;
  /** How the buyer is shown: X handle, name, or short address. */
  who: string;
}

const W = 1200;
const H = 630;
const SANS = '"Bricolage Grotesque Variable", "Bricolage Grotesque", system-ui, sans-serif';
const SERIF = '"Instrument Serif", Georgia, serif';
const MONO = '"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, monospace';

const an = (word: string) => (/^[aeiou]/i.test(word) ? "an" : "a");

/** The three fonts the card uses, ready before anything is drawn. */
async function fonts() {
  if (!document.fonts) return;
  await Promise.all([document.fonts.load(`700 72px ${SANS}`), document.fonts.load(`italic 400 90px ${SERIF}`), document.fonts.load(`500 18px ${MONO}`)]).catch(() => {});
}

export async function drawCard(tree: CardTree, scale = 2) {
  await fonts();
  const c = document.createElement("canvas");
  c.width = W * scale;
  c.height = H * scale;
  const g = c.getContext("2d")!;
  g.scale(scale, scale);

  // night
  g.fillStyle = "#07131a";
  g.fillRect(0, 0, W, H);

  // the island the moment this tree burned, on the right
  const mx = 470;
  const mw = W - mx - 10;
  const mh = H - 40;
  const map = document.createElement("canvas");
  const spot = paintIsland(map, mw, mh, tree.n, tree.total, scale);
  g.drawImage(map, mx, 20, mw, mh);
  // fade the map into the night on its left, and darken its edges
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

  // the flame on this tree's cell, and its tag
  const fx = mx + spot.x;
  const fy = 20 + spot.y;
  const glow = g.createRadialGradient(fx, fy, 0, fx, fy, 70);
  glow.addColorStop(0, "rgba(255, 200, 80, 0.95)");
  glow.addColorStop(0.3, "rgba(255, 90, 30, 0.55)");
  glow.addColorStop(1, "rgba(255, 60, 20, 0)");
  g.fillStyle = glow;
  g.fillRect(fx - 70, fy - 70, 140, 140);
  g.strokeStyle = "#ffad3b";
  g.lineWidth = 2.5;
  g.beginPath();
  g.arc(fx, fy, 16, 0, Math.PI * 2);
  g.stroke();
  const tag = `${speciesOf(tree.n)} #${tree.n.toLocaleString("en-US")}`;
  g.font = `700 17px ${MONO}`;
  const tw = g.measureText(tag).width + 22;
  const tx = Math.min(fx + 26, W - tw - 16);
  const ty = Math.max(fy - 52, 16);
  g.strokeStyle = "rgba(255, 173, 59, 0.7)";
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(fx + 12, fy - 12);
  g.lineTo(tx, ty + 30);
  g.stroke();
  g.fillStyle = "#ff5a1f";
  roundRect(g, tx, ty, tw, 32, 6);
  g.fill();
  g.fillStyle = "#1a0d05";
  g.textBaseline = "middle";
  g.fillText(tag, tx + 11, ty + 17);

  // the words, on the left
  const x = 56;
  g.textBaseline = "alphabetic";
  g.fillStyle = "#8fd3cf";
  g.font = `500 16px ${MONO}`;
  const when = new Date(tree.t * 1000).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  g.fillText(`${ISLAND.toUpperCase()} · TREE #${tree.n.toLocaleString("en-US")} · ${when.toUpperCase()}`, x, 78);

  const species = speciesOf(tree.n);
  g.fillStyle = "#efe8d6";
  g.font = `700 76px ${SANS}`;
  g.fillText("I burned", x, 170);
  g.fillStyle = "#ff5a1f";
  fitText(g, `${an(species)} ${species}.`, `italic 400 VALUEpx ${SERIF}`, 104, 520 - x, x, 262);

  g.fillStyle = "rgba(239, 232, 214, 0.8)";
  g.font = `400 26px ${SANS}`;
  g.fillText(`${ageOf(tree.n)} years old. Gone in one buy.`, x, 318);

  // three readings, like the meter on the map
  const left = Math.max(0, tree.total - tree.n);
  const pct = tree.total > 0 ? (tree.n / tree.total) * 100 : 0;
  const cells: [string, string, string][] = [
    ["TREES LEFT", left.toLocaleString("en-US"), "#7fc48a"],
    ["BOUGHT", `${amount(tree.amount)}`, "#c9d86b"],
    ["CLEARED", `${pct.toFixed(pct < 10 ? 2 : 1)}%`, "#ff5a1f"],
  ];
  const by = 372;
  const bw = 136;
  g.strokeStyle = "rgba(143, 211, 207, 0.22)";
  g.lineWidth = 1;
  roundRect(g, x, by, bw * 3, 96, 14);
  g.stroke();
  cells.forEach(([k, v, col], i) => {
    const cx = x + i * bw + 18;
    if (i) {
      g.beginPath();
      g.moveTo(x + i * bw, by + 14);
      g.lineTo(x + i * bw, by + 82);
      g.stroke();
    }
    g.fillStyle = "rgba(239, 232, 214, 0.55)";
    g.font = `500 12px ${MONO}`;
    g.fillText(k, cx, by + 32);
    g.fillStyle = col;
    fitText(g, v, `600 VALUEpx ${MONO}`, 30, bw - 30, cx, by + 72);
  });
  g.fillStyle = "rgba(239, 232, 214, 0.55)";
  g.font = `500 13px ${MONO}`;
  g.fillText(`${TICKER} bought by ${tree.who}`, x, by + 122);

  // the mark and the line
  drawMark(g, x, 548, 34);
  g.fillStyle = "#efe8d6";
  g.font = `700 24px ${SANS}`;
  g.fillText(TICKER, x + 46, 573);
  g.fillStyle = "rgba(239, 232, 214, 0.65)";
  g.font = `400 18px ${SANS}`;
  g.fillText("every buy burns a tree", x + 46 + g.measureText(TICKER).width + 40, 572);
  g.fillStyle = "rgba(239, 232, 214, 0.45)";
  g.font = `500 14px ${MONO}`;
  g.fillText(window.location.host, x, 610);

  return c;
}

/** Shrinks a line until it fits `max` wide; `font` carries VALUE where the size goes. */
function fitText(g: CanvasRenderingContext2D, text: string, font: string, size: number, max: number, x: number, y: number) {
  let s = size;
  g.font = font.replace("VALUE", String(s));
  while (g.measureText(text).width > max && s > 12) {
    s -= 2;
    g.font = font.replace("VALUE", String(s));
  }
  g.fillText(text, x, y);
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** The palm in a ring of fire, as on the top bar. */
function drawMark(g: CanvasRenderingContext2D, x: number, y: number, size: number) {
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
  g.stroke(new Path2D("M16 25V14"));
  g.stroke(new Path2D("M16 14c-2-3.4-5.4-4.4-8.6-4M16 14c2-3.4 5.4-4.4 8.6-4M16 14c-.8-3.6.3-6.8 3.2-9M16 14c-3.6-1.3-6.8-.3-9.2 2.4M16 14c3.6-1.3 6.8-.3 9.2 2.4"));
  g.restore();
}

/** The words that go with the card on X. */
export function postText(tree: CardTree) {
  const species = speciesOf(tree.n);
  const left = Math.max(0, tree.total - tree.n).toLocaleString("en-US");
  return `I burned ${an(species)} ${species} on ${ISLAND}. Tree #${tree.n.toLocaleString("en-US")}, ${ageOf(tree.n)} years old, gone in one buy. ${left} trees left. ${TICKER}`;
}
