// app/ask/AskForm.tsx  ← SERVER component (no "use client")
import { pushToQueue } from "../actions/arena";

export const dynamic = "force-dynamic";

export default function AskForm() {
  async function submitQuestion(formData: FormData) {
    "use server";
    const text = String(formData.get("q") ?? "").trim();
    if (text) {
      await pushToQueue(text);          // writes to the same KV queue Admin reads
    }
    // no redirect needed; Admin will revalidate if you added revalidatePath in actions
  }

  return (
    <form action={submitQuestion} className="form">
      <div className="row">
        <input
          className="input"
          name="q"
          placeholder="e.g., Should we colonize Mars?"
          maxLength={200}
          required
        />
        <button className="btn">Submit</button>
      </div>
      <div className="meta">
        <span>Be concise, specific, debateable.</span>
      </div>
    </form>
  );
}
