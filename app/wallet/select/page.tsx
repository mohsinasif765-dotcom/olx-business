"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { COINS } from "@/lib/coins";
import { CoinIcon } from "@/components/CoinIcon";
import { BackHeader } from "@/components/BackHeader";
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
  const plan = params.get("plan");

  return (
    <div className="star-field">
      <div className="page-enter mx-auto min-h-screen w-full max-w-[430px] px-4 pb-28 pt-3">
        <BackHeader
          href="/home"
          title={t.rechargeSelect}
          right={
            <Link href="/wallet/history" className="text-[12px] text-[#9ec6ff]">
              {t.rechargeHistory}
            </Link>
          }
        />

        <div className="space-y-2">
          {COINS.map((coin) => {
            const href = plan
              ? `/wallet/recharge?coin=${coin.id}&plan=${plan}`
              : `/wallet/recharge?coin=${coin.id}`;
            return (
              <div key={coin.id} className="coin-row">
                <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
                  <CoinIcon symbol={coin.symbol} />
                  <span className="truncate text-[14px] font-medium">{coin.name}</span>
                </Link>
                <div className="flex items-center gap-2">
                  {"telegram" in coin && coin.telegram ? (
                    <Link
                      href="/support"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2ea4e7] text-white"
                      aria-label={t.support}
                    >
                      <TelegramTiny />
                    </Link>
                  ) : null}
                  <Link href={href} className="px-1 text-white/40">
                    ›
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TelegramTiny() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.5 4.4L2.9 11.6c-1.2.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.7.8.8 1.3.5l2.6-2.5 5.4 4c1 .6 1.7.3 2-1L22.8 5.8c.3-1.3-.5-1.9-1.3-1.4z" />
    </svg>
  );
}
