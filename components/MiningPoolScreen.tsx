"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { useLanguage } from "@/lib/i18n";

type RecordTab = "collect" | "received" | "expired";
type MiningRecord = {
  id: string;
  amount: string;
  status: RecordTab;
  at: string;
};

export function MiningPoolScreen() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<RecordTab>("collect");
  const [records, setRecords] = useState<MiningRecord[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const list = useMemo(
    () => records.filter((item) => item.status === tab),
    [records, tab]
  );

  function openTab(id: RecordTab) {
    setTab(id);
    setLoading(true);
    window.setTimeout(() => setLoading(false), 700);
  }

  function collectAll() {
    const ready = records.filter((item) => item.status === "collect");
    if (!ready.length) return;
    const total = ready.reduce((sum, item) => sum + Number(item.amount), 0);
    const current = Number(window.localStorage.getItem("olx-usdt-balance") || "0");
    window.localStorage.setItem("olx-usdt-balance", String(current + total));
    setRecords((prev) =>
      prev.map((item) =>
        item.status === "collect" ? { ...item, status: "received" } : item
      )
    );
    setTab("received");
    setMessage(`${t.collected} ${total.toFixed(6)} USDT`);
  }

  return (
    <div className="star-field">
      <div className="page-enter mx-auto min-h-screen w-full max-w-[430px] px-4 pb-28 pt-3">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrandLogo size={40} />
            <div>
              <p className="text-[11px] text-white/50">{t.level}</p>
              <p className="text-[15px] font-semibold">VIP</p>
            </div>
          </div>
          <LanguageSwitch globe />
        </header>

        <div className="mb-3 grid grid-cols-2 text-center text-[12px]">
          <div>
            <p className="text-white/50">{t.miningPower}</p>
            <p className="mt-1 font-semibold">0.00 GH/s</p>
          </div>
          <div>
            <p className="text-white/50">{t.dailyIncome}</p>
            <p className="mt-1 font-semibold">0.00 USDT</p>
          </div>
        </div>

        <div className="mp-live mb-4 overflow-hidden rounded-2xl">
          <img
            src="/mining-hero.jpg"
            alt=""
            className="mp-live-img h-[148px] w-full object-cover object-center"
          />
          <span className="mp-scan" />
          <span className="mp-glow" />
          <span className="mp-live-tag">
            <span className="mp-dot" />
            {t.liveTag}
          </span>
        </div>

        <p className="mb-3 text-center text-[22px] font-semibold tracking-wide">
          0.000000<span className="text-[14px] text-white/60"> USDT</span>
        </p>

        <div className="mp-track mb-1">
          <span className="mp-fill" style={{ width: "0%" }} />
        </div>
        <p className="mb-4 text-center text-[12px] text-white/50">{t.miningProgress}</p>

        <Link href="/wallet/select" className="mp-boost mb-5">
          {t.improvePower}
        </Link>

        <h2 className="mb-3 text-center text-[15px] font-semibold">{t.miningRecords}</h2>
        <div className="mb-4 grid grid-cols-3 gap-2">
          {(
            [
              ["collect", t.canCollect],
              ["received", t.received],
              ["expired", t.expired],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`mp-tab ${tab === id ? "is-on" : ""}`}
              onClick={() => openTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mp-empty">
            <span className="mp-spinner" />
            <p className="mt-3 text-[13px] text-white/60">{t.loading}</p>
          </div>
        ) : list.length === 0 ? (
          <div className="mp-empty">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
              <HelmetIcon />
            </div>
            <p className="text-[15px] font-semibold">{t.noData}</p>
            <p className="mt-2 px-6 text-[12px] leading-5 text-white/50">{t.emptyHint}</p>
            <Link href="/wallet/select" className="mt-4 inline-block text-[12px] text-[#9ec6ff]">
              {t.improvePower} →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {list.map((item) => (
              <article key={item.id} className="deposit-card p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{item.amount} USDT</p>
                  <p className="text-[11px] text-white/45">{item.at}</p>
                </div>
              </article>
            ))}
            {tab === "collect" ? (
              <button type="button" className="wd-confirm mt-2" onClick={collectAll}>
                {t.collect}
              </button>
            ) : null}
          </div>
        )}

        {message ? (
          <p className="mt-4 text-center text-[13px] text-[#3dff9a]">{message}</p>
        ) : null}
      </div>
    </div>
  );
}

function HelmetIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 14c0-4.4 3.6-8 8-8s8 3.6 8 8v1.2H4V14z"
        fill="#9aa6c7"
      />
      <path d="M3 15.4h18v2.2H3z" fill="#c5cde0" />
      <path d="M8 18.8h8v1.6H8z" fill="#8b95b3" />
    </svg>
  );
}
