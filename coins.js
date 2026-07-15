// Shared between the scheduled refresh job and the on-demand endpoint, so
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
