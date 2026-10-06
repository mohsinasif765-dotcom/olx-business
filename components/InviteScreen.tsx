"use client";

import Link from "next/link";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { getSessionAccount } from "@/lib/session";
import { useLanguage } from "@/lib/i18n";

export function InviteScreen() {
  const { t } = useLanguage();
  const [code, setCode] = useState("------");
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<"code" | "link" | "">("");
  const [teamCount, setTeamCount] = useState(0);
  const [rebate, setRebate] = useState(0);
  const [rates, setRates] = useState({ l1: 15, l2: 3, l3: 1 });

  useEffect(() => {
    setOrigin(window.location.origin);
    const account = getSessionAccount();
    if (!account) {
      const saved = window.localStorage.getItem("olx-invite-code") || "------";
      setCode(saved);
      return;
    }
    void fetch(`/api/team?account=${encodeURIComponent(account)}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: {
        invite?: string;
        totals?: { team: number; commission: number };
        rates?: { l1: number; l2: number; l3: number };
      } | null) => {
        if (!data) return;
        if (data.invite) {
          setCode(data.invite);
          window.localStorage.setItem("olx-invite-code", data.invite);
        }
        setTeamCount(data.totals?.team || 0);
        setRebate(data.totals?.commission || 0);
        if (data.rates) setRates(data.rates);
      })
      .catch(() => {});
  }, []);

  const link = origin ? `${origin}/register?invite=${code}` : `/register?invite=${code}`;
  const shareText = encodeURIComponent(`Join OLX Business with my code ${code}`);
  const shareUrl = encodeURIComponent(link);

  async function copy(kind: "code" | "link", value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(""), 1500);
    } catch {
      setCopied("");
    }
  }

  return (
    <div className="star-field">
      <div className="page-enter mx-auto min-h-screen w-full max-w-[430px] px-4 pb-28 pt-3">
        <header className="mb-4 flex items-center justify-between">
          <Link
            href="/home"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg"
          >
            ‹
          </Link>
          <h1 className="text-[17px] font-semibold">{t.invite}</h1>
          <span className="w-9" />
        </header>

        <div className="mb-3 grid grid-cols-2 gap-3">
          <div className="deposit-card px-3 py-4 text-center">
            <p className="text-[12px] text-white/50">{t.myTeam}</p>
            <p className="mt-1 text-[22px] font-semibold">{teamCount}</p>
          </div>
          <div className="deposit-card px-3 py-4 text-center">
            <p className="text-[12px] text-white/50">{t.rebateEarned}</p>
            <p className="mt-1 text-[22px] font-semibold text-[#7ee0ff]">{rebate.toFixed(2)}</p>
          </div>
        </div>

        <section className="invite-card mb-3 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[13px] text-white/70">
              {t.inviteCode}: <span className="font-semibold tracking-[0.18em] text-white">{code}</span>
            </p>
            <button type="button" className="invite-copy" onClick={() => copy("code", code)}>
              {copied === "code" ? t.copied : t.copy}
            </button>
          </div>

          <p className="mb-2 text-center text-[13px] text-white/75">{t.shareLinkHint}</p>
          <p className="mb-3 break-all text-center text-[12px] text-[#9ec6ff]">{link}</p>
          <div className="mb-5 flex justify-center">
            <button type="button" className="invite-copy" onClick={() => copy("link", link)}>
              {copied === "link" ? t.copied : t.copy}
            </button>
          </div>

          <div className="mx-auto mb-2 flex h-[176px] w-[176px] items-center justify-center rounded-xl bg-white p-2">
            <div className="relative h-full w-full">
              <InviteQr value={link} />
              <span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-lg bg-white">
                <BrandLogo size={36} />
              </span>
            </div>
          </div>
        </section>

        <section className="invite-card mb-3 px-3 py-4">
          <p className="mb-3 text-center text-[13px] text-white/70">{t.shareTo}</p>
          <div className="flex items-start justify-between gap-1">
            <ShareIcon href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} label="Facebook">
              <FacebookIcon />
            </ShareIcon>
            <ShareIcon href={`https://x.com/intent/tweet?text=${shareText}&url=${shareUrl}`} label="X">
              <XIcon />
            </ShareIcon>
            <ShareIcon href={`https://t.me/share/url?url=${shareUrl}&text=${shareText}`} label="Telegram">
              <TelegramIcon />
            </ShareIcon>
            <ShareIcon href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`} label="LinkedIn">
              <LinkedInIcon />
            </ShareIcon>
            <ShareIcon href={`https://wa.me/?text=${shareText}%20${shareUrl}`} label="WhatsApp">
              <WhatsAppIcon />
            </ShareIcon>
            <ShareIcon href="https://www.instagram.com/" label="Instagram">
              <InstagramIcon />
            </ShareIcon>
            <button type="button" className="flex min-w-0 flex-1 flex-col items-center gap-1" onClick={() => copy("link", link)}>
              <span className="share-icon">{copied === "link" ? <CheckIcon /> : <CopyIcon />}</span>
              <span className="w-full truncate text-center text-[9px] leading-3 text-white/60">
                {copied === "link" ? t.copied : t.copy}
              </span>
            </button>
          </div>
        </section>

        <section className="invite-card p-4">
          <h2 className="mb-2 flex items-center gap-2 text-[14px] font-semibold text-[#7ee0ff]">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#7ee0ff] text-[11px]">
              i
            </span>
            {t.inviteInstructions}
          </h2>
          <p className="text-[12px] leading-6 text-white/75">{t.inviteIntro}</p>
          <p className="mt-2 text-[12px] leading-6 text-white/75">Level 1 (direct invitation): up to {rates.l1}%</p>
          <p className="text-[12px] leading-6 text-white/75">Level 2 (friends of your friends): {rates.l2}%</p>
          <p className="text-[12px] leading-6 text-white/75">Level 3 (third level): {rates.l3}%</p>
          <p className="mt-2 text-[12px] leading-6 text-white/75">{t.inviteNote}</p>
        </section>

        <p className="mt-4 text-center text-[12px] text-white/40">
          {teamCount ? `${teamCount} invited members in your team.` : t.noInvites}
        </p>
      </div>
    </div>
  );
}

function ShareIcon({
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
      className="flex min-w-0 flex-1 flex-col items-center gap-1"
      aria-label={label}
    >
      <span className="share-icon">{children}</span>
      <span className="w-full truncate text-center text-[9px] leading-3 text-white/60">{label}</span>
    </a>
  );
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14.5 8.5V6.8c0-.7.5-1 1.2-1H17V3h-2.4C12 3 11 4.5 11 6.6V8.5H9v2.7h2V21h3.2v-9.8h2.4l.4-2.7h-2.8z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.2 3H21l-6.5 7.4L22 21h-6.2l-4.4-5.8L6.2 21H3.4l7-8L2 3h6.3l4 5.3L18.2 3zm-1.1 16.2h1.7L7 4.7H5.2l11.9 14.5z" />
    </svg>
  );
}

function TelegramIcon() {
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

function InviteQr({ value }: { value: string }) {
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
          <rect key={i} x={i % size} y={Math.floor(i / size)} width="1" height="1" fill="#111" />
        ) : null
      )}
    </svg>
  );
}
