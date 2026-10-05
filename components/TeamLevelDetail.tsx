"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

export function TeamLevelDetail({ id }: { id: string }) {
  const { t } = useLanguage();
  const level = ["1", "2", "3"].includes(id) ? id : "1";

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

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="deposit-card p-4 text-center">
            <p className="text-[12px] text-white/50">{t.peopleCount}</p>
            <p className="mt-1 text-[22px] font-semibold">0</p>
          </div>
          <div className="deposit-card p-4 text-center">
            <p className="text-[12px] text-white/50">{t.validCount}</p>
            <p className="mt-1 text-[22px] font-semibold">0</p>
          </div>
        </div>

        <div className="mp-empty">
          <p className="text-[15px] font-semibold">{t.noMembers}</p>
          <Link href="/invite" className="mt-4 text-[12px] text-[#9ec6ff]">
            {t.goInvite} →
          </Link>
        </div>
      </div>
    </div>
  );
}
