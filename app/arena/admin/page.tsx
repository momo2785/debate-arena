// app/arena/admin/page.tsx
import {
  getArenaSnapshot,
  setQuestion,
  pushToQueue,
  popFromQueue,
  setState,
  setTimers,
  resetArena,
  removeFromQueueAt,
  promoteQueueIndex,
  clearQueue,
  advanceState,
  type ArenaState,
} from "../../actions/arena";

export const dynamic = "force-dynamic";

function badgeForState(state: ArenaState) {
  const map: Record<ArenaState, string> = {
    idle: "bg-gray-700",
    pre_roll: "bg-yellow-600",
    round_1: "bg-blue-600",
    round_2: "bg-purple-600",
    mod_wrap: "bg-green-600",
  };
  return map[state] ?? "bg-gray-700";
}

export default async function Admin() {
  const snap = await getArenaSnapshot();

  /* ===== Server actions defined inline (allowed in server components) ===== */
  async function initTimers() {
    "use server";
    await setTimers({ startMs: Date.now(), preRoll: 10_000, round: 90_000, mod: 20_000 });
    await setState("pre_roll");
  }

  async function setQ(formData: FormData) {
    "use server";
    const q = String(formData.get("q") ?? "").trim();
    if (q) await setQuestion(q);
  }

  async function queueQ(formData: FormData) {
    "use server";
    const q = String(formData.get("q2") ?? "").trim();
    if (q) await pushToQueue(q);
  }

  async function nextQ() {
    "use server";
    await popFromQueue();
  }

  async function doRemove(formData: FormData) {
    "use server";
    const i = Number(formData.get("i"));
    if (!Number.isNaN(i)) await removeFromQueueAt(i);
  }

  async function doPromote(formData: FormData) {
    "use server";
    const i = Number(formData.get("i"));
    if (!Number.isNaN(i)) await promoteQueueIndex(i);
  }

  async function doClearQueue() {
    "use server";
    await clearQueue();
  }

  async function doAdvance() {
    "use server";
    await advanceState();
  }

  async function wipe() {
    "use server";
    await resetArena();
  }
  /* ====================================================================== */

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-black text-white">
      <div className="max-w-6xl mx-auto p-6 space-y-6">

        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">AI Debate Arena</h1>
            <p className="text-slate-300">Moderator Control Panel</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${badgeForState(snap.state)}`}>
            State: {snap.state}
          </div>
        </header>

        {/* 🔎 Stage Preview (full-bleed, tall, unsquished) */}
        <section className="-mx-6 md:-mx-10">
          <div className="flex items-center justify-between mb-3 px-6 md:px-10">
            <div className="text-sm uppercase tracking-wide text-slate-400">Stage Preview</div>
            <a
              href="/ask"  // change to "/" if your community page is root
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-300 underline hover:text-white"
            >
              Open full stage →
            </a>
          </div>

          <div className="w-screen">
            <div className="relative rounded-none md:rounded-xl overflow-hidden border-t md:border border-white/10">
              <iframe
                src="/ask"  // change to "/" if your community page is root
                title="Stage Preview"
                className="block w-full h-[90vh] md:h-[96vh]"
                style={{ border: "none" }}
                allow="autoplay; microphone; clipboard-read; clipboard-write"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          </div>
        </section>

        {/* Current question & global controls */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm uppercase tracking-wide text-slate-400">Current Question</div>
              <div className="text-xl font-semibold">{snap.question ?? "—"}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={initTimers}>
                <button className="px-3 py-2 rounded-xl bg-yellow-600/90 hover:bg-yellow-600">
                  Init Timers (10s/90s/20s)
                </button>
              </form>
              <form action={doAdvance}>
                <button className="px-3 py-2 rounded-xl bg-indigo-600/90 hover:bg-indigo-600">
                  Advance State →
                </button>
              </form>
              <form action={wipe}>
                <button className="px-3 py-2 rounded-xl bg-red-600/90 hover:bg-red-600">
                  Reset Arena
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Set / queue inputs */}
        <section className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm uppercase tracking-wide text-slate-400 mb-2">Set current question</div>
            <form action={setQ} className="flex gap-2">
              <input
                name="q"
                placeholder="Type a question to set immediately…"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
              />
              <button className="px-3 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600">Set</button>
            </form>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm uppercase tracking-wide text-slate-400 mb-2">Push question to queue</div>
            <form action={queueQ} className="flex gap-2">
              <input
                name="q2"
                placeholder="Type a question to add to queue…"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
              />
              <button className="px-3 py-2 rounded-xl bg-blue-600/90 hover:bg-blue-600">Queue +</button>
            </form>
          </div>
        </section>

        {/* Queue management */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm uppercase tracking-wide text-slate-400">Queue ({snap.queue.length})</div>
            <div className="flex gap-2">
              <form action={nextQ}>
                <button className="px-3 py-2 rounded-xl bg-purple-600/90 hover:bg-purple-600">
                  Pop → Set as Current
                </button>
              </form>
              <form action={doClearQueue}>
                <button className="px-3 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-600">
                  Clear Queue
                </button>
              </form>
            </div>
          </div>

          {snap.queue.length === 0 ? (
            <div className="text-slate-400">No items in queue.</div>
          ) : (
            <ul className="space-y-2">
              {snap.queue.map((q, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="mt-1 text-xs text-slate-400">#{i + 1}</div>
                  <div className="flex-1">{q}</div>
                  <div className="flex gap-2">
                    <form action={doPromote}>
                      <input type="hidden" name="i" value={i} />
                      <button className="px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-600 text-sm">
                        Promote
                      </button>
                    </form>
                    <form action={doRemove}>
                      <input type="hidden" name="i" value={i} />
                      <button className="px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-sm">
                        Delete
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Debug snapshot */}
        <details className="rounded-2xl border border-white/10 bg-white/5">
          <summary className="cursor-pointer select-none px-5 py-3 text-slate-300">Snapshot (debug)</summary>
          <pre className="px-5 pb-5 text-sm text-slate-200 overflow-auto">
            {JSON.stringify(snap, null, 2)}
          </pre>
        </details>
      </div>
    </main>
  );
}
