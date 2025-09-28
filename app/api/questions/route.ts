// app/api/questions/route.ts
import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

type Q = { id: string; text: string; at: number };

const QUEUE_KEY = "question_queue_v1";

/** Quick prefilter (cheap heuristic) */
function badWordHeuristic(s: string) {
  const banned = [
    /\bkill|murder|assassinate|suicide|bomb\b/i,
    /\bslur\b/i,
    /\bsexual|porn|nsfw|explicit|nude|onlyfans\b/i,
    /\brape|molest|incest\b/i,
    /\bgenocide|ethnic cleansing\b/i,
    /\bhate\s*speech|racial slur\b/i,
  ];
  return banned.some((re) => re.test(s));
}

/** OpenAI moderation with fail-open behavior (don’t block if API has an outage) */
async function violatesPolicy(text: string): Promise<boolean> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[questions] OPENAI_API_KEY missing");
    // Fail-OPEN: do NOT block submissions just because the key is missing in prod.
    return false;
  }
  try {
    const r = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: "omni-moderation-latest", input: text }),
    });
    if (!r.ok) {
      console.error("[questions] moderation HTTP", r.status, await r.text());
      return false; // fail-open
    }
    const data = await r.json();
    return Boolean(data?.results?.[0]?.flagged);
  } catch (err) {
    console.error("[questions] moderation error", err);
    return false; // fail-open
  }
}

/** Helpers to interact with KV */
async function listAll(): Promise<Q[]> {
  const items = (await kv.lrange<string>(QUEUE_KEY, 0, -1)) ?? [];
  return items
    .map((s) => {
      try {
        return JSON.parse(s) as Q;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as Q[];
}

async function push(q: Q) {
  await kv.rpush(QUEUE_KEY, JSON.stringify(q));
}

async function removeExactly(json: string) {
  // remove a single occurrence matching the exact serialized item
  await kv.lrem(QUEUE_KEY, 1, json);
}

export async function GET() {
  try {
    const items = await listAll();
    // latest first
    items.sort((a, b) => b.at - a.at);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[questions][GET] KV error", err);
    return NextResponse.json({ error: "KV unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    // ---- Remove a specific item (by id OR exact text) ----
    if (action === "remove") {
      const { id, text } = (body ?? {}) as { id?: string; text?: string };
      if (!id && !text) {
        return NextResponse.json({ error: "id or text required" }, { status: 400 });
      }
      const items = await listAll();
      const target =
        (id && items.find((q) => q.id === id)) ||
        (text && items.find((q) => q.text === text));
      if (!target) {
        return NextResponse.json({ ok: false, remaining: items.length });
      }
      await removeExactly(JSON.stringify(target));
      const remaining = await kv.llen(QUEUE_KEY);
      return NextResponse.json({ ok: true, remaining });
    }

    // ---- Pick a random item and remove it ----
    if (action === "pick") {
      const items = await listAll();
      if (!items.length) {
        return NextResponse.json({ error: "empty" }, { status: 404 });
      }
      const idx = Math.floor(Math.random() * items.length);
      const picked = items[idx];
      await removeExactly(JSON.stringify(picked));
      const remaining = await kv.llen(QUEUE_KEY);
      return NextResponse.json({ picked: picked.text, remaining });
    }

    // ---- Default: add a new question ----
    const text = String(body?.text || "").trim();

    if (!text || text.length < 8) {
      return NextResponse.json({ error: "Question too short." }, { status: 400 });
    }
    if (text.length > 400) {
      return NextResponse.json({ error: "Question too long (max 400 chars)." }, { status: 400 });
    }

    if (badWordHeuristic(text)) {
      return NextResponse.json({ error: "Question rejected by safety filter." }, { status: 400 });
    }
    if (await violatesPolicy(text)) {
      return NextResponse.json({ error: "Question violates content policy." }, { status: 400 });
    }

    const q: Q = { id: crypto.randomUUID(), text, at: Date.now() };
    await push(q);

    const size = await kv.llen(QUEUE_KEY);
    return NextResponse.json({ ok: true, id: q.id, size });
  } catch (err: any) {
    console.error("[questions][POST] error", err);
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
  }
}
