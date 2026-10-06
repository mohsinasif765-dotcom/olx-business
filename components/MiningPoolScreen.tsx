"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { type CarHolding, loadGarage } from "@/lib/invest";
import { useCarPlans } from "@/lib/use-car-plans";
import { useLanguage } from "@/lib/i18n";

export function MiningPoolScreen() {
  const { t } = useLanguage();
  const { settings, loaded: plansLoaded } = useCarPlans();
  const [holdings, setHoldings] = useState<CarHolding[]>([]);
  const [invest, setInvest] = useState(0);
  const [ready, setReady] = useState(false);
  const [account, setAccount] = useState<string | null>(null);

  useEffect(() => {
    void loadGarage().then((data) => {
      setAccount(data.account);
      setHoldings(data.holdings);
      setInvest(data.wallets.invest);
      setReady(true);
    });
  }, []);

  const active = holdings.filter((row) => row.status !== "ended");

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

        <div className="mb-4 overflow-hidden rounded-2xl">
          <img
            src={active[0]?.image || "/cars/city-sedan.jpg"}
            alt=""
            className="h-[148px] w-full object-cover"
            onError={(event) => {
              event.currentTarget.src = "/cars/city-sedan.jpg";
            }}
          />
        </div>

        {settings.maintenance ? (
          <p className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[13px] text-amber-200">
            {settings.maintenance}
          </p>
        ) : null}

        <p className="mb-1 text-center text-[13px] text-white/50">{t.emptyHint}</p>
        <p className="mb-5 text-center text-[22px] font-semibold">
          {ready ? `${invest.toFixed(2)} USDT` : "…"}
        </p>

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
          ) : active.length === 0 ? (
            <p className="px-1 text-[13px] text-white/50">No active packages yet. Choose a car or shop package.</p>
          ) : (
            active.map((plan) => (
              <article key={plan.id} className="car-card">
                <div className="car-photo" style={{ height: 120 }}>
                  <img
                    src={plan.image}
                    alt={plan.name}
                    onError={(event) => {
                      event.currentTarget.src = "/cars/city-sedan.jpg";
                    }}
                  />
                  <span className="car-badge">
                    {plan.kind === "electronics"
                      ? t.electronics
                      : plan.kind === "jewelry"
                        ? t.jewelry
                        : plan.kind === "used"
                          ? t.usedCars
                          : t.newCars}
                  </span>
                </div>
                <div className="p-3">
                  <p className="font-semibold">{plan.name}</p>
                  <p className="mt-1 text-[12px] text-white/50">
                    {plan.invest} · {plan.term}
                  </p>
                  <p className="mt-1 text-[12px] text-[#3dff9a]">Expected {plan.returns}</p>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
