/** Run: npm test. The forest's rules and the X signature, without a chain. */
import test from "node:test";
import assert from "node:assert/strict";
import { freshForest, marksAt, recordTree, treeAt, whyNotATree, type BuyRules } from "./forest";
import { markText, oauthHeader } from "./xpost";

const CURVE = "0xcurve";
const ROUTER = "0xrouter";
const POOL = "0xpool";
const ALICE = "0xalice";
const BOB = "0xbob";
const VAULT = "0xvault";
const units = (n: number) => BigInt(n) * 10n ** 18n;

function rules(over: Partial<BuyRules> = {}): BuyRules {
  const contracts = new Set([CURVE, ROUTER, POOL, VAULT]);
  return {
    minUnits: units(10000),
    decimals: 18,
    excluded: new Set(["0xdev"]),
    sinks: new Set([CURVE]),
    router: ROUTER,
    dead: "0xdead",
    isRelay: () => false,
    isContract: async (a) => contracts.has(a),
    ...over,
  };
}
const buy = (src: string, dst: string, n: number, tx = "0xt" + Math.random()) => ({ src, dst, value: units(n), tx });

test("a buy from the curve, a pool or the router burns a tree", async () => {
  const f = freshForest();
  for (const src of [CURVE, POOL, ROUTER]) assert.equal(await whyNotATree(f, 5000, buy(src, ALICE, 20000), rules()), null);
});

test("what is not a buy burns nothing", async () => {
  const f = freshForest();
  assert.match((await whyNotATree(f, 5000, buy(ALICE, BOB, 50000), rules()))!, /wallet-to-wallet/);
  assert.match((await whyNotATree(f, 5000, buy(ALICE, CURVE, 50000), rules()))!, /market/);
  assert.match((await whyNotATree(f, 5000, buy(CURVE, VAULT, 50000), rules()))!, /contract/);
  assert.match((await whyNotATree(f, 5000, buy(CURVE, "0xdev", 50000), rules()))!, /excluded/);
  assert.match((await whyNotATree(f, 5000, buy(CURVE, ALICE, 9999), rules()))!, /smallest/);
});

test("a relay counts as the market", async () => {
  const f = freshForest();
  assert.equal(await whyNotATree(f, 5000, buy("0xrelay", ALICE, 20000), rules({ isRelay: (a) => a === "0xrelay" })), null);
});

test("the dollar minimum applies only once a price is known", async () => {
  const f = freshForest();
  // 20,000 tokens at $0.0001 = $2
  assert.match((await whyNotATree(f, 5000, buy(CURVE, ALICE, 20000), rules({ minUSD: 5, tokenUSD: 0.0001 })))!, /under \$5/);
  assert.equal(await whyNotATree(f, 5000, buy(CURVE, ALICE, 20000), rules({ minUSD: 5, tokenUSD: 0.001 })), null);
  assert.equal(await whyNotATree(f, 5000, buy(CURVE, ALICE, 20000), rules({ minUSD: 5, tokenUSD: 0 })), null);
});

test("one transaction burns one tree, and the forest stops at its size", async () => {
  const f = freshForest();
  const b = buy(CURVE, ALICE, 20000, "0xsame");
  assert.equal(await whyNotATree(f, 3, b, rules()), null);
  recordTree(f, 3, { buyer: ALICE, amount: "1", t: 1, tx: "0xsame" });
  assert.match((await whyNotATree(f, 3, b, rules()))!, /already/);
  recordTree(f, 3, { buyer: BOB, amount: "1", t: 2, tx: "0xb" });
  recordTree(f, 3, { buyer: BOB, amount: "1", t: 3, tx: "0xc" });
  assert.match((await whyNotATree(f, 3, buy(CURVE, ALICE, 20000), rules()))!, /gone/);
});

test("the book keeps every tree; marks are passed once", () => {
  const f = freshForest();
  const passed: string[] = [];
  for (let i = 1; i <= 200; i++) passed.push(...recordTree(f, 200, { buyer: i % 2 ? ALICE : BOB, amount: String(i), t: i, tx: "0x" + i }).marks);
  // on a 200-tree island the last hundred begin at tree 100, together with 50%
  assert.deepEqual(passed, ["10%", "25%", "50%", "last100", "75%", "90%", "gone"]);
  assert.deepEqual(treeAt(f, 77), { n: 77, buyer: ALICE, amount: "77", t: 77, tx: "0x77" });
  assert.equal(treeAt(f, 201), null);
  assert.equal(f.recent.length, 60);
  assert.equal(f.recent[0].n, 200);
});

test("marks for a 5,000-tree island", () => {
  assert.deepEqual(marksAt(499, 5000), []);
  assert.deepEqual(marksAt(500, 5000), ["10%"]);
  assert.deepEqual(marksAt(4900, 5000), ["10%", "25%", "50%", "75%", "90%", "last100"]);
  assert.deepEqual(marksAt(5000, 5000), ["10%", "25%", "50%", "75%", "90%", "last100", "gone"]);
});

test("the X signature matches X's published example", () => {
  // https://developer.x.com/en/docs/authentication/oauth-1-0a/creating-a-signature
  const h = oauthHeader(
    "POST",
    "https://api.twitter.com/1.1/statuses/update.json",
    { key: "xvz1evFS4wEEPTGEFPHBog", secret: "kAcSOqF21Fu85e7zjz7ZN2U4ZRhfV3WpwPAoE3Z7kBw", token: "370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb", tokenSecret: "LswwdoUaIvS8ltyTt5jkRh4J50vUPVVHtR2YPi5kE" },
    "kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg",
    "1318622958",
    { include_entities: "true", status: "Hello Ladies + Gentlemen, a signed OAuth request!" },
  );
  assert.match(h, /oauth_signature="hCtSmYh%2BiHYCEqBWrE7C7hYmtUk%3D"/);
});

test("mark posts fit in one post", () => {
  for (const m of ["10%", "50%", "last100", "gone"] as const) assert.ok(markText(m, 4900, 5000, "https://example.fun/tree/4900").length <= 280);
});
