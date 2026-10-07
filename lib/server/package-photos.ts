import { zuvoAdmin } from "@/lib/zuvo";

export type PackageCatalog = "car" | "shop";

const BUCKET = "package-photos";

function publicUrl(catalog: PackageCatalog, id: string, ext: string) {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${BUCKET}/${catalog}/${id}.${ext}`;
}

function isStoredImage(value: string) {
  const v = value.trim();
  if (!v) return false;
  if (v.startsWith("data:image/")) return true;
  if (/^https?:\/\//i.test(v)) return true;
  if (v.startsWith("/uploads/") || v.startsWith("/cars/")) return true;
  if (v.startsWith("/api/")) return false;
  return false;
}

export async function listCatalogPhotoUrls(catalog: PackageCatalog) {
  const map: Record<string, string> = {};
  try {
    const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
    const { data } = await zuvoAdmin().storage.from(BUCKET).list(catalog, { limit: 200 });
    for (const file of data || []) {
      const name = String(file.name || "");
      const id = name.replace(/\.(jpe?g|png|webp)$/i, "");
      if (!id || id === name) continue;
      map[id] = `${base}/storage/v1/object/public/${BUCKET}/${catalog}/${name}`;
    }
  } catch {
    /* ignore */
  }
  return map;
}

/** Resolve to a URL or data URL without downloading Storage blobs when possible. */
export async function readPackagePhoto(catalog: PackageCatalog, id: string) {
  const photo = await zuvoAdmin().from("package_photos").select("image").eq("id", id).eq("catalog", catalog).maybeSingle();
  if (!photo.error && photo.data?.image && isStoredImage(String(photo.data.image))) {
    return String(photo.data.image);
  }

  const probes = await Promise.all(
    ["jpg", "png", "webp"].map(async (ext) => {
      const url = publicUrl(catalog, id, ext);
      try {
        const res = await fetch(url, { method: "HEAD" });
        return res.ok ? url : "";
      } catch {
        return "";
      }
    })
  );
  const hit = probes.find(Boolean);
  if (hit) return hit;

  const table = catalog === "shop" ? "shop_packages" : "car_packages";
  const pack = await zuvoAdmin().from(table).select("image").eq("id", id).maybeSingle();
  if (pack.error) return "";
  const legacy = String(pack.data?.image || "");
  return isStoredImage(legacy) ? legacy : "";
}
