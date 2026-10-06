import { zuvoAdmin } from "@/lib/zuvo";

type Payload = Record<string, unknown>;

let cached: { at: number; payload: Payload } | null = null;
let inflight: Promise<Payload> | null = null;
const TTL_MS = 5000;

export async function readSnapshotPayload(force = false): Promise<Payload> {
  if (!force && cached && Date.now() - cached.at < TTL_MS) return cached.payload;
  if (inflight) return inflight;
  inflight = (async () => {
    const { data, error } = await zuvoAdmin()
      .from("ops_snapshot")
      .select("payload")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw error;
    const payload = { ...((data?.payload as Payload | undefined) || {}) };
    cached = { at: Date.now(), payload };
    return payload;
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

export function rememberSnapshot(payload: Payload) {
  cached = { at: Date.now(), payload };
}

export function clearSnapshotCache() {
  cached = null;
  inflight = null;
}
