// Cheap read from shared storage. No AI call happens here — the frontend
// calls this constantly/on-poll, and it costs nothing but a KV lookup.

import { storeGet } from "./_lib/storage.js";

export default async function handler(req, res) {
  const ticker = String(req.query.ticker || "").toUpperCase();
  if (!ticker) return res.status(400).json({ error: "Missing ticker" });

  const [news, profile] = await Promise.all([
    storeGet(`news:${ticker}`),
    storeGet(`profile:${ticker}`),
  ]);

  return res.status(200).json({ news: news || null, profile: profile || null });
}
