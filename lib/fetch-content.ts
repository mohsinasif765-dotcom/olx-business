type ContentPayload = Record<string, unknown>;

let cached: { at: number; data: ContentPayload | null } | null = null;
let inflight: Promise<ContentPayload | null> | null = null;
const TTL_MS = 20000;

export async function fetchContent<T = Record<string, unknown>>(): Promise<T | null> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.data as T;
  if (inflight) return inflight as Promise<T | null>;
  inflight = fetch("/api/content")
    .then((res) => (res.ok ? res.json() : null))
    .then((data: ContentPayload | null) => {
      cached = { at: Date.now(), data };
      return data;
    })
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });
  return inflight as Promise<T | null>;
}
