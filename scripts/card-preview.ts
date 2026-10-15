/** Draws the server's cards to files, to look at them without the engine: npx tsx scripts/card-preview.ts <dir> */
import fs from "fs";
import path from "path";
import { drawSite, treePng, treePage } from "../bot/cards";

const out = process.argv[2] || ".";
const t0 = Date.now();
fs.writeFileSync(path.join(out, "card-tree.png"), treePng({ n: 1688, amount: "1390000", t: 1792000000, total: 5000, who: "@palmking" }, "palm.example"));
const t1 = Date.now();
fs.writeFileSync(path.join(out, "card-last.png"), treePng({ n: 5000, amount: "880000", t: 1792000000, total: 5000, who: "0x4be1…e4f6" }, "palm.example"));
fs.writeFileSync(path.join(out, "card-site.png"), drawSite(1688, 5000, "palm.example"));
fs.writeFileSync(path.join(out, "card-gone.png"), drawSite(5000, 5000, "palm.example"));
fs.writeFileSync(path.join(out, "tree.html"), treePage({ n: 1688, amount: "1390000", t: 1792000000, total: 5000, who: "@palmking" }, "https://palm.example"));
console.log(`first card ${t1 - t0} ms, all done ${Date.now() - t0} ms`);
