"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { parseInvestRange, sanitizeMoneyAmount } from "@/lib/currencies";
import { depositMinFromUsdtNeed, formatPackageMoneyText, formatUsdtAsDisplay } from "@/lib/package-money";
import { useCarPlans } from "@/lib/use-car-plans";
import { usePackageFx } from "@/lib/use-package-fx";
import { useShopPlans } from "@/lib/use-shop-plans";

const NEED_KEY = "olx-fund-need";
const PLAN_KEY = "olx-fund-plan";

export type FundPlanTarget = {
  id: string;
  name: string;
  invest: string;
  catalog: "car" | "shop";
};

/** Call when sending member to Fund after failed invest. need = USDT package min. */
export function rememberFundTarget(opts: {
  planId: string;
  name?: string;
  invest?: string;
  need?: number;
  catalog?: "car" | "shop";
}) {
  if (typeof window === "undefined") return;
  try {
    if (opts.need && opts.need > 0) {
      window.sessionStorage.setItem(NEED_KEY, String(opts.need));
    }
    window.sessionStorage.setItem(
      PLAN_KEY,
      JSON.stringify({
        id: opts.planId,
        name: opts.name || opts.planId,
        invest: opts.invest || (opts.need ? String(opts.need) : ""),
        catalog: opts.catalog || "car",
      } satisfies FundPlanTarget),
    );
  } catch {
    /* ignore */
  }
}

function readStoredNeed() {
  if (typeof window === "undefined") return 0;
  try {
    return Number(window.sessionStorage.getItem(NEED_KEY) || 0) || 0;
  } catch {
    return 0;
  }
}

function readStoredPlan(): FundPlanTarget | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PLAN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FundPlanTarget;
    if (!parsed?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Resolve selected package + effective deposit minimum for Fund pages. */
export function useFundTarget() {
  const params = useSearchParams();
  const planId = (params.get("plan") || "").trim();
  const needParam = Number(params.get("need") || 0) || 0;
  const { plans: carPlans, loaded: carsLoaded } = useCarPlans();
  const { plans: shopPlans, loaded: shopLoaded } = useShopPlans();
  const { code, fx, money, fromUsdt } = usePackageFx();
  const [storedNeed, setStoredNeed] = useState(0);
  const [storedPlan, setStoredPlan] = useState<FundPlanTarget | null>(null);

  useEffect(() => {
    setStoredNeed(readStoredNeed());
    setStoredPlan(readStoredPlan());
  }, [planId, needParam]);

  const plan = useMemo((): FundPlanTarget | null => {
    if (!planId) return storedPlan;
    const car = carPlans.find((row) => row.id === planId);
    if (car) return { id: car.id, name: car.name, invest: car.invest, catalog: "car" };
    const shop = shopPlans.find((row) => row.id === planId);
    if (shop) return { id: shop.id, name: shop.name, invest: shop.invest, catalog: "shop" };
    if (storedPlan?.id === planId) return storedPlan;
    return null;
  }, [planId, carPlans, shopPlans, storedPlan]);

  const range = parseInvestRange(plan?.invest);
  /** Package need in USDT (catalog base). */
  const need = Math.max(needParam, storedNeed, range.min);

  function depositMinForRail(railMin: unknown, railCode?: string) {
    const rail = Number(sanitizeMoneyAmount(railMin)) || 0;
    const payCode = railCode || code;
    return depositMinFromUsdtNeed(rail, need, payCode, fx);
  }

  return {
    planId,
    plan,
    /** USDT need */
    need,
    range,
    displayCode: code,
    fx,
    investLabel: plan?.invest ? money(plan.invest) : need > 0 ? fromUsdt(need) : "",
    needLabel: need > 0 ? fromUsdt(need) : "",
    rangeLabel:
      range.min > 0
        ? formatPackageMoneyText(
            range.max > range.min ? `${range.min}-${range.max}` : String(range.min),
            code,
            fx,
          )
        : "",
    loaded: carsLoaded || shopLoaded || Boolean(plan) || !planId,
    depositMinForRail,
    backHref: plan?.catalog === "shop" ? "/shop" : plan ? "/vip" : "/home",
  };
}
