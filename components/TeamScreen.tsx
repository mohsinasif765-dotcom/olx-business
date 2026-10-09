"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { moneyPrefix } from "@/lib/currencies";
import { inviteLink } from "@/lib/invite";
import { getSessionAccount } from "@/lib/session";
import { useLanguage } from "@/lib/i18n";

type TeamPayload = {
  invite: string;
  displayCurrency?: string;
  rates: { l1: number; l2: number; l3: number };
  totals: { team: number; commission: number; recharge: number; withdraw: number };
  levels: Record<string, { people: number; valid: number; rate: number }>;
};

const EMPTY: TeamPayload = {
  invite: "------",
  rates: { l1: 15, l2: 3, l3: 1 },
  totals: { team: 0, commission: 0, recharge: 0, withdraw: 0 },
  levels: {
    "1": { people: 0, valid: 0, rate: 15 },
    "2": { people: 0, valid: 0, rate: 3 },
    "3": { people: 0, valid: 0, rate: 1 },
  },
};

export function TeamScreen() {
  const { t } = useLanguage();
  const [code, setCode] = useState("------");
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<"code" | "link" | "">("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<TeamPayload>(EMPTY);
  const [account, setAccount] = useState<string | null>(null);
  const cash = moneyPrefix(team.displayCurrency || "PKR");

  function load(queryDate = date) {
    const session = getSessionAccount();
    setAccount(session);
    if (!session) {
      setLoading(false);
      setTeam(EMPTY);
      return;
    }
    setLoading(true);
    const qs = new URLSearchParams({ account: session });
    if (queryDate) qs.set("date", queryDate);
    void fetch(`/api/team?${qs}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: TeamPayload | null) => {
        if (data?.invite) {
          setTeam({
            ...EMPTY,
            ...data,
            rates: { ...EMPTY.rates, ...data.rates },
            totals: { ...EMPTY.totals, ...data.totals },
            levels: {
              "1": { ...EMPTY.levels["1"], ...data.levels?.["1"] },
              "2": { ...EMPTY.levels["2"], ...data.levels?.["2"] },
              "3": { ...EMPTY.levels["3"], ...data.levels?.["3"] },
            },
          });
          setCode(data.invite);
          window.localStorage.setItem("olx-invite-code", data.invite);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setOrigin(window.location.origin);
    setDate(new Date().toISOString().slice(0, 10));
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const link = inviteLink(origin || "https://olx-business.app", code);
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

  function queryDate() {
    load(date);
  }

  return (
    <div className="star-field">
      <div className="page-enter mx-auto min-h-screen w-full max-w-[430px] px-4 pb-28 pt-3">
        <header className="anim-up mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrandLogo size={40} />
            <h1 className="text-[17px] font-semibold">{t.team}</h1>
          </div>
          <LanguageSwitch globe />
        </header>

        <div className="anim-up delay-1 mb-3 flex justify-end">
          <Link href="/team/commission" className="text-[12px] text-[#9ec6ff]">
            {t.commissionDetails} ›
          </Link>
        </div>

        <section className="invite-card anim-up delay-2 mb-3 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[13px] text-white/70">
              {t.inviteCode}: <span className="font-semibold tracking-[0.16em] text-white">{code}</span>
            </p>
            <button type="button" className={`invite-copy ${copied === "code" ? "is-copied" : ""}`} onClick={() => copy("code", code)}>
              {copied === "code" ? t.copied : t.copy}
            </button>
          </div>
          <p className="mb-2 text-[12px] text-white/60">{t.shareLinkHint}</p>
          <div className="flex items-start gap-2">
            <p className="min-w-0 flex-1 break-all text-[12px] text-[#9ec6ff]">{link}</p>
            <button type="button" className={`invite-copy shrink-0 ${copied === "link" ? "is-copied" : ""}`} onClick={() => copy("link", link)}>
              {copied === "link" ? t.copied : t.copy}
            </button>
          </div>
        </section>

        <section className="invite-card anim-up delay-3 mb-3 px-2 py-3">
          <p className="mb-2 text-center text-[12px] text-white/55">{t.shareTo}</p>
          <div className="team-share flex items-center justify-between px-1">
            <Share href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} label="Facebook">
              <Fb />
            </Share>
            <Share href={`https://x.com/intent/tweet?text=${shareText}&url=${shareUrl}`} label="X">
              <X />
            </Share>
            <Share href={`https://t.me/share/url?url=${shareUrl}&text=${shareText}`} label="Telegram">
              <Tg />
            </Share>
            <Share href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`} label="LinkedIn">
              <In />
            </Share>
            <Share href={`https://wa.me/?text=${shareText}%20${shareUrl}`} label="WhatsApp">
              <Wa />
            </Share>
            <Share href="https://www.instagram.com/" label="Instagram">
              <Ig />
            </Share>
            <Share href="https://www.tiktok.com/" label="TikTok">
              <Tt />
            </Share>
            <button type="button" className="share-icon" onClick={() => copy("link", link)} aria-label={t.copy}>
              {copied === "link" ? <Ck /> : <Cp />}
            </button>
          </div>
        </section>

        <section className="invite-card anim-up delay-4 mb-3 p-4">
          <label className="mb-2 block text-[12px] text-white/55">{t.selectDate}</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="wd-input flex-1"
            />
            <button type="button" className="invite-copy h-12 px-4" onClick={queryDate}>
              {t.query}
            </button>
          </div>
        </section>

        {loading ? (
          <div className="mp-empty mb-3">
            <span className="mp-spinner" />
            <p className="mt-3 text-[13px] text-white/60">{t.loading}</p>
          </div>
        ) : (
          <div className="mb-3 grid grid-cols-2 gap-3">
            <Stat label={t.totalTeam} value={String(team.totals.team)} />
            <Stat label={t.totalCommission} value={`${cash} ${team.totals.commission.toFixed(2)}`} />
            <Stat label={t.totalTeamRecharge} value={`${cash} ${team.totals.recharge.toFixed(2)}`} />
            <Stat label={t.totalTeamWithdraw} value={`${cash} ${team.totals.withdraw.toFixed(2)}`} />
          </div>
        )}

        {!account ? (
          <p className="mb-3 px-1 text-center text-[13px] text-white/50">
            Sign in to load your team from the database.{" "}
            <Link href="/" className="text-[#9ec6ff]">
              Login
            </Link>
          </p>
        ) : null}

        <div className="grid grid-cols-3 gap-2">
          {(["1", "2", "3"] as const).map((id) => (
            <article key={id} className="team-lev">
              <p className="text-[13px] font-bold tracking-wide">LEV {id}</p>
              <p className="mt-1 text-[11px] text-[#7ee0ff]">{team.levels[id].rate}%</p>
              <p className="mt-3 text-[11px] text-white/50">{t.peopleCount}</p>
              <p className="text-[18px] font-semibold">{team.levels[id].people}</p>
              <p className="mt-2 text-[11px] text-white/50">{t.validCount}</p>
              <p className="text-[18px] font-semibold">{team.levels[id].valid}</p>
              <Link href={`/team/level/${id}`} className="team-details">
                {t.details}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="deposit-card stat-in px-3 py-4">
      <p className="text-[11px] leading-4 text-white/50">{label}</p>
      <p className="mt-2 text-[20px] font-semibold">{value}</p>
    </div>
  );
}

function Share({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="share-icon" aria-label={label}>
      {children}
    </a>
  );
}

function Fb() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14.5 8.5V6.8c0-.7.5-1 1.2-1H17V3h-2.4C12 3 11 4.5 11 6.6V8.5H9v2.7h2V21h3.2v-9.8h2.4l.4-2.7h-2.8z" />
    </svg>
  );
}
function X() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.2 3H21l-6.5 7.4L22 21h-6.2l-4.4-5.8L6.2 21H3.4l7-8L2 3h6.3l4 5.3L18.2 3zm-1.1 16.2h1.7L7 4.7H5.2l11.9 14.5z" />
    </svg>
  );
}
function Tg() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.5 4.4L2.9 11.6c-1.2.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.7.8.8 1.3.5l2.6-2.5 5.4 4c1 .6 1.7.3 2-1L22.8 5.8c.3-1.3-.5-1.9-1.3-1.4zM9.3 14.2l8.6-5.4c.4-.3.8 0 .4.3l-7 6.3-.3 3.3-1.7-4.5z" />
    </svg>
  );
}
function In() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.5 9H4v11h2.5V9zM5.2 3.5A1.6 1.6 0 103.6 5.1 1.6 1.6 0 005.2 3.5zM20 20h-2.5v-5.4c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V20H11V9h2.4v1.5h.1c.3-.6 1.2-1.8 3.2-1.8 3.4 0 4 2.2 4 5.1V20z" />
    </svg>
  );
}
function Wa() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 3.1A8.9 8.9 0 003.1 12c0 1.6.4 3.1 1.2 4.4L3 21l4.7-1.2A8.9 8.9 0 0012 20.9 8.9 8.9 0 0020.9 12 8.9 8.9 0 0012.04 3.1zm4.9 12.6c-.2.6-1.2 1.1-1.7 1.2-.4.1-.9.1-1.5 0-.3 0-.7-.1-2.3-.9-1.9-1-3.1-2.8-3.2-2.9-.1-.2-1-1.3-1-2.5s.6-1.8.8-2 .4-.3.6-.3h.4c.1 0 .3 0 .4.3.2.5.6 1.6.7 1.7.1.1.1.3 0 .4l-.3.4c-.1.1-.2.3-.1.5.1.2.5 1 1.1 1.6.8.8 1.4 1 1.6 1.1.2.1.4.1.5 0l.5-.3c.1-.1.3-.1.5 0l1.7.8c.2.1.3.2.4.3 0 .2 0 .7-.4 1.3z" />
    </svg>
  );
}
function Ig() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 3h8a5 5 0 015 5v8a5 5 0 01-5 5H8a5 5 0 01-5-5V8a5 5 0 015-5zm8 1.8H8A3.2 3.2 0 004.8 8v8A3.2 3.2 0 008 19.2h8A3.2 3.2 0 0019.2 16V8A3.2 3.2 0 0016 4.8zM12 8.2A3.8 3.8 0 1112 15.8 3.8 3.8 0 0112 8.2zm0 1.7a2.1 2.1 0 100 4.2 2.1 2.1 0 000-4.2zM17.4 6.4a1 1 0 110 2 1 1 0 010-2z" />
    </svg>
  );
}
function Tt() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14.5 3v10.1a3.4 3.4 0 11-2.9-3.4V7.3a6.3 6.3 0 105.8 6.3V8.6A8 8 0 0021 10.2V7.2A5.2 5.2 0 0116.7 3h-2.2z" />
    </svg>
  );
}
function Cp() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M6 16H5a2 2 0 01-2-2V5a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}
function Ck() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M5 12.5l4.2 4.2L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
