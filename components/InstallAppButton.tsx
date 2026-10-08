"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { useLanguage } from "@/lib/i18n";
import {
  canPromptInstall,
  ensureServiceWorker,
  getInstallBlockReason,
  initPwaInstall,
  isAndroidDevice,
  isInAppBrowser,
  isStandaloneApp,
  openInChrome,
  promptInstall,
} from "@/lib/pwa-install";

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
    const onInstalled = () => {
      setHidden(true);
      onHint?.(t.installHomeReady);
    };
    window.addEventListener("olx-appinstalled", onInstalled);
    window.addEventListener("appinstalled", onInstalled);
    const timer = window.setInterval(sync, 1000);
    return () => {
      window.removeEventListener("olx-install-ready", sync);
      window.removeEventListener("beforeinstallprompt", sync);
      window.removeEventListener("olx-appinstalled", onInstalled);
      window.removeEventListener("appinstalled", onInstalled);
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- install listeners once per mount
  }, []);

  if (hidden) return null;

  async function onInstall(event: MouseEvent<HTMLButtonElement>) {
    if (stopRowClick) event.stopPropagation();
    setBusy(true);
    try {
      if (isInAppBrowser()) {
        onHint?.(t.installOpenInBrowser);
        openInChrome();
        return;
      }

      if (canPromptInstall()) {
        const result = await promptInstall();
        if (result.ok) {
          setHidden(true);
          onHint?.(t.installHomeReady);
          return;
        }
        if (result.reason === "dismissed") return;
      }

      // Android: Chrome may show its own Install bar — keep a one-line tip only.
      if (isAndroidDevice()) {
        onHint?.(t.installAndroidHint);
      }

      if (typeof console !== "undefined") {
        console.info("[olx-pwa] Install click without prompt", getInstallBlockReason());
      }
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
      data-pwa-ready={ready ? "1" : "0"}
      data-pwa-reason={getInstallBlockReason()}
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
