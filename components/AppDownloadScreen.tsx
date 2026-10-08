"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { useLanguage } from "@/lib/i18n";
import {
  canPromptInstall,
  clearDeferredInstall,
  ensureServiceWorker,
  initPwaInstall,
  isInAppBrowser,
  isStandaloneApp,
  openInChrome,
  promptInstall,
} from "@/lib/pwa-install";

export function AppDownloadScreen() {
  const { t } = useLanguage();
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [inApp, setInApp] = useState(false);

  useEffect(() => {
    initPwaInstall();
    void ensureServiceWorker();
    setInstalled(isStandaloneApp());
    setInApp(isInAppBrowser());

    const onInstalled = () => {
      setInstalled(true);
      clearDeferredInstall();
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  async function install() {
    if (installed) return;
    setBusy(true);
    try {
      if (isInAppBrowser()) {
        setInApp(true);
        openInChrome();
        return;
      }
      if (canPromptInstall()) {
        const result = await promptInstall();
        if (result.ok) setInstalled(true);
      }
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
        ) : null}
      </div>
    </div>
  );
}
