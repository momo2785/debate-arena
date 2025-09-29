"use client";
import React, { useEffect, useRef, useState } from "react";

/* ================= Styling ================= */
const css = `
:root{
  --bg1:#0b102c; --bg2:#0f172a; --line:#1d2447; --ink:#e5e7eb;
  --pro:#22c55e; --mod:#a78bfa; --con:#ef4444;
  --avatar: 180px;
}
.page{ min-height:100vh; color:var(--ink);
  background: radial-gradient(1200px 800px at 50% -200px, #1d2a6b22, transparent 60%), linear-gradient(135deg,var(--bg2),var(--bg1));
  position:relative; }
.wrap{ max-width:1200px; margin:0 auto; padding:28px 18px 56px; position:relative; z-index:1; }
.h1{ font-size:28px; font-weight:900; margin:0; text-align:center; }
.sub{ text-align:center; opacity:.85; margin-top:4px; }

/* Ask form */
.form{ margin:16px auto 0; max-width:820px; padding:14px; border:1px solid #ffffff22; background:#0b102c99; border-radius:18px;
  box-shadow:0 10px 30px #0005 inset, 0 10px 30px #0004; }
.row{ display:flex; gap:10px; }
.input{ flex:1; padding:12px 14px; border-radius:12px; border:1px solid #ffffff22; background:#10183a; color:var(--ink); }
.btn{ padding:12px 16px; border-radius:12px; border:0; color:#fff; font-weight:800; background:#10b981; cursor:pointer; }
.btn[disabled]{ opacity:.5; cursor:not-allowed; }
.meta{ display:flex; justify-content:space-between; font-size:12px; opacity:.75; margin-top:6px; }
.ok{ color:#34d399; margin-top:8px; font-size:14px; }
.err{ color:#fda4af; margin-top:8px; font-size:14px; }

/* Stage */
.stage{ margin:28px auto 0; max-width:1200px; }
.grid{ display:grid; grid-template-columns: repeat(3, minmax(280px, 1fr)); gap:28px; align-items:start; justify-items:center; }
@media (max-width: 1100px){ .grid{ grid-template-columns:1fr; } }

/* Card */
.card{ position:relative; width:100%; max-width: 440px; border:1px solid var(--line);
  border-radius:18px; background:linear-gradient(#0c1635,#0b102c); box-shadow: 0 10px 30px #0006 inset; padding:16px 16px 18px; }
.badge{ position:absolute; top:-12px; left:14px; font-weight:900; letter-spacing:.6px; font-size:12px; text-transform:uppercase;
  background:#0b102c; border:1px solid #ffffff22; color:#e5e7eb; padding:7px 10px; border-radius:10px; display:inline-flex; gap:8px; align-items:center; }
.dot{ width:10px; height:10px; border-radius:50%; background:#64748b; }
.card.speaking .dot{ background:currentColor; }

/* Avatar + balloon */
.stack{ display:flex; flex-direction:column; align-items:center; gap:14px; width:100%; }
.figure{ width:var(--avatar); height:var(--avatar); min-width:var(--avatar); min-height:var(--avatar);
  border-radius:20px; border:1px solid #1d274f; background:linear-gradient(180deg,#111936,#0b102c 70%);
  display:grid; place-items:center; overflow:hidden; box-shadow:0 12px 28px #0007, inset 0 1px 0 #ffffff10; }
.figure img{ display:block; width:100%; height:100%; object-fit:contain; filter:drop-shadow(0 12px 16px #0006); }

.balloon{ position:relative; width:100%; color:#dbe3f5; line-height:1.65; font-size:17px; min-height:74px;
  background:#0b102c; border:2px solid currentColor; border-radius:18px; padding:16px 18px;
  box-shadow: 0 8px 20px #0007, inset 0 1px 0 #ffffff08; }
.balloon.tail-up:before{ content:""; position:absolute; left:50%; top:0; transform:translate(-50%, -100%);
  width:0; height:0; border:12px solid transparent; border-bottom-color: currentColor;
  filter:drop-shadow(0 2px 1px rgba(0,0,0,.3)); }

/* Backdrop */
.backdrop{ position:absolute; inset:0; pointer-events:none; z-index:0; }
.lights{ position:absolute; inset:0;
  background: radial-gradient(900px 520px at 18% -8%, rgba(99,102,241,0.28), transparent 60%),
              radial-gradient(900px 520px at 82% -8%, rgba(16,185,129,0.28), transparent 60%),
              radial-gradient(700px 380px at 50% -10%, rgba(255,255,255,0.10), transparent 60%);
  mix-blend-mode:screen; }
.audience{ position:absolute; left:0; right:0; bottom:0; height:34vh;
  background:radial-gradient(120% 80% at 50% 120%, rgba(8,12,28,0.95), rgba(8,12,28,0.80) 40%, transparent 62%),
             linear-gradient(to top, rgba(2,6,23,0.96) 0%, rgba(2,6,23,0.88) 52%, rgba(2,6,23,0.0) 100%); }
`;

