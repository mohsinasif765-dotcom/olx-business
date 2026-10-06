"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { useLanguage } from "@/lib/i18n";
import { clearDeferredInstall, promptInstall } from "@/lib/pwa-install";

export function AppDownloadScreen() {
  const { t } = useLanguage();
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    if (window.matchMedia("(display-mode: standalone)").matches || nav.standalone) {
      setInstalled(true);
    }
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
      const ok = await promptInstall();
      if (ok) setInstalled(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="star-field">
      <div className="page-enter mx-auto min-h-screen w-full max-w-[430px] px-4 pb-28 pt-3">
        <header className="mb-8 flex items-center justify-between">
          <Link
            href="/home"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg"
          >
            ‹
          </Link>
          <h1 className="text-[17px] font-semibold">{t.appDownload}</h1>
          <span className="w-9" />
        </header>

        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo size={88} />
          <h2 className="mt-4 text-[22px] font-semibold">OLX Business</h2>
        </div>

        <button
          type="button"
          className={`store-btn store-download ${installed ? "is-on" : ""}`}
          onClick={() => void install()}
          disabled={busy}
        >
          {installed ? t.alreadyInstalled : t.install}
        </button>
      </div>
    </div>
  );
}
