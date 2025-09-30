// @ts-nocheck
// app/arena/admin/page.tsx
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
} from "../../actions/arena";
import AdminStageClient from "./AdminStageClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const snap = await getArenaSnapshot();

  async function doInitTimers() { "use server";
    await setTimers({ startMs: Date.now(), preRoll: 10_000, round: 90_000, mod: 20_000 });
  }
  async function doAdvance() { "use server"; await advanceState(); }
  async function doReset() { "use server"; await resetArena(); }
  async function doSetQuestion(formData: FormData) { "use server";
    const q = String(formData.get("q") ?? "").trim();
    if (q) await setQuestion(q);
  }
  async function doQueue(formData: FormData) { "use server";
    const q2 = String(formData.get("q2") ?? "").trim();
    if (q2) await pushToQueue(q2);
  }
  async function doPop() { "use server"; await popFromQueue(); }
  async function doPromote(formData: FormData) { "use server";
    const idx = Number(formData.get("idx")); if (!Number.isNaN(idx)) await promoteQueueIndex(idx);
  }
  async function doDelete(formData: FormData) { "use server";
    const idx = Number(formData.get("idx")); if (!Number.isNaN(idx)) await removeFromQueueAt(idx);
  }
  async function doClearQueue() { "use server"; await clearQueue(); }

  return (
    <div className="p-6 space-y-6 text-gray-200">
      <h1 className="text-2xl font-bold">AI Debate Arena — Admin</h1>
      <p className="text-sm opacity-75">Monitor & moderate. Uses same stage visual as community.</p>

      {/* Visual Stage (mirrors community look) */}
      <div className="p-4 rounded-md border border-gray-700 bg-gray-900">
        <AdminStageClient />
      </div>

      {/* Current Question */}
      <div className="p-4 rounded-md border border-indigo-600 bg-gray-900">
        <h2 className="font-semibold mb-2 text-indigo-400">Current Question</h2>
        {snap.question ? <p className="text-lg">{snap.question}</p> : <p className="opacity-50">No active question.</p>}
      </div>

      {/* Controls */}
      <div className="flex gap-2 flex-wrap">
        <form action={doInitTimers}><button className="px-4 py-2 bg-yellow-600 rounded">Init Timers (10s/90s/20s)</button></form>
        <form action={doAdvance}><button className="px-4 py-2 bg-blue-600 rounded">Advance State →</button></form>
        <form action={doReset}><button className="px-4 py-2 bg-red-600 rounded">Reset Arena</button></form>
      </div>

      {/* Set current question */}
      <form action={doSetQuestion} className="flex gap-2">
        <input name="q" type="text" className="flex-1 px-3 py-2 rounded bg-gray-800 border border-gray-600" placeholder="Type a question to set immediately…" />
        <button className="px-4 py-2 bg-green-600 rounded">Set</button>
      </form>

      {/* Push to queue */}
      <form action={doQueue} className="flex gap-2">
        <input name="q2" type="text" className="flex-1 px-3 py-2 rounded bg-gray-800 border border-gray-600" placeholder="Type a question to add to queue…" />
        <button className="px-4 py-2 bg-indigo-600 rounded">Queue +</button>
      </form>

      {/* Queue display */}
      <div className="p-4 rounded-md border border-gray-700 bg-gray-900">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">Queue ({snap.queue?.length || 0})</h2>
          <div className="flex gap-2">
            <form action={doPop}><button className="px-3 py-1 text-sm bg-pink-600 rounded">Pop → Set as Current</button></form>
            <form action={doClearQueue}><button className="px-3 py-1 text-sm bg-red-700 rounded">Clear Queue</button></form>
          </div>
        </div>

        {(!snap.queue || snap.queue.length === 0) ? (
          <p className="opacity-50">No items in queue.</p>
        ) : (
          <ul className="space-y-2">
            {(snap.queue || []).map((q, i) => (
              <li key={i} className="flex justify-between items-center px-3 py-2 rounded bg-gray-800 border border-gray-600">
                <span><span className="opacity-60 mr-2">#{i + 1}</span>{q}</span>
                <div className="flex gap-2">
                  <form action={doPromote}><input type="hidden" name="idx" value={i} /><button className="px-2 py-1 text-sm bg-purple-600 rounded">Promote</button></form>
                  <form action={doDelete}><input type="hidden" name="idx" value={i} /><button className="px-2 py-1 text-sm bg-red-600 rounded">Delete</button></form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
