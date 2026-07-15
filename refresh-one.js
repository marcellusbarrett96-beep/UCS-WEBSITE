// Used when a visitor's coin (custom-added, or a default coin whose cache
// somehow expired) isn't in shared storage yet. Fetches live and caches the
// result, so the NEXT visitor (or the same one) gets it from cache instead.

import { storeSet } from "./_lib/storage.js";
import { newsPrompt, profilePrompt } from "./_lib/coins.js";
import { callClaudeJSON } from "./_lib/anthropic.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name, ticker, type } = req.body || {};
  if (!name || !ticker || !["news", "profile"].includes(type)) {
    return res.status(400).json({ error: "Expected { name, ticker, type: 'news'|'profile' }" });
  }
  const coin = { name, ticker: String(ticker).toUpperCase() };

  try {
    if (type === "news") {
      const parsed = await callClaudeJSON(newsPrompt(coin));
      const record = {
        sentiment: parsed.sentiment || "neutral",
        summary: parsed.summary || "",
        headlines: Array.isArray(parsed.headlines) ? parsed.headlines.slice(0, 4) : [],
        fetchedAt: Date.now(),
        status: "ready",
      };
      await storeSet(`news:${coin.ticker}`, record);
      return res.status(200).json(record);
    } else {
      const parsed = await callClaudeJSON(profilePrompt(coin));
      const record = {
        utility: parsed.utility || "",
        marketIntegration: parsed.marketIntegration || "",
        rwaCorrelation: parsed.rwaCorrelation || "",
        generatedAt: Date.now(),
        status: "ready",
      };
      await storeSet(`profile:${coin.ticker}`, record);
      return res.status(200).json(record);
    }
  } catch (err) {
    console.error("refresh-one error:", err);
    return res.status(500).json({ error: String(err) });
  }
}
