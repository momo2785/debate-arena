// app/api/tts/route.ts
export const runtime = "nodejs";

export async function POST(req: Request) {
  const { text, voice = "alloy" } = await req.json();
  if (!process.env.OPENAI_API_KEY) return new Response("Missing OPENAI_API_KEY", { status: 500 });
  if (!text || typeof text !== "string") return new Response("Bad request: missing text", { status: 400 });

  const r = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice,
      input: text,
      format: "mp3",
    }),
  });
  if (!r.ok) return new Response(`TTS error: ${await r.text()}`, { status: 502 });

  const buf = Buffer.from(await r.arrayBuffer());
  return new Response(buf, {
    status: 200,
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
  });
}