/* ================= Types ================= */
type Speaker = "PRO" | "CON" | "MOD";
type StreamEvent =
  | { type: "mod_open"; text: string }
  | { type: "mod_close"; text: string }
  | { type: "turn"; side: Speaker; text: string }
  | { type: "error"; message: string };

/* ================= NDJSON from /api/debate ================= */
async function* startDebateStream(topic: string, rounds: number) {
  const res = await fetch("/api/debate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, rounds }),
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

/* ================= Web Audio + TTS ================= */
let __ctx: AudioContext | null = null;
let __gain: GainNode | null = null;
function getCtx(): AudioContext {
  if (!__ctx) {
    __ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    __gain = __ctx.createGain();
    __gain.gain.value = 1;
    __gain.connect(__ctx.destination);
  }
  return __ctx;
}
async function resumeCtx() {
  const ctx = getCtx();
  if (ctx.state !== "running") { try { await ctx.resume(); } catch {} }
}

type Clip = { buffer: AudioBuffer; durationMs: number };

const HARD_MAX_MS = 150_000;
const EXTRA_BUFFER_MS_MOD = 2000;
const EXTRA_BUFFER_MS_PARTY = 20000;
const SCHEDULE_LEAD_S = 0.05;
const FIRST_MOD_CUSHION_S = 0.12;

function estimateMs(text: string) {
  const words = (text.match(/\b\w+\b/g) || []).length;
  return Math.min(HARD_MAX_MS, Math.max(1500, Math.round((words / 2.5) * 1000)));
}

async function prefetchTTSBuffer(text: string, voice: string): Promise<Clip> {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice, hints: { gender: "male" } }),
  });
  if (!res.ok) throw new Error("tts failed");
  const blob = await res.blob();
  const arr = await blob.arrayBuffer();

  const ctx = getCtx();
  const buffer = await ctx.decodeAudioData(arr.slice(0));
  const durMs = Math.min(HARD_MAX_MS, Math.max(1, Math.round(buffer.duration * 1000))) || estimateMs(text);
  return { buffer, durationMs: durMs };
}

async function prefetchWithFallback(text: string, voices: string[]): Promise<Clip | null> {
  for (const v of voices) {
    try { return await prefetchTTSBuffer(text, v); } catch {}
  }
  return null;
}

function stripModeratorPrefix(s: string) {
  return s.replace(/^\s*(?:moderator|mod)\s*[:\-–—]\s*/i, "");
}

let speakChain: Promise<void> = Promise.resolve();

function schedulePlay(
  clip: Clip,
  displayText: string,
  who: Speaker,
  setText: (t: string) => void,
  setSpeaking: (s: Speaker | null) => void,
  firstModPlayedRef: React.MutableRefObject<boolean>
) {
  return new Promise<void>(async (resolve) => {
    await resumeCtx();
    const ctx = getCtx();
    const src = ctx.createBufferSource();
    src.buffer = clip.buffer;
    src.connect(__gain!);

    const extraFirstMod = (who === "MOD" && !firstModPlayedRef.current) ? FIRST_MOD_CUSHION_S : 0;
    const startAt = ctx.currentTime + SCHEDULE_LEAD_S + extraFirstMod;

    const msUntilStart = Math.max(0, (startAt - ctx.currentTime) * 1000);
    setTimeout(() => { setSpeaking(who); setText(displayText); }, msUntilStart);

    src.start(startAt);

    const tailMs = (who === "MOD") ? EXTRA_BUFFER_MS_MOD : EXTRA_BUFFER_MS_PARTY;
    let finished = false;
    const cleanResolve = () => {
      if (finished) return;
      finished = true;
      setSpeaking(null);
      resolve();
    };
    src.onended = () => { setTimeout(cleanResolve, tailMs); };
    const fallbackTotalMs = msUntilStart + clip.durationMs + tailMs + 500;
    setTimeout(cleanResolve, fallbackTotalMs);

    if (who === "MOD") firstModPlayedRef.current = true;
  });
}

