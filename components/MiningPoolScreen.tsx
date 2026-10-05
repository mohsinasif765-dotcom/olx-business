"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { useCarPlans } from "@/lib/use-car-plans";
import { useLanguage } from "@/lib/i18n";

export function MiningPoolScreen() {
  const { t } = useLanguage();
  const { plans } = useCarPlans();
  const sample = plans.filter((p) => p.kind === "new").slice(0, 2);

  return (
    <div className="star-field">
      <div className="page-enter mx-auto min-h-screen w-full max-w-[430px] px-4 pb-28 pt-3">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrandLogo size={40} />
            <div>
              <p className="text-[11px] text-white/50">{t.miningPool}</p>
              <p className="text-[15px] font-semibold">{t.carsTitle}</p>
            </div>
          </div>
          <LanguageSwitch globe />
        </header>

        <div className="mb-4 overflow-hidden rounded-2xl">
          <img
            src={sample[0]?.image || "/cars/city-sedan.jpg"}
            alt=""
            className="h-[148px] w-full object-cover"
            onError={(event) => {
              event.currentTarget.src = "/cars/city-sedan.jpg";
            }}
          />
        </div>

        <p className="mb-1 text-center text-[13px] text-white/50">{t.emptyHint}</p>
        <p className="mb-5 text-center text-[22px] font-semibold">0.00 USDT</p>

        <Link href="/vip" className="mp-boost mb-5">
          {t.improvePower}
        </Link>

        <h2 className="mb-3 text-[15px] font-semibold">{t.miningRecords}</h2>
        <div className="space-y-3">
          {sample.map((plan) => (
            <article key={plan.id} className="car-card">
              <div className="car-photo" style={{ height: 120 }}>
                <img
                  src={plan.image}
                  alt={plan.name}
                  onError={(event) => {
                    event.currentTarget.src = "/cars/city-sedan.jpg";
                  }}
                />
              </div>
              <div className="p-3">
                <p className="font-semibold">{plan.name}</p>
                <p className="mt-1 text-[12px] text-white/50">
                  {plan.invest} · {plan.term}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
