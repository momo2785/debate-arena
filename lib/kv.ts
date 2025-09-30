// lib/kv.ts
export async function kvGet<T>(key: string): Promise<T | null> {
  const res = await fetch(`${process.env.KV_REST_API_URL}/get/${key}`, {
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_READ_ONLY_TOKEN}`,
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()).result as T;
}

export async function kvSet(key: string, value: any): Promise<boolean> {
  const res = await fetch(`${process.env.KV_REST_API_URL}/set/${key}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ value }),
  });
  return res.ok;
}

export async function kvDel(key: string): Promise<boolean> {
  const res = await fetch(`${process.env.KV_REST_API_URL}/del/${key}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
    },
  });
  return res.ok;
}
