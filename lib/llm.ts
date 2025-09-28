import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Call the chat model with a system prompt + running transcript.
 */
export async function chat(
  system: string,
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  model = "gpt-4o-mini",
  temperature = 0.7
): Promise<string> {
  const resp = await openai.chat.completions.create({
    model,
    temperature,
    messages: [{ role: "system", content: system }, ...messages],
  });

  return resp.choices[0]?.message?.content?.trim() ?? "";
}