import { NextResponse } from "next/server";

type Q = { id: string; text: string; at: number };
const QUEUE: Q[] = []; // in-memory (clears on server restart)

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
  if (!r.ok) {
    // Fail safe: when moderation endpoint fails, reject to be safe
    return true;
  }
  const data = await r.json();
  const flagged = data?.results?.[0]?.flagged ?? false;
  return Boolean(flagged);
}

export async function GET() {
  // List (latest first)
  const items = [...QUEUE].sort((a, b) => b.at - a.at).slice(0, 100);
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const action: string | undefined = body?.action;

    // ---- NEW: delete/remove a specific question from the queue ----
    if (action === "remove") {
      const { id, text } = body as { id?: string; text?: string };

      let removed = false;
      if (id) {
        const i = QUEUE.findIndex((q) => q.id === id);
        if (i >= 0) { QUEUE.splice(i, 1); removed = true; }
      } else if (text) {
        const i = QUEUE.findIndex((q) => q.text === text);
        if (i >= 0) { QUEUE.splice(i, 1); removed = true; }
      }

      return NextResponse.json({
        ok: removed,
        remaining: QUEUE.length,
      });
    }

    // Random pick & pop
    if (action === "pick") {
      if (!QUEUE.length) return NextResponse.json({ error: "empty" }, { status: 404 });
      const idx = Math.floor(Math.random() * QUEUE.length);
      const [q] = QUEUE.splice(idx, 1);
      return NextResponse.json({ picked: q.text, remaining: QUEUE.length });
    }

    // Otherwise treat as "submit"
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
    QUEUE.push(q);
    return NextResponse.json({ ok: true, id: q.id, size: QUEUE.length });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
