// lib/kv.ts
import { Redis } from "@upstash/redis";

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  throw new Error("Missing KV_REST_API_URL or KV_REST_API_TOKEN");
}

const kv = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export async function kvGet<T = unknown>(key: string): Promise<T | null> {
  return (await kv.get<T>(key)) ?? null;
}

export async function kvSet<T = unknown>(key: string, value: T): Promise<void> {
  await kv.set(key, value);
}

export async function kvDel(key: string): Promise<void> {
  await kv.del(key);
}
