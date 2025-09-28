"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

/* ===================== Styles ===================== */
const css = `
:root{ --bg1:#0b102c; --bg2:#0f172a; --line:#1b2447; --ink:#e5e7eb; --pro:#22c55e; --mod:#a78bfa; --con:#ef4444; }
.stage{ min-height:100vh; color:var(--ink);
  background: radial-gradient(1200px 800px at 50% -200px, #1d2a6b22, transparent 60%), linear-gradient(135deg,var(--bg2),var(--bg1)); }
.container{ max-width:1200px; margin:0 auto; padding:28px 20px 48px; }

/* layout: question dock + main */
.mainGrid{ display:grid; grid-template-columns: 320px 1fr; gap:20px; }
@media (max-width: 980px){ .mainGrid{ grid-template-columns: 1fr; } }

/* controls */
.controls{ display:grid; grid-template-columns:1fr auto; gap:12px; margin-top:12px; }
.input{ padding:12px 14px; border-radius:10px; background:#ffffff14; border:1px solid #ffffff22; color:var(--ink); }
.rounds{ width:80px; }
.btns{ display:flex; gap:8px; margin-top:14px; flex-wrap:wrap; }
.btn{ padding:10px 14px; border-radius:10px; border:0; color:white; font-weight:700; cursor:pointer }
.btn.primary{ background:#6366f1 } .btn.secondary{ background:#ffffff1a }

/* stage */
.grid{ margin-top:20px; display:grid; grid-template-columns:1fr 1fr 1fr; gap:18px; align-items:start; }
.podium{ position:relative; background:linear-gradient(#112044,#0c1635); border:1px solid var(--line);
  border-radius:18px; padding:16px; box-shadow: 0 10px 30px #00000055 inset, 0 10px 30px #00000040; }
.podium.speaking{ box-shadow: 0 0 0 1px var(--line) inset, 0 0 36px currentColor; transform: translateY(-2px); transition: transform .15s, box-shadow .2s; }

.nameplate{ position:absolute; top:-12px; left:14px; font-weight:800; letter-spacing:.5px; font-size:13px; background:#0b102c; border:1px solid var(--line);
  padding:8px 10px; border-radius:10px; display:flex; align-items:center; gap:8px; }
.dot{ width:10px; height:10px; border-radius:50%; }

.speechRow{ display:flex; align-items:center; justify-content:center; gap:16px; }
.speechRow.reverse{ flex-direction: row-reverse; }
.bubble{ background:#0b102c; border:1px solid var(--line); border-radius:12px; padding:12px; position:relative; line-height:1.5; font-size:14px; min-height:56px; color:#cbd5e1 }
.bubble.side:before{ content:""; position:absolute; top:50%; width:12px; height:12px; background:#0b102c; border-left:1px solid var(--line); border-top:1px solid var(--line); transform:translateY(-50%) rotate(45deg); }
.bubble.side.right:before{ right:-6px; } .bubble.side.left:before{ left:-6px; }

.timer{ display:flex; align-items:center; gap:8px; margin-top:10px; font-size:12px; }
.bar{ flex:1; height:6px; background:#1f2937; border-radius:8px; overflow:hidden; }
.fill{ height:100%; transition: width .25s linear; }

/* 2.5D figurine */
.fig3d{ --tiltX:0deg; --tiltY:0deg; position:relative; width:160px; height:220px; border-radius:22px; overflow:hidden;
  transform-style:preserve-3d; background:radial-gradient(120% 100% at 50% 10%,#ffffff12,#0000 60%),linear-gradient(180deg,#111936,#0b102c 70%,#0b0f22);
  border:1px solid #1d274f; box-shadow:0 16px 40px #0008,inset 0 1px 0 #ffffff10,inset 0 -40px 80px #0008;
  transition:transform .25s ease, box-shadow .25s ease; transform:perspective(900px) rotateX(var(--tiltX)) rotateY(var(--tiltY)); }
.fig3d:hover{ box-shadow:0 24px 70px #000a,inset 0 1px 0 #ffffff10,inset 0 -50px 90px #000a; }
.fig3d__img{ position:absolute; inset:0; display:grid; place-items:center; transform:translateZ(30px); filter:drop-shadow(0 20px 24px #0006); }
.fig3d__img :global(img){ width:78%; height:78%; object-fit:contain; }
.fig3d__sheen{ position:absolute; inset:0; pointer-events:none; mix-blend-mode:screen; background:radial-gradient(120% 100% at 30% 0%,#ffffff12,transparent 55%); transform:translateZ(40px); }
.pedestal{ position:absolute; left:50%; bottom:18px; translate:-50% 0; width:120px; height:12px; border-radius:999px;
  background:radial-gradient(120% 120% at 50% 30%,#000,#0a0f24); box-shadow:0 18px 30px #0009 inset,0 8px 30px #0008; transform:translateZ(10px); }
.pedestal:before{ content:""; position:absolute; inset:-4px; border-radius:999px; background:radial-gradient(120% 120% at 50% 20%,currentColor,transparent 60%); filter:blur(10px); opacity:.55; }

/* debug + dock */
.debug{ position:sticky; top:0; z-index:40; margin-bottom:8px; padding:8px 12px; border-radius:10px; border:1px solid #ffffff22; background:#111827aa; backdrop-filter:blur(6px); font-size:12px; }
.debug .tag{ padding:2px 6px; border-radius:6px; background:#ffffff1a; border:1px solid #ffffff22; margin-right:6px; }

.dock{ border:1px solid #ffffff22; border-radius:14px; padding:14px; background:#0b102c; }
.dock h3{ margin:0 0 8px 0; font-size:16px; font-weight:800; }
.dock small{ opacity:.8 }
.dock .row{ display:flex; gap:8px; margin-top:10px; }
.dock .qinput{ flex:1; }
.dock .muted{ font-size:12px; opacity:.8; margin-top:6px; }
`;

