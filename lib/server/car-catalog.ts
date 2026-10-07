import { type CarKind, type CarPlan } from "@/lib/cars";
import { listCatalogPhotoUrls } from "@/lib/server/package-photos";
import { zuvoAdmin } from "@/lib/zuvo";

type PackageRow = {
  id: string;
  name: string;
  kind: CarKind;
  invest: string;
  returns: string;
  term: string;
  enabled: boolean;
};

function photoUrl(id: string, publicUrl?: string) {
  if (publicUrl) return publicUrl;
  return `/api/car-photo/${encodeURIComponent(id)}`;
}

function toPlan(row: PackageRow, photoUrls: Record<string, string>): CarPlan {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind === "used" ? "used" : "new",
    invest: row.invest,
    returns: row.returns,
    term: row.term,
    image: photoUrl(row.id, photoUrls[row.id]),
  };
}

export async function listLivePlans(): Promise<CarPlan[]> {
  const query = zuvoAdmin()
    .from("car_packages")
    .select("id,name,kind,invest,returns,term,enabled")
    .eq("enabled", true)
    .limit(1000);
  let { data, error } = await query.order("updated_at", { ascending: false });
  if (error) {
    const retry = await zuvoAdmin()
      .from("car_packages")
      .select("id,name,kind,invest,returns,term,enabled")
      .eq("enabled", true)
      .limit(1000)
      .order("id");
    data = retry.data;
    error = retry.error;
  }
  if (error) throw error;
  const photoUrls = await listCatalogPhotoUrls("car");
  return ((data || []) as PackageRow[]).map((row) => toPlan(row, photoUrls));
}

export async function replacePlans(plans: CarPlan[]) {
  const db = zuvoAdmin();
  const { data: existing } = await db.from("car_packages").select("id");
  const keep = new Set(plans.map((p) => p.id));
  const extra = ((existing || []) as { id: string }[]).map((r) => r.id).filter((id) => !keep.has(id));
  if (extra.length) await db.from("car_packages").delete().in("id", extra);
  const { error } = await db.from("car_packages").upsert(
    plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      kind: plan.kind,
      invest: plan.invest,
      returns: plan.returns,
      term: plan.term,
      image: plan.image,
      enabled: true,
      updated_at: new Date().toISOString(),
    }))
  );
  if (error) throw error;
}

export function clearPlanCache() {}
