/**
 * The share card in the browser: the same drawing as the engine's link previews (src/card/draw.ts),
 * on a page canvas once the page's fonts are ready. Nothing is sent anywhere.
 */
import { drawTreeCard, postText, type CardTree } from "../card/draw";

export type { CardTree };
export { postText };

async function fonts() {
  if (!document.fonts) return;
  await Promise.all([
    document.fonts.load('700 72px "Bricolage Grotesque Variable"'),
    document.fonts.load('italic 400 90px "Instrument Serif"'),
    document.fonts.load('500 18px "JetBrains Mono Variable"'),
  ]).catch(() => {});
}

const make = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};

export async function drawCard(tree: CardTree, scale = 2) {
  await fonts();
  return drawTreeCard(make, tree, window.location.host, scale) as HTMLCanvasElement;
}
