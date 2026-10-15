/**
 * Painting the island: shared by the live map, the share card in the browser, and the engine, which
 * draws the same cards on the server for link previews. Nothing here touches the DOM.
 */
import { GW, GH, cellRand, clearedCells, island } from "./island";

/** A 2D context: the browser's, or the server canvas's, which draws the same way. */
export type Ctx = CanvasRenderingContext2D;

const CANOPY = ["#14402a", "#185032", "#1d5a36", "#123a25", "#226140", "#1a4c2f", "#2a6a3e"];

export type Layout = { s: number; ox: number; oy: number; w: number; h: number };

export function layoutFor(w: number, h: number): Layout {
  const s = Math.min(w / GW, h / GH);
  return { s, ox: (w - s * GW) / 2, oy: (h - s * GH) / 2, w, h };
}

/** One crown of old forest: a soft shadow to the south-east, the crown, a lit edge to the north-west. */
export function drawForest(g: Ctx, x: number, y: number, L: Layout, pass: 0 | 1 | 2 = 1) {
  const { s, ox, oy } = L;
  const r = cellRand(x, y);
  const cx = ox + (x + 0.5 + (r - 0.5) * 0.5) * s;
  const cy = oy + (y + 0.5 + (cellRand(x, y, 1) - 0.5) * 0.5) * s;
  // a few emergent giants stand above the canopy
  const big = cellRand(x, y, 3) > 0.93;
  const rad = s * (big ? 1.05 : 0.58 + cellRand(x, y, 2) * 0.3);
  g.beginPath();
  if (pass === 0) {
    g.fillStyle = "rgba(2, 12, 7, 0.55)";
    g.arc(cx + rad * 0.35, cy + rad * 0.45, rad, 0, Math.PI * 2);
  } else if (pass === 1) {
    g.fillStyle = big ? "#2b7044" : CANOPY[Math.floor(r * CANOPY.length)];
    g.arc(cx, cy, rad, 0, Math.PI * 2);
  } else {
    g.fillStyle = big ? "rgba(170, 220, 140, 0.28)" : "rgba(140, 200, 120, 0.15)";
    g.arc(cx - rad * 0.28, cy - rad * 0.3, rad * 0.48, 0, Math.PI * 2);
  }
  g.fill();
}

/** Cleared ground: dark soil, a lighter furrow every other row so the plantation reads as rows. */
export function drawSoil(g: Ctx, x: number, y: number, L: Layout) {
  const { s, ox, oy } = L;
  g.fillStyle = y % 2 ? "#2e251b" : "#362b1f";
  g.fillRect(ox + x * s, oy + y * s, s + 0.5, s + 0.5);
}

