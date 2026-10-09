/** Shop package kinds (motorcycle, jewelry, etc.) — never show car stock photos. */
export function isShopKind(kind: string) {
  const k = String(kind || "").toLowerCase();
  return k === "electronics" || k === "jewelry" || k === "shop";
}

/**
 * Resolve the image URL for a garage holding.
 * Shop investments always use the shop photo API so motorcycle/etc. never fall back to a car JPG.
 */
export function normalizeHoldingImage(holding: {
  kind: string;
  planId: string;
  image?: string;
}) {
  const planId = String(holding.planId || "").trim();
  const image = String(holding.image || "").trim();

  if (isShopKind(holding.kind)) {
    if (image.includes("/api/shop-photo/")) return image;
    if (planId) return `/api/shop-photo/${encodeURIComponent(planId)}`;
    return image;
  }

  if (image.startsWith("/api/car-photo/") || image.startsWith("/api/shop-photo/")) return image;
  if (image.startsWith("http") || image.startsWith("data:image/")) return image;
  if (planId) return `/api/car-photo/${encodeURIComponent(planId)}`;
  if (image && !image.includes("/cars/")) return image;
  return image || (planId ? `/api/car-photo/${encodeURIComponent(planId)}` : "");
}

export function holdingImageFallback(kind: string) {
  // Transparent 1×1 — avoids swapping a motorcycle holding for a sedan photo.
  if (isShopKind(kind)) {
    return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  }
  return "/cars/city-sedan.jpg";
}
