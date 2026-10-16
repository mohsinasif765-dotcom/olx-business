"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { holdingImageFallback, isShopKind, normalizeHoldingImage } from "@/lib/holding-image";
import { claimHoldingProfit, type CarHolding, loadGarage } from "@/lib/invest";
import {
  accruedProfitUsdt,
  hourlyReturnUsdt,
  isTermMatured,
  parseDailyReturnUsdt,
  todayProfitUsdt,
} from "@/lib/package-yield";
import { useCarPlans } from "@/lib/use-car-plans";
import { useLanguage } from "@/lib/i18n";
import { usePackageFx } from "@/lib/use-package-fx";

function kindLabel(
  kind: string,
  t: { electronics: string; jewelry: string; usedCars: string; newCars: string }
) {
  if (kind === "electronics") return t.electronics;
  if (kind === "jewelry") return t.jewelry;
  if (kind === "used") return t.usedCars;
  return t.newCars;
}

export function MiningPoolScreen() {
  const { t } = useLanguage();
  const { settings, loaded: plansLoaded } = useCarPlans();
  const { money, cash, fromUsdt } = usePackageFx();
  const [holdings, setHoldings] = useState<CarHolding[]>([]);
  const [invest, setInvest] = useState(0);
  const [ready, setReady] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  function refresh() {
    void loadGarage().then((data) => {
      setAccount(data.account);
      setHoldings(
        data.holdings.map((row) => ({
          ...row,
          image: normalizeHoldingImage(row),
        }))
      );
      setInvest(data.wallets.invest);
      setReady(true);
    });
  }

  useEffect(() => {
    refresh();
    const poll = window.setInterval(refresh, 60_000);
    const clock = window.setInterval(() => setTick((n) => n + 1), 30_000);
    return () => {
      window.clearInterval(poll);
      window.clearInterval(clock);
    };
  }, []);

  const visible = holdings.filter((row) => row.status !== "ended");
  const hero = visible[0];
  const heroSrc = hero ? normalizeHoldingImage(hero) : "";

  async function onClaim(holdingId: string) {
    setClaimingId(holdingId);
    setNote("");
    const result = await claimHoldingProfit(holdingId);
    setClaimingId(null);
    if (!result.ok) {
      if (result.error === "early") setNote(t.claimLocked);
      else if (result.error === "claimed") setNote(t.claimDone);
      else setNote(t.claimLocked);
      return;
    }
    if (typeof result.invest === "number") setInvest(result.invest);
    setNote(`${t.claimDone} ${fromUsdt(result.amount)}`);
    refresh();
  }

  return (
    <div className="star-field">
      <div className="page-enter mx-auto min-h-screen w-full max-w-[430px] px-4 pb-28 pt-3">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrandLogo size={40} />
            <div>
              <p className="text-[11px] text-white/50">{t.miningPool}</p>
              <p className="text-[15px] font-semibold">{settings.siteName}</p>
            </div>
          </div>
          <LanguageSwitch globe />
        </header>

        <div className="mb-4 overflow-hidden rounded-2xl bg-white/5">
          {heroSrc ? (
            <img
              src={heroSrc}
              alt={hero?.name || ""}
              className="h-[148px] w-full object-cover"
              onError={(event) => {
                const kind = hero?.kind || "";
                const fallback = holdingImageFallback(kind);
                if (event.currentTarget.src !== fallback) {
                  event.currentTarget.src = fallback;
                }
                if (isShopKind(kind)) {
                  event.currentTarget.style.display = "none";
                }
              }}
            />
          ) : (
            <div className="flex h-[148px] items-center justify-center bg-gradient-to-br from-white/10 to-white/5 px-6 text-center">
              <p className="text-[13px] text-white/50">{t.emptyHint}</p>
            </div>
          )}
        </div>

        {settings.maintenance ? (
          <p className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[13px] text-amber-200">
            {settings.maintenance}
          </p>
        ) : null}

        <p className="mb-1 text-center text-[13px] text-white/50">{t.emptyHint}</p>
        <p className="mb-2 text-center text-[22px] font-semibold">
          {ready ? `${cash} ${invest.toFixed(2)}` : "…"}
        </p>
        <p className="mb-5 text-center text-[11px] text-white/40">{t.claimHint}</p>

        {note ? (
          <p className="mb-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-[12px] text-[#9ee7ff]">
            {note}
          </p>
        ) : null}

        {settings.packagesOn ? (
          <div className="mb-5 grid grid-cols-2 gap-2">
            <Link href="/vip" className="mp-boost">
              {t.improvePower}
            </Link>
            <Link href="/shop" className="mp-boost">
              {t.shop}
            </Link>
          </div>
        ) : (
          <p className="mb-5 text-center text-[13px] text-white/50">Packages are paused in admin settings.</p>
        )}

        <h2 className="mb-3 text-[15px] font-semibold">{t.miningRecords}</h2>
        <div className="space-y-3">
          {!ready || !plansLoaded ? (
            <p className="px-1 text-[13px] text-white/50">Loading packages…</p>
          ) : !account ? (
            <p className="px-1 text-[13px] text-white/50">
              Sign in to see active packages.{" "}
              <Link href="/" className="text-[#9ec6ff]">
                Login
              </Link>
            </p>
          ) : visible.length === 0 ? (
            <p className="px-1 text-[13px] text-white/50">No active packages yet. Choose a car or shop package.</p>
          ) : (
            visible.map((plan) => {
              const src = normalizeHoldingImage(plan);
              const daily = parseDailyReturnUsdt(plan.returns);
              const hourly = hourlyReturnUsdt(daily);
              const yieldInput = {
                returns: plan.returns,
                term: plan.term,
                earnedTotal: plan.earnedTotal,
                paidTotal: plan.paidTotal,
                lastPayoutAt: plan.lastPayoutAt,
                startedAt: plan.startedAt,
              };
              void tick;
              const today = todayProfitUsdt(yieldInput);
              const total = accruedProfitUsdt(yieldInput);
              const paidOut = Number(plan.paidTotal) || 0;
              const matured = isTermMatured({ startedAt: plan.startedAt, term: plan.term });
              const principal = Number(plan.investAmount) || 0;
              const canReturnPrincipal = matured && principal > 0;
              const busy = claimingId === plan.id;
              return (
                <article key={plan.id} className="car-card">
                  <div className="car-photo bg-white/5" style={{ height: 120 }}>
                    {src ? (
                      <img
                        src={src}
                        alt={plan.name}
                        onError={(event) => {
                          const fallback = holdingImageFallback(plan.kind);
                          if (event.currentTarget.src !== fallback) {
                            event.currentTarget.src = fallback;
                          }
                          if (isShopKind(plan.kind)) {
                            event.currentTarget.style.opacity = "0";
                          }
                        }}
                      />
                    ) : null}
                    <span className="car-badge">{kindLabel(plan.kind, t)}</span>
                  </div>
                  <div className="p-3">
                    <p className="font-semibold">{plan.name}</p>
                    <p className="mt-1 text-[12px] text-white/50">
                      {money(plan.invest)} · {plan.term}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2 text-[12px]">
                      <span className="text-white/50">{t.hourlyIncome}</span>
                      <span className="font-medium text-[#3dff9a]">{fromUsdt(hourly)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-[12px]">
                      <span className="text-white/50">{t.todayProfit}</span>
                      <span className="font-medium text-[#3dff9a]">{fromUsdt(today)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-[12px]">
                      <span className="text-white/50">{t.totalProfit}</span>
                      <span className="font-medium text-[#3dff9a]">{fromUsdt(total)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-[12px]">
                      <span className="text-white/50">{t.profitToWallet}</span>
                      <span className="font-medium text-[#9ee7ff]">{fromUsdt(paidOut)}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-white/35">
                      {t.dailyIncome} {money(plan.returns)}
                    </p>
                    <button
                      type="button"
                      disabled={!canReturnPrincipal || busy}
                      onClick={() => void onClaim(plan.id)}
                      className={`mt-3 w-full rounded-xl py-2.5 text-[13px] font-semibold transition ${
                        canReturnPrincipal && !busy
                          ? "bg-[#3dff9a] text-[#062816]"
                          : "cursor-not-allowed bg-white/10 text-white/40"
                      }`}
                    >
                      {busy
                        ? t.loading
                        : canReturnPrincipal
                          ? `${t.principalReturn} · ${fromUsdt(principal)}`
                          : matured
                            ? t.claimDone
                            : t.claimLocked}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
