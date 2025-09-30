// app/api/arena-snapshot/route.ts
import { NextResponse } from "next/server";
import { kvGet } from "../../../lib/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEYS = {
  question: "arena:question",
  state: "arena:state",
  queue: "arena:queue",
} as const;

export async function GET() {
  try {
    const [question, state, queue] = await Promise.all([
      kvGet<string>(KEYS.question),
      kvGet<string>(KEYS.state),
      kvGet<string[]>(KEYS.queue),
    ]);

    return NextResponse.json({
      question: question ?? null,
      state: state ?? "idle",
      queue: Array.isArray(queue) ? queue : [],
    });
  } catch (e) {
    // Return a safe payload so the client can keep polling
    return NextResponse.json(
      { question: null, state: "idle", queue: [], error: String(e) },
      { status: 200 }
    );
  }
}
