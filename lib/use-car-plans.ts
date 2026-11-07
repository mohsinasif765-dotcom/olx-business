"use client";

import { useEffect, useMemo, useState } from "react";
import { type CarPlan } from "@/lib/cars";

function withLocalPhoto(plan: CarPlan): CarPlan {
  if (!plan.image) {
    return { ...plan, image: "/cars/city-sedan.jpg" };
  }
  return plan;
}

export type CarSiteSettings = {
  siteName: string;
  packagesOn: boolean;
  maintenance: string;
};

type PlansPayload = { plans?: CarPlan[]; settings?: Partial<CarSiteSettings> };

let inflight: Promise<PlansPayload | null> | null = null;

function loadPlans() {
  if (inflight) return inflight;
  inflight = fetch("/api/car-plans", { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : null))
    .then((data: PlansPayload | null) => data)
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useCarPlans() {
  const [plans, setPlans] = useState<CarPlan[]>([]);
  const [settings, setSettings] = useState<CarSiteSettings>({
    siteName: "olbusiness",
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
          siteName: data.settings.siteName || "olbusiness",
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

  const vipPlans = useMemo(
    () => plans.map((plan) => ({ id: plan.id, name: plan.name, recharge: plan.invest })),
    [plans]
  );

  return { plans, vipPlans, settings, loaded };
}
