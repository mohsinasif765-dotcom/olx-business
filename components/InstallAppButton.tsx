"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { useLanguage } from "@/lib/i18n";
import {
  canPromptInstall,
  ensureServiceWorker,
  initPwaInstall,
  isInAppBrowser,
  isStandaloneApp,
  openInChrome,
  promptInstall,
} from "@/lib/pwa-install";

export function InstallAppButton({
  stopRowClick = true,
  onHint,
  onGuide,
}: {
  stopRowClick?: boolean;
  onHint?: (message: string) => void;
  onGuide?: () => void;
}) {
  const { t } = useLanguage();
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initPwaInstall();
    void ensureServiceWorker();
    if (isStandaloneApp()) {
      setHidden(true);
      return;
    }

    const sync = () => setReady(canPromptInstall());
    sync();
    window.addEventListener("olx-install-ready", sync);
    window.addEventListener("beforeinstallprompt", sync);
    window.addEventListener("olx-appinstalled", () => setHidden(true));
    window.addEventListener("appinstalled", () => setHidden(true));
    const timer = window.setInterval(sync, 800);
    return () => {
      window.removeEventListener("olx-install-ready", sync);
      window.removeEventListener("beforeinstallprompt", sync);
      window.clearInterval(timer);
    };
  }, []);

  if (hidden) return null;

  async function onInstall(event: MouseEvent<HTMLButtonElement>) {
    if (stopRowClick) event.stopPropagation();
    setBusy(true);
    try {
      if (isInAppBrowser()) {
        onHint?.(t.installOpenInBrowser);
        onGuide?.();
        openInChrome();
        return;
      }

      const ok = await promptInstall();
      if (ok) {
        setHidden(true);
        onHint?.(t.installHomeReady);
        return;
      }

      onHint?.(ready ? t.installTapPrompt : t.installWaitNetwork);
      onGuide?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={`pwa-install-btn${ready ? " is-ready" : ""}`}
      onClick={(e) => void onInstall(e)}
      disabled={busy}
      title={ready ? t.installTapPrompt : t.installWaitNetwork}
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
      {busy ? "…" : ready ? t.installNow : t.install}
    </button>
  );
}