/** A young palm: six fronds from the centre, a shadow under it, a fruit bunch now and then. */
export function drawPalm(g: Ctx, x: number, y: number, L: Layout, alpha = 1) {
  const { s, ox, oy } = L;
  const cx = ox + (x + 0.5) * s;
  const cy = oy + (y + 0.5) * s;
  const len = s * 0.46;
  const turn = cellRand(x, y, 7) * Math.PI;
  g.globalAlpha = alpha;
  g.fillStyle = "rgba(10, 6, 3, 0.45)";
  g.beginPath();
  g.arc(cx + s * 0.14, cy + s * 0.18, len * 0.9, 0, Math.PI * 2);
  g.fill();
  g.lineCap = "round";
  g.lineWidth = Math.max(0.9, s * 0.16);
  g.strokeStyle = "#7f9338";
  g.beginPath();
  for (let k = 0; k < 6; k++) {
    const a = turn + (k * Math.PI * 2) / 6;
    g.moveTo(cx, cy);
    g.quadraticCurveTo(cx + Math.cos(a) * len * 0.7, cy + Math.sin(a) * len * 0.7 - s * 0.08, cx + Math.cos(a) * len, cy + Math.sin(a) * len + s * 0.06);
  }
  g.stroke();
  g.lineWidth = Math.max(0.6, s * 0.08);
  g.strokeStyle = "#c9d86b";
  g.beginPath();
  for (let k = 0; k < 6; k += 2) {
    const a = turn + (k * Math.PI * 2) / 6;
    g.moveTo(cx, cy);
    g.lineTo(cx + Math.cos(a) * len * 0.6, cy + Math.sin(a) * len * 0.6 - s * 0.05);
  }
  g.stroke();
  if (cellRand(x, y, 8) > 0.7) {
    g.fillStyle = "#e0702c";
    g.beginPath();
    g.arc(cx, cy, s * 0.1, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
}

/** Rounded land: one disc per cell so the coast is soft instead of stepped. */
export function landShape(g: Ctx, L: Layout, kinds: number[], grow = 0.72) {
  const { s, ox, oy } = L;
  const isl = island();
  g.beginPath();
  for (let y = 0; y < GH; y++)
    for (let x = 0; x < GW; x++) {
      if (!kinds.includes(isl.kind[y * GW + x])) continue;
      const cx = ox + (x + 0.5) * s;
      const cy = oy + (y + 0.5) * s;
      g.moveTo(cx + s * grow, cy);
      g.arc(cx, cy, s * grow, 0, Math.PI * 2);
    }
  g.fill();
}

/** The fixed picture for a given number of cleared cells. */
/** What never changes as trees burn: sea, shallows, sand and the forest floor. */
export function paintGround(g: Ctx, L: Layout, dpr: number) {
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const { s, ox, oy } = L;

  // the sea: deeper at the edges, a faint survey grid over it
  const sea = g.createRadialGradient(L.w * 0.55, L.h * 0.5, 0, L.w * 0.55, L.h * 0.5, Math.max(L.w, L.h) * 0.7);
  sea.addColorStop(0, "#0c2129");
  sea.addColorStop(1, "#050e13");
  g.fillStyle = sea;
  g.fillRect(0, 0, L.w, L.h);
  g.fillStyle = "rgba(143, 211, 207, 0.08)";
  for (let y = 0; y < GH; y += 4) for (let x = 0; x < GW; x += 4) g.fillRect(ox + x * s, oy + y * s, 1, 1);

  // shallow water: the land, blurred and tinted, under everything
  g.save();
  g.filter = "blur(" + Math.max(4, s * 2.2) + "px)";
  g.fillStyle = "rgba(60, 150, 150, 0.35)";
  landShape(g, L, [1, 2], 1.8);
  g.restore();
  g.fillStyle = "rgba(90, 170, 160, 0.18)";
  landShape(g, L, [1, 2], 1.25);

  // sand, then the floor of the forest
  g.fillStyle = "#4a4433";
  landShape(g, L, [1, 2], 0.78);
  g.fillStyle = "#0b2617";
  landShape(g, L, [2], 0.7);
}

/** A canvas-like thing the ground can be copied from. */
type Source = Parameters<Ctx["drawImage"]>[0];

/**
 * The fixed picture for a given number of cleared cells. With `ground` (from paintGround at the same
 * size) the unchanging layers are copied instead of drawn again.
 */
export function paintBase(g: Ctx, L: Layout, dpr: number, cleared: number, ground?: Source) {
  const isl = island();
  if (ground) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(ground, 0, 0);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  } else paintGround(g, L, dpr);
  // the plantation's soil, then the forest in three passes, then the palms on top (paintCleared repeats this per patch)
  isl.order.forEach((cell, i) => i < cleared && drawSoil(g, cell.x, cell.y, L));
  for (const pass of [0, 1, 2] as const) isl.order.forEach((cell, i) => i >= cleared && drawForest(g, cell.x, cell.y, L, pass));
  isl.order.forEach((cell, i) => i < cleared && drawPalm(g, cell.x, cell.y, L));

  drawMill(g, L);
}

/**
 * Cells `from` to `to` (burn ranks) have just turned to palm: paint only the patch around them again,
 * layer for layer as paintBase does, so a burn costs a few dozen cells instead of the whole island.
 */
export function paintCleared(g: Ctx, L: Layout, dpr: number, from: number, to: number, ground: Source) {
  const { s, ox, oy } = L;
  const isl = island();
  const rank = (x: number, y: number) => (x < 0 || y < 0 || x >= GW || y >= GH ? -1 : isl.rankAt[y * GW + x]);
  // the patch: land cells within 2 of a changed cell (a giant crown reaches that far)
  const patch = new Set<number>();
  for (let r = from; r < to; r++) {
    const c = isl.order[r];
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (rank(c.x + dx, c.y + dy) >= 0) patch.add((c.y + dy) * GW + c.x + dx);
  }
  if (!patch.size) return;
  // everything that can paint into the patch: cells within 2 more
  const near = new Set<number>();
  for (const i of patch) {
    const x = i % GW;
    const y = (i - x) / GW;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (rank(x + dx, y + dy) >= 0) near.add((y + dy) * GW + x + dx);
  }
  // in burn order, as paintBase draws them: overlapping crowns stack the same way
  const cells = [...near].map((i) => ({ x: i % GW, y: Math.floor(i / GW), r: isl.rankAt[i] })).sort((p, q) => p.r - q.r);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.save();
  g.beginPath();
  // the clip snaps to whole device pixels, so its edge leaves no half-blended seam
  const px = (v: number) => Math.round(v * dpr) / dpr;
  for (const i of patch) {
    const x0 = px(ox + (i % GW) * s);
    const y0 = px(oy + Math.floor(i / GW) * s);
    g.rect(x0, y0, px(ox + ((i % GW) + 1) * s) - x0, px(oy + (Math.floor(i / GW) + 1) * s) - y0);
  }
  g.clip();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(ground, 0, 0);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (const c of cells) if (c.r < to) drawSoil(g, c.x, c.y, L);
  for (const pass of [0, 1, 2] as const) for (const c of cells) if (c.r >= to) drawForest(g, c.x, c.y, L, pass);
  for (const c of cells) if (c.r < to) drawPalm(g, c.x, c.y, L);
  drawMill(g, L);
  g.restore();
}

/** The mill: two long sheds, a tank and a chimney, on a concrete yard by the shore. */
function drawMill(g: Ctx, L: Layout) {
  const { s, ox, oy } = L;
  const m = island().mill;
  const mx = ox + (m.x - 1.5) * s;
  const my = oy + (m.y - 1.2) * s;
  g.fillStyle = "#57534a";
  g.fillRect(mx - s * 0.4, my - s * 0.4, s * 4.4, s * 3.2);
  g.fillStyle = "#d9d2bf";
  g.fillRect(mx, my, s * 2.4, s * 0.9);
  g.fillRect(mx, my + s * 1.2, s * 2.4, s * 0.9);
  g.fillStyle = "#a59e8b";
  g.fillRect(mx, my + s * 0.7, s * 2.4, s * 0.2);
  g.fillRect(mx, my + s * 1.9, s * 2.4, s * 0.2);
  g.fillStyle = "#c98a3a";
  g.beginPath();
  g.arc(mx + s * 3.2, my + s * 0.6, s * 0.55, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#2b2b2b";
  g.fillRect(mx + s * 2.95, my + s * 1.5, s * 0.5, s * 0.5);
}

/**
 * The island as it stood when `burned` trees had gone, painted into a context sized `w` by `h`
 * times `scale`. Returns where the cell of tree `burned` sits, for a marker.
 */
export function paintIsland(g: Ctx, w: number, h: number, burned: number, total: number, scale = 2) {
  const L = layoutFor(w, h);
  const cleared = clearedCells(burned, total);
  paintBase(g, L, scale, cleared);
  const cell = island().order[Math.max(0, cleared - 1)];
  return { x: L.ox + (cell.x + 0.5) * L.s, y: L.oy + (cell.y + 0.5) * L.s, s: L.s };
}
