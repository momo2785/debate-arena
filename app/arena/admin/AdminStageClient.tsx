"use client";
import React, { useEffect, useState } from "react";
import Stage, { type Speaker } from "../../components/Stage"; // ✅ two levels up

export default function AdminStageClient() {
  const [topic, setTopic] = useState<string>("");
  const [proText, setProText] = useState("");
  const [modText, setModText] = useState("");
  const [conText, setConText] = useState("");
  const [speaking, setSpeaking] = useState<Speaker | null>(null);

  useEffect(() => {
    let stop = false;
    async function poll() {
      try {
        const r = await fetch("/api/arena-snapshot", { cache: "no-store" });
        if (r.ok) {
          const snap = await r.json();
          if (!stop) setTopic(snap.question || "");
        }
      } catch {
        // ignore
      }
      if (!stop) setTimeout(poll, 1000);
    }
    poll();
    return () => {
      stop = true;
    };
  }, []);

  return (
    <Stage
      speaking={speaking}
      proText={proText}
      modText={modText}
      conText={conText}
      topic={topic}
    />
  );
}
