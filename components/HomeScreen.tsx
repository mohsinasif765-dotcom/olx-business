"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { useLanguage } from "@/lib/i18n";
import { moneyPrefix } from "@/lib/currencies";
import { rememberFundCurrency } from "@/lib/display-currency";
import { inviteLink } from "@/lib/invite";
import { getSessionAccount } from "@/lib/session";
import { loadWallets } from "@/lib/wallets";
import { fillWithdrawLogs, SAMPLE_WITHDRAW_LOGS } from "@/lib/withdraw-logs";

const LOG_ITEM_HEIGHT = 58;
const LOG_BUFFER = 3;

export function HomeScreen() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<{ user: string; amount: string }[]>(SAMPLE_WITHDRAW_LOGS);
  const [logIndex, setLogIndex] = useState(0);
  const [logSnap, setLogSnap] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [wallets, setWallets] = useState({ invest: 0, brokerage: 0 });
  const [inviteHref, setInviteHref] = useState("https://olx-business.app/register");
  const [siteName, setSiteName] = useState("OLX Business");
  const [stats, setStats] = useState({ users: 0, revenue: 0 });
  const [currency, setCurrency] = useState("PKR");
  const [walletMode, setWalletMode] = useState("pkr");
  const [usdtToPkrRate, setUsdtToPkrRate] = useState(280);
  const cash = moneyPrefix(currency);
  const totalAssets = wallets.invest + wallets.brokerage;
  const dual = walletMode === "dual";
  const showPkrBeside =
    (currency === "USDT" || dual) && usdtToPkrRate > 0;
  const approxPkr = showPkrBeside
    ? Number((totalAssets * usdtToPkrRate).toFixed(2))
    : null;

  useEffect(() => {
    const account = getSessionAccount();
    setLoggedIn(Boolean(account));
    const origin = window.location.origin;

    function loadHome() {
      const params = new URLSearchParams();
      if (account) params.set("account", account);
      const qs = params.toString() ? `?${params}` : "";
      void fetch(`/api/home${qs}`, { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: {
          siteName?: string;
          users?: number;
          revenue?: number;
          displayCurrency?: string;
          walletMode?: string;
          usdtToPkrRate?: number;
          logs?: { user: string; amount: string }[];
          wallets?: { invest: number; brokerage: number; invite?: string };
        } | null) => {
          if (!data) {
            void loadWallets().then(setWallets);
            return;
          }
          if (data.siteName) setSiteName(data.siteName);
          const mode = String(data.walletMode || "").toLowerCase();
          setWalletMode(mode === "usdt" || mode === "dual" ? mode : "pkr");
          const code =
            mode === "pkr"
              ? "PKR"
              : "USDT";
          setCurrency(code);
          rememberFundCurrency(code);
          if (data.usdtToPkrRate) setUsdtToPkrRate(Number(data.usdtToPkrRate) || 280);
          setStats({ users: Number(data.users) || 0, revenue: Number(data.revenue) || 0 });
          const incoming = Array.isArray(data.logs) ? data.logs : [];
          const hasFiat = incoming.some((row) => !/USDT\s*$/i.test(row.amount));
          setLogs(hasFiat ? fillWithdrawLogs(incoming) : SAMPLE_WITHDRAW_LOGS);
          if (data.wallets) {
            setWallets({ invest: data.wallets.invest, brokerage: data.wallets.brokerage });
          } else {
            void loadWallets().then(setWallets);
          }
          const invite = data.wallets?.invite || "";
          setInviteHref(invite ? inviteLink(origin, invite) : `${origin}/register`);
        })
        .catch(() => {
          void loadWallets().then(setWallets);
          setInviteHref(`${origin}/register`);
        });
    }

    loadHome();
    const onFocus = () => loadHome();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    setLogs(SAMPLE_WITHDRAW_LOGS);
  }, [SAMPLE_WITHDRAW_LOGS]);

  const ticker = logs.length ? logs : SAMPLE_WITHDRAW_LOGS;
  const logCount = ticker.length;
  const reel = [...ticker, ...ticker.slice(0, LOG_BUFFER)];

  useEffect(() => {
    setLogIndex(0);
    setLogSnap(false);
    const tick = window.setInterval(() => {
      setLogIndex((current) => (current >= logCount ? current : current + 1));
    }, 2400);
    return () => window.clearInterval(tick);
  }, [logCount]);

  useEffect(() => {
    if (logIndex !== logCount) return;
    const hold = window.setTimeout(() => {
      setLogSnap(true);
      setLogIndex(0);
    }, 560);
    return () => window.clearTimeout(hold);
  }, [logIndex, logCount]);

  useEffect(() => {
    if (!logSnap) return;
    const unlock = window.setTimeout(() => setLogSnap(false), 40);
    return () => window.clearTimeout(unlock);
  }, [logSnap]);

  return (
    <div id="app" className="star-field">
      <div className="app-main page-enter mx-auto min-h-screen w-full max-w-[430px] px-4 pb-28 pt-3">
        <header className="app-topbar mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrandLogo size={42} />
            <span className="text-[17px] font-semibold text-white">{siteName}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-white/85">
            <LanguageSwitch globe />
            {loggedIn ? (
              <Link href="/me" className="text-[#9ec6ff]">
                {t.me}
              </Link>
            ) : (
              <Link href="/" className="text-[#9ec6ff]">
                {t.login}
              </Link>
            )}
          </div>
        </header>

        <div className="home-banner mb-4 h-[132px] overflow-hidden rounded-2xl">
          <img
            src="/home-banner.jpg"
            alt="OLX Business"
            className="h-full w-full object-cover object-center"
          />
        </div>

        <section className="show-top mb-4">
          <p className="text-center text-[13px] tracking-[0.18em] text-white/60">
            {t.totalAssets}
          </p>
          {dual ? (
            <p className="mt-2 text-center text-[11px] tracking-[0.16em] text-[#9ee7ff]/80">PKR + USDT</p>
          ) : null}
          <p className="total-amount mt-3 text-center text-[42px] font-semibold leading-none">
            {cash} {totalAssets.toFixed(2)}
          </p>
          {approxPkr != null ? (
            <p className="mt-2 text-center text-[13px] text-white/45">
              ≈ Rs {approxPkr.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          ) : null}

          <div className="mt-8 mb-8 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white/5 px-3 py-3 text-center">
              <p className="text-[12px] text-white/55">{t.investWallet}</p>
              <p className="mt-2 text-[18px] font-medium text-[#9ee7ff]">
                {cash} {wallets.invest.toFixed(2)}
              </p>
              {showPkrBeside ? (
                <p className="mt-1 text-[11px] text-white/40">
                  ≈ Rs {(wallets.invest * usdtToPkrRate).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </p>
              ) : null}
            </div>
            <div className="rounded-2xl bg-white/5 px-3 py-3 text-center">
              <p className="text-[12px] text-white/55">{t.brokerageWallet}</p>
              <p className="mt-2 text-[18px] font-medium text-[#c6b8ff]">
                {cash} {wallets.brokerage.toFixed(2)}
              </p>
              {showPkrBeside ? (
                <p className="mt-1 text-[11px] text-white/40">
                  ≈ Rs {(wallets.brokerage * usdtToPkrRate).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </p>
              ) : null}
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-4 gap-y-6">
            <Action href="/wallet/select" label={t.rechargeShort} icon={<RechargeIcon />} />
            <Action href="/withdraw" label={t.withdraw} icon={<WithdrawIcon />} />
            <Action href="/vip" label={t.vip} icon={<VipIcon />} />
            <Action href="/activity" label={t.activity} icon={<ActivityIcon />} />
            <Action href="/faq" label={t.faq} icon={<FaqIcon />} />
            <Action href="/invite" label={t.invite} icon={<InviteIcon />} />
            <Action href="/about" label={t.aboutUs} icon={<AboutIcon />} />
            <Action href="/app-download" label={t.appDownload} icon={<AppIcon />} />
          </div>
        </section>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <StatCard
            icon={<UsersIcon />}
            value={stats.users}
            label={t.cumulativeUsers}
          />
          <StatCard
            icon={<RevenueIcon />}
            value={stats.revenue}
            label={t.cumulativeRevenue}
            prefix={cash}
          />
        </div>

        <section className="mb-5">
          <h2 className="mb-2 text-center text-sm font-semibold text-white">
            {t.withdrawalLogs}
          </h2>
          <div className="log-ticker">
            <div
              className={`log-track ${logSnap ? "log-track-instant" : ""}`}
              style={{ transform: `translateY(-${logIndex * LOG_ITEM_HEIGHT}px)` }}
            >
              {reel.map((log, index) => {
                const slot = index - logIndex;
                const size =
                  slot === 2 ? "is-new" : slot === 1 ? "is-mid" : slot === 0 ? "is-top" : "is-away";
                return (
                  <div key={`${log.user}-${index}`} className={`log-item ${size}`}>
                    <div className="log-item-card">
                      {t.withdrawLog.replace("{user}", log.user).replace("{amount}", log.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mb-5">
          <h2 className="mb-3 px-1 text-[22px] font-semibold">{t.regulators}</h2>
          <div className="grid grid-cols-3 gap-2">
            <article className="pay-card px-2 py-3 text-center">
              <p className="text-[12px] font-semibold">{t.newCars}</p>
            </article>
            <article className="pay-card px-2 py-3 text-center">
              <p className="text-[12px] font-semibold">{t.usedCars}</p>
            </article>
            <article className="pay-card px-2 py-3 text-center">
              <p className="text-[12px] font-semibold">{currency === "PKR" ? "PKR" : currency}</p>
            </article>
          </div>
        </section>

        <section className="mb-2">
          <h2 className="mb-3 px-1 text-[22px] font-semibold">{t.shareTo}</h2>
          <div className="share-card px-4 py-4 text-center">
            <p className="mb-4 text-[13px] text-white/80">
              {t.shareLinkHint}
            </p>
            <div className="flex items-center justify-between gap-1">
              <ShareButton
                label="X"
                href={`https://x.com/intent/tweet?text=${encodeURIComponent(`OLX Business ${inviteHref}`)}`}
              >
                <XIcon />
              </ShareButton>
              <ShareButton
                label="Facebook"
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteHref)}`}
              >
                <FacebookIcon />
              </ShareButton>
              <ShareButton
                label="Telegram"
                href={`https://t.me/share/url?url=${encodeURIComponent(inviteHref)}&text=${encodeURIComponent("OLX Business")}`}
              >
                <TelegramShareIcon />
              </ShareButton>
              <ShareButton
                label="LinkedIn"
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(inviteHref)}`}
              >
                <LinkedInIcon />
              </ShareButton>
              <ShareButton
                label="WhatsApp"
                href={`https://wa.me/?text=${encodeURIComponent(`OLX Business ${inviteHref}`)}`}
              >
                <WhatsAppIcon />
              </ShareButton>
              <ShareButton label="Instagram" href="https://www.instagram.com/">
                <InstagramIcon />
              </ShareButton>
              <ShareButton label="TikTok" href="https://www.tiktok.com/">
                <TikTokIcon />
              </ShareButton>
              <CopyShareButton link={inviteHref} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  prefix,
}: {
  icon: ReactNode;
  value: number;
  label: string;
  prefix?: string;
}) {
  const shown = useCountUp(value, 1800);

  return (
    <div className="stat-card flex flex-col items-center rounded-[22px] px-3 py-5 text-center">
      <span className="stat-icon mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-full">
        {icon}
      </span>
      {prefix ? <p className="text-[13px] font-semibold text-white/90">{prefix}</p> : null}
      <p className={`font-semibold leading-tight ${prefix ? "text-[18px]" : "text-[20px]"}`}>
        {shown.toLocaleString("en-US", prefix
          ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
          : { maximumFractionDigits: 0 })}
      </p>
      <p className="mt-1 text-[12px] leading-4 text-white/55">{label}</p>
    </div>
  );
}

function useCountUp(target: number, duration: number) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setValue(target * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

function CopyShareButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copyLink}
      className="share-icon"
      aria-label={copied ? "Copied" : "Copy link"}
      title={copied ? "Copied" : "Copy link"}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
}

function ShareButton({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="share-icon"
      aria-label={label}
    >
      {children}
    </a>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.2 3H21l-6.5 7.4L22 21h-6.2l-4.4-5.8L6.2 21H3.4l7-8L2 3h6.3l4 5.3L18.2 3zm-1.1 16.2h1.7L7 4.7H5.2l11.9 14.5z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14.5 8.5V6.8c0-.7.5-1 1.2-1H17V3h-2.4C12 3 11 4.5 11 6.6V8.5H9v2.7h2V21h3.2v-9.8h2.4l.4-2.7h-2.8z" />
    </svg>
  );
}

function TelegramShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.5 4.4L2.9 11.6c-1.2.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.7.8.8 1.3.5l2.6-2.5 5.4 4c1 .6 1.7.3 2-1L22.8 5.8c.3-1.3-.5-1.9-1.3-1.4zM9.3 14.2l8.6-5.4c.4-.3.8 0 .4.3l-7 6.3-.3 3.3-1.7-4.5z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.5 9H4v11h2.5V9zM5.2 3.5A1.6 1.6 0 103.6 5.1 1.6 1.6 0 005.2 3.5zM20 20h-2.5v-5.4c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V20H11V9h2.4v1.5h.1c.3-.6 1.2-1.8 3.2-1.8 3.4 0 4 2.2 4 5.1V20z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 3.1A8.9 8.9 0 003.1 12c0 1.6.4 3.1 1.2 4.4L3 21l4.7-1.2A8.9 8.9 0 0012 20.9 8.9 8.9 0 0020.9 12 8.9 8.9 0 0012.04 3.1zm4.9 12.6c-.2.6-1.2 1.1-1.7 1.2-.4.1-.9.1-1.5 0-.3 0-.7-.1-2.3-.9-1.9-1-3.1-2.8-3.2-2.9-.1-.2-1-1.3-1-2.5s.6-1.8.8-2 .4-.3.6-.3h.4c.1 0 .3 0 .4.3.2.5.6 1.6.7 1.7.1.1.1.3 0 .4l-.3.4c-.1.1-.2.3-.1.5.1.2.5 1 1.1 1.6.8.8 1.4 1 1.6 1.1.2.1.4.1.5 0l.5-.3c.1-.1.3-.1.5 0l1.7.8c.2.1.3.2.4.3 0 .2 0 .7-.4 1.3z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 3h8a5 5 0 015 5v8a5 5 0 01-5 5H8a5 5 0 01-5-5V8a5 5 0 015-5zm8 1.8H8A3.2 3.2 0 004.8 8v8A3.2 3.2 0 008 19.2h8A3.2 3.2 0 0019.2 16V8A3.2 3.2 0 0016 4.8zM12 8.2A3.8 3.8 0 1112 15.8 3.8 3.8 0 0112 8.2zm0 1.7a2.1 2.1 0 100 4.2 2.1 2.1 0 000-4.2zM17.4 6.4a1 1 0 110 2 1 1 0 010-2z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14.5 3v10.1a3.4 3.4 0 11-2.9-3.4V7.3a6.3 6.3 0 105.8 6.3V8.6A8 8 0 0021 10.2V7.2A5.2 5.2 0 0116.7 3h-2.2z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M6 16H5a2 2 0 01-2-2V5a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M5 12.5l4.2 4.2L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Action({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <Link href={href} className="action-link flex flex-col items-center gap-2">
      <span className="show-top-icon flex items-center justify-center text-white">
        {icon}
      </span>
      <span className="text-[12px] font-medium text-white/90">{label}</span>
    </Link>
  );
}

function RechargeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="18" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 13v5M10 15.5h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function WithdrawIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 10l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function VipIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 18h14l1.5-9-4.5 3L12 6l-4 6-4.5-3L5 18z" fill="currentColor" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 7h8l2 3H6l2-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M6 10h12v8a2 2 0 01-2 2H8a2 2 0 01-2-2v-8z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 10v10" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function FaqIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9.4 9.6a2.6 2.6 0 114.4 1.9c-.9.7-1.3 1.1-1.3 2.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12.5" cy="16.6" r="1" fill="currentColor" />
    </svg>
  );
}

function InviteIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.8 18.5a5.2 5.2 0 0110.4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17.5 8.5h4M19.5 6.5v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function AboutIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 11.2V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="8" r="1.15" fill="currentColor" />
    </svg>
  );
}

function AppIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="7" y="3.5" width="10" height="17" rx="2.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 17.5h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="7.2" r="3.1" />
      <circle cx="16.4" cy="8" r="2.35" />
      <path d="M1.9 19.3c0-3.5 3.2-6.1 7.1-6.1s7.1 2.6 7.1 6.1v.4H1.9v-.4z" />
      <path d="M15.2 13.6c2.9.4 5.1 2.6 5.1 5.7v.4H16v-.4c0-2.1-.8-3.9-2.2-5.2.5-.3.9-.4 1.4-.5z" />
    </svg>
  );
}

function RevenueIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.1 2.6c-.6 1.6-1.7 2.7-1.7 4.1 0 .7.3 1.3.7 1.8h-1.8C7 8.6 5.4 10.5 5.4 13.2 5.4 17 8.3 21.3 12 21.3s6.6-4.3 6.6-8.1c0-2.7-1.6-4.6-3.9-4.7h-1.8c.4-.5.7-1.1.7-1.8 0-1.4-1.1-2.5-1.7-4.1h-.8z" />
      <path
        d="M12 10.4c-1.7 0-2.7.9-2.7 2.1 0 .9.6 1.5 1.8 1.8l.9.2c.6.14 1 .4 1 .8 0 .5-.5.8-1.2.8-.8 0-1.3-.3-1.6-.8l-1.2.5c.4.9 1.3 1.5 2.5 1.6v1.1h1.4v-1.1c1.5-.2 2.5-1.1 2.5-2.3 0-1.1-.7-1.7-2-2l-.9-.22c-.7-.16-1-.4-1-.8 0-.4.4-.7 1.1-.7.7 0 1.2.3 1.4.7l1.2-.5c-.4-.8-1.2-1.3-2.4-1.4v-1h-1.4v1z"
        fill="#2f7bff"
      />
    </svg>
  );
}