/* ===================== Types & helpers ===================== */
type Speaker = "PRO" | "CON" | "MOD";
type StreamEvent =
  | { type: "mod_open"; text: string }
  | { type: "mod_close"; text: string }
  | { type: "turn"; side: Speaker; text: string }
  | { type: "error"; message: string };

type JudgeResult = {
  scores: {
    PRO: { content:number; organization:number; evidence:number; refutation:number; delivery:number; total:number };
    CON: { content:number; organization:number; evidence:number; refutation:number; delivery:number; total:number };
  };
  winner: "PRO"|"CON"|"TIE";
  rationale: string;
};

const wait = (ms:number) => new Promise(res => setTimeout(res, ms));
const SILENT_MP3 =
  "data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

/* ---- Debate stream (NDJSON) ---- */
async function* startDebateStream(topic: string, rounds: number, onStatus?: (s:string)=>void) {
  const res = await fetch("/api/debate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, rounds }),
  });
  onStatus?.(`debate ${res.status}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (!res.body) throw new Error("No body");

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

/* ===================== TTS (singleton + chunked) ===================== */
function getSharedAudio(): HTMLAudioElement {
  // @ts-ignore
  if (!window.__debateAudio) {
    // @ts-ignore
    window.__debateAudio = new Audio();
    // @ts-ignore
    window.__debateAudio.playsInline = true;
    // @ts-ignore
    window.__debateAudio.preload = "auto";
    // @ts-ignore
    window.__debateAudio.volume = 1;
  }
  // @ts-ignore
  return window.__debateAudio as HTMLAudioElement;
}

async function primeAutoplay() {
  try {
    const a = getSharedAudio();
    a.src = SILENT_MP3; a.muted = true;
    const p = a.play().catch(()=>undefined); if (p) await p;
    await new Promise(r=>requestAnimationFrame(r));
    a.muted = false;
  } catch {}
}

// ~150 wpm ≈ 2.5 wps
function getEstimatedSpeechSeconds(text: string) {
  const words = (text.match(/\b\w+\b/g) || []).length;
  return Math.max(8, Math.min(110, Math.round(words / 2.5)));
}

async function speakTTSChunked(
  text: string,
  voice: "alloy"|"verse"|"sage"|"charlie"|"juniper" = "alloy",
  setDebug?: (s:string)=>void,
  { chunkChars = 320, maxClips = 6, perClipMs = 20000 } = {}
): Promise<void> {
  if (!text?.trim()) return;
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const chunks:string[] = [];
  let buf = "";
  for (const s of sentences) {
    if ((buf + " " + s).trim().length > chunkChars) { if (buf) chunks.push(buf.trim()); buf = s; }
    else { buf = (buf ? buf + " " : "") + s; }
  }
  if (buf) chunks.push(buf.trim());
  const limited = chunks.slice(0, maxClips);
  for (let i=0; i<limited.length; i++) {
    const part = limited[i];
    setDebug?.(`TTS clip ${i+1}/${limited.length}`);
    await playClip(part, voice, perClipMs);
    await wait(120);
  }
  async function playClip(line:string, v:string, timeoutMs:number) {
    return new Promise<void>(async (resolve) => {
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: line, voice: v }),
        });
        if (!res.ok) return resolve();
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = getSharedAudio();
        try { audio.pause(); } catch {}
        audio.src = url;
        audio.muted = true;
        const started = audio.play().catch(()=>undefined);
        if (started) await started;
        requestAnimationFrame(()=>{ audio.muted = false; });
        const cleanup = () => { audio.onended=null; audio.onerror=null; URL.revokeObjectURL(url); if (tm) clearTimeout(tm); };
        audio.onended = () => { cleanup(); resolve(); };
        audio.onerror = () => { cleanup(); resolve(); };
        const tm = setTimeout(() => { cleanup(); resolve(); }, timeoutMs);
      } catch { resolve(); }
    });
  }
}

/* ===================== Voices per role ===================== */
function getVoiceFor(side: Speaker) {
  if (side === "PRO") return "alloy" as const;
  if (side === "CON") return "verse" as const;
  return "sage" as const; // MOD
}

/* ===================== Figurine ===================== */
function FigurineCard({
  src, alt, speaking=false, color="var(--mod)"
}:{ src:string; alt:string; speaking?:boolean; color?:string }){
  return (
    <div
      className={`fig3d ${speaking ? "speaking" : ""}`}
      style={{ color } as React.CSSProperties}
      onMouseMove={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--tiltX", `${-py * 6}deg`);
        el.style.setProperty("--tiltY", `${px * 10}deg`);
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.setProperty("--tiltX", "0deg");
        el.style.setProperty("--tiltY", "0deg");
      }}
    >
      <div className="fig3d__img" style={{ position: "absolute", inset: 0 }}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes="160px"
          style={{ objectFit: "contain" }}
          priority
        />
      </div>
      <div className="fig3d__sheen" />
      <div className="pedestal" />
    </div>
  );
}

/* ===================== Queue Monitor (admin) ===================== */
function QueueMonitor({
  onPick,
  onStart,
}: {
  onPick: (q: string) => void;
  onStart?: () => void;
}) {
  const [items, setItems] = useState<{ id?: string; text?: string; question?: string; ts?: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getText = (it: any) => it?.question ?? it?.text ?? "";

  async function refresh() {
    try {
      setLoading(true);
      setError(null);
      const r = await fetch("/api/questions", { cache: "no-store" });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      setItems(Array.isArray(j?.items) ? j.items : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }

  async function pickRandomConsume() {
    try {
      setLoading(true);
      const r = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pick" }),
      });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      const picked = j?.picked;
      if (picked) {
        onPick(picked);
        if (onStart) onStart();
      }
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Pick failed");
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ marginTop: 12, border: "1px solid #ffffff22", borderRadius: 12, padding: 12, background: "#0b102c" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontWeight: 800 }}>Queue Monitor</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn secondary" onClick={refresh} disabled={loading}>Refresh</button>
          <button className="btn primary" onClick={pickRandomConsume} disabled={loading}>Pick Random (consume)</button>
        </div>
      </div>
      <div style={{ fontSize: 12, opacity: .8, marginTop: 6 }}>
        Live items: <b>{items.length}</b> {loading ? " • loading…" : ""} {error ? ` • ${error}` : ""}
      </div>

      <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
        {items.length === 0 && <div style={{ opacity: .7 }}>No pending questions.</div>}
        {items.map((it, idx) => (
          <div key={it.id ?? idx} style={{ border: "1px solid #ffffff22", borderRadius: 10, padding: 10, background: "#0b102c" }}>
            <div style={{ fontSize: 14, lineHeight: 1.4 }}>{getText(it)}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button className="btn secondary" onClick={() => onPick(getText(it))}>Use as Topic</button>
              {onStart && (
                <button className="btn primary" onClick={() => { onPick(getText(it)); onStart(); }}>
                  Use + Start
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===================== Page ===================== */
export default function AdminPanel(){
  const [topic, setTopic] = useState("Should we colonize Mars?");
  const [rounds, setRounds] = useState(3);
  const [running, setRunning] = useState(false);

  const [current, setCurrent] = useState<Speaker|null>(null);
  const [textPRO, setTextPRO] = useState("");
  const [textCON, setTextCON] = useState("");
  const [textMOD, setTextMOD] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [secondsLeft, setSecondsLeft] = useState<number|null>(null);

  const [dbgStream, setDbgStream] = useState("idle");
  const [dbgTTS, setDbgTTS] = useState("-");
  const [dbgErr, setDbgErr] = useState("-");

  // Judge state
  const [judgement, setJudgement] = useState<JudgeResult | null>(null);

  // Question Dock state
  const [queueCount, setQueueCount] = useState(0);
  const [qText, setQText] = useState("");
  const [qMsg, setQMsg] = useState<string | null>(null);
  const [autoRun, setAutoRun] = useState(false);

  // countdown ticker
  useEffect(()=>{
    if (secondsLeft===null) return;
    const id = setInterval(()=> setSecondsLeft(s => (s===null? s : Math.max(0, s-1))), 1000);
    return ()=>clearInterval(id);
  },[secondsLeft]);

  // poll queue size lightly
  useEffect(()=>{
    let stop = false;
    async function poll(){
      try{
        const r = await fetch("/api/questions", { cache: "no-store" });
        const j = await r.json();
        if (!stop) setQueueCount(Array.isArray(j?.items) ? j.items.length : 0);
      }catch{}
      if (!stop) setTimeout(poll, 5000);
    }
    poll();
    return ()=>{ stop = true; };
  },[]);

  // Auto-run when idle
  useEffect(()=>{
    let tid: any;
    async function maybeAuto(){
      if (!autoRun || running) return;
      try {
        const r = await fetch("/api/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "pick" }),
        });
        if (r.ok) {
          const j = await r.json();
          if (j?.picked) {
            setTopic(j.picked);
            setTimeout(()=>run(), 200);
          }
        }
      } catch {}
    }
    tid = setInterval(maybeAuto, 8000);
    return ()=>clearInterval(tid);
  },[autoRun, running]);

  function reset(){
    setRunning(false); setCurrent(null); setSecondsLeft(null);
    setTextPRO(""); setTextCON(""); setTextMOD(""); setLog([]);
    setDbgErr("-"); setDbgStream("idle"); setDbgTTS("-");
    setJudgement(null);
  }

  async function submitQuestion(){
    setQMsg(null);
    try{
      const r = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ text: qText }),
      });
      const j = await r.json();
      if (!r.ok) { setQMsg(j?.error || "Rejected by moderation."); return; }
      setQMsg("Added to queue!");
      setQText("");
      setQueueCount((c)=>c+1);
    }catch(e:any){
      setQMsg("Could not submit question.");
    }
  }

  // --- Moderator judges & announces winner ---
  async function judgeAndAnnounce(finalTranscript: string) {
    try {
      const res = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: finalTranscript }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: JudgeResult = await res.json();
      setJudgement(data);

      const pro = data.scores.PRO.total.toFixed(1);
      const con = data.scores.CON.total.toFixed(1);

      const announcement = `Using standard debate criteria — Content 30%, Organization 15%, Evidence 25%, Refutation 20%, Delivery 10% — the totals are: PRO ${pro}, CON ${con}. The winner is ${data.winner === "TIE" ? "a TIE" : data.winner}. Brief rationale: ${data.rationale}`;

      setCurrent("MOD");
      setTextMOD(announcement);
      setLog(t => [...t, `[MOD] ${announcement}`]);
      await speakTTSChunked(announcement, getVoiceFor("MOD"), (s)=>setDbgTTS(s));
    } catch (e:any) {
      const err = `Judging failed: ${String(e?.message || e)}`;
      setCurrent("MOD");
      setTextMOD(err);
      setLog(t => [...t, `[MOD] ${err}`]);
      await speakTTSChunked("Judging could not be completed due to an error.", getVoiceFor("MOD"), (s)=>setDbgTTS(s));
    }
  }

  async function run(){
    if (running) return;
    await primeAutoplay(); // Safari autoplay allowance
    setRunning(true);
    setJudgement(null);
    setLog([`[MOD] Debate start — Topic: ${topic}. — ${rounds} rounds.`]);
    setDbgStream("connecting"); setDbgErr("-"); setDbgTTS("-");

    try {
      // 10s pre-roll
      setCurrent("MOD"); setTextMOD("Preparing debate…"); setSecondsLeft(10);
      await wait(10000); setSecondsLeft(null);

      for await (const evt of startDebateStream(topic, rounds, s=>setDbgStream(s))) {
        if (evt.type === "mod_open") {
          setCurrent("MOD");
          setTextMOD(evt.text);
          setLog(t=>[...t, `[MOD] ${evt.text}`]);
          setSecondsLeft(getEstimatedSpeechSeconds(evt.text));
          await speakTTSChunked(evt.text, getVoiceFor("MOD"), (s)=>setDbgTTS(s));
          setSecondsLeft(null);

        } else if (evt.type === "turn") {
          setCurrent(evt.side);
          if (evt.side==="PRO") setTextPRO(evt.text);
          if (evt.side==="CON") setTextCON(evt.text);
          setLog(t=>[...t, `[${evt.side}] ${evt.text}`]);
          setSecondsLeft(Math.min(110, getEstimatedSpeechSeconds(evt.text)));
          await speakTTSChunked(evt.text, getVoiceFor(evt.side as Speaker), (s)=>setDbgTTS(s));
          setSecondsLeft(null);

        } else if (evt.type === "mod_close") {
          setCurrent("MOD");
          setTextMOD(evt.text);
          setLog(t=>[...t, `[MOD] ${evt.text}`]);
          setSecondsLeft(getEstimatedSpeechSeconds(evt.text));
          await speakTTSChunked(evt.text, getVoiceFor("MOD"), (s)=>setDbgTTS(s));
          setSecondsLeft(null);

        } else if (evt.type === "error") {
          setCurrent("MOD"); setTextMOD(`Error: ${evt.message}`); setDbgErr(evt.message);
          setLog(t=>[...t, `[ERROR] ${evt.message}`]); setSecondsLeft(null); break;
        }
      }

      // After the stream ends, have MOD judge & announce the winner
      await judgeAndAnnounce(log.join("\n"));

    } catch (e:any) {
      const msg = String(e?.message||e);
      setDbgErr(msg);
      setCurrent("MOD");
      setTextMOD(`Error starting stream: ${msg}`);
      setLog(t=>[...t, `[ERROR] ${msg}`]);
    } finally {
      setCurrent(null); setSecondsLeft(null); setRunning(false);
    }
  }

  return (
    <div className="stage">
      <style>{css}</style>
      <div className="container">
        {/* Debug strip */}
        <div className="debug">
          <span className="tag">stream: {dbgStream}</span>
          <span className="tag">tts: {dbgTTS}</span>
          <span className="tag">err: {dbgErr}</span>
          <button className="btn secondary" onClick={()=>primeAutoplay()}>Prime Autoplay</button>
        </div>

        <h1 style={{fontSize:28, fontWeight:900}}>$VS — Debate Arena</h1>
        <p style={{opacity:.85}}>Audience questions • moderation filter • random queue • auto-run • judging.</p>

        <div className="mainGrid">
          {/* -------- Question Dock -------- */}
          <aside className="dock">
            <h3>Question Dock</h3>
            <small>Submit a motion/question to add to the queue. Unsafe content is auto-blocked.</small>
            <div className="row">
              <input
                className="input qinput"
                value={qText}
                onChange={(e)=>setQText(e.target.value)}
                placeholder="e.g., Should crypto be regulated like banks?"
                maxLength={400}
              />
              <button className="btn primary" onClick={submitQuestion}>Submit</button>
            </div>
            {qMsg && <div className="muted">{qMsg}</div>}

            <div className="row" style={{marginTop:10}}>
              <button
                className="btn secondary"
                onClick={async()=>{
                  const r = await fetch("/api/questions", {
                    method:"POST", headers:{"Content-Type":"application/json"},
                    body: JSON.stringify({ action:"pick" })
                  });
                  if (r.ok) {
                    const j = await r.json();
                    if (j?.picked) { setTopic(j.picked); }
                    setQueueCount(j?.remaining ?? queueCount);
                  }
                }}
              >
                Pick Random
              </button>
              <button className="btn primary" onClick={run} disabled={running}>Start</button>
            </div>

            <div className="muted" style={{marginTop:8}}>
              Queue size: <b>{queueCount}</b>
            </div>

            <div className="muted" style={{marginTop:8, display:"flex", alignItems:"center", gap:8}}>
              <input id="autorun" type="checkbox" checked={autoRun} onChange={(e)=>setAutoRun(e.target.checked)} />
              <label htmlFor="autorun">Auto-run from queue when idle</label>
            </div>

            <hr style={{borderColor:"#ffffff22", opacity:.4, margin:"12px 0"}}/>

            {/* Manual override controls */}
            <div>
              <label style={{fontSize:12, opacity:.8}}>Topic (editable)</label>
              <input className="input" value={topic} onChange={e=>setTopic(e.target.value)} />
              <div className="btns" style={{marginTop:8}}>
                <div>
                  <label style={{fontSize:12, opacity:.8}}>Rounds</label><br/>
                  <input className="input rounds" type="number" min={1} max={6} value={rounds}
                    onChange={e=>setRounds(parseInt(e.target.value||"3"))}/>
                </div>
              </div>
            </div>

            <QueueMonitor
              onPick={(q) => { setTopic(q); }}
              onStart={() => { setTimeout(() => run(), 200); }}
            />
          </aside>

          {/* -------- Debate Stage + Transcript -------- */}
          <main>
            <div className="btns" style={{marginTop:0, marginBottom:6}}>
              <button className="btn primary" onClick={run} disabled={running}>Start</button>
              <button className="btn secondary" onClick={reset}>Reset</button>
            </div>

            <div className="grid">
              <Podium
                label="PRO"
                color="var(--pro)"
                speaking={current === "PRO"}
                secondsLeft={current === "PRO" ? secondsLeft : null}
                text={textPRO}
              />
              <Podium
                label="MOD"
                color="var(--mod)"
                speaking={current === "MOD"}
                secondsLeft={current === "MOD" ? secondsLeft : null}
                text={textMOD}
              />
              <Podium
                label="CON"
                color="var(--con)"
                speaking={current === "CON"}
                secondsLeft={current === "CON" ? secondsLeft : null}
                text={textCON}
              />
            </div>

            <div style={{marginTop:22}}>
              <h2 style={{fontSize:18, fontWeight:800}}>Transcript</h2>
              <textarea
                readOnly
                value={log.join("\n")}
                style={{
                  marginTop:8,
                  width:"100%",
                  height:220,
                  background:"#0b102c",
                  border:"1px solid var(--line)",
                  borderRadius:12,
                  color:"var(--ink)",
                  padding:12,
                  fontFamily:"ui-monospace, SFMono-Regular, Menlo, Monaco"
                }}
              />
            </div>

            {judgement && (
              <div style={{ marginTop: 16, padding: 12, borderRadius: 12, border: "1px solid #ffffff22", background: "#0b102c" }}>
                <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 6 }}>
                  🏆 Winner: <span style={{ color: judgement.winner === "PRO" ? "var(--pro)" : judgement.winner === "CON" ? "var(--con)" : "#e5e7eb" }}>
                    {judgement.winner}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ padding: 10, borderRadius: 10, border: "1px solid #ffffff22", background: "#111827" }}>
                    <div style={{ color: "var(--pro)", fontWeight: 800 }}>PRO — {judgement.scores.PRO.total.toFixed(2)}</div>
                    <small>Content {judgement.scores.PRO.content} • Org {judgement.scores.PRO.organization} • Evidence {judgement.scores.PRO.evidence} • Refutation {judgement.scores.PRO.refutation} • Delivery {judgement.scores.PRO.delivery}</small>
                  </div>
                  <div style={{ padding: 10, borderRadius: 10, border: "1px solid #ffffff22", background: "#111827" }}>
                    <div style={{ color: "var(--con)", fontWeight: 800 }}>CON — {judgement.scores.CON.total.toFixed(2)}</div>
                    <small>Content {judgement.scores.CON.content} • Org {judgement.scores.CON.organization} • Evidence {judgement.scores.CON.evidence} • Refutation {judgement.scores.CON.refutation} • Delivery {judgement.scores.CON.delivery}</small>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

/* ===================== Podium ===================== */
function Podium({
  label, color, speaking, secondsLeft, text,
}:{ label:"PRO"|"CON"|"MOD"; color:string; speaking:boolean; secondsLeft:number|null; text:string; }){
  const bubbleSide = label === "CON" ? "left" : "right";
  const rowClass = `speechRow ${bubbleSide === "left" ? "reverse" : ""}`;
  const bubbleClass = `bubble side ${bubbleSide}`;
  const totalSecs = label === "MOD" ? 20 : 110;
  const imgSrc = label === "PRO" ? "/pro.png" : label === "CON" ? "/con.png" : "/mod.png";

  return (
    <div className={`podium ${speaking ? "speaking":""}`} style={{ color }}>
      <div className="nameplate">
        <span className="dot" style={{background: speaking ? "currentColor" : "#64748b"}}/>
        <span style={{color:"#e5e7eb"}}>{label}</span>
      </div>
      <div className={rowClass} style={{ width: "100%" }}>
        <FigurineCard src={imgSrc} alt={`${label} character`} speaking={speaking} color={color} />
        <div className={bubbleClass} style={{ flex: 1, maxWidth: 280 }}>
          {text ? <span style={{opacity:.95}}>{text}</span> : <span style={{opacity:.6}}>…waiting…</span>}
        </div>
      </div>
      <div className="timer">
        <div style={{ width: 28, textAlign:"right", opacity:.85, color:"#e5e7eb" }}>{secondsLeft ?? ""}</div>
        <div className="bar">
          <div className="fill"
               style={{ width: secondsLeft!==null ? `${Math.max(0, Math.min(100, (secondsLeft/totalSecs)*100))}%` : 0, background: "currentColor" }} />
        </div>
      </div>
    </div>
  );
}
