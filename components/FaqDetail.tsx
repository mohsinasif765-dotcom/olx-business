"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getFaq } from "@/lib/faq";
import { useLanguage } from "@/lib/i18n";
import { fetchContent } from "@/lib/fetch-content";
import { TELEGRAM_HELP } from "@/lib/links";

export function FaqDetail({ id }: { id: string }) {
  const { t } = useLanguage();
  const local = getFaq(id);
  const [title, setTitle] = useState(local?.title || "");
  const [body, setBody] = useState(
    local ? local.sections.flatMap((s) => [s.heading, ...s.body]).join("\n") : ""
  );
  const [telegram, setTelegram] = useState(TELEGRAM_HELP);
  const [ready, setReady] = useState(!id);

  useEffect(() => {
    void fetchContent()
      .then((data: { faqs?: { id: string; title: string; body: string }[]; telegram?: string } | null) => {
        const row = data?.faqs?.find((item) => item.id === id);
        if (row) {
          setTitle(row.title);
          setBody(row.body);
        }
        if (data?.telegram) setTelegram(data.telegram);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, [id]);

  if (ready && !title) {
    return (
      <div className="star-field">
        <div className="page-enter mx-auto min-h-screen max-w-[430px] px-4 pt-8">
          <p>{t.pageNotFound}</p>
          <Link href="/faq" className="mt-4 block text-[#9ec6ff]">
            ← {t.faq}
          </Link>
        </div>
      </div>
    );
  }

  const paras = body.split(/\n+/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="star-field relative">
      <div className="page-enter mx-auto min-h-screen w-full max-w-[430px] px-4 pb-28 pt-3">
        <header className="mb-5 flex items-center justify-between">
          <Link
            href="/faq"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg"
          >
            ‹
          </Link>
          <h1 className="text-[17px] font-semibold">{t.faqDetail}</h1>
          <span className="w-9" />
        </header>

        <h2 className="mb-5 text-[18px] font-semibold leading-7">{title}</h2>
        <div className="space-y-3 text-[13px] leading-6 text-white/78">
          {paras.map((para) => (
            <p key={para}>{para}</p>
          ))}
        </div>

        <div className="mt-8 flex gap-3">
          <Link href="/support" className="wd-ghost flex-1 text-[13px]">
            {t.customerService}
          </Link>
          <Link href="/vip" className="wd-confirm flex-1 text-[13px] tracking-normal">
            {t.goVip}
          </Link>
        </div>
      </div>

      <a href={telegram} target="_blank" rel="noreferrer" className="faq-fab" aria-label={t.telegram}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="12" fill="#2aa1d8" />
          <path d="M6.8 11.7l10.2-4.2c.5-.2.9.1.7.8l-1.7 8.2c-.1.6-.5.7-1 .5l-2.8-2.1-1.5 1.5c-.2.2-.3.3-.6.3l.2-2.9 5.3-4.8c.2-.2 0-.3-.3-.1l-6.6 4.1-2.7-.8c-.6-.2-.6-.6.1-.8z" fill="#fff" />
        </svg>
      </a>
    </div>
  );
}
