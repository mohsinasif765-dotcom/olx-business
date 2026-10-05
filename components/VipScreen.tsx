"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { type CarKind } from "@/lib/cars";
import { useCarPlans } from "@/lib/use-car-plans";
import { useLanguage } from "@/lib/i18n";

export { VIP_PLANS } from "@/lib/cars";

export function VipScreen() {
  const { t } = useLanguage();
  const { plans: allPlans } = useCarPlans();
  const [tab, setTab] = useState<CarKind>("new");
  const plans = useMemo(() => allPlans.filter((p) => p.kind === tab), [allPlans, tab]);

  return (
    <div className="star-field">
      <div className="mx-auto min-h-screen w-full max-w-[430px] px-4 pb-32 pt-3">
        <header className="relative mb-4 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-2">
            <BrandLogo size={42} />
            <span className="text-[17px] font-semibold">OLX Business</span>
          </Link>
          <LanguageSwitch globe />
        </header>

        <h1 className="mb-1 px-1 text-[22px] font-semibold">{t.carsTitle}</h1>
        <p className="mb-4 px-1 text-[13px] leading-5 text-white/55">{t.carIntro}</p>

        <div className="car-tabs mb-4">
          <button
            type="button"
            className={tab === "new" ? "is-on" : ""}
            onClick={() => setTab("new")}
          >
            {t.newCars}
          </button>
          <button
            type="button"
            className={tab === "used" ? "is-on" : ""}
            onClick={() => setTab("used")}
          >
            {t.usedCars}
          </button>
        </div>

        <div className="space-y-4">
          {plans.length === 0 ? (
            <p className="px-1 text-[13px] text-white/50">No packages in this tab yet.</p>
          ) : (
            plans.map((plan) => (
            <article key={plan.id} className="car-card">
              <div className="car-photo">
                <img
                  src={plan.image}
                  alt={plan.name}
                  onError={(event) => {
                    event.currentTarget.src =
                      plan.kind === "used" ? "/cars/used-compact.jpg" : "/cars/city-sedan.jpg";
                  }}
                />
                <span className="car-badge">{tab === "new" ? t.newCars : t.usedCars}</span>
              </div>
              <div className="p-3.5">
                <h2 className="mb-3 text-[16px] font-semibold">{plan.name}</h2>
                <Row label={t.investAmount} value={plan.invest} />
                <Row label={t.expectedReturn} value={plan.returns} accent />
                <Row label={t.planTerm} value={plan.term} />
                <Link href={`/wallet/select?plan=${plan.id}`} className="car-invest">
                  {t.investCta}
                </Link>
              </div>
            </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-[4px] text-[13px]">
      <span className="text-white/55">{label}</span>
      <span className={accent ? "font-medium text-[#3dff9a]" : "text-white"}>{value}</span>
    </div>
  );
}
