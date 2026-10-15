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

## Share card

`src/lib/sharecard.ts` draws a 1200 by 630 PNG in the browser for any burned tree: the island as it
stood when that tree burned, a flame on its cell, the tree's name and age, trees left, tokens bought.
It opens from the ticker (any tree), from a wallet's record (its own trees, tracked by the engine as
`treeCount` and `trees` on each holder, display only), and from a toast when the connected wallet's own
buy burns a tree. Save, Share (where the browser shares files) or Post on X (text only: X intents take no picture).

## Not done yet

- No token, domain, X account or server yet. `X_URL` in `src/lib/api.ts` is empty. `public/terms.html`
  and `public/privacy.html` say `your-domain.example`.
- Not tested against a live token yet: the buy detection should be checked on the first real buys.

## Launch checklist

1. Launch $PALM on Pons **from the wallet whose key goes into the engine**.
2. Put a little ETH in it for gas.
3. `/lotnok` → CA, key, treasury, admin secret → Save. Check `/api/status` shows the token, an indexed block and `forest`.
4. The first Reward runs once the escrow reaches 0.02 ETH and at least one wallet is eligible.
