import { clearSnapshotCache, readSnapshotPayload, rememberSnapshot } from "@/lib/server/snapshot";
import { zuvoAdmin } from "@/lib/zuvo";

export async function patchSnapshot(update: (payload: Record<string, unknown>) => void) {
  const db = zuvoAdmin();
  const payload = { ...(await readSnapshotPayload(true)) };
  update(payload);
  const { error: saveError } = await db.from("ops_snapshot").upsert({
    id: 1,
    payload,
    updated_at: new Date().toISOString(),
  });
  if (saveError) {
    clearSnapshotCache();
    throw saveError;
  }
  rememberSnapshot(payload);
  return payload;
}

export async function appendList(key: string, row: Record<string, unknown>) {
  await patchSnapshot((payload) => {
    const list = Array.isArray(payload[key]) ? (payload[key] as Record<string, unknown>[]) : [];
    payload[key] = [row, ...list].slice(0, 200);
  });
}
