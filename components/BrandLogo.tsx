"use client";

import { useEffect, useState } from "react";

type BrandAssets = { logo: string; splash: string };

let cached: BrandAssets | null = null;
let inflight: Promise<BrandAssets> | null = null;

async function loadBrandAssets(): Promise<BrandAssets> {
  if (cached) return cached;
  if (!inflight) {
    inflight = fetch("/api/brand-assets", { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json()) as Partial<BrandAssets>;
        cached = {
          logo: data.logo || "/logo.png",
          splash: data.splash || data.logo || "/logo.png",
        };
        return cached;
      })
      .catch(() => {
        cached = { logo: "/logo.png", splash: "/logo.png" };
        return cached;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Call after admin uploads so the next mount picks up new URLs. */
export function clearBrandLogoCache() {
  cached = null;
}

export function BrandLogo({
  size = 40,
  className = "",
  variant = "logo",
}: {
  size?: number;
  className?: string;
  /** `splash` = login / install / about hero mark */
  variant?: "logo" | "splash";
}) {
  const [src, setSrc] = useState(variant === "splash" ? "/api/brand-splash" : "/api/brand-logo");

  useEffect(() => {
    let alive = true;
    void loadBrandAssets().then((assets) => {
      if (!alive) return;
      setSrc(variant === "splash" ? assets.splash : assets.logo);
    });
    return () => {
      alive = false;
    };
  }, [variant]);

  return (
    <img
      src={src}
      alt="OLX Business"
      width={size}
      height={size}
      className={`brand-logo shrink-0 ${className}`}
      style={{ width: size, height: size }}
      onError={() => setSrc("/logo.png")}
    />
  );
}
