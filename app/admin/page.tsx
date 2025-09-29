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

export const dynamic = "force-dynamic";

export default async function Admin() {
  const snap = await getArenaSnapshot();

  async function initTimers() {
    "use server";
    await setTimers({ startMs: Date.now(), preRoll: 10_000, round: 90_000, mod: 20_000 });
  }

  async function setQ(formData: FormData) {
    "use server";
    const q = String(formData.get("q") ?? "").trim();
    if (q) await setQuestion(q);
  }

  async function addToQueue(formData: FormData) {
    "use server";
    const q = String(formData.get("q2") ?? "").trim();
    if (q) await pushToQueue(q);
  }

  async function popAndSetCurrent() {
    "use server";
    await popFromQueue();
  }

  async function doPromote(formData: FormData) {
    "use server";
    const idx = Number(formData.get("idx"));
    await promoteQueueIndex(idx);
  }

  async function doDelete(formData: FormData) {
    "use server";
    const idx = Number(formData.get("idx"));
    await removeFromQueueAt(idx);
  }

  async function doClearQueue() {
    "use server";
    await clearQueue();
  }

  async function doAdvance() {
    "use server";
    await advanceState();
  }

  async function doReset() {
    "use server";
    await resetArena();
  }

  return (
    <div className="p-6 text-slate-200">
      <style>{`
        .card{background:#0b102c; border:1px solid #1d2447; border-radius:16px; padding:16px;}
        .row{display:flex; gap:12px; align-items:center;}
        .btn{background:#1f2937; border:1px solid #334155; padding:8px 12px; border-radius:10px; font-weight:700;}
        .btn.yellow{ background:#f59e0b; border-color:#d97706; color:#111; }
        .btn.red{ background:#ef4444; border-color:#dc2626; }
        .btn.purple{ background:#7c3aed; border-color:#6d28d9; }
        .btn.green{ background:#10b981; border-color:#059669; }
        .pill{display:inline-flex; gap:8px; align-items:center; padding:6px 10px; border-radius:999px; border:1px solid #334155; background:#0b102c;}
        .input{flex:1; background:#0f172a; color:#e5e7eb; border:1px solid #334155; padding:10px 12px; border-radius:10px;}
        .muted{opacity:.7}
        .grid{display:grid; gap:16px;}
        @media(min-width: 900px){ .grid{ grid-template-columns: 1fr 1fr; } }
      `}</style>

      <h1 className="text-2xl font-extrabold">AI Debate Arena</h1>
      <div className="muted mb-4">Moderator Control Panel</div>

      {/* Stage preview header (optional) */}
      <div className="card mb-6">
        <div className="text-center text-xl font-bold">Ask the Arena</div>
        <div className="text-center muted">Queue size: {snap.queue.length}</div>
      </div>

      {/* Current Question + controls */}
      <div className="card mb-6">
        <div className="row" style={{justifyContent:"space-between"}}>
          <div>
            <div className="muted text-sm uppercase">CURRENT QUESTION</div>
            <div className="text-lg font-semibold">{snap.question ?? "—"}</div>
          </div>
          <div className="row">
            <form action={initTimers}><button className="btn yellow">Init Timers (10s/90s/20s)</button></form>
            <form action={doAdvance}><button className="btn purple">Advance State →</button></form>
            <form action={doReset}><button className="btn red">Reset Arena</button></form>
          </div>
        </div>
      </div>

      {/* Set / Queue forms */}
      <div className="grid mb-6">
        <div className="card">
          <div className="muted text-sm mb-2">SET CURRENT QUESTION</div>
          <form action={setQ} className="row">
            <input name="q" className="input" placeholder="Type a question to set immediately…" />
            <button className="btn green">Set</button>
          </form>
        </div>

        <div className="card">
          <div className="muted text-sm mb-2">PUSH QUESTION TO QUEUE</div>
          <form action={addToQueue} className="row">
            <input name="q2" className="input" placeholder="Type a question to add to queue…" />
            <button className="btn">Queue +</button>
          </form>
        </div>
      </div>

      {/* Queue list */}
      <div className="card">
        <div className="row" style={{justifyContent:"space-between", marginBottom:12}}>
          <div className="muted">QUEUE ({snap.queue.length})</div>
          <div className="row">
            <form action={popAndSetCurrent}><button className="btn purple">Pop → Set as Current</button></form>
            <form action={doClearQueue}><button className="btn red">Clear Queue</button></form>
          </div>
        </div>

        {snap.queue.length === 0 ? (
          <div className="muted">No items in queue.</div>
        ) : (
          <div style={{display:"grid", gap:10}}>
            {snap.queue.map((text, i) => (
              <div key={i} className="row" style={{justifyContent:"space-between"}}>
                <div><span className="pill muted mr-2">#{i+1}</span> {text}</div>
                <div className="row">
                  <form action={doPromote}>
                    <input type="hidden" name="idx" value={i} />
                    <button className="btn green">Promote</button>
                  </form>
                  <form action={doDelete}>
                    <input type="hidden" name="idx" value={i} />
                    <button className="btn red">Delete</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
