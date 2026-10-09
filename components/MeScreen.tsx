"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, ReactNode, useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { InstallAppButton } from "@/components/InstallAppButton";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { clearSession, getSessionAccount, maskAccount } from "@/lib/session";
import { useLanguage } from "@/lib/i18n";
import { displayName } from "@/lib/member-name";
import { TELEGRAM_HELP } from "@/lib/links";
import {
  canPromptInstall,
  ensureServiceWorker,
  initPwaInstall,
  isInAppBrowser,
  isStandaloneApp,
  openInChrome,
  promptInstall,
} from "@/lib/pwa-install";

type MeFlags = { rechargeOn: boolean; withdrawOn: boolean; transferOn: boolean };

export function MeScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [account, setAccount] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [vip, setVip] = useState("Member");
  const [siteName, setSiteName] = useState("OLX Business");
  const [telegram, setTelegram] = useState(TELEGRAM_HELP);
  const [flags, setFlags] = useState<MeFlags>({ rechargeOn: true, withdrawOn: true, transferOn: true });
  const [showAccount, setShowAccount] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [installHint, setInstallHint] = useState("");
  const [photoHint, setPhotoHint] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [inAppBrowser, setInAppBrowser] = useState(false);
  const [alreadyInstalled, setAlreadyInstalled] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initPwaInstall();
    void ensureServiceWorker();
    setInAppBrowser(isInAppBrowser());
    setAlreadyInstalled(isStandaloneApp());
    const session = getSessionAccount();
    setAccount(session);
    const qs = session ? `?account=${encodeURIComponent(session)}` : "";
    void fetch(`/api/me${qs}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: {
        account?: string;
        name?: string;
        avatarUrl?: string;
        vip?: string;
        siteName?: string;
        telegram?: string;
        flags?: MeFlags;
      } | null) => {
        if (!data) return;
        if (data.account) setAccount(data.account);
        if (data.name) setName(data.name);
        if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
        setVip(data.vip && data.vip !== "—" ? data.vip : "Member");
        if (data.siteName) setSiteName(data.siteName);
        if (data.telegram) setTelegram(data.telegram);
        if (data.flags) setFlags(data.flags);
      })
      .catch(() => {});
  }, []);

  async function onPickPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !account || uploadingPhoto) return;
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      setPhotoHint(t.photoFailed);
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setPhotoHint(t.photoFailed);
      return;
    }
    setUploadingPhoto(true);
    setPhotoHint(t.photoUploading);
    try {
      const body = new FormData();
      body.set("account", account);
      body.set("file", file);
      const res = await fetch("/api/me/avatar", { method: "POST", body });
      const data = (await res.json()) as { avatarUrl?: string; error?: string };
      if (!res.ok || !data.avatarUrl) {
        setPhotoHint(t.photoFailed);
        return;
      }
      setAvatarUrl(data.avatarUrl);
      setPhotoHint(t.photoUpdated);
    } catch {
      setPhotoHint(t.photoFailed);
    } finally {
      setUploadingPhoto(false);
    }
  }

  function logout() {
    setLoggingOut(true);
    clearSession();
    window.setTimeout(() => router.push("/"), 280);
  }

  async function installApp() {
    if (alreadyInstalled) {
      setInstallHint(t.alreadyInstalled);
      return;
    }
    if (isInAppBrowser()) {
      setInAppBrowser(true);
      setInstallHint(t.installOpenInBrowser);
      openInChrome();
      return;
    }
    // Must call prompt() in the same tap — no long waits before this.
    if (canPromptInstall()) {
      const result = await promptInstall();
      if (result.ok) {
        setInstallHint(t.installHomeReady);
        setAlreadyInstalled(true);
      }
    }
  }

  return (
    <div className="star-field">
      <div className="page-enter mx-auto min-h-screen w-full max-w-[430px] px-4 pb-28 pt-3">
        <header className="me-topbar anim-up flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <BrandLogo size={36} />
            <span className="truncate text-[16px] font-semibold text-white">{siteName}</span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <LanguageSwitch globe />
            <Link href="/" className="me-login-ico" aria-label={t.login}>
              <HeaderLoginIcon />
            </Link>
          </div>
        </header>

        {account ? (
          <>
            <section className="me-user anim-up delay-1 mb-3 flex items-center gap-3 px-4 py-3.5">
              <button
                type="button"
                className="me-avatar me-avatar-btn"
                aria-label={t.changePhoto}
                disabled={uploadingPhoto}
                onClick={() => fileRef.current?.click()}
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="me-avatar-img" />
                ) : (
                  <UserIcon />
                )}
                <span className="me-avatar-cam" aria-hidden>
                  <CameraIcon />
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => void onPickPhoto(e)}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold tracking-wide">
                  {name || displayName("", account)}
                </p>
                <p className="mt-0.5 min-w-0 truncate text-[12px] text-white/55">
                  {showAccount ? account : maskAccount(account)}
                </p>
                <button
                  type="button"
                  className="mt-1 text-[11px] font-medium text-[#9ec6ff]"
                  disabled={uploadingPhoto}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploadingPhoto ? t.photoUploading : t.changePhoto}
                </button>
              </div>
              <button
                type="button"
                className="me-eye"
                aria-label={showAccount ? "Hide number" : "Show number"}
                onClick={() => setShowAccount((open) => !open)}
              >
                {showAccount ? <EyeOffIcon /> : <EyeIcon />}
              </button>
              <span className="me-vip">{vip}</span>
            </section>
            {photoHint ? (
              <p className="mb-3 px-1 text-[12px] text-[#9ec6ff]">{photoHint}</p>
            ) : null}
          </>
        ) : (
          <Link
            href="/"
            className="me-user anim-up delay-1 mb-3 flex items-center gap-3 px-4 py-3.5"
          >
            <div className="me-avatar">
              <UserIcon />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium">{t.guest}</p>
              <p className="text-[12px] text-white/55">{t.tapToLogin}</p>
            </div>
            <span className="text-white/40">›</span>
          </Link>
        )}

        <section className="me-tools anim-up delay-2 mb-3 px-3 py-5">
          <div className="grid grid-cols-3 gap-y-6">
            {flags.rechargeOn ? <Tool href="/wallet/select" label={t.rechargeShort} icon={<RechargeIcon />} /> : null}
            {flags.withdrawOn ? <Tool href="/withdraw" label={t.withdraw} icon={<WithdrawIcon />} /> : null}
            <Tool href="/records" label={t.financialRecords} icon={<RecordsIcon />} />
            {flags.transferOn ? <Tool href="/transfer" label={t.transfer} icon={<TransferIcon />} /> : null}
            <a href={telegram} target="_blank" rel="noreferrer" className="me-tool">
              <span className="me-tool-icon me-tele">
                <TelegramIcon />
              </span>
              <span>{t.telegram}</span>
            </a>
            <Tool href="/support" label={t.support} icon={<HeadsetIcon />} />
            <Tool href="/team" label={t.team} icon={<TeamIcon />} />
          </div>
        </section>

        <section className="me-menu anim-up delay-3 mb-5 overflow-hidden">
          <Menu href="/support" icon={<HeadsetIcon />} label={t.contactService} />
          <button type="button" className="me-row w-full text-left" onClick={() => void installApp()}>
            <span className="me-row-icon">
              <InstallRowIcon />
            </span>
            <span className="flex-1">{t.appDownload}</span>
            {!alreadyInstalled ? <InstallAppButton onHint={setInstallHint} /> : null}
          </button>
          {inAppBrowser ? (
            <p className="border-t border-[#ffd27a]/20 bg-[#ffd27a]/10 px-4 py-3 text-[12px] leading-5 text-[#ffd27a]">
              {t.installOpenInBrowser}
            </p>
          ) : null}
          {installHint ? (
            <p className="border-t border-white/8 bg-black/20 px-4 py-3 text-[12px] leading-5 text-[#9ec6ff]">
              {installHint}
            </p>
          ) : null}
          <Menu href="/faq" icon={<FaqRowIcon />} label={t.faq} />
          <Menu href="/me/password" icon={<DotsIcon />} label={t.loginPassword} />
          <Menu href="/me/security" icon={<ShieldIcon />} label={t.securityPassword} />
          <Menu href="/about" icon={<InfoIcon />} label={t.aboutUs} last />
        </section>

        {account ? (
          <button
            type="button"
            className="me-logout anim-up delay-4"
            onClick={logout}
            disabled={loggingOut}
          >
            {t.logout}
          </button>
        ) : (
          <Link href="/" className="me-logout anim-up delay-4">
            {t.login}
          </Link>
        )}
      </div>
    </div>
  );
}

function Tool({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  return (
    <Link href={href} className="me-tool">
      <span className="me-tool-icon">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function Menu({
  href,
  icon,
  label,
  last,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  last?: boolean;
}) {
  return (
    <Link href={href} className={`me-row ${last ? "is-last" : ""}`}>
      <span className="me-row-icon">{icon}</span>
      <span className="flex-1">{label}</span>
      <span className="text-[20px] font-light text-white/35">›</span>
    </Link>
  );
}

function InstallRowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 4v11m0 0-4-4m4 4 4-4M5 18h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeaderLoginIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="10" cy="8" r="2.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5.5 18c.7-2.6 2.5-4 4.5-4s3.8 1.4 4.5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M16 8.5h5M18.6 6l2.4 2.5L18.6 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8.4" r="3.3" stroke="#b9d4ff" strokeWidth="1.7" />
      <path d="M5.2 18.4c1.3-3.1 3.7-4.6 6.8-4.6s5.5 1.5 6.8 4.6" stroke="#b9d4ff" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h3l2-2h6l2 2h3v11H4V8z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}

function RechargeIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="6" width="17" height="12.5" rx="2.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.5 10h17" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function WithdrawIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <rect x="6" y="3.5" width="12" height="17" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9.5 12h5M12 9.5v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function RecordsIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="3.5" width="14" height="17" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function TransferIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M7 8.5h10.5M14.5 5.5 18 8.5l-3.5 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 15.5H6.5M9.5 12.5 6 15.5l3.5 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M20.2 5.2 3.9 11.5c-.8.3-.8.8-.1 1l4.2 1.3 1.6 5c.2.6.6.7 1 .4l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8L21.4 6.2c.2-1-.4-1.5-1.2-1z"
        fill="#fff"
      />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8.5" r="2.3" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16" cy="9" r="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4.6 17.5c.6-2.3 2.3-3.5 4.4-3.5h.6c2.1 0 3.8 1.2 4.4 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M13.8 17.5c.4-1.6 1.6-2.6 3.2-2.6h.3c1.5 0 2.6 1 3.1 2.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function FaqRowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9.7 10a2.3 2.3 0 1 1 3.2 2.1c-.6.4-.9.8-.9 1.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="16.4" r=".75" fill="currentColor" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="6" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="18" cy="12" r="1.6" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 4.2 5.2 7v5.2c0 3.8 2.8 6.3 6.8 7.3 4-1 6.8-3.5 6.8-7.3V7L12 4.2Z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function HeadsetIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M5 13.2V11a7 7 0 0 1 14 0v2.2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3.6" y="12.2" width="3.8" height="5.6" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
      <rect x="16.6" y="12.2" width="3.8" height="5.6" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 11v5.2M12 8.2h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.77 21.77 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.83 21.83 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
