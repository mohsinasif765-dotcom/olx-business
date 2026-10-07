import { zuvoAdmin } from "@/lib/zuvo";

export type BrandKind = "logo" | "splash";

const BUCKET = "brand";

const DEFAULTS: Record<BrandKind, string> = {
  logo: "/logo.png",
  splash: "/logo.png",
};

function publicUrl(path: string) {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}

async function resolveKind(kind: BrandKind) {
  try {
    const { data } = await zuvoAdmin().storage.from(BUCKET).list("", { limit: 50 });
    const match = (data || []).find((f) => {
      const name = String(f.name || "");
      return name === kind || name.startsWith(`${kind}.`);
    });
    if (match?.name) {
      const updated = match.updated_at || match.created_at || "";
      const url = publicUrl(match.name);
      return updated ? `${url}?v=${encodeURIComponent(String(updated))}` : url;
    }
  } catch {
    /* bucket missing */
  }
  return DEFAULTS[kind];
}

export async function readBrandAssets() {
  const [logo, splash] = await Promise.all([resolveKind("logo"), resolveKind("splash")]);
  // Splash falls back to brand logo when only logo was uploaded
  return {
    logo,
    splash: splash === DEFAULTS.splash && logo !== DEFAULTS.logo ? logo : splash,
  };
}
