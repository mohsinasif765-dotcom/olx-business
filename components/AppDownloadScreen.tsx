"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { useLanguage } from "@/lib/i18n";
import {
  canPromptInstall,
  clearDeferredInstall,
  initPwaInstall,
  isStandaloneApp,
  promptInstall,
} from "@/lib/pwa-install";

function detectPlatform() {
  if (typeof navigator === "undefined") return "other" as const;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios" as const;
  if (/Android/i.test(ua)) return "android" as const;
  return "other" as const;
}

function isInAppBrowser() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /FBAN|FBAV|Instagram|Line\/|WhatsApp|Twitter|MicroMessenger/i.test(ua);
}

export function AppDownloadScreen() {
  const { t } = useLanguage();
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");
  const [inApp, setInApp] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    initPwaInstall();
    setInstalled(isStandaloneApp());
    setPlatform(detectPlatform());
    setInApp(isInAppBrowser());
    setCanPrompt(canPromptInstall());

    const onInstalled = () => {
      setInstalled(true);
      setShowGuide(false);
      clearDeferredInstall();
    };
    const onPrompt = () => setCanPrompt(true);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("beforeinstallprompt", onPrompt);
    const timer = window.setInterval(() => setCanPrompt(canPromptInstall()), 700);

    return () => {
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.clearInterval(timer);
    };
  }, []);

  async function install() {
    if (installed) return;
    setBusy(true);
    try {
      if (canPromptInstall()) {
        const ok = await promptInstall();
        if (ok) {
          setInstalled(true);
          return;
        }
      }
      setShowGuide(true);
    } finally {
      setBusy(false);
    }
  }

  const steps =
    platform === "ios"
      ? [t.installIosHint, t.install2, t.install3]
      : [t.installAndroidHint, t.install2, t.install3];

  return (
    <div className="star-field">
      <div className="page-enter mx-auto min-h-screen w-full max-w-[430px] px-4 pb-28 pt-3">
        <header className="mb-8 flex items-center justify-between">
          <Link
            href="/me"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg"
          >
            ‹
          </Link>
          <h1 className="text-[17px] font-semibold">{t.appDownload}</h1>
          <span className="w-9" />
        </header>

        <div className="mb-6 flex flex-col items-center text-center">
          <BrandLogo size={88} variant="splash" />
          <h2 className="mt-4 text-[22px] font-semibold">OLX Business</h2>
          <p className="mt-2 max-w-[300px] text-[13px] leading-5 text-white/55">
            {installed ? t.installHomeReady : t.installHomeAfter}
          </p>
        </div>

        {inApp ? (
          <p className="mb-4 rounded-xl border border-[#ffd27a]/25 bg-[#ffd27a]/10 px-3 py-3 text-center text-[13px] leading-5 text-[#ffd27a]">
            {t.installOpenInBrowser}
          </p>
        ) : null}

        <button
          type="button"
          className={`store-btn store-download ${installed ? "is-on" : ""}`}
          onClick={() => void install()}
          disabled={busy || installed}
        >
          {installed ? t.alreadyInstalled : busy ? t.loading : t.installNow}
        </button>

        {installed ? (
          <p className="mt-4 rounded-xl border border-[#3dff9a]/25 bg-[#3dff9a]/10 px-3 py-3 text-center text-[13px] leading-5 text-[#3dff9a]">
            {t.installHomeReady}
          </p>
        ) : (
          <p className="mt-3 text-center text-[12px] leading-5 text-white/50">{t.installHomeAfter}</p>
        )}

        {!installed && (showGuide || !canPrompt) ? (
          <div className="deposit-card mt-5 space-y-3 p-4">
            <p className="text-[13px] font-semibold text-[#3dff9a]">{t.installTitle}</p>
            <ol className="space-y-2 text-[12px] leading-5 text-white/80">
              {steps.map((step, i) => (
                <li key={i}>
                  {i + 1}. {step}
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </div>
  );
}
