"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { getSessionAccount } from "@/lib/session";

type WithdrawRecord = {
  id: string;
  wallet: string;
  address: string;
  amount: string;
  fee: string;
  arrival: string;
  status: string;
  at: string;
};

export default function Page() {
  const { t } = useLanguage();
  const [items, setItems] = useState<WithdrawRecord[]>([]);

  useEffect(() => {
    const account = getSessionAccount();
    if (!account) return;
    void fetch(`/api/records?account=${encodeURIComponent(account)}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { rows?: { id: string; kind: string; title: string; amount: string; status: string; at: string }[] } | null) => {
        setItems(
          (data?.rows || [])
            .filter((row) => row.kind === "withdraw")
            .map((row) => ({
              id: row.id,
              wallet: row.title,
              address: "",
              amount: row.amount.replace(/^-/, ""),
              fee: "",
              arrival: row.amount.replace(/^-/, ""),
              status: row.status,
              at: row.at,
            }))
        );
      })
      .catch(() => {});
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
                <p className="mt-2 text-[11px] text-white/40">{item.at}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
