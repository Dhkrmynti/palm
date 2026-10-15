/**
 * Dry run of the forest against a real token: reads its Transfer logs and prints which ones would burn
 * a tree and why the others would not, with the same rules as the engine (bot/forest.ts). Read only:
 * sends nothing, writes nothing, touches no engine state.
 *
 *   npx tsx scripts/forest-dryrun.ts 0xTOKEN [blocks=20000] [minTokens=10000] [sink,sink…]
 *
 * Any Pons token works for checking the buy detection before $PALM exists. Run it on the server:
 * Indonesian ISPs block the Robinhood RPC.
 */
import { ethers } from "ethers";
import { freshForest, recordTree, whyNotATree, type BuyRules } from "../bot/forest";
import { UNISWAP_V4_UNIVERSAL_ROUTER } from "../bot/uniswap-v4";

const [ca, blocksArg = "20000", minArg = "10000", sinksArg = ""] = process.argv.slice(2);
if (!ethers.isAddress(ca ?? "")) {
  console.error("usage: npx tsx scripts/forest-dryrun.ts 0xTOKEN [blocks] [minTokens] [extra sinks]");
  process.exit(1);
}
const RPC = process.env.RPC_URL || "https://rpc.mainnet.chain.robinhood.com";
const provider = new ethers.JsonRpcProvider(RPC);
const lc = (a: string) => a.toLowerCase();
const TRANSFER = ethers.id("Transfer(address,address,uint256)");
const token = new ethers.Contract(ca, ["function decimals() view returns (uint8)", "function curve() view returns (address)", "function symbol() view returns (string)"], provider);

const code = new Map<string, boolean>();
const isContract = async (a: string) => {
  if (!code.has(a)) code.set(a, (await provider.getCode(a)) !== "0x");
  return code.get(a)!;
};

async function main() {
  const [decimals, symbol, curve, head] = await Promise.all([
    token.decimals().then(Number).catch(() => 18),
    token.symbol().catch(() => "?"),
    token.curve().then(lc).catch(() => ""),
    provider.getBlockNumber(),
  ]);
  const from = Math.max(0, head - parseInt(blocksArg, 10));
  console.log(`${symbol} ${ca} · decimals ${decimals} · curve ${curve || "(none)"} · blocks ${from}..${head}`);

  const sinks = new Set([curve, ...sinksArg.split(",").map((s) => lc(s.trim()))].filter(Boolean));
  const rules: BuyRules = {
    minUnits: ethers.parseUnits(minArg, decimals),
    decimals,
    excluded: new Set([lc(ca)]),
    sinks,
    router: lc(UNISWAP_V4_UNIVERSAL_ROUTER),
    dead: "0x000000000000000000000000000000000000dead",
    isRelay: () => false,
    isContract,
  };

  const logs: ethers.Log[] = [];
  for (let a = from; a <= head; a += 5000) {
    logs.push(...(await provider.getLogs({ address: ca, topics: [TRANSFER], fromBlock: a, toBlock: Math.min(head, a + 4999) })));
  }
  const f = freshForest();
  const why = new Map<string, number>();
  let shown = 0;
  for (const l of logs) {
    const src = lc(ethers.getAddress("0x" + l.topics[1].slice(26)));
    const dst = lc(ethers.getAddress("0x" + l.topics[2].slice(26)));
    const value = BigInt(l.data);
    if (src === ethers.ZeroAddress) continue;
    const no = await whyNotATree(f, Number.MAX_SAFE_INTEGER, { src, dst, value, tx: l.transactionHash }, rules);
    if (no) {
      why.set(no, (why.get(no) || 0) + 1);
      continue;
    }
    const { n } = recordTree(f, Number.MAX_SAFE_INTEGER, { buyer: dst, amount: value.toString(), t: 0, tx: l.transactionHash });
    if (shown++ < 25) console.log(`  tree #${n}  ${dst}  ${ethers.formatUnits(value, decimals)}  ${l.transactionHash}`);
  }
  console.log(`\n${logs.length} transfers · ${f.burned} would burn a tree`);
  for (const [k, v] of [...why].sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(6)}  ${k}`);
  console.log("\nCheck a few tree txs on the explorer: each should be a buy. Anything else is a bug to report.");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
