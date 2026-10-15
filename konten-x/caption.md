# Palm ($PALM): konten X

| File | Untuk |
|---|---|
| `logo-x.png` | Foto profil X dan logo token di Pons (1080×1080, aman untuk crop bulat) |
| `banner-x.png` | Header X (1500×500, kiri bawah tertutup foto profil) |
| `teaser-5000-trees.png` | Sebelum launch: pulau masih hutan semua, 5.000 pohon |
| `post-1-the-island-burns.mp4` | Post 1 (di-pin): timelapse 24 detik, hutan jadi sawit satu buy demi satu buy |
| `post-3-four-rules.png` | Post 3, empat aturan |
| `post-4-the-plantation.png` | Post 4, sepuluh pemilik kebun (core dan outer estate) |
| `post-5-where-the-fees-go.png` | Post 5, alur fee: Reward lalu Treasury |
| `hook-share-card.png` | Hook: contoh kartu yang didapat tiap pembeli |
| `hook-the-last-tree.png` | Hook: siapa yang membakar pohon terakhir |

Gambar diam dibuat ulang dengan `npx tsx scripts/content.ts`. Video dan screenshot section diambil dari
situs versi demo (`?demo&from=120&pace=45`), jadi semua angka di dalamnya **ilustrasi**, bukan data asli.

`<CA>` dan `<SITE>` diganti setelah launch.

## Domain

Dicek lewat RDAP pada 15 Okt 2026 (pembanding: `pepads.fun` dan `hawkings.fun` terbaca terdaftar). Semua di bawah ini **belum terdaftar**:

- **palmburn.fun** (pilihan pertama: nama token + apa yang terjadi, gampang diketik)
- everybuyburns.fun (persis tagline)
- canopyisland.fun (nama pulau)
- burnpalm.fun, palmisland.fun, palmcoin.fun, burnthepalm.fun, palmrh.fun

Cek sekali lagi di registrar sebelum bayar, karena RDAP tidak menampilkan harga premium.

## Akun X

**Handle:** `@palmburnfun`, kalau dipakai `@palmrh` (pola `@pepadsrh`), lalu `@palm_burn`. Ketersediaan handle belum dicek, X tidak bisa dicek dari sini.

**Nama tampilan:** `Palm $PALM`
**Website:** domain di atas
**Lokasi:** `Canopy Island`

**Bio**, pilih satu:

> Every buy burns a tree. 5,000 trees on Canopy Island and none grow back. The ten biggest holders own the plantation. Sell once and you're smoke. $PALM

> A forest island, cleared one buy at a time. Top ten holders get paid in ETH. Oren lives in the last tree. $PALM on Robinhood Chain

## Posts (bahasa Inggris)

**Teaser** (`teaser-5000-trees.png`)
> Canopy Island. 5,000 trees, old growth, edge to edge.
> Every buy burns one. Nothing grows back.
> $PALM, soon on Pons.

**Post 1, launch, pin** (`post-1-the-island-burns.mp4`)
> $PALM is live.
> Every buy burns a tree on Canopy Island and plants a palm in a straight row. You watch your own tree go up on the map, with its name and age.
> The ten biggest holders who never sell own the plantation and get paid in ETH from the fees.
> Sell once and you go up in smoke.
> CA: <CA>
> <SITE>

**Post 2** (`hook-share-card.png`)
> Every buyer gets a card. Your tree, its name, its age, the moment it burned.
> Post it and the link shows it.
> <SITE>

**Post 3** (`post-3-four-rules.png`)
> Four rules. No regrowth.
> 1. Buy, and a tree burns.
> 2. Hold, and stake a concession.
> 3. The harvest is paid in ETH.
> 4. Sell once, and you're smoke.

**Post 4** (`post-4-the-plantation.png`)
> Ten own the plantation. Everyone else watches.
> No. 1 to 5 in the core estate, No. 6 to 10 in the outer estate. No. 1 holds the torch.
> Ranked by $PALM held. Never sold.

**Post 5** (`post-5-where-the-fees-go.png`)
> Fees in. ETH out.
> Every trade fills the mill. At 0.02 ETH it pays the ten, at 0.025 it pays the treasury, then again. Every round is on chain.

**Hook** (`hook-the-last-tree.png`)
> Oren lives in the last tree.
> Somebody's buy will burn it. Their name stays on the island.

## Post otomatis dari engine

Kalau `X_POST_*` diisi di `.env`, engine sendiri memposting saat pulau melewati 10%, 25%, 50%, 75%, 90%,
saat tersisa 100 pohon, dan saat pohon terakhir terbakar. Tiap post membawa link `/tree/<n>`, jadi kartu
pohon itu tampil sebagai gambarnya. Isi teksnya ada di `bot/xpost.ts` (`markText`).

Aturan: tidak ada janji untung, APY, atau "passive income". Reward tergantung fee trading dan bisa berhenti.
