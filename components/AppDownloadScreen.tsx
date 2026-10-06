"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { fetchContent } from "@/lib/fetch-content";
import { useLanguage } from "@/lib/i18n";
import { clearDeferredInstall, saveAppShortcut, waitForInstallPrompt } from "@/lib/pwa-install";

export function AppDownloadScreen() {
  const { t } = useLanguage();
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [siteName, setSiteName] = useState("OLX Business");
  const [blurb, setBlurb] = useState("");
  const [hint, setHint] = useState("");
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
    const nav = window.navigator as Navigator & { standalone?: boolean };
    if (window.matchMedia("(display-mode: standalone)").matches || nav.standalone) {
      setInstalled(true);
    }
    const onInstalled = () => {
      setInstalled(true);
      clearDeferredInstall();
      setHint("");
      setBusy(false);
    };
    window.addEventListener("appinstalled", onInstalled);
    void fetchContent()
      .then((data: { siteName?: string; cms?: { slug: string; body: string }[] } | null) => {
        if (data?.siteName) setSiteName(data.siteName);
        const page = data?.cms?.find((p) => p.slug === "app");
        if (page?.body) setBlurb(page.body);
      })
      .catch(() => {});
    return () => {
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const appUrl = origin ? `${origin}/app-download` : "https://olx-business.app/app-download";

  async function downloadApp() {
    if (installed) {
      setHint(t.alreadyInstalled);
      return;
    }
    setBusy(true);
    setHint("");
    try {
      if ("serviceWorker" in navigator) {
        await navigator.serviceWorker.ready.catch(() => null);
      }
      const pending = await waitForInstallPrompt(2800);
      if (pending) {
        await pending.prompt();
        const choice = await pending.userChoice;
        clearDeferredInstall();
        if (choice.outcome === "accepted") {
          setInstalled(true);
          return;
        }
      }
      saveAppShortcut(origin || window.location.origin);
      document.getElementById("install-steps")?.scrollIntoView({ behavior: "smooth", block: "start" });
      const ios = /iPhone|iPad|iPod/i.test(window.navigator.userAgent);
      setHint(ios ? t.installIosHint : t.installAndroidHint);
    } finally {
      setBusy(false);
    }
  }

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

        <section className="app-hero mb-4 px-4 pb-5 pt-6 text-center">
          <p className="app-kicker">{t.appHeroKicker}</p>
          <div className="app-logo-ring mx-auto mt-4">
            <BrandLogo size={72} />
          </div>
          <h2 className="mt-4 text-[22px] font-semibold tracking-tight">{siteName}</h2>
          <p className="mt-1 text-[12px] text-white/45">{t.versionLabel}</p>
          <p className="mx-auto mt-3 max-w-[300px] text-[13px] leading-5 text-white/72">
            {blurb || t.appTagline}
          </p>
          <p className="mt-2 text-[12px] leading-5 text-[#9ec6ff]">{t.addToPhone}</p>
        </section>

        <button
          type="button"
          className={`store-btn store-download mb-3 ${installed ? "is-on" : ""}`}
          onClick={() => void downloadApp()}
          disabled={busy}
        >
          <DownloadMark />
          <span>{installed ? t.alreadyInstalled : t.downloadAppCta}</span>
        </button>
        <p className="mb-4 text-center text-[11px] leading-4 text-white/40">{t.phoneInstall}</p>

        {hint ? <p className="app-hint mb-4">{hint}</p> : null}

        <section className="app-panel mb-4 p-4 text-center">
          <p className="mb-3 text-[12px] font-medium tracking-[0.12em] text-white/50 uppercase">
            {t.scanToInstall}
          </p>
          <div className="app-qr mx-auto mb-3">
            <AppQr value={appUrl} />
            <span className="app-qr-badge">
              <BrandLogo size={28} />
            </span>
          </div>
          <p className="mb-3 break-all px-1 text-[11px] text-white/45">{appUrl}</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="app-ghost" onClick={() => void copyLink()}>
              {copied ? t.copied : t.copy}
            </button>
            <Link href="/home" className="app-ghost">
              {t.openApp}
            </Link>
          </div>
        </section>

        <section id="install-steps" className="app-panel mb-4 p-4">
          <h3 className="mb-4 text-[14px] font-semibold">{t.installTitle}</h3>
          <ol className="space-y-3">
            {[t.install1, t.install2, t.install3].map((step, index) => (
              <li key={step} className="app-step">
                <span className="app-step-no">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="app-panel mb-4 p-4">
          <h3 className="mb-3 text-[14px] font-semibold">{t.appFeatures}</h3>
          <ul className="space-y-2.5">
            {[t.feat1, t.feat2, t.feat3].map((feat) => (
              <li key={feat} className="app-feat">
                <span className="app-feat-dot" />
                {feat}
              </li>
            ))}
          </ul>
        </section>

        <section className="app-note">
          <h3 className="mb-1.5 text-[13px] font-semibold text-[#ffd27a]">{t.reqTitle}</h3>
          <p className="text-[12px] leading-5 text-white/65">{t.reqBody}</p>
        </section>
      </div>
    </div>
  );
}

function DownloadMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4v11m0 0l-4-4m4 4l4-4M5 18h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
          <rect key={i} x={i % size} y={Math.floor(i / size)} width="1" height="1" fill="#0a1a4a" />
        ) : null
      )}
    </svg>
  );
}
