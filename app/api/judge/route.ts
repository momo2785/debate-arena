import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json({ error: "missing transcript" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    // Ask OpenAI to grade with classic debate criteria; force strict JSON
    const body = {
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:
            "You are an expert competitive debate judge. Score PRO and CON with traditional metrics and return strict JSON only.",
        },
        {
          role: "user",
          content: `
Judge the debate transcript. Score PRO and CON on 0-10 for each category:

1) Content/Clash (30%)
2) Organization (15%)
3) Evidence & Reasoning (25%)
4) Refutation (20%)
5) Delivery (10%)

Compute weighted totals. Choose winner "PRO" | "CON" | "TIE".
Return JSON:

{
  "scores": {
    "PRO": {"content":0-10,"organization":0-10,"evidence":0-10,"refutation":0-10,"delivery":0-10,"total":0-100},
    "CON": {"content":0-10,"organization":0-10,"evidence":0-10,"refutation":0-10,"delivery":0-10,"total":0-100}
  },
  "winner":"PRO|CON|TIE",
  "rationale":"<=120 words"
}

Transcript:
${transcript}
          `.trim(),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          json_schema: {
            name: "DebateJudgment",
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                scores: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    PRO: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        content: { type: "number" },
                        organization: { type: "number" },
                        evidence: { type: "number" },
                        refutation: { type: "number" },
                        delivery: { type: "number" },
                        total: { type: "number" }
                      },
                      required: ["content","organization","evidence","refutation","delivery","total"]
                    },
                    CON: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        content: { type: "number" },
                        organization: { type: "number" },
                        evidence: { type: "number" },
                        refutation: { type: "number" },
                        delivery: { type: "number" },
                        total: { type: "number" }
                      },
                      required: ["content","organization","evidence","refutation","delivery","total"]
                    }
                  },
                  required: ["PRO","CON"]
                },
                winner: { type: "string", enum: ["PRO","CON","TIE"] },
                rationale: { type: "string" }
              },
              required: ["scores","winner","rationale"]
            }
          }
        }
      }
    };

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const err = await r.text();
      return NextResponse.json({ error: err }, { status: 502 });
    }

    const data = await r.json();
    const text =
      data?.output?.[0]?.content?.[0]?.text ??
      data?.content?.[0]?.text ??
      data?.text ??
      null;

    if (!text) {
      return NextResponse.json({ error: "No JSON returned" }, { status: 502 });
    }

    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}