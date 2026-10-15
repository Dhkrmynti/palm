/**
 * Posting the forest's big moments to the project's X account. Off unless all four keys are set
 * (an X developer app with read and write access, and the access token of the project account):
 *   X_POST_API_KEY, X_POST_API_SECRET, X_POST_ACCESS_TOKEN, X_POST_ACCESS_SECRET
 * Each post carries the link to the tree's page, whose preview is the tree's share card.
 */
import crypto from "crypto";
import { log } from "./store";
import { MARKS, type Mark } from "./forest";

const keys = () => ({
  key: process.env.X_POST_API_KEY || "",
  secret: process.env.X_POST_API_SECRET || "",
  token: process.env.X_POST_ACCESS_TOKEN || "",
  tokenSecret: process.env.X_POST_ACCESS_SECRET || "",
});

export const xPostEnabled = () => Object.values(keys()).every(Boolean);

const enc = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());

/** The OAuth 1.0a header for a JSON POST (the body is not part of the signature). */
export function oauthHeader(method: string, url: string, k = keys(), nonce = crypto.randomBytes(16).toString("hex"), ts = Math.floor(Date.now() / 1000).toString(), signed: Record<string, string> = {}) {
  const params: Record<string, string> = {
    oauth_consumer_key: k.key,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: ts,
    oauth_token: k.token,
    oauth_version: "1.0",
  };
  const all = { ...signed, ...params };
  const base = [method.toUpperCase(), enc(url), enc(Object.keys(all).sort().map((p) => `${enc(p)}=${enc(all[p])}`).join("&"))].join("&");
  params.oauth_signature = crypto.createHmac("sha1", `${enc(k.secret)}&${enc(k.tokenSecret)}`).update(base).digest("base64");
  return "OAuth " + Object.keys(params).sort().map((p) => `${enc(p)}="${enc(params[p])}"`).join(", ");
}

/** The words for a moment. `link` is the tree's page. */
export function markText(m: Mark, n: number, total: number, link: string) {
  const left = Math.max(0, total - n).toLocaleString("en-US");
  const tree = `Tree #${n.toLocaleString("en-US")}`;
  switch (m) {
    case "last100":
      return `100 trees left on Canopy Island. ${tree} just burned. Oren is watching the fire come. $PALM\n${link}`;
    case "gone":
      return `The last tree on Canopy Island burned. ${tree}. Oren's tree is gone and the island is all palm. The forest doesn't come back. $PALM\n${link}`;
    default:
      return `${m} of Canopy Island is cleared. ${tree} just burned, ${left} trees left. Every buy burns a tree. $PALM\n${link}`;
  }
}

export async function postText(text: string) {
  const url = "https://api.x.com/2/tweets";
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: oauthHeader("POST", url), "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`X ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

export async function postMark(m: Mark, n: number, total: number) {
  if (!MARKS.includes(m) || !xPostEnabled()) return;
  const site = (process.env.SITE_URL || "").replace(/\/$/, "");
  if (!/^https:\/\//.test(site)) return log("warn", `Not posting the ${m} mark: SITE_URL is not an https address yet.`);
  await postText(markText(m, n, total, `${site}/tree/${n}`));
  log("info", `Posted the ${m} mark to X.`);
}
