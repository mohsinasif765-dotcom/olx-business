import { zuvoAdmin } from "@/lib/zuvo";

export async function newUserHandle() {
  const db = zuvoAdmin();
  for (let i = 0; i < 24; i += 1) {
    const handle = String(100000 + Math.floor(Math.random() * 900000));
    const { data } = await db.from("members").select("id").eq("invite", handle).maybeSingle();
    if (!data) return handle;
  }
  return `u${Date.now().toString(36).slice(-6)}`;
}
