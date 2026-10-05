"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { useLanguage } from "@/lib/i18n";

export function AppDownloadScreen() {
  const { t } = useLanguage();
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const appUrl = origin || "https://olx-business.app";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

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
          <h1 className="text-[17px] font-semibold">{t.appDownload}</h1>
          <span className="w-9" />
        </header>

        <div className="mb-4 flex flex-col items-center">
          <BrandLogo size={88} />
          <h2 className="mt-3 text-[22px] font-semibold">OLX Business</h2>
          <p className="mt-1 text-[12px] text-white/50">V1.0</p>
          <p className="mt-2 max-w-[280px] text-center text-[13px] leading-5 text-white/70">
            {t.appTagline}
          </p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <a href={appUrl} className="store-btn store-android">
            <AndroidMark />
            <span>
              <span className="block text-[10px] opacity-80">GET IT ON</span>
              {t.downloadAndroid}
            </span>
          </a>
          <a href={appUrl} className="store-btn store-ios">
            <AppleMark />
            <span>
              <span className="block text-[10px] opacity-80">Download on the</span>
              {t.downloadIos}
            </span>
          </a>
        </div>

        <section className="deposit-card mb-4 p-4 text-center">
          <p className="mb-3 text-[12px] text-white/55">{t.scanToInstall}</p>
          <div className="mx-auto mb-3 flex h-[168px] w-[168px] items-center justify-center rounded-xl bg-white p-2">
            <div className="relative h-full w-full">
              <AppQr value={appUrl} />
              <span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-lg bg-white">
                <BrandLogo size={36} />
              </span>
            </div>
          </div>
          <p className="mb-3 break-all text-[11px] text-[#9ec6ff]">{appUrl}</p>
          <div className="flex gap-2">
            <button type="button" className="invite-copy flex-1" onClick={copyLink}>
              {copied ? t.copied : t.copy}
            </button>
            <Link href="/home" className="invite-copy flex-1 text-center leading-[28px]">
              {t.openApp}
            </Link>
          </div>
        </section>

        <section className="deposit-card mb-4 p-4">
          <h3 className="mb-3 text-[14px] font-semibold">{t.installTitle}</h3>
          <ol className="space-y-2 text-[12px] leading-5 text-white/70">
            <li className="flex gap-2">
              <span className="step-no">1</span>
              {t.install1}
            </li>
            <li className="flex gap-2">
              <span className="step-no">2</span>
              {t.install2}
            </li>
            <li className="flex gap-2">
              <span className="step-no">3</span>
              {t.install3}
            </li>
          </ol>
        </section>

        <section className="deposit-card mb-4 p-4">
          <h3 className="mb-3 text-[14px] font-semibold">{t.appFeatures}</h3>
          <ul className="space-y-2 text-[13px] text-white/75">
            <li>• {t.feat1}</li>
            <li>• {t.feat2}</li>
            <li>• {t.feat3}</li>
          </ul>
        </section>

        <section className="wd-reminder">
          <h3 className="mb-2 text-[14px] font-semibold text-[#ffd27a]">{t.reqTitle}</h3>
          <p className="text-[12px] leading-5 text-white/70">{t.reqBody}</p>
        </section>
      </div>
    </div>
  );
}

function AndroidMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.6 9.5l1.4-2.4-.9-.5-1.5 2.5A7.4 7.4 0 0012 8.2a7.4 7.4 0 00-4.6.9L5.9 6.6l-.9.5 1.4 2.4A6.7 6.7 0 004.2 14v.2h15.6V14a6.7 6.7 0 00-2.2-4.5zM8.2 12.4a.8.8 0 11.8-.8.8.8 0 01-.8.8zm7.6 0a.8.8 0 11.8-.8.8.8 0 01-.8.8zM6.2 15.4h11.6v5.2H6.2z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.7 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-.1 2.9-2.3c.7-1.2 1-2.3 1-2.4-.1 0-2.3-.9-2.3-3.5zM14.8 5.6c.6-.8 1.1-1.9.9-3-1 .1-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.2-.6 2.9-1.4z" />
    </svg>
  );
}

function AppQr({ value }: { value: string }) {
  const size = 25;
  const cells = useMemo(() => {
    const grid: boolean[] = [];
    for (let i = 0; i < size * size; i += 1) {
      const code = value.charCodeAt(i % value.length) + i * 17;
      grid.push(code % 3 !== 0);
    }
    function finder(x: number, y: number) {
      for (let r = 0; r < 7; r += 1) {
        for (let c = 0; c < 7; c += 1) {
          const on =
            r === 0 || r === 6 || c === 0 || c === 6 || (r > 1 && r < 5 && c > 1 && c < 5);
          grid[(y + r) * size + (x + c)] = on;
        }
      }
    }
    finder(0, 0);
    finder(size - 7, 0);
    finder(0, size - 7);
    return grid;
  }, [value]);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full">
      <rect width={size} height={size} fill="#fff" />
      {cells.map((on, i) =>
        on ? (
          <rect key={i} x={i % size} y={Math.floor(i / size)} width="1" height="1" fill="#111" />
        ) : null
      )}
    </svg>
  );
}
