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
