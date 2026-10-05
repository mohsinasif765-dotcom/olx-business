"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { getTransferHistory } from "@/lib/wallets";

type Tab = "all" | "recharge" | "withdraw" | "transfer";

type Row = {
  id: string;
  kind: Exclude<Tab, "all">;
  title: string;
  amount: string;
  status: string;
  at: string;
};

export function RecordsScreen() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>("all");
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const rechargeRaw = window.localStorage.getItem("olx-recharge-history");
    const withdrawRaw = window.localStorage.getItem("olx-withdraw-history");
    const recharge = rechargeRaw ? (JSON.parse(rechargeRaw) as { id: string; coin: string; amount: string; status: string; at: string }[]) : [];
    const withdraw = withdrawRaw
      ? (JSON.parse(withdrawRaw) as { id: string; wallet: string; amount: string; status: string; at: string }[])
      : [];
    const transfers = getTransferHistory();

    const merged: Row[] = [
      ...recharge.map((item) => ({
        id: `r-${item.id}`,
        kind: "recharge" as const,
        title: item.coin,
        amount: `+${item.amount}`,
        status: item.status,
        at: item.at,
      })),
      ...withdraw.map((item) => ({
        id: `w-${item.id}`,
        kind: "withdraw" as const,
        title: item.wallet,
        amount: `-${item.amount}`,
        status: item.status,
        at: item.at,
      })),
      ...transfers.map((item) => ({
        id: `t-${item.id}`,
        kind: "transfer" as const,
        title: `${item.from === "invest" ? t.investWallet : t.brokerageWallet} → ${
          item.to === "invest" ? t.investWallet : t.brokerageWallet
        }`,
        amount: item.amount,
        status: "OK",
        at: item.at,
      })),
    ];
    merged.sort((a, b) => (a.at < b.at ? 1 : -1));
    setRows(merged);
  }, [t.investWallet, t.brokerageWallet]);

  const visible = useMemo(
    () => (tab === "all" ? rows : rows.filter((row) => row.kind === tab)),
    [rows, tab]
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: t.allRecords },
    { id: "recharge", label: t.typeRecharge },
    { id: "withdraw", label: t.typeWithdraw },
    { id: "transfer", label: t.typeTransfer },
  ];

  return (
    <div className="star-field">
      <div className="page-enter mx-auto min-h-screen w-full max-w-[430px] px-4 pb-28 pt-3">
        <header className="mb-5 flex items-center justify-between">
          <Link
            href="/me"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg"
          >
            ‹
          </Link>
          <h1 className="text-[17px] font-semibold">{t.financialRecords}</h1>
          <span className="w-9" />
        </header>

        <div className="me-tabs mb-4 p-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`me-tab ${tab === item.id ? "is-on" : ""}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="deposit-card px-4 py-10 text-center text-sm text-white/60">
            {t.recordsEmpty}
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((item) => (
              <article key={item.id} className="deposit-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-medium capitalize">{item.title}</p>
                  <p className={item.amount.startsWith("-") ? "text-[#ff9aa8]" : "text-[#7dffc2]"}>
                    {item.amount}
                  </p>
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-white/45">
                  <span>{item.status}</span>
                  <span>{item.at}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
