// app/arena/admin/page.tsx
export const dynamic = "force-dynamic";

import AdminStageClient from "./AdminStageClient";
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

export default async function AdminPage() {
  const snap = await getArenaSnapshot();

  // Quick server actions
  async function initTimers() {
    "use server";
    await setTimers({ startMs: Date.now(), preRoll: 10_000, round: 90_000, mod: 20_000 });
  }
  async function doAdvance() { "use server"; await advanceState(); }
  async function doReset()   { "use server"; await resetArena(); }

  return (
    <div className="p-6 space-y-6 text-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Debate Arena</h1>
          <p className="text-sm opacity-75">Moderator Control Panel</p>
        </div>
        <span className="px-2 py-1 rounded border border-gray-700 text-xs">
          State: <b>{snap.state ?? "idle"}</b>
        </span>
      </div>

      {/* Stage preview (mirrors community look) */}
      <div className="rounded-xl border border-gray-700 bg-black/30 p-4">
        <AdminStageClient />
      </div>

      {/* Example quick controls */}
      <div className="flex gap-2 flex-wrap">
        <form action={initTimers}><button className="px-4 py-2 bg-yellow-600 rounded">Init Timers</button></form>
        <form action={doAdvance}><button className="px-4 py-2 bg-blue-600 rounded">Advance State →</button></form>
        <form action={doReset}><button className="px-4 py-2 bg-red-600 rounded">Reset Arena</button></form>
      </div>

      {/* Your existing queue/question UI can remain below */}
    </div>
  );
}