const MOD_VOICES = ["harry", "daniel", "brian", "alloy"];
const PRO_VOICES = ["charlie", "alloy", "sage"];
const CON_VOICES = ["nathan", "mason", "alloy", "sage"];

/* ================= Component ================= */
export default function AskPage(){
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const [queueCount, setQueueCount] = useState<number|null>(null);
  const [topic, setTopic] = useState<string>("");
  const [running, setRunning] = useState(false);

  const [proText, setProText] = useState("");
  const [modText, setModText] = useState("");
  const [conText, setConText] = useState("");
  const [speaking, setSpeaking] = useState<Speaker|null>(null);

  const cacheKey = String(Math.floor(Date.now() / (1000 * 60)));
  const firstModPlayedRef = useRef(false);

  useEffect(() => { resumeCtx(); }, []);

  // cooldown ticker
  useEffect(() => {
    const until = Number(localStorage.getItem("ask.cooldownUntil") || 0);
    setCooldownUntil(until);
    const id = setInterval(() => {
      const left = Math.max(0, Math.floor(((until || 0) - Date.now()) / 1000));
      setCooldownLeft(left);
    }, 250);
    return () => clearInterval(id);
  }, []);

  // poll queue; when idle, try to pick → start debate
  useEffect(() => {
    let stop = false;
    async function poll(){
      try{
        if (!running) {
          // attempt atomic pick
          const rPick = await fetch("/api/arena-queue", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "pick" }),
          });
          if (rPick.ok) {
            const j = await rPick.json(); // { picked, remaining }
            if (j?.picked) {
              setTopic(j.picked);
              if (typeof j.remaining === "number") setQueueCount(j.remaining);
              setTimeout(()=>run(j.picked as string), 150);
            } else {
              // nothing picked → just refresh size
              const rList = await fetch("/api/arena-queue", { cache:"no-store" });
              const jj = rList.ok ? await rList.json() : null;
              const items = (jj?.items||[]) as any[];
              if (!stop) setQueueCount(items.length||0);
            }
          }
        } else {
          // while running, keep size updated
          const rList = await fetch("/api/arena-queue", { cache:"no-store" });
          const jj = rList.ok ? await rList.json() : null;
          const items = (jj?.items||[]) as any[];
          if (!stop) setQueueCount(items.length||0);
        }
      } catch {
        if (!stop && queueCount===null) setQueueCount(0);
      }
      if (!stop) setTimeout(poll, 4000);
    }
    poll();
    return ()=>{ stop = true; };
  }, [running]);

  async function submit(e: React.FormEvent){
    e.preventDefault();
    await resumeCtx();
    setMsg(null); setErr(null);
    const text = q.trim(); if (!text) return;
    if (text.length > 180) { setErr("Please keep questions ≤ 180 characters."); return; }
    if (Date.now() < cooldownUntil) return;
    try{
      const r = await fetch("/api/arena-queue", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ text }),
      });
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setMsg("Added to the queue. Thanks!"); setQ("");
      const until = Date.now()+30000;
      localStorage.setItem("ask.cooldownUntil", String(until));
      setCooldownUntil(until);
      setQueueCount((c)=> (typeof data?.size==="number" ? data.size : (c==null?1:c+1)));
    }catch{
      setMsg("Added locally (server busy)"); setQ("");
    }
  }

  function enqueueTurn(
    rawText: string,
    voices: string[],
    setText: (t: string) => void,
    who: Speaker
  ) {
    const displayText = (who === "MOD") ? stripModeratorPrefix(rawText) : rawText;
    const clipP = prefetchWithFallback(rawText, voices);

    speakChain = speakChain.then(async () => {
      const clip = await clipP;
      if (!clip) {
        const ms = estimateMs(rawText);
        const tail = (who === "MOD") ? EXTRA_BUFFER_MS_MOD : EXTRA_BUFFER_MS_PARTY;
        setSpeaking(who); setText(displayText);
        await new Promise((r) => setTimeout(r, ms + tail));
        setSpeaking(null);
        return;
      }
      await schedulePlay(clip, displayText, who, setText, setSpeaking, firstModPlayedRef);
    }).catch(()=>{});
  }

  async function run(t: string){
    if (running) return;
    setRunning(true);
    setProText(""); setConText(""); setModText("…preparing…");
    firstModPlayedRef.current = false;

    try{
      await resumeCtx();

      for await (const evt of startDebateStream(t, 3)){
        if (evt.type === "turn") {
          if (evt.side === "PRO") enqueueTurn(evt.text, PRO_VOICES, setProText, "PRO");
          else if (evt.side === "CON") enqueueTurn(evt.text, CON_VOICES, setConText, "CON");
        } else if (evt.type === "mod_open" || evt.type === "mod_close") {
          enqueueTurn(evt.text, MOD_VOICES, setModText, "MOD");
        } else if (evt.type === "error") {
          setModText(`Error: ${evt.message}`); break;
        }
      }

      await speakChain;
      setModText("");
    } catch {
      setModText("Error starting debate. Check /api/debate.");
    } finally {
      setSpeaking(null);
      setRunning(false);
    }
  }

  return (
    <div className="page">
      <style>{css}</style>
      <div className="backdrop"><div className="lights"/><div className="audience"/></div>

      <div className="wrap">
        <h1 className="h1">Ask the Arena</h1>
        <div className="sub">Queue size: {queueCount==null ? "—" : queueCount}</div>

        <form className="form" onSubmit={submit}>
          <div className="row">
            <input
              className="input"
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              placeholder="e.g., Should we colonize Mars?"
              maxLength={200}
            />
            <button className="btn" disabled={!q.trim() || Date.now()<cooldownUntil}>
              {Date.now()<cooldownUntil ? `Wait ${cooldownLeft}s` : "Submit"}
            </button>
          </div>
          <div className="meta">
            <span>{q.trim().length}/180</span>
            <span>Be concise, specific, debateable.</span>
          </div>
          {msg && <div className="ok">✅ {msg}</div>}
          {err && <div className="err">⚠️ {err}</div>}
        </form>

        {/* Stage */}
        <div className="stage">
          <div className="grid">
            <div className={`card ${speaking==="PRO"?"speaking":""}`} style={{ color:"var(--pro)" } as React.CSSProperties}>
              <div className="badge"><span className="dot"/><span>PRO</span></div>
              <div className="stack">
                <div className="figure"><img src={`/pro.png?v=${cacheKey}`} alt="Pro"/></div>
                <div className="balloon tail-up">{proText || <span style={{opacity:.6}}>…waiting…</span>}</div>
              </div>
            </div>

            <div className={`card ${speaking==="MOD"?"speaking":""}`} style={{ color:"var(--mod)" } as React.CSSProperties}>
              <div className="badge"><span className="dot"/><span>MODERATOR</span></div>
              <div className="stack">
                <div className="figure"><img src={`/mod.png?v=${cacheKey}`} alt="Moderator"/></div>
                <div className="balloon tail-up">{modText || <span style={{opacity:.6}}>…waiting…</span>}</div>
              </div>
            </div>

            <div className={`card ${speaking==="CON"?"speaking":""}`} style={{ color:"var(--con)" } as React.CSSProperties}>
              <div className="badge"><span className="dot"/><span>CON</span></div>
              <div className="stack">
                <div className="figure"><img src={`/con.png?v=${cacheKey}`} alt="Con"/></div>
                <div className="balloon tail-up">{conText || <span style={{opacity:.6}}>…waiting…</span>}</div>
              </div>
            </div>
          </div>

          {topic && <div className="sub" style={{marginTop:10}}>Now debating: <b>{topic}</b></div>}
        </div>
      </div>
    </div>
  );
}
