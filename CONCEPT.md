# Palm ($PALM) · working name (14 Oct 2026)

A new lore and a new site on the engine of $MENKREP / $HANG (token2). The money mechanics are
unchanged; the engine gains one read-only counter: the forest.

## Lore

**Canopy Island** is an island of old forest, edge to edge. A palm-oil mill sits on its south-west
shore. Every buy of $PALM burns one tree and a palm goes in, in a straight row. The fire front moves
inland from the mill; the map shows loose dark canopy on one side and strict rows of palms on the other.

- **The ten biggest holders own the plantation.** No. 1-5 in the **core** estate, No. 6-10
  in the **outer** estate. **No. 1 holds the torch.**
- **Sell once and you go up in smoke** (the haze). Out for good.
- **Oren**, the last orangutan, lives in the last tree: the cell the fire reaches last. That is the
  dev wallet. It watches, it is never ranked, never paid.
- Every burned tree has a name and an age, worked out from its number: *Ironwood #1,687, 122 yrs old.*
- The forest never grows back. When the last tree burns, Oren's pin is gone and the island is all palm.
- Tagline: **"Every buy burns a tree."** Closing: **"The forest doesn't come back."**
- Voice: deadpan field report. Satire about palm-oil clearing, not a celebration of it; the footer
  says so plainly. Never yield, APY, passive income or promises of value.

| Word on the site | What it is in the engine |
|---|---|
| a tree burns | one buy tx of at least `TREE_MIN_TOKENS` (tokens out of the curve / a pool / a router into a plain wallet) |
| trees left / palms planted | `FOREST_TREES - burned` / `burned` |
| the concession register | the leaderboard |
| the torch | No. 1 |
| core / outer estate | the two reward tiers (No. 1-5 share 70%, No. 6-10 share 30% of every 0.02 ETH Reward) |
| at the forest edge | No. 11-50 |
| waiting at the edge | holding, first buy not old enough yet |
| smoke / the haze | sold: out forever |
| Oren | the dev wallet |
| the mill | the fee escrow and the cycle: Reward, then Treasury, then again |
| the harvest log | every round with its transaction |
| your plot | the wallet check; name and seal set by a signed message |
| seal | the holder's mark (ink, frame, sign, ground: the same 5/5/6/6 counts the engine validates) |
| oldest roots | holders by time held |

Money keeps its plain name: Reward, Treasury.

## Why it works as a meme

- **Every buy is visible.** A buyer watches their own tree catch fire on the map within seconds,
  named, with its age. That is the screenshot people post.
- **Scarcity you can see.** 5,000 trees. The counter only goes one way.
- **A winner and a victim.** The ten plantation owners get paid; Oren's tree is the clock everyone watches.
- **Sellers are punished in public:** they drift off as haze, struck out.

Done: the share card ("I burned an Ebony. 312 years old."). Ideas for later: milestone events at 25/50/75%
cleared; a "last tree" countdown under 100 trees left; an X post from the engine per milestone.

## Mechanics (unchanged)

1. Every 3 seconds the engine reads the Pons fee escrow. When it reaches the next step's size it claims it.
2. **Reward** (0.02 ETH) → ETH straight to the top 10 by balance, by estate and by balance inside each.
3. **Treasury** (0.025 ETH) → the treasury wallet.
4. Again from 2: 44% to the ten, 56% to the treasury over a full loop, shown on the page.

No buyback and no token burn. The only thing that burns is the forest, and it is only a counter.
