import { shopKind, type ShopKind, type ShopPlan } from "@/lib/shop";
import { listCatalogPhotoUrls } from "@/lib/server/package-photos";
import { zuvoAdmin } from "@/lib/zuvo";

type PackageRow = {
  id: string;
  name: string;
  kind: ShopKind;
  invest: string;
  returns: string;
  term: string;
  enabled: boolean;
};

function photoUrl(id: string, publicUrl?: string) {
  if (publicUrl) return publicUrl;
  return `/api/shop-photo/${encodeURIComponent(id)}`;
}

function toPlan(row: PackageRow, photoUrls: Record<string, string>): ShopPlan {
  return {
    id: row.id,
    name: row.name,
    kind: shopKind(row.kind),
    invest: row.invest,
    returns: row.returns,
    term: row.term,
    image: photoUrl(row.id, photoUrls[row.id]),
  };
}

export async function listLiveShopPlans(): Promise<ShopPlan[]> {
  const query = zuvoAdmin()
    .from("shop_packages")
    .select("id,name,kind,invest,returns,term,enabled")
    .eq("enabled", true)
    .limit(1000);
  let { data, error } = await query.order("updated_at", { ascending: false });
  if (error) {
    const retry = await zuvoAdmin()
      .from("shop_packages")
      .select("id,name,kind,invest,returns,term,enabled")
      .eq("enabled", true)
      .limit(1000)
      .order("id");
    data = retry.data;
    error = retry.error;
  }
  if (error) return [];
  const photoUrls = await listCatalogPhotoUrls("shop");
  return ((data || []) as PackageRow[]).map((row) => toPlan(row, photoUrls));
}
