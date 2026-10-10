"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { BackHeader } from "@/components/BackHeader";
import { CurrencyFlag } from "@/components/CurrencyFlag";
import { rememberFundCurrency } from "@/lib/display-currency";
import { fetchContent } from "@/lib/fetch-content";
import {
  currencyCodeFromRail,
  formatMoneyLabel,
  railDisplayTitle,
  type CurrencyRow,
} from "@/lib/currencies";
import { useFundTarget } from "@/lib/fund-target";
import { useLanguage } from "@/lib/i18n";

type Coin = CurrencyRow;

export default function Page() {
  return (
    <Suspense fallback={<div className="star-field min-h-screen" />}>
      <RechargeSelect />
    </Suspense>
  );
}

function RechargeSelect() {
  const { t } = useLanguage();
  const { planId, plan, need, investLabel, needLabel, rangeLabel, depositMinForRail, backHref } =
    useFundTarget();
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
          href={backHref}
          title={t.fundWallet}
          right={
            <Link href="/wallet/history" className="text-[12px] text-[#9ec6ff]">
              {t.rechargeHistory}
            </Link>
          }
        />

        {plan || need > 0 ? (
          <div className="pay-card mb-4">
            <p className="text-[11px] tracking-wide text-white/45 uppercase">{t.selectedPlan}</p>
            <p className="mt-1 text-[17px] font-semibold">{plan?.name || planId || "Package"}</p>
            {investLabel ? (
              <p className="mt-1 text-[13px] text-[#9ee7ff]">
                {t.investAmount}: {investLabel}
              </p>
            ) : null}
            {needLabel || rangeLabel ? (
              <p className="mt-1 text-[12px] text-white/50">
                {t.minAmount}: {rangeLabel || needLabel}
              </p>
            ) : null}
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
              const code = currencyCodeFromRail(coin);
              const title = railDisplayTitle(coin);
              const minN = depositMinForRail(coin.min, code);
              const qs = new URLSearchParams({ coin: coin.id });
              if (planId) qs.set("plan", planId);
              if (need > 0) qs.set("need", String(need));
              return (
                <article key={coin.id} className="pay-card">
                  <div className="flex items-center gap-3">
                    <CurrencyFlag id={coin.id} name={coin.name} network={coin.network} size={40} />
                    <div className="min-w-0 flex-1">
                      <h2 className="text-[17px] font-semibold">{title}</h2>
                      <p className="text-[12px] text-white/50">
                        {code} · min {formatMoneyLabel(minN, code)}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/wallet/recharge?${qs.toString()}`}
                    className="car-invest mt-4"
                    onClick={() => rememberFundCurrency(code)}
                  >
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
