# Palm · $PALM

Memecoin site + engine for **$PALM** (Robinhood Chain 4663, to be launched on Pons). Every buy burns
one tree on Canopy Island and plants a palm. Creator fees run a two-step loop: ETH straight to the
**10 biggest wallets that never sold**, then the treasury, then again. Lore: `CONCEPT.md`. Design: `DESIGN.md`.

The engine in `bot/` is the one from `../token-menkrep` (itself from `../token2`). Changed: the token
name in logs and signed texts, the default port (5041), and the **forest**: a read-only counter of buy
transactions (`state.forest`, `GET /api/forest`, `forest` in `/api/status`). Nothing that claims or sends ETH was changed.

## Run locally

```bash
npm install
npm run bot          # engine + API on 127.0.0.1:5041 (standby until /lotnok is filled)
npm run dev          # site on http://localhost:5203 (proxies /api to 5041)
```

- The dev server always shows labelled demo data (a tree burns every 6.5 s); `http://localhost:5203/?live` shows the real state.
- `http://localhost:5203/lotnok` is the engine room.

## The forest (`burnTree` in `bot/pads-engine.ts`)

A Transfer counts as a buy when tokens leave the curve, a sell sink, the Uniswap router, a relay or any
contract, and land in a plain wallet that is not excluded. One tree per transaction, and only if the
amount is at least `TREE_MIN_TOKENS` (default 10,000), so dust buys can't clear the island.
`FOREST_TREES` (default 5,000) is the island's size. The counter is saved with the rest of the state
and reset with it when the token changes.

## Tests and checks

```bash
npm test                                   # forest rules, marks, the X signature, map repaints (13 tests)
npx tsx scripts/forest-dryrun.ts 0xTOKEN   # buy detection against a real Pons token, read only (run on the server)
npx tsx scripts/card-preview.ts <dir>      # draws the server's cards to files
```

The forest rules live in `bot/forest.ts` (no chain needed, so they are tested). The dry run reads any
Pons token's Transfers and prints which would burn a tree and why the others would not. Run it on a
token that already trades before $PALM exists, and once more after the first $PALM buys.

## Share cards and link previews

`src/card/draw.ts` draws the cards (1200 by 630) with no DOM, so the page and the engine draw the same thing:

- In the page: Save, Share, Post on X. A post links to `/tree/<n>`.
- In the engine (`bot/cards.ts`, `@napi-rs/canvas`, static font files from `@fontsource`):
  `/api/card/site.png` (the island now; the page's `og:image`), `/api/card/tree/<n>.png`, and
  `/tree/<n>`, a page whose preview on X and Telegram is that tree's card and which sends people on to
  `/?tree=<n>`. nginx sends `/tree/` to the engine (`scripts/install-server.sh`).
- The engine keeps every tree in a book (`state.forest.book`), so any tree can get its card.
- `og:image` must be absolute: the build writes `SITE_URL` from `.env` into `index.html`.

## Marks and the end

At 10, 25, 50, 75 and 90% cleared, at 100 trees left and at the last tree (`src/lib/marks.ts`):
the page shows a banner with that tree's card; under 100 the hero warns and the meter pulses; when the
forest is gone the hero and the closing change, Oren's pin and tree are gone, and the last tree's card
is one click away. With `X_POST_*` set the engine posts each mark reached live (`bot/xpost.ts`).
Try them in the demo: `?stage=quarter`, `?stage=last100`, `?stage=gone`; `?from=<n>&pace=<ms>` sets
where the demo starts and how fast it burns.

## Tuning the forest

How long the island lasts is the number of qualifying buys. Pick the size and the smallest buy before
launch (`.env`, then `pm2 restart palm-engine --update-env`):

| Setting | Default | What it does |
|---|---|---|
| `FOREST_TREES` | 5000 | trees on the island |
| `TREE_MIN_TOKENS` | 10000 | smallest buy, in tokens |
| `TREE_MIN_USD` | 0 (off) | smallest buy in dollars, once a price is known |

At a launch price around $0.00004, 10,000 tokens is about $0.40: a bot could clear all 5,000 trees with
about $2,000 of buys. With `TREE_MIN_USD=5` it takes at least $25,000 of buys, and the token minimum
still applies before a price exists. The island lasts as many qualifying buys as it has trees: if the
first day brings 2,000 of them, 5,000 trees last two or three days; double `FOREST_TREES` for a slower
burn. (2,000 is an example, not a measured Pons figure: watch the first hours and adjust before people
get used to the numbers.) Change these before launch: the
map is drawn from the share of trees burned, so changing the size later moves the fire front.

## Deploy and content

- `DEPLOY-VPS.md`: install on a VPS, HTTPS, and the checks after launch (`scripts/postlaunch-check.sh`).
- `konten-x/`: logo, banner, teaser, the timelapse video, post pictures and the post texts (`caption.md`).
  Stills: `npx tsx scripts/content.ts`.

## Not done yet

- No token, domain, X account or server yet. `X_URL` in `src/lib/api.ts` is empty.
- Buy detection has passed its tests and is ready for the dry run, but has not seen a real chain:
  the Robinhood RPC is blocked from the dev laptop. Run the dry run on the server before launch.
- X posting is written against X's API and its signature matches X's published example, but has not
  posted for real: it needs the project's X keys.

## Launch checklist

1. Deploy (`DEPLOY-VPS.md`), with `SITE_URL` on https.
2. Dry run the buy detection on any trading Pons token.
3. Set `FOREST_TREES`, `TREE_MIN_TOKENS`, `TREE_MIN_USD`; optionally `X_POST_*`.
4. Launch $PALM on Pons **from the wallet whose key goes into the engine**, with a little ETH for gas.
5. `/lotnok` → CA, key, treasury, admin secret → Save. `sh scripts/site-mode.sh live`.
6. After the first buys: `sh scripts/postlaunch-check.sh 0xCA`.
