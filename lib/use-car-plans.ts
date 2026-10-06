"use client";

import { useEffect, useMemo, useState } from "react";
import { type CarPlan } from "@/lib/cars";

function withLocalPhoto(plan: CarPlan): CarPlan {
  if (plan.image.includes("unsplash.com") || !plan.image) {
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

let cached: { at: number; data: PlansPayload } | null = null;
let inflight: Promise<PlansPayload | null> | null = null;
const TTL_MS = 15000;

function loadPlans() {
  if (cached && Date.now() - cached.at < TTL_MS) return Promise.resolve(cached.data);
  if (inflight) return inflight;
  inflight = fetch("/api/car-plans")
    .then((res) => (res.ok ? res.json() : null))
    .then((data: PlansPayload | null) => {
      if (data) cached = { at: Date.now(), data };
      return data;
    })
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useCarPlans() {
  const [plans, setPlans] = useState<CarPlan[]>(cached?.data.plans?.map(withLocalPhoto) || []);
  const [settings, setSettings] = useState<CarSiteSettings>({
    siteName: cached?.data.settings?.siteName || "OLX Business",
    packagesOn: cached?.data.settings?.packagesOn !== false,
    maintenance: cached?.data.settings?.maintenance || "",
  });
  const [loaded, setLoaded] = useState(Boolean(cached));

  useEffect(() => {
    let live = true;
    loadPlans()
      .then((data) => {
        if (!live || !data) return;
        if (Array.isArray(data.plans)) setPlans(data.plans.map(withLocalPhoto));
        if (data.settings) {
          setSettings({
            siteName: data.settings.siteName || "OLX Business",
            packagesOn: data.settings.packagesOn !== false,
            maintenance: data.settings.maintenance || "",
          });
        }
      })
      .finally(() => {
        if (live) setLoaded(true);
      });
    return () => {
      live = false;
    };
  }, []);

  const vipPlans = useMemo(
    () => plans.map((plan) => ({ id: plan.id, name: plan.name, recharge: plan.invest })),
    [plans]
  );

  return { plans, vipPlans, settings, loaded };
}
