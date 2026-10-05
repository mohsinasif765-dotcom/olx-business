"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getActivity } from "@/lib/activities";
import { useLanguage } from "@/lib/i18n";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function addBalance(amount: number) {
  const current = Number(window.localStorage.getItem("olx-usdt-balance") || "0");
  const next = (Number.isFinite(current) ? current : 0) + amount;
  window.localStorage.setItem("olx-usdt-balance", String(next));
}

export function ActivityDetail({ id }: { id: string }) {
  const { t } = useLanguage();
  const router = useRouter();
  const event = useMemo(() => getActivity(id), [id]);

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

        {event.id === "checkin" && "rewards" in event ? (
          <CheckInPanel rewards={[...event.rewards]} disabled={ended} />
        ) : null}

        {event.id === "lucky" && "prizes" in event ? (
          <LuckyPanel prizes={[...event.prizes]} disabled={ended} />
        ) : null}

        {"href" in event && event.href ? (
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
    const raw = window.localStorage.getItem("olx-checkin");
    const data = raw ? (JSON.parse(raw) as { date: string; streak: number }) : null;
    if (!data) return;
    const today = todayKey();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = yesterday.toISOString().slice(0, 10);
    if (data.date === today) {
      setStreak(data.streak);
      setDone(true);
      return;
    }
    setStreak(data.date === yKey && data.streak < 7 ? data.streak : 0);
  }, []);

  function claim() {
    if (disabled || done) return;
    const day = streak + 1;
    const prize = Number(rewards[day - 1] || "0.10");
    addBalance(prize);
    window.localStorage.setItem(
      "olx-checkin",
      JSON.stringify({ date: todayKey(), streak: day })
    );
    setStreak(day);
    setDone(true);
    setMessage(`${t.claimedToday} +${prize.toFixed(2)} USDT`);
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
    const raw = window.localStorage.getItem("olx-lucky");
    const data = raw ? (JSON.parse(raw) as { date: string; prize: string }) : null;
    if (data?.date === todayKey()) {
      setUsed(true);
      setPrize(data.prize);
    }
  }, []);

  function spin() {
    if (disabled || used || spinning) return;
    const index = Math.floor(Math.random() * prizes.length);
    const slice = 360 / prizes.length;
    const extra = 360 * 5 + (360 - index * slice) - slice / 2;
    setSpinning(true);
    setAngle((current) => current + extra);
    window.setTimeout(() => {
      const won = prizes[index];
      addBalance(Number(won));
      window.localStorage.setItem("olx-lucky", JSON.stringify({ date: todayKey(), prize: won }));
      setPrize(won);
      setUsed(true);
      setSpinning(false);
    }, 2800);
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
