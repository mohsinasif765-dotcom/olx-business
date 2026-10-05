"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { useLanguage } from "@/lib/i18n";

export function AboutScreen() {
  const { t } = useLanguage();

  return (
    <div className="star-field">
      <div className="page-enter mx-auto min-h-screen w-full max-w-[430px] px-4 pb-28 pt-3">
        <header className="mb-5 flex items-center justify-between">
          <Link
            href="/home"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg"
          >
            ‹
          </Link>
          <h1 className="text-[17px] font-semibold">{t.aboutUs}</h1>
          <span className="w-9" />
        </header>

        <div className="mb-4 flex justify-center">
          <div className="about-globe">
            <BrandLogo size={72} />
          </div>
        </div>

        <div className="about-version mb-5">{t.currentVersion}</div>

        <section className="mb-5 text-[13px] leading-6 text-white/80">
          <p className="mb-2 font-semibold text-white">{t.welcomeAbout}</p>
          <p>{t.aboutBody}</p>
        </section>

        <section className="mb-5 space-y-2 text-[13px] leading-6">
          <p>
            <span className="text-white/50">{t.companyNameLabel}: </span>
            <span className="font-medium">{t.companyName}</span>
          </p>
          <p>
            <span className="text-white/50">{t.companyAddressLabel}: </span>
            <span>{t.companyAddress}</span>
          </p>
        </section>

        <article className="about-cert mb-5 p-4">
          <p className="text-center text-[11px] font-semibold tracking-[0.14em] text-[#1a3a8a]">
            {t.companyProfile}
          </p>
          <p className="mt-1 text-center text-[10px] uppercase tracking-[0.12em] text-[#5b6b8a]">
            {t.privateCompany}
          </p>

          <div className="my-4 flex justify-center">
            <div className="about-seal">
              <BrandLogo size={52} />
            </div>
          </div>

          <h2 className="text-center text-[15px] font-semibold text-[#12224a]">{t.companyName}</h2>
          <p className="mt-2 text-center text-[11px] leading-5 text-[#3d4d6e]">{t.companyAddress}</p>

          <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-[#3d4d6e]">
            <p>
              {t.companyNo}
              <br />
              <span className="font-semibold text-[#12224a]">OB-2026-8841</span>
            </p>
            <p className="text-right">
              {t.regDate}
              <br />
              <span className="font-semibold text-[#12224a]">12 Jan 2026</span>
            </p>
          </div>
          <p className="mt-3 text-right text-[10px] text-[#5b6b8a]">
            {t.issued}: 05 Oct 2026
          </p>
        </article>

        <div className="flex gap-3">
          <Link href="/agreement" className="wd-ghost flex-1 text-[12px]">
            {t.viewAgreement}
          </Link>
          <Link href="/privacy" className="wd-ghost flex-1 text-[12px]">
            {t.viewPrivacy}
          </Link>
        </div>
      </div>
    </div>
  );
}
