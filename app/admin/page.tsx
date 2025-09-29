"use client";
import { useState, useEffect } from "react";
import {
  getArenaSnapshot,
  setQuestion,
  pushToQueue,
  popFromQueue,
  promoteQueueIndex,
  removeFromQueueAt,
  clearQueue,
  setTimers,
  advanceState,
  resetArena,
} from "../actions/arena"; // ✅ one level up from /app/admin/page.tsx

export default function AdminPage() {
  const [snap, setSnap] = useState<any>(null);
  const [newQuestion, setNewQuestion] = useState("");
  const [queueInput, setQueueInput] = useState("");

  useEffect(() => {
    let stop = false;
    async function poll() {
      try {
        const s = await getArenaSnapshot();
        if (!stop) setSnap(s);
      } catch (e) {
        console.error(e);
      }
      if (!stop) setTimeout(poll, 3000);
    }
    poll();
    return () => { stop = true; };
  }, []);

  if (!snap) {
    return (
      <div className="p-6 text-gray-300">
        <h1 className="text-2xl font-bold">AI Debate Arena</h1>
        <p>Loading snapshot…</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 text-gray-200">
      <h1 className="text-2xl font-bold">AI Debate Arena</h1>
      <p className="text-sm opacity-75">Moderator Control Panel</p>

      <div className="p-4 rounded-md border border-gray-700 bg-gray-900">
        <h2 className="font-semibold mb-2">Current State</h2>
        <pre>{JSON.stringify(snap, null, 2)}</pre>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button className="px-4 py-2 bg-yellow-600 rounded"
          onClick={() => setTimers({ startMs: Date.now(), preRoll: 10000, round: 90000, mod: 20000 })}>
          Init Timers (10s/90s/20s)
        </button>
        <button className="px-4 py-2 bg-blue-600 rounded" onClick={() => advanceState()}>
          Advance State →
        </button>
        <button className="px-4 py-2 bg-red-600 rounded" onClick={() => resetArena()}>
          Reset Arena
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 px-3 py-2 rounded bg-gray-800 border border-gray-600"
          placeholder="Type a question to set immediately…"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
        />
        <button className="px-4 py-2 bg-green-600 rounded"
          onClick={() => { if (newQuestion.trim()) { setQuestion(newQuestion.trim()); setNewQuestion(""); } }}>
          Set
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 px-3 py-2 rounded bg-gray-800 border border-gray-600"
          placeholder="Type a question to add to queue…"
          value={queueInput}
          onChange={(e) => setQueueInput(e.target.value)}
        />
        <button className="px-4 py-2 bg-indigo-600 rounded"
          onClick={() => { if (queueInput.trim()) { pushToQueue(queueInput.trim()); setQueueInput(""); } }}>
          Queue +
        </button>
      </div>

      <div className="p-4 rounded-md border border-gray-700 bg-gray-900">
        <h2 className="font-semibold mb-2">Queue ({snap.queue?.length || 0})</h2>
        <ul className="space-y-2">
          {(snap.queue || []).map((q: string, i: number) => (
            <li key={i} className="flex justify-between items-center px-3 py-2 rounded bg-gray-800 border border-gray-600">
              <span>#{i + 1} {q}</span>
              <div className="flex gap-2">
                <button className="px-2 py-1 text-sm bg-purple-600 rounded" onClick={() => promoteQueueIndex(i)}>
                  Promote
                </button>
                <button className="px-2 py-1 text-sm bg-red-600 rounded" onClick={() => removeFromQueueAt(i)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
        {(!snap.queue || snap.queue.length === 0) && <p className="opacity-50">No items in queue.</p>}
        <div className="mt-2 flex gap-2">
          <button className="px-3 py-1 text-sm bg-pink-600 rounded" onClick={() => popFromQueue()}>
            Pop → Set as Current
          </button>
          <button className="px-3 py-1 text-sm bg-red-700 rounded" onClick={() => clearQueue()}>
            Clear Queue
          </button>
        </div>
      </div>
    </div>
  );
}
