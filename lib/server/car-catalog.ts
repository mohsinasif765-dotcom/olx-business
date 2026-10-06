import { CAR_PLANS, type CarKind, type CarPlan } from "@/lib/cars";
import { zuvoAdmin } from "@/lib/zuvo";

type PackageRow = {
  id: string;
  name: string;
  kind: CarKind;
  invest: string;
  returns: string;
  term: string;
  image: string;
  enabled: boolean;
};

function toPlan(row: PackageRow): CarPlan {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind === "used" ? "used" : "new",
    invest: row.invest,
    returns: row.returns,
    term: row.term,
    image: row.image,
  };
}

export async function listLivePlans(): Promise<CarPlan[]> {
  const { data, error } = await zuvoAdmin()
    .from("car_packages")
    .select("id,name,kind,invest,returns,term,image,enabled")
    .eq("enabled", true)
    .order("id");
  if (error) throw error;
  const rows = (data || []) as PackageRow[];
  if (!rows.length) {
    await seedPackages();
    return CAR_PLANS;
  }
  return rows.map(toPlan);
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

async function seedPackages() {
  const { error } = await zuvoAdmin().from("car_packages").upsert(
    CAR_PLANS.map((plan) => ({
      id: plan.id,
      name: plan.name,
      kind: plan.kind,
      invest: plan.invest,
      returns: plan.returns,
      term: plan.term,
      image: plan.image,
      enabled: true,
    }))
  );
  if (error) throw error;
}
