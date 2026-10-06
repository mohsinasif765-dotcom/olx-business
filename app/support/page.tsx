"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { fetchContent } from "@/lib/fetch-content";
import { TELEGRAM_HANDLE, TELEGRAM_HELP } from "@/lib/links";

export default function Page() {
  const { t } = useLanguage();
  const [telegram, setTelegram] = useState(TELEGRAM_HELP);
  const [handle, setHandle] = useState(TELEGRAM_HANDLE);
  const [body, setBody] = useState("");

  useEffect(() => {
    void fetchContent()
      .then((data: { telegram?: string; handle?: string; cms?: { slug: string; body: string }[] } | null) => {
        if (data?.telegram) setTelegram(data.telegram);
        if (data?.handle) setHandle(data.handle);
        const page = data?.cms?.find((p) => p.slug === "support");
        if (page?.body) setBody(page.body);
      })
      .catch(() => {});
  }, []);

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
          <h1 className="text-[17px] font-semibold">{t.customerService}</h1>
          <span className="w-9" />
        </header>

        <p className="mb-4 text-center text-[13px] text-white/60">{t.onlineHours}</p>

        <a
          href={telegram}
          target="_blank"
          rel="noreferrer"
          className="deposit-card mb-3 flex items-center gap-3 p-4"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2aa1d8] text-lg font-bold">
            T
          </span>
          <span>
            <span className="block font-medium">{t.telegram}</span>
            <span className="text-[12px] text-white/50">{handle}</span>
          </span>
        </a>

        <Link href="/faq" className="deposit-card mb-3 flex items-center gap-3 p-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#5b4dff] text-lg">
            ?
          </span>
          <span>
            <span className="block font-medium">{t.faq}</span>
            <span className="text-[12px] text-white/50">{t.warmReminder}</span>
          </span>
        </Link>

        <div className="deposit-card p-4">
          <p className="font-medium">{t.liveChat}</p>
          <p className="mt-2 text-[13px] leading-6 text-white/65">{body || t.warmFooter}</p>
        </div>
      </div>
    </div>
  );
}
