"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { useLanguage } from "@/lib/i18n";
import { canPromptInstall, initPwaInstall, isStandaloneApp, promptInstall } from "@/lib/pwa-install";

export function InstallAppButton({
  stopRowClick = true,
  onHint,
}: {
  stopRowClick?: boolean;
  onHint?: (message: string) => void;
}) {
  const { t } = useLanguage();
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    initPwaInstall();
    if (isStandaloneApp()) setHidden(true);
    const onInstalled = () => setHidden(true);
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  if (hidden) return null;

  async function onInstall(event: MouseEvent<HTMLButtonElement>) {
    if (stopRowClick) event.stopPropagation();
    setBusy(true);
    try {
      const ok = await promptInstall();
      if (ok) {
        setHidden(true);
        onHint?.(t.installHomeReady);
        return;
      }
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
      onHint?.(ios ? t.installIosHint : t.installAndroidHint);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="pwa-install-btn" onClick={(e) => void onInstall(e)} disabled={busy}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 4v11m0 0-4-4m4 4 4-4M5 18h14"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {busy ? "…" : t.install}
    </button>
  );
}
