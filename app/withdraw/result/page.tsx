"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n";

export default function Page() {
  return (
    <Suspense fallback={<div className="star-field min-h-screen" />}>
      <WithdrawResult />
    </Suspense>
  );
}

function WithdrawResult() {
  const { t } = useLanguage();
  const params = useSearchParams();
  const amount = params.get("amount") || "0.00";
  const wallet = params.get("wallet") || "USDT";
  const arrival = params.get("arrival") || amount;
  const receive = params.get("receive");
  const receiveCode = (params.get("receiveCode") || "").toUpperCase();
  const showReceive =
    Boolean(receive) && receiveCode && receiveCode !== "USDT" && receiveCode !== wallet;

  return (
    <div className="star-field">
      <div className="page-enter mx-auto min-h-screen w-full max-w-[430px] px-4 pb-28 pt-10">
        <div className="deposit-card px-5 py-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#3dff9a]/15 text-3xl text-[#3dff9a]">
            ✓
          </div>
          <h1 className="text-[20px] font-semibold">{t.submitted}</h1>
          <p className="mt-2 text-[13px] text-[#ffd27a]">{t.resultPending}</p>
          <p className="mt-5 text-[28px] font-semibold">
            {amount} {wallet === "USDT" ? "USDT" : wallet}
          </p>
          {showReceive ? (
            <p className="mt-3 text-[13px] font-medium text-[#9ee7ff]">
              {t.estimatedReceive.replace("{amount}", receive!).replace("{code}", receiveCode)}
            </p>
          ) : (
            <p className="mt-3 text-[12px] text-white/50">
              {t.actualArrival}: {arrival} USDT
            </p>
          )}
        </div>

        <div className="mt-5 space-y-3">
          <Link href="/withdraw/history" className="wd-confirm">
            {t.withdrawHistory}
          </Link>
          <Link href="/support" className="wd-ghost">
            {t.customerService}
          </Link>
          <Link href="/home" className="block py-3 text-center text-sm text-[#9ec6ff]">
            {t.backHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
