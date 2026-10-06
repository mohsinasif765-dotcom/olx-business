"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { getSessionAccount } from "@/lib/session";

type HistoryItem = {
  id: string;
  title?: string;
  coin?: string;
  amount: string;
  status: string;
  at: string;
};

export default function Page() {
  const { t } = useLanguage();
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const account = getSessionAccount();
    if (!account) return;
    void fetch(`/api/records?account=${encodeURIComponent(account)}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { rows?: { id: string; kind: string; title: string; amount: string; status: string; at: string }[] } | null) => {
        const rows = (data?.rows || []).filter((row) => row.kind === "recharge");
        setItems(rows.map((row) => ({ id: row.id, coin: row.title, amount: row.amount, status: row.status, at: row.at })));
      })
      .catch(() => {});
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
