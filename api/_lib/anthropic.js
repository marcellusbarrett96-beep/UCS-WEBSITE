// Runs server-side only. Holds the real API key and does the actual call +
// JSON parsing, shared by the cron refresh job and the on-demand endpoint.

export async function callClaudeJSON(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
      tools: [{ type: "web_search_20250305", name: "web_search" }],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `Anthropic API error ${response.status}`);
  }

  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  const clean = text.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in Claude response");
  return JSON.parse(clean.slice(start, end + 1));// Shared between the scheduled refresh job and the on-demand endpoint, so
// prompts stay identical no matter which path triggers them.

export const DEFAULT_COINS = [
  { name: "XRP", ticker: "XRP" },
  { name: "XDC Network", ticker: "XDC" },
  { name: "Stellar", ticker: "XLM" },
  { name: "Hedera", ticker: "HBAR" },
  { name: "Flare", ticker: "FLR" },
];

export function newsPrompt(coin) {
  return `Search the web for the latest news on the cryptocurrency "${coin.name}" (ticker: ${coin.ticker}) from the last few days — focus on developments, acquisitions, settlements/legal outcomes, partnerships, and overall market sentiment.

Respond with ONLY a raw JSON object, no markdown fences, no preamble, in exactly this shape:
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "summary": "one or two sentence sentiment summary in your own words, under 40 words",
  "headlines": [
    { "title": "short original-wording headline, under 12 words", "source": "publication or site name", "tone": "bullish" | "bearish" | "neutral" }
  ]
}
Include at most 4 headlines, mixing bullish and bearish items if they exist — reflect what's actually being reported, don't force a slant. Never quote source text verbatim; paraphrase everything in your own words.`;
}

export function profilePrompt(coin) {
  return `Explain the cryptocurrency "${coin.name}" (ticker: ${coin.ticker}) for someone learning about utility coins. Search the web if useful to ground this in accurate, current information.

Respond with ONLY a raw JSON object, no markdown fences, no preamble, in exactly this shape:
{
  "utility": "2-4 sentences, plain-language explanation of what real-world problem or use case this coin's underlying network solves, and who uses it",
  "marketIntegration": "2-4 sentences on how this coin/network is positioning itself to integrate into or reshape existing financial market structure — e.g. partnerships with institutions, regulatory strategy, payment rails, settlement systems",
  "rwaCorrelation": "2-4 sentences objectively explaining tokenized real-world assets (RWAs) in general, and specifically how this coin's network relates to or enables RWA tokenization, if it does"
}
Write in your own words, plain and objective, no hype language, no quoted text from sources.`;
}

}
// Vercel KV was discontinued (Dec 2024) — Upstash Redis via the Vercel
// Marketplace is the replacement. This file is the only place that knows
// which storage library is in use, so a future swap only touches one file.

import { Redis } from "@upstash/redis";

// Redis.fromEnv() reads KV_REST_API_URL / KV_REST_API_TOKEN automatically —
// those are the env var names Vercel injects when you connect the Upstash
// integration, even though the product itself is now called "Upstash".
const redis = Redis.fromEnv();

export async function storeGet(key) {
  const value = await redis.get(key);
  return value ?? null;
}

export async function storeSet(key, value) {
  await redis.set(key, value);
}
