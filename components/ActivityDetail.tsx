"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getActivity } from "@/lib/activities";
import { getSessionAccount } from "@/lib/session";
import { useLanguage } from "@/lib/i18n";
import { loadWallets } from "@/lib/wallets";

type EventRow = {
  id: string;
  status: "live" | "ended";
  badge: string;
  title: string;
  desc: string;
  time: string;
  theme: string;
  rewards?: string[];
  prizes?: string[];
  href?: string;
  cta?: string;
  rules: string[];
};

export function ActivityDetail({ id }: { id: string }) {
  const { t } = useLanguage();
  const router = useRouter();
  const fallback = getActivity(id);
  const [event, setEvent] = useState<EventRow | null>(
    fallback
      ? {
          id: fallback.id,
          status: fallback.status,
          badge: fallback.badge,
          title: fallback.title,
          desc: fallback.desc,
          time: fallback.time,
          theme: fallback.theme,
          rewards: "rewards" in fallback ? [...fallback.rewards] : undefined,
          prizes: "prizes" in fallback ? [...fallback.prizes] : undefined,
          href: "href" in fallback ? fallback.href : undefined,
          cta: "cta" in fallback ? fallback.cta : undefined,
          rules: [...fallback.rules],
        }
      : null
  );

  useEffect(() => {
    const account = getSessionAccount() || "";
    const qs = account ? `?account=${encodeURIComponent(account)}` : "";
    void fetch(`/api/activity${qs}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { activities?: EventRow[] } | null) => {
        const row = data?.activities?.find((item) => item.id === id);
        if (row) setEvent(row);
      })
      .catch(() => {});
  }, [id]);

  if (!event) {
    return (
      <div className="star-field">
        <div className="page-enter mx-auto min-h-screen max-w-[430px] px-4 pt-8">
          <p>Event not found.</p>
          <Link href="/activity" className="mt-4 block text-[#9ec6ff]">
            ← {t.activity}
          </Link>
        </div>
      </div>
    );
  }

  const ended = event.status === "ended";

  return (
    <div className="star-field">
      <div className="page-enter mx-auto min-h-screen w-full max-w-[430px] px-4 pb-28 pt-3">
        <header className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg"
          >
            ‹
          </button>
          <h1 className="text-[17px] font-semibold">{t.details}</h1>
          <span className="w-9" />
        </header>

        <div className={`act-card theme-${event.theme} mb-4`}>
          <span className={`act-badge badge-${event.badge}`}>
            {event.badge === "hot" ? t.hot : event.badge === "new" ? t.newTag : t.endedTag}
          </span>
          <h2 className="pr-16 text-[20px] font-semibold">{event.title}</h2>
          <p className="mt-2 text-[13px] leading-6 text-white/75">{event.desc}</p>
          <p className="mt-3 text-[12px] text-white/50">
            {t.eventTime}: {event.time}
          </p>
        </div>

        {event.rewards ? <CheckInPanel rewards={event.rewards} disabled={ended} /> : null}
        {event.prizes ? <LuckyPanel prizes={event.prizes} disabled={ended} /> : null}

        {event.href ? (
          <Link href={ended ? "/activity" : event.href} className="wd-confirm mb-4">
            {ended
              ? t.endedTag
              : event.cta === "goInvite"
                ? t.goInvite
                : event.cta === "goVip"
                  ? t.goVip
                  : t.goRecharge}
          </Link>
        ) : null}

        <section className="wd-reminder">
          <h3 className="mb-2 text-[14px] font-semibold text-[#ffd27a]">{t.rules}</h3>
          <ol className="space-y-2 text-[12px] leading-5 text-white/70">
            {event.rules.map((rule, index) => (
              <li key={rule}>
                {index + 1}. {rule}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}

function CheckInPanel({ rewards, disabled }: { rewards: string[]; disabled: boolean }) {
  const { t } = useLanguage();
  const [streak, setStreak] = useState(0);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const account = getSessionAccount();
    if (!account) return;
    void fetch(`/api/activity?account=${encodeURIComponent(account)}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { checkin?: { date: string; streak: number } } | null) => {
        const today = new Date().toISOString().slice(0, 10);
        if (data?.checkin?.date === today) {
          setStreak(data.checkin.streak);
          setDone(true);
        } else if (data?.checkin) {
          setStreak(data.checkin.streak);
        }
      })
      .catch(() => {});
  }, []);

  function claim() {
    if (disabled || done) return;
    const account = getSessionAccount();
    if (!account) return;
    void fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account, action: "checkin" }),
    })
      .then((res) => res.json())
      .then((data: { ok?: boolean; prize?: string; streak?: number; error?: string }) => {
        if (!data.ok) {
          setMessage(data.error === "used" ? t.checkedIn : "Could not check in.");
          return;
        }
        setStreak(data.streak || 0);
        setDone(true);
        setMessage(`${t.claimedToday} +${Number(data.prize).toFixed(2)} USDT`);
        void loadWallets();
      })
      .catch(() => {});
  }

  return (
    <div className="deposit-card mb-4 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] font-semibold">{t.checkIn}</p>
        <p className="text-[12px] text-white/50">
          {t.consecutive}: {streak}
        </p>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {rewards.map((reward, index) => {
          const day = index + 1;
          const on = day <= streak;
          const today = !done && day === streak + 1;
          return (
            <div
              key={day}
              className={`rounded-xl py-2 text-center ${
                today ? "bg-[#5b4dff]" : on ? "bg-[#3dff9a]/20" : "bg-black/25"
              }`}
            >
              <p className="text-[10px] text-white/55">D{day}</p>
              <p className="mt-1 text-[11px] font-semibold">{reward}</p>
            </div>
          );
        })}
      </div>
      <button type="button" className="wd-confirm mt-4" onClick={claim} disabled={disabled || done}>
        {done ? t.checkedIn : t.checkIn}
      </button>
      {message ? <p className="mt-3 text-center text-[13px] text-[#3dff9a]">{message}</p> : null}
    </div>
  );
}

