"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import type { WithdrawRecord } from "@/components/WithdrawScreen";

export default function Page() {
  const { t } = useLanguage();
  const [items, setItems] = useState<WithdrawRecord[]>([]);

  useEffect(() => {
    const raw = window.localStorage.getItem("olx-withdraw-history");
    setItems(raw ? (JSON.parse(raw) as WithdrawRecord[]) : []);
  }, []);

  return (
    <div className="star-field">
      <div className="page-enter mx-auto min-h-screen w-full max-w-[430px] px-4 pb-28 pt-3">
        <header className="mb-5 flex items-center justify-between">
          <Link
            href="/withdraw"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg"
          >
            ‹
          </Link>
          <h1 className="text-[17px] font-semibold">{t.withdrawHistory}</h1>
          <span className="w-9" />
        </header>

        {items.length === 0 ? (
          <p className="text-center text-sm text-white/60">{t.noWithdrawHistory}</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <article key={item.id} className="deposit-card p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{item.wallet}</p>
                  <p className="text-[12px] text-[#ffd27a]">{item.status}</p>
                </div>
                <p className="mt-2 text-[18px] font-semibold">{item.amount} USDT</p>
                <p className="mt-1 break-all text-[11px] text-white/45">{item.address}</p>
                <div className="mt-2 flex justify-between text-[11px] text-white/50">
                  <span>
                    {t.handlingFee}: {item.fee}
                  </span>
                  <span>
                    {t.actualArrival}: {item.arrival}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-white/40">{item.at}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
