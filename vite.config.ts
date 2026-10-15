import { defineConfig, loadEnv } from "vite";
import fs from "node:fs";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // SITE_URL from the engine's .env makes link previews absolute, as X and Telegram want them
  const site = (env.SITE_URL || "").replace(/\/$/, "");
  const port = env.PORT || "5041";
  return {
    plugins: [
      react(),
      { name: "site-url", transformIndexHtml: (html: string) => html.replaceAll("__SITE__", /^https?:\/\//.test(site) && !site.includes("your-domain") ? site : "") },
    ],
    server: {
      proxy: { "/api": `http://127.0.0.1:${port}`, "/tree": `http://127.0.0.1:${port}` },
      // node_modules may be a link to another checkout (git worktrees): let the dev server read fonts through it
      fs: { allow: [".", fs.realpathSync("node_modules")] },
    },
  };
});
