// app/api/questions/route.ts
import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

type Q = { id: string; text: string; at: number };

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

async function isDisallowedByModeration(text: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");
  const r = await fetch("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "omni-moderation-latest", input: text }),
  });
  if (!r.ok) return true;
  const data = await r.json();
  return Boolean(data?.results?.[0]?.flagged);
}

// GET: return latest 100
export async function GET() {
  const items = (await kv.lrange<Q>("questions", 0, 99)) || [];
  return NextResponse.json({ items });
}

// POST: add, pick, or remove
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "pick") {
      const items = (await kv.lrange<Q>("questions", 0, -1)) || [];
      if (!items.length) return NextResponse.json({ error: "empty" }, { status: 404 });
      const idx = Math.floor(Math.random() * items.length);
      const picked = items[idx];
      // Remove picked by id
      await kv.lrem("questions", 1, JSON.stringify(picked));
      return NextResponse.json({ picked: picked.text, remaining: items.length - 1 });
    }

    if (action === "remove") {
      const { id, text } = body as { id?: string; text?: string };
      const items = (await kv.lrange<Q>("questions", 0, -1)) || [];
      let removed = false;
      for (const it of items) {
        if ((id && it.id === id) || (text && it.text === text)) {
          await kv.lrem("questions", 1, JSON.stringify(it));
          removed = true;
          break;
        }
      }
      return NextResponse.json({ ok: removed });
    }

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
    if (await isDisallowedByModeration(text)) {
      return NextResponse.json({ error: "Question violates content policy." }, { status: 400 });
    }

    const q: Q = { id: crypto.randomUUID(), text, at: Date.now() };
    await kv.rpush("questions", JSON.stringify(q));
    return NextResponse.json({ ok: true, id: q.id });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
