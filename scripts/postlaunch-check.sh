#!/bin/sh
# Read-only health check right after launch, run ON the server from the app folder. Sends no transactions.
#   sh scripts/postlaunch-check.sh 0xTOKEN
# Checks the token on chain, the engine's settings, indexing, the forest, the link previews, the
# site through nginx, and shows the latest engine log.
set -u
CA="${1:?usage: sh scripts/postlaunch-check.sh 0xTOKEN}"
APP="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP"
PORT="$(grep '^PORT=' .env | cut -d= -f2)"
SITE="$(grep '^SITE_URL=' .env | cut -d= -f2)"
NAME="${NAME:-palm-engine}"
RPC=https://rpc.mainnet.chain.robinhood.com
ok() { printf '  \033[32mOK\033[0m   %s\n' "$*"; }
bad() { printf '  \033[31mFAIL\033[0m %s\n' "$*"; }
code() { curl -s -m 20 -o /dev/null -w '%{http_code}' "$1"; }

echo "== 1. Token on chain"
len=$(curl -s -m 20 "$RPC" -H 'content-type: application/json' -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_getCode\",\"params\":[\"$CA\",\"latest\"]}" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log((JSON.parse(s).result||"0x").length))')
[ "$len" -gt 10 ] && ok "contract code at $CA" || bad "no contract code at $CA"

echo "== 2. Engine"
curl -s -m 10 "127.0.0.1:$PORT/api/status" > /tmp/palm-status.json
node - "$CA" <<'JS'
const fs = require("fs");
const ca = process.argv[2].toLowerCase();
const d = JSON.parse(fs.readFileSync("/tmp/palm-status.json", "utf8")).data;
const say = (good, m) => console.log(good ? "  \x1b[32mOK\x1b[0m  " : "  \x1b[31mFAIL\x1b[0m", m);
say(d.tokenAddress.toLowerCase() === ca, `engine token = ${d.tokenAddress || "(none)"}`);
say(!!d.walletAddress, `operator wallet = ${d.walletAddress || "(not set)"}`);
say(!!d.treasuryAddress, `treasury = ${d.treasuryAddress || "(not set)"}`);
say(!!d.curveAddress, `curve = ${d.curveAddress || "(not detected yet)"}`);
say(d.lastIndexedBlock > 0, `indexed up to block ${d.lastIndexedBlock}`);
console.log("  ..   escrow", d.escrowETH, "ETH · next", d.cycle.kind, d.cycle.thresholdETH, "ETH · holders", JSON.stringify(d.counts));
JS

echo "== 3. The forest"
curl -s -m 10 "127.0.0.1:$PORT/api/forest" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const f=JSON.parse(s).data;console.log(`  ..   ${f.burned} of ${f.total} trees burned · smallest buy ${f.minTokens} tokens${f.minUSD?` and $${f.minUSD}`:""} · marks ${JSON.stringify(f.marks)}`);for(const b of f.recent.slice(0,5))console.log(`       tree #${b.n} ${b.buyer} ${b.amount} ${b.tx}`);if(!f.burned)console.log("       no tree yet: after the first buys, check each tx above is a buy on the explorer")})'

echo "== 4. Link previews"
[ "$(code "127.0.0.1:$PORT/api/card/site.png")" = 200 ] && ok "site card draws" || bad "site card does not draw (fonts or @napi-rs/canvas?)"
case "$SITE" in https://*) ok "SITE_URL is $SITE" ;; *) bad "SITE_URL is '$SITE': run 'sh scripts/install-server.sh https' so previews use https" ;; esac
grep -q "og:image\" content=\"$SITE/api/card/site.png" dist/index.html && ok "the page's preview points at $SITE" || bad "dist/index.html has no absolute og:image: rebuild after SITE_URL is set (npm run build)"

echo "== 5. Through nginx"
for p in / /api/status /api/forest /api/card/site.png; do c=$(code "$SITE$p"); [ "$c" = 200 ] && ok "$p 200" || bad "$p $c"; done
grep -q 'rh-mode" content="live"' dist/index.html && ok "live mode" || bad "demo mode: sh scripts/site-mode.sh live"

echo "== 6. Buy detection on the real chain (dry run, read only)"
npx tsx scripts/forest-dryrun.ts "$CA" 20000 2>&1 | tail -12

echo "== 7. Engine log (last 15)"
pm2 logs "$NAME" --lines 15 --nostream 2>&1 | tail -15
