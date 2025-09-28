"use client";
import FigurineCard from "./FigurineCard";

type Speaker = "PRO" | "CON" | "MOD";
type Props = {
  proText: string;
  conText: string;
  modText: string;
  active: Speaker | null;
  queueCount?: number;
  lastSubmitted?: string | null;
  lastPicked?: string | null;
  onSeed?: () => void;
  onForceStart?: () => void;
};

export default function DebateStage2D({
  proText, conText, modText, active,
  queueCount = 0, lastSubmitted, lastPicked, onSeed, onForceStart,
}: Props) {
  return (
    <div className="stage2d">
      <StageTopBar
        queueCount={queueCount}
        lastSubmitted={lastSubmitted}
        lastPicked={lastPicked}
        onSeed={onSeed}
        onForceStart={onForceStart}
      />
      <div className="grid">
        <Card
          title="PRO" color="var(--pro)" img="/pro.png"
          text={proText} speaking={active==="PRO"}
        />
        <Card
          title="MOD" color="var(--mod)" img="/mod.png"
          text={modText} speaking={active==="MOD"}
        />
        <Card
          title="CON" color="var(--con)" img="/con.png"
          text={conText} speaking={active==="CON"}
        />
      </div>

      <style>{`
        :root{ --panel:#0d1430; --line:#1b2447; --ink:#e5e7eb; }
        .stage2d{ position:relative; padding-top:16px; }
        .topbar{ display:flex; gap:10px; align-items:center; justify-content:flex-end; margin-bottom:10px; }
        .btn{ padding:8px 10px; border-radius:10px; border:1px solid #ffffff22; background:#ffffff14; color:#fff; font-weight:700; cursor:pointer }
        .grid{ display:grid; grid-template-columns:1fr 1fr 1fr; gap:18px; }
        .card{ position:relative; background:linear-gradient(#0e1837,#0a1230); border:1px solid var(--line); border-radius:18px; padding:16px; }
        .card .title{ position:absolute; top:-12px; left:14px; background:#0b102c; border:1px solid var(--line); padding:8px 10px; border-radius:10px; font-weight:800; color:var(--ink) }
        .bubble{ margin-top:10px; background:#0b102c; border:1px solid var(--line); border-radius:12px; padding:12px; min-height:56px; color:#cbd5e1 }
        .spotlight{ position:absolute; inset:auto; width:38vw; height:36vh; top:10%; left:50%; transform:translateX(-50%); pointer-events:none; opacity:.08;
                    background: radial-gradient(60% 50% at 50% 0%, #fff, transparent 60%); filter:blur(2px); }
      `}</style>

      {/* ambient spotlights */}
      <div className="spotlight" />
    </div>
  );
}

function StageTopBar({
  queueCount, lastSubmitted, lastPicked, onSeed, onForceStart,
}: {
  queueCount: number; lastSubmitted?: string | null; lastPicked?: string | null;
  onSeed?: () => void; onForceStart?: () => void;
}) {
  return (
    <div className="topbar">
      {lastSubmitted && <span style={{opacity:.8}}>Last submitted: <em>{lastSubmitted}</em></span>}
      {lastPicked && <span style={{opacity:.8}}>Last picked: <em>{lastPicked}</em></span>}
      <span style={{opacity:.8}}>Queued: <strong>{queueCount}</strong></span>
      <button className="btn" onClick={onSeed}>Seed Sample</button>
      <button className="btn" onClick={onForceStart}>Force Start</button>
    </div>
  );
}

function Card({
  title, color, img, text, speaking,
}: { title:"PRO"|"MOD"|"CON"; color:string; img:string; text:string; speaking:boolean }) {
  return (
    <div className="card" style={{color}}>
      <div className="title">{title}</div>
      <FigurineCard src={img} alt={`${title} figurine`} speaking={speaking} color={color} />
      <div className="bubble">{text ? text : <span style={{opacity:.55}}>…waiting…</span>}</div>
    </div>
  );
}