// app/api/arena-queue/route.ts
import { NextResponse } from "next/server";
// RELATIVE path to /lib/kv.ts (this file is 3 folders deep under project root)
import { kvGet, kvSet } from "../../../lib/kv";

const KEY_QUEUE = "arena:queue";

// POST → push a new question into the queue
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = String(body?.text ?? "").trim();
    if (!text) return NextResponse.json({ error: "Empty question" }, { status: 400 });

    const queue: string[] = (await kvGet<string[]>(KEY_QUEUE)) ?? [];
    queue.push(text);
    await kvSet(KEY_QUEUE, queue);

    return NextResponse.json({ ok: true, size: queue.length });
  } catch (err) {
    console.error("POST /api/arena-queue error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET → return current queue
export async function GET() {
  try {
    const queue: string[] = (await kvGet<string[]>(KEY_QUEUE)) ?? [];
    return NextResponse.json({ items: queue, size: queue.length });
  } catch (err) {
    console.error("GET /api/arena-queue error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