function LuckyPanel({ prizes, disabled }: { prizes: string[]; disabled: boolean }) {
  const { t } = useLanguage();
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [used, setUsed] = useState(false);
  const [prize, setPrize] = useState("");

  useEffect(() => {
    const account = getSessionAccount();
    if (!account) return;
    void fetch(`/api/activity?account=${encodeURIComponent(account)}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { lucky?: { date: string; prize: string } } | null) => {
        const today = new Date().toISOString().slice(0, 10);
        if (data?.lucky?.date === today) {
          setUsed(true);
          setPrize(data.lucky.prize);
        }
      })
      .catch(() => {});
  }, []);

  function spin() {
    if (disabled || used || spinning) return;
    const account = getSessionAccount();
    if (!account) return;
    setSpinning(true);
    void fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account, action: "lucky" }),
    })
      .then((res) => res.json())
      .then((data: { ok?: boolean; prize?: string; error?: string }) => {
        const won = data.ok ? data.prize || "0.00" : "0.00";
        const index = Math.max(0, prizes.indexOf(won));
        const slice = 360 / prizes.length;
        setAngle((current) => current + 360 * 5 + (360 - index * slice) - slice / 2);
        window.setTimeout(() => {
          setPrize(won);
          setUsed(true);
          setSpinning(false);
          void loadWallets();
        }, 2800);
      })
      .catch(() => setSpinning(false));
  }

  return (
    <div className="deposit-card mb-4 p-4 text-center">
      <p className="mb-3 text-[13px] font-semibold">{t.luckyDraw}</p>
      <div className="relative mx-auto h-[220px] w-[220px]">
        <div className="act-pointer" />
        <div className="act-wheel" style={{ transform: `rotate(${angle}deg)` }}>
          {prizes.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="act-slice-label"
              style={{ transform: `rotate(${index * (360 / prizes.length) + 30}deg)` }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
      <button type="button" className="wd-confirm mt-4" onClick={spin} disabled={disabled || used || spinning}>
        {used ? t.oncePerDay : t.spin}
      </button>
      {prize ? (
        <p className="mt-3 text-[13px] text-[#3dff9a]">
          {t.youWon} {prize} USDT
        </p>
      ) : null}
    </div>
  );
}
