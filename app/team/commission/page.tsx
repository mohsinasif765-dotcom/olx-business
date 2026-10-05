"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

const RATES = [
  { level: "LEV 1", rate: "15%", noteKey: "levDirect" as const },
  { level: "LEV 2", rate: "3%", noteKey: "levFriends" as const },
  { level: "LEV 3", rate: "1%", noteKey: "levThird" as const },
];

export default function Page() {
  const { t } = useLanguage();

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
          {RATES.map((row) => (
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
          <p className="text-[14px] font-semibold">{t.noCommission}</p>
          <p className="mt-2 px-4 text-[12px] text-white/50">{t.noInvites}</p>
        </div>
      </div>
    </div>
  );
}
