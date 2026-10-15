# Deploy Palm ($PALM) ke VPS

Untuk yang punya akses SSH ke VPS. Skripnya **hanya menambah** satu situs nginx untuk domain kamu dan
satu proses pm2 (`palm-engine`, port 5041). Situs dan aplikasi lain yang sudah ada di server **tidak diubah**.

## 1. Masuk ke VPS lalu ambil kodenya

Kode ada di repo public https://github.com/Dhkrmynti/palm, jadi tidak perlu token GitHub.

```sh
ssh root@<IP-VPS>
apt-get install -y git
git clone https://github.com/Dhkrmynti/palm.git /opt/palm
```

## 2. Pasang

```sh
cd /opt/palm
DOMAIN=<domainmu.com> sh scripts/install-server.sh
```

Skrip ini memasang Node 20, nginx, pm2 dan certbot (yang belum ada saja), membuat `.env` engine dengan
`ADMIN_SECRET` acak, menjalankan tes, membangun situs, mendaftarkan situs nginx, lalu menjalankan engine.
Kalau RPC Robinhood diblokir DNS Indonesia, DNS server otomatis dipindah ke DNS-over-TLS.

Skrip berhenti tanpa mengubah apa pun kalau port 80 dipakai aplikasi selain nginx, atau port 5041 sudah
dipakai. Port lain: `PORT=5051 DOMAIN=... sh scripts/install-server.sh`.

## 3. Arahkan domain, lalu HTTPS

Di DNS domain buat dua record A (`@` dan `www`) ke IP VPS. Tunggu sampai `ping <domainmu.com>` menunjuk
ke IP itu, lalu:

```sh
cd /opt/palm && sh scripts/install-server.sh https
```

Langkah ini juga membangun ulang situs, supaya gambar preview link (X, Telegram) memakai alamat https.

## Sebelum launch

- `sh scripts/site-mode.sh demo` membuat semua pengunjung melihat versi demo. `live` untuk balik ke yang asli.
- Uji deteksi buy pakai token Pons **mana saja** yang sudah ada (tidak mengirim apa pun):
  `npx tsx scripts/forest-dryrun.ts 0xTOKEN 20000` lalu cek beberapa tx "tree" di explorer: semuanya harus buy.
- Atur ukuran hutan dan buy minimum di `.env` (lihat README, bagian "Tuning the forest"), lalu
  `pm2 restart palm-engine --update-env`.
- Opsional, posting otomatis ke X: isi `X_POST_*` di `.env` (lihat `.env.example`).

## Setelah token launch di Pons

1. Buka `https://<domainmu.com>/lotnok`, isi CA token, private key wallet creator, alamat treasury, dan
   **ADMIN_SECRET** (ada di `/opt/palm/.env`, jangan dibagikan).
2. `sh scripts/site-mode.sh live`
3. Setelah beberapa buy pertama: `sh scripts/postlaunch-check.sh 0xTOKEN`. Ini cuma membaca, tidak mengirim transaksi.
4. Log engine: `pm2 logs palm-engine`.

## Update berikutnya

```sh
cd /opt/palm && git pull && sh scripts/install-server.sh update
```
