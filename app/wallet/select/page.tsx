"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BackHeader } from "@/components/BackHeader";
import { useCarPlans } from "@/lib/use-car-plans";
import { useLanguage } from "@/lib/i18n";

export default function Page() {
  return (
    <Suspense fallback={<div className="star-field min-h-screen" />}>
      <RechargeSelect />
    </Suspense>
  );
}

function RechargeSelect() {
  const { t } = useLanguage();
  const params = useSearchParams();
  const { vipPlans } = useCarPlans();
  const planId = params.get("plan");
  const plan = vipPlans.find((item) => item.id === planId) ?? null;
  const href = planId ? `/wallet/recharge?coin=usdt&plan=${planId}` : "/wallet/recharge?coin=usdt";

  return (
    <div className="star-field">
      <div className="page-enter mx-auto min-h-screen w-full max-w-[430px] px-4 pb-28 pt-3">
        <BackHeader
          href={plan ? "/vip" : "/home"}
          title={t.fundWallet}
          right={
            <Link href="/wallet/history" className="text-[12px] text-[#9ec6ff]">
              {t.rechargeHistory}
            </Link>
          }
        />

        {plan ? (
          <div className="pay-card mb-4">
            <p className="text-[11px] tracking-wide text-white/45 uppercase">{t.selectedPlan}</p>
            <p className="mt-1 text-[17px] font-semibold">{plan.name}</p>
            <p className="mt-1 text-[13px] text-[#9ee7ff]">{plan.recharge}</p>
          </div>
        ) : (
          <p className="mb-4 px-1 text-[13px] leading-5 text-white/55">{t.fundIntro}</p>
        )}

        <article className="pay-card">
          <p className="text-[11px] tracking-wide text-white/45 uppercase">{t.payMethod}</p>
          <h2 className="mt-2 text-[18px] font-semibold">USDT</h2>
          <p className="mt-2 text-[13px] leading-5 text-white/55">{t.payUsdtHint}</p>
          <Link href={href} className="car-invest mt-4">
            {t.continuePay}
          </Link>
        </article>
      </div>
    </div>
  );
}
