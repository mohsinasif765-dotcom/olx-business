"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { BackHeader } from "@/components/BackHeader";
import { CurrencyFlag } from "@/components/CurrencyFlag";
import { fetchContent } from "@/lib/fetch-content";
import { useCarPlans } from "@/lib/use-car-plans";
import { useLanguage } from "@/lib/i18n";

type Coin = { id: string; name: string; network: string; min: string; address: string };

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
  const [coins, setCoins] = useState<Coin[]>([]);
  const [hint, setHint] = useState("");

  useEffect(() => {
    void fetchContent()
      .then((data: { flags?: { rechargeOn?: boolean }; coins?: Coin[] } | null) => {
        if (data?.flags?.rechargeOn === false) setHint("Funding is paused in admin settings.");
        setCoins(Array.isArray(data?.coins) ? data.coins : []);
      })
      .catch(() => {});
  }, []);

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

        {hint ? <p className="mb-3 px-1 text-[13px] text-white/50">{hint}</p> : null}

        <p className="mb-3 px-1 text-[12px] tracking-wide text-white/45 uppercase">{t.payMethod}</p>
        <div className="space-y-3">
          {coins.length === 0 ? (
            <p className="px-1 text-[13px] text-white/50">No currencies enabled yet.</p>
          ) : (
            coins.map((coin) => {
              const href = planId
                ? `/wallet/recharge?coin=${coin.id}&plan=${planId}`
                : `/wallet/recharge?coin=${coin.id}`;
              return (
                <article key={coin.id} className="pay-card">
                  <div className="flex items-center gap-3">
                    <CurrencyFlag id={coin.id} name={coin.name} network={coin.network} size={40} />
                    <div className="min-w-0 flex-1">
                      <h2 className="text-[17px] font-semibold">{coin.name}</h2>
                      <p className="text-[12px] text-white/50">
                        {coin.network} · min {coin.min}
                      </p>
                    </div>
                  </div>
                  <Link href={href} className="car-invest mt-4">
                    {t.continuePay}
                  </Link>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
