"use client";

import { useEffect, useMemo, useState } from "react";
import { CAR_PLANS, type CarPlan } from "@/lib/cars";

function withLocalPhoto(plan: CarPlan): CarPlan {
  if (plan.image.includes("unsplash.com") || !plan.image) {
    const local = CAR_PLANS.find((item) => item.id === plan.id);
    return { ...plan, image: local?.image || "/cars/city-sedan.jpg" };
  }
  return plan;
}

export function useCarPlans() {
  const [plans, setPlans] = useState<CarPlan[]>(CAR_PLANS);

  useEffect(() => {
    let live = true;
    fetch("/api/car-plans", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { plans?: CarPlan[] } | null) => {
        if (!live || !data || !Array.isArray(data.plans)) return;
        setPlans(data.plans.map(withLocalPhoto));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const vipPlans = useMemo(
    () => plans.map((plan) => ({ id: plan.id, name: plan.name, recharge: plan.invest })),
    [plans]
  );

  return { plans, vipPlans };
}
