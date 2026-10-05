"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n";

type HistoryItem = {
  id: string;
  coin: string;
  amount: string;
  status: string;
  at: string;
};

export default function Page() {
  const { t } = useLanguage();
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const raw = window.localStorage.getItem("olx-recharge-history");
    setItems(raw ? (JSON.parse(raw) as HistoryItem[]) : []);
  }, []);

  return (
    <div className="star-field">
      <div className="page-enter mx-auto min-h-screen w-full max-w-[430px] px-4 pb-28 pt-3">
        <header className="mb-5 flex items-center justify-between">
          <Link href="/wallet/select" className="text-xl">
            ‹
          </Link>
          <h1 className="text-[17px] font-semibold">{t.rechargeHistory}</h1>
          <span className="w-4" />
        </header>

        {items.length === 0 ? (
          <p className="text-center text-sm text-white/60">{t.noHistory}</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="vip-card">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{item.coin}</p>
                  <p className="text-[#3dff9a]">{item.status}</p>
                </div>
                <p className="mt-1 text-sm text-white/70">{item.amount}</p>
                <p className="mt-1 text-[11px] text-white/45">{item.at}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
