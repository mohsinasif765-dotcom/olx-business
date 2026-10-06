"use client";

import { useEffect, useMemo, useState } from "react";
import { type ShopPlan } from "@/lib/shop";
import { type CarSiteSettings } from "@/lib/use-car-plans";

function withLocalPhoto(plan: ShopPlan): ShopPlan {
  if (!plan.image) {
    return { ...plan, image: plan.kind === "electronics" ? "/cars/executive.jpg" : "/cars/luxury.jpg" };
  }
  return plan;
}

type PlansPayload = { plans?: ShopPlan[]; settings?: Partial<CarSiteSettings> };

let inflight: Promise<PlansPayload | null> | null = null;

function loadPlans() {
  if (inflight) return inflight;
  inflight = fetch("/api/shop-plans", { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : null))
    .then((data: PlansPayload | null) => data)
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useShopPlans() {
  const [plans, setPlans] = useState<ShopPlan[]>([]);
  const [settings, setSettings] = useState<CarSiteSettings>({
    siteName: "OLX Business",
    packagesOn: true,
    maintenance: "",
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let live = true;
    function apply(data: PlansPayload | null) {
      if (!live || !data) return;
      if (Array.isArray(data.plans)) setPlans(data.plans.map(withLocalPhoto));
      if (data.settings) {
        setSettings({
          siteName: data.settings.siteName || "OLX Business",
          packagesOn: data.settings.packagesOn !== false,
          maintenance: data.settings.maintenance || "",
        });
      }
    }
    loadPlans()
      .then(apply)
      .finally(() => {
        if (live) setLoaded(true);
      });
    function onFocus() {
      void loadPlans().then(apply);
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      live = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  const shopPlans = useMemo(
    () => plans.map((plan) => ({ id: plan.id, name: plan.name, recharge: plan.invest })),
    [plans]
  );

  return { plans, shopPlans, settings, loaded };
}
