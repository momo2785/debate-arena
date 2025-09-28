"use client";
import { useEffect, useState } from "react";
import DebateStage2D from "./components/DebateStage2D";

/* light page styling */
const css = `
:root{
  --bg1:#0b102c; --bg2:#0f172a; --line:#1b2447; --ink:#e5e7eb;
}
.stage{ min-height:100vh; color:var(--ink);
  background: radial-gradient(1200px 800px at 50% -200px, #1d2a6b22, transparent 60%),
              linear-gradient(135deg,var(--bg2),var(--bg1)); }
.container{ max-width:1200px; margin:0 auto; padding:28px 20px 48px; }
.controls{ display:grid; grid-template-columns:1fr auto; gap:12px; margin-top:12px; }
.input{ padding:12px 14px; border-radius:10px; background:#ffffff14; border:1px solid #ffffff22; color:var(--ink); }
.rounds{ width:80px; }
.btns{ display:flex; gap:8px; margin-top:14px; }
.btn{ padding:10px 14px; border-radius:10px; border:0; color:white; font-weight:700; cursor:pointer }
.btn.primary{ background:#6366f1 } .btn.secondary{ background:#ffffff1a }
`;

type Speaker = "PRO" | "CON" | "MOD" | null;

/* ---- streaming events from /api/debate ---- */
async function* startDebateStream(topic: string, rounds: number) {
  const res = await fetch("/api/debate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, rounds }),
  });
  if (!res.body) throw new Error("No response body");
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
      yield JSON.parse(line);
    }
  }
}

/* ---- TTS helper using your /api/tts (OpenAI voice) ---- */
async function speak(text: string, voice: "alloy"|"verse"|"sage" = "sage", maxMs=9000) {
  try {
    const r = await fetch("/api/tts", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ text, voice }) });
    if (!r.ok) throw new Error(await r.text());
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    (audio as any).playsInline = true;
    audio.muted = true;
    audio.volume = 1;
    const p = audio.play().catch(()=>undefined);
    if (p) await p;
    requestAnimationFrame(()=>{ audio.muted = false; });
    await Promise.race([
      new Promise<void>(res => { audio.onended = ()=>{ URL.revokeObjectURL(url); res(); }; }),
      new Promise<void>(res => setTimeout(()=>{ try{audio.pause();}catch{} URL.revokeObjectURL(url); res(); }, maxMs)),
    ]);
  } catch {
    await new Promise(r=>setTimeout(r,300));
  }
}

export default function Page(){
  const [topic, setTopic] = useState("Should we colonize Mars?");
  const [rounds, setRounds] = useState(3);
  const [running, setRunning] = useState(false);

  const [active, setActive] = useState<Speaker>(null);
  const [proText, setProText] = useState("");
  const [conText, setConText] = useState("");
  const [modText, setModText] = useState("");
  const [log, setLog] = useState<string[]>([]);

  // queue UI bits shown in the top bar
  const [queueCount, setQueueCount] = useState(0);
  const [lastSubmitted, setLastSubmitted] = useState<string | null>(null);
  const [lastPicked, setLastPicked] = useState<string | null>(null);

  async function run(){
    if (running) return;
    setRunning(true);
    setLog([`[MOD] Debate start — Topic: ${topic}. — ${rounds} rounds.`]);
    setLastPicked(topic);

    try{
      for await (const evt of startDebateStream(topic, rounds)){
        if (evt.type === "turn") {
          setActive(evt.side as Speaker);
          if (evt.side === "PRO") setProText(evt.text);
          if (evt.side === "CON") setConText(evt.text);
          setLog(t => [...t, `[${evt.side}] ${evt.text}`]);
          await speak(evt.text, evt.side === "PRO" ? "alloy" : "verse");
        } else if (evt.type === "mod_open" || evt.type === "mod_close") {
          setActive("MOD"); setModText(evt.text);
          setLog(t => [...t, `[MOD] ${evt.text}`]);
          await speak(evt.text, "sage");
        } else if (evt.type === "error") {
          setActive("MOD"); setModText(`Error: ${evt.message}`); break;
        }
      }
    } finally {
      setActive(null); setRunning(false);
    }
  }

  function reset(){
    setRunning(false); setActive(null);
    setProText(""); setConText(""); setModText(""); setLog([]);
  }

  // fake “seed” button for the topbar (optional)
  function seedSample(){
    const samples = [
      "Is AGI closer than we think?",
      "Should crypto be regulated like banks?",
      "Are memes the future of marketing?"
    ];
    const q = samples[Math.floor(Math.random()*samples.length)];
    setLastSubmitted(q);
  }

  return (
    <div className="stage">
      <style>{css}</style>
      <div className="container">
        <h1 style={{fontSize:28,fontWeight:900}}>$VS — Three-Person Debate Arena</h1>
        <p style={{opacity:.85,marginTop:6}}>PRO left, MOD center, CON right. Live TTS.</p>

        {/* Controls */}
        <div className="controls">
          <input className="input" value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Enter a motion or topic"/>
          <div>
            <label style={{fontSize:12,opacity:.8}}>Rounds</label><br/>
            <input className="input rounds" type="number" min={1} max={6} value={rounds} onChange={e=>setRounds(parseInt(e.target.value||"3"))}/>
          </div>
        </div>
        <div className="btns">
          <button className="btn primary" onClick={run} disabled={running}>Start (use box above)</button>
          <button className="btn secondary" onClick={reset}>Reset</button>
        </div>

        {/* The Stage */}
        <DebateStage2D
          proText={proText}
          conText={conText}
          modText={modText}
          active={active}
          queueCount={queueCount}
          lastSubmitted={lastSubmitted}
          lastPicked={lastPicked}
          onSeed={seedSample}
          onForceStart={run}
        />

        {/* Transcript */}
        <div style={{marginTop:22}}>
          <h2 style={{fontSize:18,fontWeight:800}}>Transcript</h2>
          <textarea
            readOnly value={log.join("\n")}
            style={{marginTop:8,width:"100%",height:220,background:"#0b102c",border:"1px solid var(--line)",borderRadius:12,color:"var(--ink)",padding:12,fontFamily:"ui-monospace,Menlo,Monaco"}}
          />
        </div>
      </div>
    </div>
  );
}
