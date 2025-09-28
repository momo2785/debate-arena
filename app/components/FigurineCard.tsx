"use client";
import React from "react";

type Props = {
  src: string;
  alt: string;
  speaking?: boolean;
  color?: string; // "var(--pro)" etc.
  width?: number;
  height?: number;
};

export default function FigurineCard({
  src, alt, speaking=false, color="var(--mod)", width=160, height=220
}: Props){
  return (
    <div
      className={`fig3d ${speaking ? "speaking" : ""}`}
      style={{ color, width, height } as React.CSSProperties}
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
        el.style.setProperty("--tiltX", `0deg`);
        el.style.setProperty("--tiltY", `0deg`);
      }}
    >
      <span className="cone" />
      <div className="fig3d__img"><img src={src} alt={alt} /></div>
      <div className="fig3d__sheen" />
      <div className="pedestal" />
      <style>{`
        .fig3d{--tiltX:0deg;--tiltY:0deg;position:relative;border-radius:22px;overflow:hidden;
          transform-style:preserve-3d;
          background:radial-gradient(120% 100% at 50% 10%,#ffffff12,#0000 60%),linear-gradient(180deg,#111936,#0b102c 70%,#0b0f22);
          border:1px solid #1d274f;box-shadow:0 16px 40px #0008,inset 0 1px 0 #ffffff10,inset 0 -40px 80px #0008;
          transition:transform .25s ease,box-shadow .25s ease,filter .25s ease;
          transform:perspective(900px) rotateX(var(--tiltX)) rotateY(var(--tiltY));
        }
        .fig3d:hover{box-shadow:0 24px 70px #000a,inset 0 1px 0 #ffffff10,inset 0 -50px 90px #000a;}
        .fig3d__img{position:absolute;inset:0;display:grid;place-items:center;transform:translateZ(30px);filter:drop-shadow(0 20px 24px #0006)}
        .fig3d__img img{width:78%;height:78%;object-fit:contain}
        .fig3d__sheen{position:absolute;inset:0;pointer-events:none;mix-blend-mode:screen;background:radial-gradient(120% 100% at 30% 0%,#ffffff12,transparent 55%);transform:translateZ(40px)}
        .pedestal{position:absolute;left:50%;bottom:18px;translate:-50% 0;width:120px;height:12px;border-radius:999px;background:radial-gradient(120% 120% at 50% 30%,#000,#0a0f24);box-shadow:0 18px 30px #0009 inset,0 8px 30px #0008;transform:translateZ(10px)}
        .pedestal:before{content:"";position:absolute;inset:-4px;border-radius:999px;background:radial-gradient(120% 120% at 50% 20%,currentColor,transparent 60%);filter:blur(10px);opacity:.55}
        @keyframes bob3d{0%{transform:translateZ(30px) translateY(0)}50%{transform:translateZ(30px) translateY(-6px)}100%{transform:translateZ(30px) translateY(0)}}
        .fig3d.speaking .fig3d__img{animation:bob3d 2.2s ease-in-out infinite}
        .cone{position:absolute;inset:auto;width:320px;height:360px;top:-140px;left:50%;translate:-50% 0;pointer-events:none;filter:blur(1px);
          background:radial-gradient(60% 50% at 50% 0%,currentColor 0%,#0000 60%),linear-gradient(180deg,currentColor,#0000 60%);opacity:.08;transform:rotateX(60deg) translateZ(-80px)}
      `}</style>
    </div>
  );
}
