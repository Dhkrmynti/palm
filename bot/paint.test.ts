/** The live map paints only the patch around new palms; it must match a full repaint. */
import test from "node:test";
import assert from "node:assert/strict";
import { Canvas } from "@napi-rs/canvas";
import { layoutFor, paintBase, paintCleared, paintGround, type Ctx } from "../src/map/paint";

const W = 900, H = 560, dpr = 2;
const L = layoutFor(W, H);
const ctx = (c: Canvas) => c.getContext("2d") as unknown as Ctx;
const ground = new Canvas(W * dpr, H * dpr);
paintGround(ctx(ground), L, dpr);

function offShare(a: number, b: number) {
  const full = new Canvas(W * dpr, H * dpr);
  paintBase(ctx(full), L, dpr, b, ground as never);
  const inc = new Canvas(W * dpr, H * dpr);
  paintBase(ctx(inc), L, dpr, a, ground as never);
  paintCleared(ctx(inc), L, dpr, a, b, ground as never);
  const p = full.getContext("2d").getImageData(0, 0, W * dpr, H * dpr).data;
  const q = inc.getContext("2d").getImageData(0, 0, W * dpr, H * dpr).data;
  let big = 0;
  for (let i = 0; i < p.length; i += 4) if (Math.abs(p[i] - q[i]) + Math.abs(p[i + 1] - q[i + 1]) + Math.abs(p[i + 2] - q[i + 2]) > 60) big++;
  return big / (p.length / 4);
}

test("one new palm, patched, looks like a full repaint", () => assert.ok(offShare(1000, 1001) < 0.0001));
test("a dozen new palms, patched, look like a full repaint", () => assert.ok(offShare(2500, 2512) < 0.0001));
test("near the mill and the coast too", () => assert.ok(offShare(3, 9) < 0.0001));
