/**
 * The still pictures for X, drawn with the same painter as the site and the link previews:
 *   npx tsx scripts/content.ts      → konten-x/logo-x.png, banner-x.png, teaser-5000-trees.png,
 *                                     hook-share-card.png, hook-the-last-tree.png
 * The island is the real one; numbers on the teaser and hooks are illustrations.
 */
import fs from "fs";
import path from "path";
import { Canvas } from "@napi-rs/canvas";
import { loadFonts } from "../bot/cards";
import { drawMark, drawSiteCard, drawTreeCard, type Make } from "../src/card/draw";
import { layoutFor, paintBase, type Ctx } from "../src/map/paint";
import { clearedCells } from "../src/map/island";
import { TICKER } from "../src/lib/brand";

const out = path.join(process.cwd(), "konten-x");
fs.mkdirSync(out, { recursive: true });
loadFonts();
const make: Make = (w, h) => new Canvas(w, h);
const save = (name: string, c: unknown) => fs.writeFileSync(path.join(out, name), (c as Canvas).toBuffer("image/png"));
const SANS = '"Bricolage Grotesque Variable"';
const SERIF = '"Instrument Serif"';
const MONO = '"JetBrains Mono Variable"';

// the profile picture: the mark, big, safe for a round crop
{
  const c = new Canvas(1080, 1080);
  const g = c.getContext("2d") as unknown as Ctx;
  g.fillStyle = "#07131a";
  g.fillRect(0, 0, 1080, 1080);
  const glow = g.createRadialGradient(540, 560, 100, 540, 560, 540);
  glow.addColorStop(0, "rgba(255, 90, 31, 0.28)");
  glow.addColorStop(1, "rgba(255, 90, 31, 0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, 1080, 1080);
  drawMark(g, 190, 190, 700);
  save("logo-x.png", c);
}

// the header: a strip of the island, half palm, half forest, with the line on the right
{
  const W = 1500, H = 500;
  const c = new Canvas(W, H);
  const g = c.getContext("2d") as unknown as Ctx;
  const L = layoutFor(W * 1.15, H * 1.6);
  const shifted = { ...L, ox: L.ox - W * 0.12, oy: L.oy - H * 0.32 };
  paintBase(g, shifted, 1, clearedCells(2200, 5000));
  const shade = g.createLinearGradient(W * 0.45, 0, W, 0);
  shade.addColorStop(0, "rgba(7, 19, 26, 0)");
  shade.addColorStop(0.4, "rgba(7, 19, 26, 0.85)");
  shade.addColorStop(1, "rgba(7, 19, 26, 0.95)");
  g.fillStyle = shade;
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#efe8d6";
  g.font = `700 76px ${SANS}`;
  g.textAlign = "right";
  g.fillText("Every buy", W - 70, 200);
  g.font = `italic 400 92px ${SERIF}`;
  const tree = g.measureText("a tree.").width;
  g.font = `700 76px ${SANS}`;
  g.fillText("burns", W - 70 - tree - g.measureText(" ").width, 286);
  g.fillStyle = "#ff5a1f";
  g.font = `italic 400 92px ${SERIF}`;
  g.fillText("a tree.", W - 70, 286);
  g.fillStyle = "#8fd3cf";
  g.font = `500 20px ${MONO}`;
  g.fillText(`${TICKER} · CANOPY ISLAND · ROBINHOOD CHAIN`, W - 72, 350);
  save("banner-x.png", c);
}

// before launch: the whole island still forest
save("teaser-5000-trees.png", drawSiteCard(make, 0, 5000, "", 1));
// what a buyer gets
save("hook-share-card.png", drawTreeCard(make, { n: 1688, amount: "1390000", t: Math.floor(Date.now() / 1000), total: 5000, who: "@palmking" }, "", 1));
save("hook-the-last-tree.png", drawTreeCard(make, { n: 5000, amount: "880000", t: Math.floor(Date.now() / 1000), total: 5000, who: "who will it be?" }, "", 1));
console.log("wrote", fs.readdirSync(out).filter((f) => f.endsWith(".png")).join(", "));
