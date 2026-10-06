"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getCurrentAccount } from "@/lib/session";
import { useLanguage } from "@/lib/i18n";
import { debitWallet, loadWallets } from "@/lib/wallets";

export type WithdrawRecord = {
  id: string;
  wallet: string;
  address: string;
  amount: string;
  fee: string;
  arrival: string;
  status: string;
  at: string;
};

export function WithdrawScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState("");

  const fee = 1;
  const minPayout = 1;

  useEffect(() => {
    void loadWallets().then((w) => setBalance(w.invest));
  }, []);

  const parsedAmount = Number(amount);
  const arrival = useMemo(() => {
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return 0;
    return Math.max(0, parsedAmount - fee);
  }, [parsedAmount, fee]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!address.trim()) {
      setError(t.addressRequired);
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount < minPayout) {
      setError(t.minWithdrawError);
      return;
    }
    if (parsedAmount > balance) {
      setError(t.insufficient);
      return;
    }
    if (!password.trim()) {
      setError(t.securityRequired);
      return;
    }

    const session = getCurrentAccount();
    if (session?.securityPassword && session.securityPassword !== password) {
      setError(t.wrongPassword);
      return;
    }

    void debitWallet("invest", parsedAmount).then((result) => {
      if (!result.ok) {
        setError(t.insufficient);
        return;
      }
      const item: WithdrawRecord = {
        id: String(Date.now()),
        wallet: "USDT",
        address: address.trim(),
        amount: parsedAmount.toFixed(6),
        fee: fee.toFixed(6),
        arrival: arrival.toFixed(6),
        status: t.resultPending,
        at: new Date().toLocaleString(),
      };
      const prev = JSON.parse(
        window.localStorage.getItem("olx-withdraw-history") || "[]"
      ) as WithdrawRecord[];
      window.localStorage.setItem(
        "olx-withdraw-history",
        JSON.stringify([item, ...prev].slice(0, 20))
      );
      router.push(
        `/withdraw/result?amount=${item.amount}&wallet=${encodeURIComponent("USDT")}&arrival=${item.arrival}`
      );
    });
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
          <h1 className="text-[17px] font-semibold">{t.withdraw}</h1>
          <Link href="/withdraw/history" className="text-[12px] text-[#9ec6ff]">
            {t.withdrawHistory}
          </Link>
        </header>

        <div className="wd-balance mb-4">
          <p className="text-[12px] text-white/55">{t.availableAssets}</p>
          <p className="mt-2 text-[28px] font-semibold tracking-wide text-[#7ee0ff]">
            {balance.toFixed(6)}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="pay-card">
            <p className="text-[11px] tracking-wide text-white/45 uppercase">{t.payoutMethod}</p>
            <p className="mt-2 text-[17px] font-semibold">USDT</p>
            <p className="mt-1 text-[13px] text-white/50">{t.payoutHint}</p>
          </div>

          <label className="block">
            <span className="mb-2 block text-[12px] text-white/55">{t.withdrawalAddress}</span>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t.addressPlaceholder}
              className="wd-input"
              autoComplete="off"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-[12px] text-white/55">{t.transferAmount}</span>
            <div className="relative">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="wd-input pr-16"
                inputMode="decimal"
              />
              <button
                type="button"
                className="wd-all"
                onClick={() => setAmount(balance.toFixed(6))}
              >
                {t.all}
              </button>
            </div>
          </label>

          <div className="flex justify-between text-[12px] text-white/50">
            <span>
              {t.minWithdraw}: {minPayout.toFixed(2)} USDT
            </span>
            <span>
              {t.handlingFee}: {fee.toFixed(0)} USDT
            </span>
          </div>

          <label className="block">
            <span className="mb-2 block text-[12px] text-white/55">{t.securityPassword}</span>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.securityPlaceholder}
                className="wd-input pr-12"
              />
              <button
                type="button"
                className="wd-eye"
                onClick={() => setShowPass((value) => !value)}
              >
                {showPass ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <p className="text-right text-[12px] text-white/55">
            {t.actualArrival}: {arrival.toFixed(6)} USDT
          </p>

          {error ? (
            <p className="rounded-xl bg-[#ff5b7a]/12 px-3 py-2 text-center text-[13px] text-[#ff8aa0]">
              {error}
            </p>
          ) : null}

          <button type="submit" className="wd-confirm">
            {t.confirm}
          </button>
        </form>

        <section className="wd-reminder mt-5">
          <h2 className="mb-2 flex items-center gap-2 text-[14px] font-semibold text-[#ffd27a]">
            <span>⚠</span> {t.warmReminder}
          </h2>
          <p className="mb-3 text-[12px] leading-5 text-white/70">{t.warmIntro}</p>
          <ol className="space-y-3 text-[12px] leading-5 text-white/68">
            <li>
              <strong className="text-white/90">1. {t.warm1Title}</strong>
              <p className="mt-1">{t.warm1Body}</p>
            </li>
            <li>
              <strong className="text-white/90">2. {t.warm2Title}</strong>
              <p className="mt-1">{t.warm2Body}</p>
            </li>
            <li>
              <strong className="text-white/90">3. {t.warm3Title}</strong>
              <p className="mt-1">{t.warm3Body}</p>
            </li>
            <li>
              <strong className="text-white/90">4. {t.warm4Title}</strong>
              <p className="mt-1">{t.warm4Body}</p>
            </li>
          </ol>
          <Link href="/support" className="mt-4 block text-[12px] leading-5 text-[#9ec6ff]">
            {t.warmFooter}
          </Link>
        </section>
      </div>
    </div>
  );
}
