// app/api/queue/route.ts
import { NextResponse } from "next/server";

// In-memory queue (persists only while server is warm)
type Item = { id: string; question: string; ts: number; ip?: string };
const queue: Item[] = [];

// Simple rate limit by IP (30s)
const windowMs = 30_000;
const ipLast: Record<string, number> = {};

export async function POST(req: Request) {
  const { question } = await req.json().catch(() => ({}));
  if (!question || typeof question !== "string") {
    return NextResponse.json({ error: "Missing question" }, { status: 400 });
  }
  const q = question.trim();
  if (q.length === 0 || q.length > 180) {
    return NextResponse.json({ error: "Invalid length" }, { status: 400 });
  }

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  if (ipLast[ip] && now - ipLast[ip] < windowMs) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }
  ipLast[ip] = now;

  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  queue.push({ id, question: q, ts: now, ip });

  return NextResponse.json({ ok: true, id });
}

// Optional: GET to fetch the queue
export async function GET() {
  return NextResponse.json({ items: [...queue].sort((a, b) => b.ts - a.ts) });
}
