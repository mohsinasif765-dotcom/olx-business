"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ACTIVITIES } from "@/lib/activities";
import { useLanguage } from "@/lib/i18n";

export function ActivityScreen() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<"live" | "ended">("live");
  const list = useMemo(
    () => ACTIVITIES.filter((item) => item.status === tab),
    [tab]
  );

  return (
    <div className="star-field">
      <div className="page-enter mx-auto min-h-screen w-full max-w-[430px] px-4 pb-28 pt-3">
        <header className="mb-4 flex items-center justify-between">
          <Link
            href="/home"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg"
          >
            ‹
          </Link>
          <h1 className="text-[17px] font-semibold">{t.activity}</h1>
          <span className="w-9" />
        </header>

        <div className="act-hero mb-4">
          <p className="text-[12px] tracking-[0.16em] text-white/55">OLX BUSINESS</p>
          <h2 className="mt-1 text-[22px] font-semibold">Member offers</h2>
          <p className="mt-2 text-[13px] text-white/70">
            Check-in, first fund bonus, and invite rewards.
          </p>
        </div>

        <div className="mb-4 grid grid-cols-2 rounded-full bg-black/25 p-1">
          <button
            type="button"
            className={`h-9 rounded-full text-[13px] ${tab === "live" ? "act-tab-on" : "text-white/55"}`}
            onClick={() => setTab("live")}
          >
            {t.ongoing}
          </button>
          <button
            type="button"
            className={`h-9 rounded-full text-[13px] ${tab === "ended" ? "act-tab-on" : "text-white/55"}`}
            onClick={() => setTab("ended")}
          >
            {t.ended}
          </button>
        </div>

        {list.length === 0 ? (
          <p className="py-10 text-center text-sm text-white/55">{t.noEnded}</p>
        ) : (
          <div className="space-y-3">
            {list.map((item) => (
              <Link key={item.id} href={`/activity/${item.id}`} className={`act-card theme-${item.theme}`}>
                <span className={`act-badge badge-${item.badge}`}>
                  {item.badge === "hot" ? t.hot : item.badge === "new" ? t.newTag : t.endedTag}
                </span>
                <h3 className="pr-16 text-[16px] font-semibold">{item.title}</h3>
                <p className="mt-2 text-[12px] leading-5 text-white/72">{item.desc}</p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-white/50">
                  <span>
                    {t.eventTime}: {item.time}
                  </span>
                  <span className="text-[#c9b8ff]">{t.details} →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
