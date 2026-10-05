"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { getWallets, moveFunds } from "@/lib/wallets";
import { getCurrentAccount } from "@/lib/session";

export function TransferScreen() {
  const { t } = useLanguage();
  const [from, setFrom] = useState<"invest" | "brokerage">("invest");
  const [to, setTo] = useState<"invest" | "brokerage">("brokerage");
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [wallets, setWallets] = useState({ invest: 0, brokerage: 0 });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setWallets(getWallets());
  }, []);

  function swap() {
    setFrom(to);
    setTo(from);
    setError("");
    setMessage("");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    const session = getCurrentAccount();
    if (session?.securityPassword) {
      if (!password.trim()) {
        setError(t.securityRequired);
        return;
      }
      if (session.securityPassword !== password) {
        setError(t.wrongPassword);
        return;
      }
    }

    const value = Number(amount);
    const result = moveFunds(from, to, value);
    if (!result.ok) {
      if (result.error === "same") setError(t.sameWallet);
      else if (result.error === "insufficient") setError(t.insufficient);
      else setError(t.amountRequired);
      return;
    }

    setWallets(getWallets());
    setAmount("");
    setPassword("");
    setMessage(t.transferDone);
  }

  const fromBalance = from === "invest" ? wallets.invest : wallets.brokerage;

  return (
    <div className="star-field">
      <div className="page-enter mx-auto min-h-screen w-full max-w-[430px] px-4 pb-28 pt-3">
        <header className="mb-5 flex items-center justify-between">
          <Link
            href="/me"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg"
          >
            ‹
          </Link>
          <h1 className="text-[17px] font-semibold">{t.transfer}</h1>
          <span className="w-9" />
        </header>

        <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <WalletPick
            title={t.fromWallet}
            name={from === "invest" ? t.investWallet : t.brokerageWallet}
            value={from === "invest" ? wallets.invest : wallets.brokerage}
            onToggle={() => {
              const next = from === "invest" ? "brokerage" : "invest";
              setFrom(next);
              if (to === next) setTo(from);
            }}
          />
          <button type="button" className="me-swap" onClick={swap} aria-label="Swap">
            ⇄
          </button>
          <WalletPick
            title={t.toWallet}
            name={to === "invest" ? t.investWallet : t.brokerageWallet}
            value={to === "invest" ? wallets.invest : wallets.brokerage}
            onToggle={() => {
              const next = to === "invest" ? "brokerage" : "invest";
              setTo(next);
              if (from === next) setFrom(to);
            }}
          />
        </div>

        <form className="deposit-card space-y-3 p-4" onSubmit={onSubmit}>
          <label className="block text-[12px] text-white/55">{t.amount}</label>
          <div className="flex items-center gap-2">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder={t.enterAmount}
              className="auth-input"
            />
            <button
              type="button"
              className="shrink-0 rounded-full bg-white/10 px-3 py-2 text-[12px]"
              onClick={() => setAmount(String(fromBalance))}
            >
              {t.all}
            </button>
          </div>
          <p className="text-[12px] text-white/45">
            {t.availableAssets}: {fromBalance.toFixed(2)}
          </p>

          <label className="block text-[12px] text-white/55">{t.securityPassword}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.securityPlaceholder}
            className="auth-input"
          />

          {error ? <p className="text-center text-[13px] text-[#ff9aa8]">{error}</p> : null}
          {message ? <p className="text-center text-[13px] text-[#7dffc2]">{message}</p> : null}

          <button type="submit" className="vip-recharge-btn w-full">
            {t.confirm}
          </button>
        </form>
      </div>
    </div>
  );
}

function WalletPick({
  title,
  name,
  value,
  onToggle,
}: {
  title: string;
  name: string;
  value: number;
  onToggle: () => void;
}) {
  return (
    <button type="button" className="deposit-card p-3 text-left" onClick={onToggle}>
      <p className="text-[11px] text-white/50">{title}</p>
      <p className="mt-1 text-[13px] font-medium">{name}</p>
      <p className="mt-1 text-[15px] text-[#9ee7ff]">{value.toFixed(2)}</p>
    </button>
  );
}
