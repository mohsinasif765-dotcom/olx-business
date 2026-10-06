"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSessionAccount } from "@/lib/session";
import { useLanguage } from "@/lib/i18n";

export default function Page() {
  const { t } = useLanguage();
  const [rates, setRates] = useState({ l1: 15, l2: 3, l3: 1 });
  const [commission, setCommission] = useState(0);
  const [team, setTeam] = useState(0);

  useEffect(() => {
    const account = getSessionAccount();
    if (!account) return;
    void fetch(`/api/team?account=${encodeURIComponent(account)}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { rates?: { l1: number; l2: number; l3: number }; totals?: { commission: number; team: number } } | null) => {
        if (data?.rates) setRates(data.rates);
        if (data?.totals) {
          setCommission(data.totals.commission);
          setTeam(data.totals.team);
        }
      })
      .catch(() => {});
  }, []);

  const rows = [
    { level: "LEV 1", rate: `${rates.l1}%`, noteKey: "levDirect" as const },
    { level: "LEV 2", rate: `${rates.l2}%`, noteKey: "levFriends" as const },
    { level: "LEV 3", rate: `${rates.l3}%`, noteKey: "levThird" as const },
  ];

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
          <h1 className="text-[17px] font-semibold">{t.commissionDetails}</h1>
          <span className="w-9" />
        </header>

        <h2 className="mb-3 text-[13px] text-white/55">{t.commissionRules}</h2>
        <div className="space-y-2">
          {rows.map((row) => (
            <article key={row.level} className="deposit-card flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">{row.level}</p>
                <p className="text-[12px] text-white/50">{t[row.noteKey]}</p>
              </div>
              <p className="text-[18px] font-semibold text-[#7ee0ff]">{row.rate}</p>
            </article>
          ))}
        </div>

        <div className="mp-empty mt-4">
          {team === 0 ? (
            <>
              <p className="text-[14px] font-semibold">{t.noCommission}</p>
              <p className="mt-2 px-4 text-[12px] text-white/50">{t.noInvites}</p>
            </>
          ) : (
            <>
              <p className="text-[14px] font-semibold">Brokerage wallet</p>
              <p className="mt-2 text-[22px] font-semibold text-[#7ee0ff]">${commission.toFixed(2)}</p>
              <p className="mt-2 px-4 text-[12px] text-white/50">{team} members in your 3-level team.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
