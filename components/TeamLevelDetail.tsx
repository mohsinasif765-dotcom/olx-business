"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { moneyPrefix } from "@/lib/currencies";
import { getSessionAccount } from "@/lib/session";
import { useLanguage } from "@/lib/i18n";

type Row = {
  account: string;
  vip: string;
  invest: number;
  status: string;
  joined: string;
};

export function TeamLevelDetail({ id }: { id: string }) {
  const { t } = useLanguage();
  const level = ["1", "2", "3"].includes(id) ? id : "1";
  const [people, setPeople] = useState(0);
  const [valid, setValid] = useState(0);
  const [rate, setRate] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [ready, setReady] = useState(false);
  const [cash, setCash] = useState("Rs");

  useEffect(() => {
    const account = getSessionAccount();
    if (!account) {
      setReady(true);
      return;
    }
    void fetch(`/api/team?account=${encodeURIComponent(account)}&level=${level}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: {
        displayCurrency?: string;
        levels?: Record<string, { people: number; valid: number; rate: number }>;
        members?: Row[];
      } | null) => {
        if (!data) return;
        if (data.displayCurrency) setCash(moneyPrefix(data.displayCurrency));
        setPeople(data.levels?.[level]?.people || 0);
        setValid(data.levels?.[level]?.valid || 0);
        setRate(data.levels?.[level]?.rate || 0);
        setRows(Array.isArray(data.members) ? data.members : []);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, [level]);

  return (
    <div className="star-field">
      <div className="page-enter mx-auto min-h-screen w-full max-w-[430px] px-4 pb-28 pt-3">
        <header className="mb-5 flex items-center justify-between">
          <Link
            href="/team"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg"
          >
            ‹
          </Link>
          <h1 className="text-[17px] font-semibold">LEV {level}</h1>
          <span className="w-9" />
        </header>

        <p className="mb-3 text-center text-[13px] text-[#7ee0ff]">{rate}% rebate</p>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="deposit-card p-4 text-center">
            <p className="text-[12px] text-white/50">{t.peopleCount}</p>
            <p className="mt-1 text-[22px] font-semibold">{people}</p>
          </div>
          <div className="deposit-card p-4 text-center">
            <p className="text-[12px] text-white/50">{t.validCount}</p>
            <p className="mt-1 text-[22px] font-semibold">{valid}</p>
          </div>
        </div>

        {!ready ? (
          <p className="text-center text-[13px] text-white/50">{t.loading}</p>
        ) : rows.length === 0 ? (
          <div className="mp-empty">
            <p className="text-[15px] font-semibold">{t.noMembers}</p>
            <Link href="/invite" className="mt-4 text-[12px] text-[#9ec6ff]">
              {t.goInvite} →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <article key={`${row.account}-${row.joined}`} className="deposit-card flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold">{row.account}</p>
                  <p className="text-[12px] text-white/50">
                    {row.vip} · {row.joined || "—"}
                  </p>
                </div>
                <p className="text-[15px] font-semibold">
                  {cash} {row.invest.toFixed(2)}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
