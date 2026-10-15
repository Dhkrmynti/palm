/** Whole tokens, short: 1.38M, 2.10B, 940. No DOM, so the engine can use it too. */
export function amount(v: string | number, digits = 0) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (!isFinite(n)) return "0";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}
