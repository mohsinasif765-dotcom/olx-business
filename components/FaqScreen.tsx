"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FAQ_ARTICLES, type FaqTab } from "@/lib/faq";
import { useLanguage } from "@/lib/i18n";
import { TELEGRAM_HELP } from "@/lib/links";

export function FaqScreen() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<FaqTab>("cars");
  const items = useMemo(
    () => FAQ_ARTICLES.filter((item) => item.tab === tab),
    [tab]
  );

  const tabs: { id: FaqTab; label: string }[] = [
    { id: "cars", label: t.faqMining },
    { id: "about", label: t.faqAbout },
    { id: "wallet", label: t.faqWallet },
  ];

  return (
    <div className="star-field relative">
      <div className="page-enter mx-auto min-h-screen w-full max-w-[430px] px-4 pb-28 pt-3">
        <header className="mb-4 flex items-center justify-between">
          <Link
            href="/home"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg"
          >
            ‹
          </Link>
          <h1 className="text-[17px] font-semibold">{t.faq}</h1>
          <span className="w-9" />
        </header>

        <div className="faq-tabs mb-4">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`faq-tab ${tab === item.id ? "is-on" : ""}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <Link key={item.id} href={`/faq/${item.id}`} className="faq-row">
              <span className="min-w-0 flex-1 truncate pr-3">{item.title}</span>
              <span className="shrink-0 text-white/45">›</span>
            </Link>
          ))}
        </div>
      </div>

      <a
        href={TELEGRAM_HELP}
        target="_blank"
        rel="noreferrer"
        className="faq-fab"
        aria-label={t.telegram}
      >
        <TelegramMark />
      </a>
    </div>
  );
}

function TelegramMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#2aa1d8" />
      <path d="M6.8 11.7l10.2-4.2c.5-.2.9.1.7.8l-1.7 8.2c-.1.6-.5.7-1 .5l-2.8-2.1-1.5 1.5c-.2.2-.3.3-.6.3l.2-2.9 5.3-4.8c.2-.2 0-.3-.3-.1l-6.6 4.1-2.7-.8c-.6-.2-.6-.6.1-.8z" fill="#fff" />
    </svg>
  );
}
