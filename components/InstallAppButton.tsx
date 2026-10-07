"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { useLanguage } from "@/lib/i18n";
import {
  canPromptInstall,
  ensureServiceWorker,
  initPwaInstall,
  isInAppBrowser,
  isIosDevice,
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
    const onReady = () => sync();
    const onInstalled = () => setHidden(true);
    window.addEventListener("olx-install-ready", onReady);
    window.addEventListener("beforeinstallprompt", onReady);
    window.addEventListener("appinstalled", onInstalled);
    const timer = window.setInterval(sync, 1000);
    return () => {
      window.removeEventListener("olx-install-ready", onReady);
      window.removeEventListener("beforeinstallprompt", onReady);
      window.removeEventListener("appinstalled", onInstalled);
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

      // prompt() must run in the same tap — no long awaits before this.
      if (canPromptInstall()) {
        const ok = await promptInstall();
        if (ok) {
          setHidden(true);
          onHint?.(t.installHomeReady);
          return;
        }
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
      {busy ? "…" : t.install}
    </button>
  );
}
