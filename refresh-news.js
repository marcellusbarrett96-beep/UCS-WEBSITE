// Called on a schedule (see vercel.json + README for the external scheduler
// setup) to refresh news for the default coin list into shared storage.
// This is what keeps data current even when nobody has the site open.

import { storeGet, storeSet } from "./_lib/storage.js";
import { DEFAULT_COINS, newsPrompt } from "./_lib/coins.js";
import { callClaudeJSON } from "./_lib/anthropic.js";

function isAuthorized(req) {
  // Vercel's own built-in cron sends this automatically.
  const vercelCronAuth = req.headers["authorization"];
  if (process.env.CRON_SECRET && vercelCronAuth === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }
  // External scheduler (e.g. cron-job.org) sends this custom header instead —
  // set REFRESH_SECRET yourself in Vercel env vars and give the same value
  // to the external scheduler.
  const customSecret = req.headers["x-refresh-secret"] || req.query.secret;
  if (process.env.REFRESH_SECRET && customSecret === process.env.REFRESH_SECRET) {
    return true;
  }
  return false;
}

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const results = [];
  for (const coin of DEFAULT_COINS) {
    try {
      const parsed = await callClaudeJSON(newsPrompt(coin));
      const record = {
        sentiment: parsed.sentiment || "neutral",
        summary: parsed.summary || "",
        headlines: Array.isArray(parsed.headlines) ? parsed.headlines.slice(0, 4) : [],
        fetchedAt: Date.now(),
        status: "ready",
      };
      await storeSet(`news:${coin.ticker}`, record);
      results.push({ ticker: coin.ticker, ok: true });
    } catch (err) {
      console.error(`refresh-news failed for ${coin.ticker}:`, err);
      results.push({ ticker: coin.ticker, ok: false, error: String(err) });
    }
  }

  return res.status(200).json({ refreshedAt: Date.now(), results });
}
