"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { useLanguage } from "@/lib/i18n";
import { canPromptInstall, clearDeferredInstall, initPwaInstall, isStandaloneApp, promptInstall } from "@/lib/pwa-install";

export function AppDownloadScreen() {
  const { t } = useLanguage();
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);
  const [hint, setHint] = useState("");

  useEffect(() => {
    initPwaInstall();
    setInstalled(isStandaloneApp());
    setCanPrompt(canPromptInstall());

    const onInstalled = () => {
      setInstalled(true);
      clearDeferredInstall();
    };
    const onPrompt = () => setCanPrompt(true);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("beforeinstallprompt", onPrompt);
    const timer = window.setInterval(() => setCanPrompt(canPromptInstall()), 800);
    return () => {
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.clearInterval(timer);
    };
  }, []);

  async function install() {
    if (installed) return;
    setBusy(true);
    setHint("");
    try {
      const ok = await promptInstall();
      if (ok) {
        setInstalled(true);
        return;
      }
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
      setHint(ios ? t.installIosHint : t.installAndroidHint);
    } finally {
      setBusy(false);
    }
  }

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

        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo size={88} variant="splash" />
          <h2 className="mt-4 text-[22px] font-semibold">OLX Business</h2>
          <p className="mt-2 max-w-[280px] text-[13px] leading-5 text-white/55">{t.phoneInstall}</p>
        </div>

        <button
          type="button"
          className={`store-btn store-download ${installed ? "is-on" : ""}`}
          onClick={() => void install()}
          disabled={busy || installed}
        >
          {installed ? t.alreadyInstalled : canPrompt ? t.installNow : t.install}
        </button>

        {hint ? (
          <p className="mt-4 rounded-xl border border-[#ffd27a]/25 bg-[#ffd27a]/10 px-3 py-3 text-center text-[13px] leading-5 text-[#ffd27a]">
            {hint}
          </p>
        ) : null}

        <div className="deposit-card mt-5 space-y-3 p-4">
          <p className="text-[13px] font-semibold">{t.installTitle}</p>
          <ol className="space-y-2 text-[12px] leading-5 text-white/70">
            <li>1. {t.install1}</li>
            <li>2. {t.install2}</li>
            <li>3. {t.install3}</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
