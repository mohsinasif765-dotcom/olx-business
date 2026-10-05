"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { useLanguage } from "@/lib/i18n";

export const VIP_PLANS = [
  { id: "vip1", name: "VIP 1", recharge: "$100.00 – $199.99", income: "$3.00", days: 1, rebate: "0.01%" },
  { id: "vip2", name: "VIP 2", recharge: "$200.00 – $499.99", income: "$24.00", days: 3, rebate: "0.01%" },
  { id: "vip3", name: "VIP 3", recharge: "$500.00 – $1,999.99", income: "$60.00", days: 5, rebate: "0.01%" },
  { id: "vip4", name: "VIP 4", recharge: "$2,000.00 – $4,999.99", income: "$360.00", days: 7, rebate: "0.02%" },
  { id: "vip5", name: "VIP 5", recharge: "$5,000.00 – $9,999.99", income: "$1,050.00", days: 10, rebate: "0.03%" },
  { id: "vip6", name: "VIP 6", recharge: "$10,000.00 – $19,999.99", income: "$2,400.00", days: 15, rebate: "0.04%" },
  { id: "vip7", name: "VIP 7", recharge: "$20,000.00 – $29,999.99", income: "$6,000.00", days: 20, rebate: "0.05%" },
  { id: "vip8", name: "VIP 8", recharge: "$30,000.00+", income: "$10,500.00", days: 30, rebate: "0.06%" },
];

export function VipScreen() {
  const { t } = useLanguage();

  return (
    <div className="star-field">
      <div className="page-enter mx-auto min-h-screen w-full max-w-[430px] px-4 pb-28 pt-3">
        <header className="relative mb-4 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-2">
            <BrandLogo size={42} />
            <span className="text-[17px] font-semibold">OLX Business</span>
          </Link>
          <LanguageSwitch globe />
        </header>

        <div className="mb-3 flex items-center justify-between px-1 text-[12px] text-white/55">
          <span>{t.level}</span>
          <span>{t.rechargeAmount}</span>
        </div>

        <Link href="/wallet/select" className="vip-recharge-btn mb-4 block text-center">
          {t.recharge}
        </Link>

        <div className="space-y-3">
          {VIP_PLANS.map((plan) => (
            <article key={plan.id} className="vip-card">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6d5bff]/30 text-[#c9b8ff]">
                  ♛
                </span>
                <h2 className="text-[16px] font-semibold">{plan.name}</h2>
              </div>
              <Row label={t.rechargeAmount} value={plan.recharge} />
              <Row label={t.miningIncome} value={plan.income} accent />
              <Row
                label={t.miningTime}
                value={`${plan.days} ${plan.days === 1 ? t.day : t.days}`}
              />
              <Row label={t.miningRebate} value={plan.rebate} accent />
            </article>
          ))}
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
    <div className="flex items-center justify-between py-[3px] text-[13px]">
      <span className="text-white/55">{label}</span>
      <span className={accent ? "font-medium text-[#3dff9a]" : "text-white"}>
        {value}
      </span>
    </div>
  );
}
