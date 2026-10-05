"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="star-field">
      <div className="page-enter mx-auto flex min-h-screen w-full max-w-[430px] flex-col items-center justify-center px-6 pb-28 text-center">
        <p className="text-[42px] font-semibold text-white/25">404</p>
        <h1 className="mt-2 text-[20px] font-semibold">{t.pageNotFound}</h1>
        <p className="mt-2 text-[13px] text-white/55">{t.pageNotFoundHint}</p>
        <Link href="/home" className="vip-recharge-btn mt-6 w-full max-w-[280px]">
          {t.goHome}
        </Link>
      </div>
    </div>
  );
}
