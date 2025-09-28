// app/api/debate/route.ts
import type { NextRequest } from "next/server";

export const runtime = "nodejs"; // use "edge" if you prefer

type Speaker = "PRO" | "CON" | "MOD";

function ndjsonEncoder(controller: ReadableStreamDefaultController) {
  return (obj: any) => {
    controller.enqueue(new TextEncoder().encode(JSON.stringify(obj) + "\n"));
  };
}

function sysPromptFor(side: Speaker) {
  if (side === "MOD") {
    return [
      "You are a neutral debate moderator.",
      "Tone: concise, impartial, TV-moderator vibe.",
      "You never argue either side.",
    ].join(" ");
  }
  if (side === "PRO") {
    return [
      "You argue the PRO side.",
      "Debate like a skilled policy debater: claim → warrant → evidence → impact.",
      "Always engage with the opponent's last points. Avoid repeating your own earlier material except to set up a refutation.",
      "Use plain language; keep it punchy; no lists unless natural.",
    ].join(" ");
  }
  return [
    "You argue the CON side.",
    "Debate like a skilled policy debater: refute their claims, present counters, weigh impacts.",
    "Always engage with the opponent's last points. Avoid repeating your own earlier material except to set up a refutation.",
    "Use plain language; keep it punchy; no lists unless natural.",
  ].join(" ");
}

function turnInstruction(side: Speaker, topic: string, round: number, totalRounds: number) {
  const secs = 90; // matches your UI pacing
  const targetWords = 190; // ~ 90s spoken at ~125–150wpm; we’ll keep it tight
  if (side === "MOD") {
    if (round === 0) {
      return [
        `Open the debate on: “${topic}”.`,
        "Briefly set the stage and the rules (90s per turn, respectful rebuttals).",
        "Do NOT include the word 'Moderator:'; speak plainly in 1 short paragraph.",
      ].join(" ");
    }
    if (round === totalRounds) {
      return [
        "Close the debate with a quick, neutral wrap-up.",
        "Highlight 1–2 main points from each side (no judgement).",
        "Do NOT include the word 'Moderator:'. 1 short paragraph only.",
      ].join(" ");
    }
    return "Keep neutral timing cues VERY brief. Do NOT include 'Moderator:'.";
  }
  return [
    `Round ${round} of ${totalRounds}.`,
    `Timebox yourself to roughly ${secs} seconds (~${targetWords} words).`,
    "Start by directly addressing the opponent’s most recent claims, then present your best new material.",
    "No ad hominem, no strawmen. Avoid repeating earlier arguments verbatim.",
    "Write as one cohesive paragraph (no headings).",
  ].join(" ");
}

async function callOpenAI(messages: Array<{ role: "system" | "user"; content: string }>) {
  // Minimal, reliable chat call (non-stream) so we can NDJSON per turn.
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",     // adjust to your model
      temperature: 0.9,          // a bit creative for varied phrasing
      max_tokens: 600,           // enough for ~200 words
      messages,
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content?.trim() || "";
  return text;
}

export async function POST(req: NextRequest) {
  const { topic, rounds = 3 } = await req.json().catch(() => ({ topic: "", rounds: 3 }));
  if (!topic || typeof topic !== "string") {
    return new Response("Missing topic", { status: 400 });
  }
  const totalRounds = Math.max(1, Math.min(6, Number(rounds) || 3));

  const stream = new ReadableStream({
    async start(controller) {
      const send = ndjsonEncoder(controller);
      try {
        // Running transcript we’ll keep appending to
        const transcript: string[] = [];

        // ---------- Moderator opening ----------
        {
          const sys = sysPromptFor("MOD");
          const user = [
            turnInstruction("MOD", topic, 0, totalRounds),
            "Keep it to 1 short paragraph.",
          ].join("\n\n");
          const text = await callOpenAI([
            { role: "system", content: sys },
            { role: "user", content: user },
          ]);
          transcript.push(`[MOD] ${text}`);
          send({ type: "mod_open", text });
        }

        // ---------- Rounds ----------
        // Each round = PRO then CON (both see context + opponent last)
        for (let r = 1; r <= totalRounds; r++) {
          // PRO
          {
            const sys = sysPromptFor("PRO");
            const context = [
              `Topic: ${topic}`,
              "Transcript so far:",
              transcript.join("\n"),
              "",
              "Opponent's most recent points (if any) are above—address them explicitly.",
            ].join("\n");
            const user = turnInstruction("PRO", topic, r, totalRounds);
            const text = await callOpenAI([
              { role: "system", content: sys },
              { role: "user", content: context },
              { role: "user", content: user },
            ]);
            transcript.push(`[PRO] ${text}`);
            send({ type: "turn", side: "PRO", text });
          }

          // CON
          {
            const sys = sysPromptFor("CON");
            const context = [
              `Topic: ${topic}`,
              "Transcript so far:",
              transcript.join("\n"),
              "",
              "Opponent's most recent points (PRO) are above—address them explicitly.",
            ].join("\n");
            const user = turnInstruction("CON", topic, r, totalRounds);
            const text = await callOpenAI([
              { role: "system", content: sys },
              { role: "user", content: context },
              { role: "user", content: user },
            ]);
            transcript.push(`[CON] ${text}`);
            send({ type: "turn", side: "CON", text });
          }
        }

        // ---------- Moderator close ----------
        {
          const sys = sysPromptFor("MOD");
          const context = [
            `Topic: ${topic}`,
            "Transcript so far:",
            transcript.join("\n"),
          ].join("\n");
          const user = turnInstruction("MOD", topic, totalRounds, totalRounds);
          const text = await callOpenAI([
            { role: "system", content: sys },
            { role: "user", content: context },
            { role: "user", content: user },
          ]);
          transcript.push(`[MOD] ${text}`);
          send({ type: "mod_close", text });
        }

        controller.close();
      } catch (e: any) {
        send({ type: "error", message: String(e?.message || e) });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
