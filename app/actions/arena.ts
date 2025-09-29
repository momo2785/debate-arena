"use server";

import { revalidatePath } from "next/cache";
import { kvGet, kvSet, kvDel } from "../../lib/kv";

const KEYS = {
  question: "arena:question",
  queue: "arena:queue",
  state: "arena:state",
  timers: "arena:timers",
} as const;

export type ArenaState = "idle" | "pre_roll" | "round_1" | "round_2" | "mod_wrap";

function bump() {
  // Revalidate both admin and community pages (adjust "/ask" to "/" if needed)
  revalidatePath("/arena/admin");
  revalidatePath("/ask");
  revalidatePath("/");
}

export async function getArenaSnapshot() {
  const [question, queue, state, timers] = await Promise.all([
    kvGet<string>(KEYS.question),
    kvGet<string[]>(KEYS.queue),
    kvGet<ArenaState>(KEYS.state),
    kvGet<{ startMs: number; preRoll: number; round: number; mod: number }>(KEYS.timers),
  ]);
  return { question, queue: queue ?? [], state: state ?? "idle", timers: timers ?? null };
}

export async function setQuestion(q: string) {
  await kvSet(KEYS.question, q);
  bump();
  return { ok: true };
}

export async function pushToQueue(q: string) {
  const current = (await kvGet<string[]>(KEYS.queue)) ?? [];
  current.push(q);
  await kvSet(KEYS.queue, current);
  bump();
  return { ok: true, size: current.length };
}

export async function popFromQueue() {
  const current = (await kvGet<string[]>(KEYS.queue)) ?? [];
  const next = current.shift() ?? null;
  await kvSet(KEYS.queue, current);
  if (next) await kvSet(KEYS.question, next);
  bump();
  return { ok: true, next };
}

export async function setState(state: ArenaState) {
  await kvSet(KEYS.state, state);
  bump();
  return { ok: true };
}

export async function setTimers(timers: { startMs: number; preRoll: number; round: number; mod: number }) {
  await kvSet(KEYS.timers, timers);
  bump();
  return { ok: true };
}

export async function removeFromQueueAt(index: number) {
  const q = (await kvGet<string[]>(KEYS.queue)) ?? [];
  if (index < 0 || index >= q.length) return { ok: false, error: "index_out_of_bounds" };
  q.splice(index, 1);
  await kvSet(KEYS.queue, q);
  bump();
  return { ok: true, size: q.length };
}

export async function promoteQueueIndex(index: number) {
  const q = (await kvGet<string[]>(KEYS.queue)) ?? [];
  if (index < 0 || index >= q.length) return { ok: false, error: "index_out_of_bounds" };
  const chosen = q.splice(index, 1)[0];
  await Promise.all([kvSet(KEYS.queue, q), kvSet(KEYS.question, chosen)]);
  bump();
  return { ok: true, question: chosen, size: q.length };
}

export async function clearQueue() {
  await kvDel(KEYS.queue);
  bump();
  return { ok: true };
}

export async function advanceState() {
  const snap = await getArenaSnapshot();
  const order: ArenaState[] = ["idle", "pre_roll", "round_1", "round_2", "mod_wrap"];
  const idx = order.indexOf(snap.state);
  const next = order[(idx + 1) % order.length];
  await setState(next);
  bump();
  return { ok: true, next };
}

export async function resetArena() {
  await Promise.all([
    kvDel(KEYS.question),
    kvDel(KEYS.queue),
    kvDel(KEYS.state),   // ✅ fixed (was KEYYS.state)
    kvDel(KEYS.timers),
  ]);
  bump();
  return { ok: true };
}
