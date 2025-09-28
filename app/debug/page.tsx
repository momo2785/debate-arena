"use client";
import { useRef, useState } from "react";

export default function DebugPage() {
  const [log, setLog] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function append(x: string) { setLog(s => s + x + "\n"); }

  async function testDebateStream() {
    setLog("— testDebateStream —\n");
    try {
      const r = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: "Test stream", rounds: 1 }),
      });
      append(`status: ${r.status}`);
      const text = await r.text();
      append(text || "(empty)");
    } catch (e:any) {
      append("err: " + (e?.message || String(e)));
    }
  }

  async function testDebateJson() {
    setLog("— testDebateJson —\n");
    try {
      const r = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "Should we colonize Mars?", name: "Debugger" }),
      });
      append(`status: ${r.status}`);
      const t = await r.text();
      append(t || "(empty)");
    } catch (e:any) {
      append("err: " + (e?.message || String(e)));
    }
  }

  async function testTTS() {
    setLog("— testTTS —\n");
    try {
      const r = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Test one two three", voice: "alloy" }),
      });
      append(`status: ${r.status}`);
      if (!r.ok) {
        append(await r.text());
        return;
      }
      const blob = await r.blob();
      append(`blob: ${blob.type}, ${blob.size} bytes`);
      const url = URL.createObjectURL(blob);
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      const a = audioRef.current!;
      a.src = url;
      // Safari: require a user gesture – click button was the gesture, so play should work
      await a.play();
      append("played!");
      a.onended = () => URL.revokeObjectURL(url);
    } catch (e:any) {
      append("err: " + (e?.message || String(e)));
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: "ui-monospace, monospace", color: "#e5e7eb", background:"#0b102c", minHeight:"100vh" }}>
      <h1 style={{ fontWeight: 800, marginBottom: 12 }}>Debug panel</h1>
      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        <button onClick={testDebateStream} style={btn}>Test /api/debate (stream)</button>
        <button onClick={testDebateJson} style={btn}>Test /api/debate (json)</button>
        <button onClick={testTTS} style={btn}>Test /api/tts (audio)</button>
      </div>
      <pre style={{ whiteSpace:"pre-wrap", background:"#111936", border:"1px solid #1b2447", padding:12, borderRadius:10, minHeight:240 }}>
        {log}
      </pre>
    </div>
  );
}

const btn: React.CSSProperties = {
  background:"#6366f1", border:"0", color:"#fff", padding:"10px 14px", borderRadius:10, fontWeight:700, cursor:"pointer"
};
