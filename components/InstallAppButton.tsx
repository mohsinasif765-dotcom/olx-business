"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { initPwaInstall, promptInstall } from "@/lib/pwa-install";

export function InstallAppButton() {
  const { t } = useLanguage();
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    initPwaInstall();
    const nav = window.navigator as Navigator & { standalone?: boolean };
    if (window.matchMedia("(display-mode: standalone)").matches || nav.standalone) {
      setHidden(true);
    }
    const onInstalled = () => setHidden(true);
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  if (hidden) return null;

  async function onInstall() {
    setBusy(true);
    try {
      const ok = await promptInstall();
      if (ok) setHidden(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className="pwa-install-btn"
      onClick={(event) => {
        event.stopPropagation();
        void onInstall();
      }}
      disabled={busy}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 4v11m0 0-4-4m4 4 4-4M5 18h14"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {t.install}
    </button>
  );
}
