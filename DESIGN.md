---
name: Palm — A walk down Canopy Island
description: "$PALM as one walk down an island: from a satellite pass over the live map, down to the fire line, across the plantation, through the mill and its weighbridge office, into the haze, to the land office, and out to the last tree at night."
colors:
  night: "#07131a (orbit, the last tree)"
  fire-ground: "#140d09 (the fire line, the ticker)"
  plantation: "#1b331f"
  mill: "#1b1715 (coal) with #e8a24a (oil)"
  office: "#6a4529 (wood counter), #8d8a82 (tin roof), #fffaf0 (ticket)"
  haze: "#aba69b → #ddd6c6"
  paper: "#efe8d6 (land office)"
  fire: "#ff5a1f (the one loud colour everywhere)"
  palm: "#c9d86b"
typography:
  display: "Bricolage Grotesque (700, tight tracking)"
  accent: "Instrument Serif italic, for the turn in every headline"
  data: "JetBrains Mono (every number, address, label)"
---

# Palm — a walk down the island

The page is one place, top to bottom, like the other tokens in this folder. Every stop has its own
ground colour and its own drawn thing, and the edge between two stops is drawn too (`src/world/Edges.tsx`):
each edge sits on top of a place, in that place's colour, and rises into the place above it.

| Stop | Section | Ground | The thing drawn | Edge into it |
|---|---|---|---|---|
| 01 Orbit | `Hero.tsx` | night | the live island map (canvas), meter, radio | - |
| (horizon) | `Treeline.tsx` | night → fire ground | forest, fire, palms; the fire stands at the live % cleared | - |
| 02 Fire line | `Story.tsx` `FireLine` | charcoal + ember glow | a green "Do not burn the forest" sign, sprayed over; four wooden boards for the rules | ticker band |
| 03 Plantation | `Board.tsx` | palm green, furrow rows | estate signs (core, outer), concrete stakes, a palm per block sized by holdings | a row of palms |
| 04 Mill | `Mill.tsx` `Mill` | coal | the tank (fee escrow), pipes, two valves (Reward, Treasury), riveted plates | sheds, tank, chimney |
| 05 Weighbridge | `Mill.tsx` `Ledger` | wood counter | a printed weighbridge ticket, one line per round, a PAID stamp | a tin roof |
| 06 Haze | `Mill.tsx` `Haze` | grey haze | sellers as puffs of smoke | billows of smoke |
| 07 Land office | `Plot.tsx` `PlotSection` | paper | a concession certificate with the lookup, a seal stamp | (haze fades into paper) |
| 08 Last tree | `Frame.tsx` `Closing` | night | palms, the last tree with Oren, the moon | old-forest crowns |

## Motion (GSAP + ScrollTrigger + Lenis)
- Orbit: as the hero scrolls away the map zooms toward the fire front and the readouts lift off; the treeline rises.
- Fire line: the sign swings in, the spray X draws itself, the "1 buy = 1 tree" plank slams on; the boards drop in.
- Plantation: the palms of the edge grow up, the estate signs drop, the rows slide in.
- Mill: the tank fills to today's level as you scroll; oil runs down the pipe of the step being filled; its valve turns.
- Weighbridge: the ticket prints out (clip) as you scroll; the stamp slams at the end.
- Haze: clouds drift apart; the puffs rise in and un-blur.
- Land office: the certificate unfolds; the seal stamps.
- Last tree: the moon rises; the headline lifts in.
- Page-wide: a progress line under the bar (palm → fire), the bar hides while you walk down, and the
  journey rail on the left (wide screens) marks the stop you are at with a flame. It stays hidden over the map.
- All of it is off under prefers-reduced-motion.

## The map (`src/map/`)
- `island.ts`: a seeded 112 by 70 grid; land cells sorted into a burn order from the mill, so the front is
  ragged and the last cell is Oren's tree. Ten stakes, No. 1 on the peak.
- `IslandMap.tsx`: a cached base layer (rounded coast, shallow-water glow, canopy in three passes, soil
  furrows under six-frond palms, the mill) and a live layer (the smouldering front, burns going flame →
  ash → palm, soft smoke, the mill's plume, cloud shadows). Pins are HTML over the canvas.

## Rules
- Fire is the one loud colour in every place. Each place has one accent of its own (palm, oil, haze rust).
- Headlines: plain grotesque, then the turn in serif italic.
- No yield or APY language. A satire note at the bottom.
