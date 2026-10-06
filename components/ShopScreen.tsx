"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { buyShopPackage } from "@/lib/invest";
import { getSessionAccount } from "@/lib/session";
import { type ShopKind } from "@/lib/shop";
import { useLanguage } from "@/lib/i18n";
import { useShopPlans } from "@/lib/use-shop-plans";

export function ShopScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { plans: allPlans, settings, loaded } = useShopPlans();
  const [tab, setTab] = useState<ShopKind | "all">("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const plans = useMemo(
    () =>
      settings.packagesOn
        ? tab === "all"
          ? allPlans
          : allPlans.filter((p) => p.kind === tab)
        : [],
    [allPlans, tab, settings.packagesOn]
  );

  async function investNow(planId: string) {
    if (!getSessionAccount()) {
      router.push("/");
      return;
    }
    setNote("");
    setBusy(planId);
    const result = await buyShopPackage(planId);
    setBusy(null);
    if (result.ok) {
      router.push("/mining-pool");
      return;
    }
    if (result.error === "insufficient") {
      setNote(`Invest wallet needs at least $${(result.need || 0).toFixed(0)}. Fund USDT first.`);
      router.push(`/wallet/select?plan=${planId}`);
      return;
    }
    if (result.error === "paused") setNote("Shop packages are paused in admin settings.");
    else if (result.error === "frozen") setNote("This account cannot invest right now.");
    else if (result.error === "login") router.push("/");
    else setNote("Could not invest. Try again.");
  }

  return (
    <div className="star-field">
      <div className="mx-auto min-h-screen w-full max-w-[430px] px-4 pb-32 pt-3">
        <header className="relative mb-4 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-2">
            <BrandLogo size={42} />
            <span className="text-[17px] font-semibold">{settings.siteName}</span>
          </Link>
          <LanguageSwitch globe />
        </header>

        <h1 className="mb-1 px-1 text-[22px] font-semibold">{t.shopTitle}</h1>
        <p className="mb-4 px-1 text-[13px] leading-5 text-white/55">{t.shopIntro}</p>
        {settings.maintenance ? (
          <p className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[13px] text-amber-200">
            {settings.maintenance}
          </p>
        ) : null}

        {note ? (
          <p className="mb-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[13px] text-white/70">{note}</p>
        ) : null}

        <div className="car-tabs mb-4">
          <button type="button" className={tab === "all" ? "is-on" : ""} onClick={() => setTab("all")}>
            {t.allCars}
          </button>
          <button type="button" className={tab === "jewelry" ? "is-on" : ""} onClick={() => setTab("jewelry")}>
            {t.jewelry}
          </button>
          <button type="button" className={tab === "electronics" ? "is-on" : ""} onClick={() => setTab("electronics")}>
            {t.electronics}
          </button>
        </div>

        <div className="space-y-4">
          {!loaded ? (
            <p className="px-1 text-[13px] text-white/50">Loading packages…</p>
          ) : !settings.packagesOn ? (
            <p className="px-1 text-[13px] text-white/50">Shop packages are paused in admin settings.</p>
          ) : plans.length === 0 ? (
            <p className="px-1 text-[13px] text-white/50">No packages in this tab yet.</p>
          ) : (
            plans.map((plan) => (
              <article key={plan.id} className="car-card">
                <div className="car-photo">
                  <img
                    src={plan.image}
                    alt={plan.name}
                    onError={(event) => {
                      event.currentTarget.src =
                        plan.kind === "electronics" ? "/cars/executive.jpg" : "/cars/luxury.jpg";
                    }}
                  />
                  <span className="car-badge">{plan.kind === "electronics" ? t.electronics : t.jewelry}</span>
                </div>
                <div className="p-3.5">
                  <h2 className="mb-3 text-[16px] font-semibold">{plan.name}</h2>
                  <Row label={t.investAmount} value={plan.invest} />
                  <Row label={t.expectedReturn} value={plan.returns} accent />
                  <Row label={t.planTerm} value={plan.term} />
                  <button
                    type="button"
                    className="car-invest"
                    disabled={busy === plan.id}
                    onClick={() => void investNow(plan.id)}
                  >
                    {busy === plan.id ? "Investing…" : t.investCta}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-[4px] text-[13px]">
      <span className="text-white/55">{label}</span>
      <span className={accent ? "font-medium text-[#3dff9a]" : "text-white"}>{value}</span>
    </div>
  );
}
