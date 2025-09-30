// app/ask/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import Stage, { type Speaker } from "../components/Stage"; // ✅ one level up

/** ===== Types for debate stream ===== */
type StreamEvent =
  | { type: "mod_open"; text: string }
  | { type: "mod_close"; text: string }
  | { type: "turn"; side: Speaker; text: string }
  | { type: "error"; message: string };

export const dynamic = "force-dynamic";

/** ===== Debate stream (NDJSON) ===== */
async function* startDebateStream(topic: string, rounds: number) {
  const res = await fetch("/api/debate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, rounds }),
    cache: "no-store",
  });
  if (!res.ok || !res.body) throw new Error("/api/debate failed");
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line) continue;
      yield JSON.parse(line) as StreamEvent;
    }
  }
}

/** ===== Component ===== */
export default function AskPage() {
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [queueCount, setQueueCount] = useState<number | null>(null);

  const [topic, setTopic] = useState<string>("");
  const [running, setRunning] = useState(false);

  const [proText, setProText] = useState("");
  const [modText, setModText] = useState("");
  const [conText, setConText] = useState("");
  const [speaking, setSpeaking] = useState<Speaker | null>(null);

  /** Submit new question to queue */
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = q.trim();
    if (!text) return;
    if (text.length > 180) {
      setMsg("Please keep questions ≤ 180 characters.");
      return;
    }
    try {
      const r = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        cache: "no-store",
      });
      if (!r.ok) throw new Error(await r.text());
      await r.json();
      setMsg("Added to the queue. Thanks!");
      setQ("");
    } catch {
      setMsg("Added locally (server busy)");
      setQ("");
    }
  }

  /** Start a debate client-side for this viewer */
  async function run(t: string) {
    if (running) return;
    setRunning(true);
    setProText("");
    setConText("");
    setModText("…preparing…");

    try {
      for await (const evt of startDebateStream(t, 3)) {
        if (evt.type === "turn") {
          if (evt.side === "PRO") setProText(evt.text);
          else if (evt.side === "CON") setConText(evt.text);
        } else if (evt.type === "mod_open" || evt.type === "mod_close") {
          setModText(evt.text);
        } else if (evt.type === "error") {
          setModText(`Error: ${evt.message}`);
          break;
        }
      }
    } catch {
      setModText("Error starting debate. Check /api/debate.");
    } finally {
      setRunning(false);
    }
  }

  /** Adopt current question immediately on mount */
  useEffect(() => {
    let gone = false;
    (async () => {
      try {
        const r = await fetch("/api/arena-snapshot", { cache: "no-store" });
        if (!r.ok) return;
        const snap = await r.json();
        setQueueCount(Array.isArray(snap.queue) ? snap.queue.length : 0);
        if (!gone && snap.question && !running) {
          setTopic(snap.question);
          setTimeout(() => run(snap.question), 100);
        }
      } catch {}
    })();
    return () => {
      gone = true;
    };
  }, []);

  /** Keep polling snapshot every 1s */
  useEffect(() => {
    let stop = false;
    async function poll() {
      try {
        const r = await fetch("/api/arena-snapshot", { cache: "no-store" });
        if (r.ok) {
          const snap = await r.json();
          setQueueCount(Array.isArray(snap.queue) ? snap.queue.length : 0);
          if (snap.question && !running) {
            if (topic !== snap.question) setTopic(snap.question);
            setTimeout(() => run(snap.question), 50);
          }
        }
      } catch {}
      if (!stop) setTimeout(poll, 1000);
    }
    poll();
    return () => {
      stop = true;
    };
  }, [running, topic]);

  return (
    <div className="p-6 text-gray-200">
      <h1 className="text-2xl font-bold text-center">Ask the Arena</h1>
      <div className="text-center mb-2">
        Queue size: {queueCount == null ? "—" : queueCount}
      </div>

      <form onSubmit={submit} className="max-w-xl mx-auto mb-4 flex gap-2">
        <input
          className="flex-1 px-3 py-2 rounded bg-gray-800 border border-gray-600"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g., Should we colonize Mars?"
          maxLength={200}
        />
        <button className="px-4 py-2 bg-emerald-600 rounded" disabled={!q.trim()}>
          Submit
        </button>
      </form>

      {msg && (
        <div className="max-w-xl mx-auto mb-6 text-center opacity-80">
          {msg}
        </div>
      )}

      <Stage
        speaking={speaking}
        proText={proText}
        modText={modText}
        conText={conText}
        topic={topic}
      />
    </div>
  );
}
