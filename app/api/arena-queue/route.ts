// app/api/arena-queue/route.ts
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { kvGet, kvSet } from "../../../lib/kv"; // NOTE: relative path

const KEY_QUEUE = "arena:queue";
const KEY_QUESTION = "arena:question";

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

// POST → push a new question into the queue
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = String(body?.text ?? "").trim();
    if (!text) return NextResponse.json({ error: "Empty question" }, { status: 400 });

    const q: string[] = (await kvGet<string[]>(KEY_QUEUE)) ?? [];
    q.push(text);
    await kvSet(KEY_QUEUE, q);

    revalidatePath("/ask");
    revalidatePath("/arena/admin");

    return NextResponse.json({ ok: true, size: q.length });
  } catch (err) {
    console.error("POST /api/arena-queue error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH → { action: "pick" } : pop first item and set as current question
export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");

    if (action !== "pick") {
      return NextResponse.json({ error: "unsupported_action" }, { status: 400 });
    }

    const q: string[] = (await kvGet<string[]>(KEY_QUEUE)) ?? [];
    const picked = q.shift() ?? null;

    // Always write back (so size stays correct)
    await kvSet(KEY_QUEUE, q);
    if (picked) {
      await kvSet(KEY_QUESTION, picked);
    }

    revalidatePath("/ask");
    revalidatePath("/arena/admin");

    return NextResponse.json({ picked, remaining: q.length });
  } catch (err) {
    console.error("PATCH /api/arena-queue error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
