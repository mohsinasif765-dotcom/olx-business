"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { fetchContent } from "@/lib/fetch-content";
import { getCoin } from "@/lib/coins";
import { CurrencyFlag } from "@/components/CurrencyFlag";
import { useLanguage } from "@/lib/i18n";
import { useCarPlans } from "@/lib/use-car-plans";
import { creditWallet } from "@/lib/wallets";
import { postLedger } from "@/lib/ledger";
import { getSessionAccount } from "@/lib/session";

type HistoryItem = {
  id: string;
  coin: string;
  amount: string;
  status: string;
  at: string;
};

export default function Page() {
  return (
    <Suspense fallback={<div className="star-field min-h-screen" />}>
      <RechargeDetail />
    </Suspense>
  );
}

function RechargeDetail() {
  const { t } = useLanguage();
  const params = useSearchParams();
  const { vipPlans } = useCarPlans();
  const coinId = params.get("coin") || "usdt";
  const fallback = getCoin(coinId);
  const [asset, setAsset] = useState<{
    id: string;
    name: string;
    network: string;
    symbol: string;
    color: string;
    letter: string;
    min: string;
    address: string;
  }>({
    id: fallback.id,
    name: fallback.name,
    network: fallback.network,
    symbol: fallback.symbol,
    color: fallback.color,
    letter: fallback.letter,
    min: fallback.min,
    address: fallback.address,
  });
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    void fetchContent()
      .then((data: {
        flags?: { rechargeOn?: boolean };
        coins?: { id: string; name: string; network: string; min: string; address: string }[];
      } | null) => {
        if (data?.flags?.rechargeOn === false) setPaused(true);
        const row = data?.coins?.find((c) => c.id === coinId) || data?.coins?.[0];
        if (row) {
          setAsset({
            id: row.id,
            name: row.name,
            network: row.network,
            symbol: row.name || row.id.toUpperCase(),
            color: "#26a17b",
            letter: "₮",
            min: row.min,
            address: row.address,
          });
        }
      })
      .catch(() => {});
  }, [coinId]);
  const plan = useMemo(
    () => vipPlans.find((item) => item.id === params.get("plan")) ?? null,
    [params, vipPlans]
  );
  const [amount, setAmount] = useState("");
  const [hash, setHash] = useState("");
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");

  const quick = [asset.min, "50", "100", "500"];

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(asset.address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!amount.trim()) {
      setMessage(t.amountRequired);
      return;
    }
    const item: HistoryItem = {
      id: String(Date.now()),
      coin: asset.name,
      amount: `${amount} ${asset.symbol}`,
      status: t.pending,
      at: new Date().toLocaleString(),
    };
    const prev = JSON.parse(
      window.localStorage.getItem("olx-recharge-history") || "[]"
    ) as HistoryItem[];
    window.localStorage.setItem(
      "olx-recharge-history",
      JSON.stringify([item, ...prev].slice(0, 20))
    );
    const credited = Number(amount);
    if (paused) {
      setMessage("Funding is paused in admin settings.");
      return;
    }
    if (Number.isFinite(credited) && credited > 0) {
      void creditWallet("invest", credited);
      void postLedger({ kind: "recharges", amount: credited, network: asset.network, txHash: hash, status: "paid" });
    }
    setMessage(`${asset.name} ${amount} ${t.rechargeDone}`);
  }

  return (
    <div className="star-field">
      <div className="page-enter mx-auto min-h-screen w-full max-w-[430px] px-4 pb-28 pt-3">
        <header className="mb-5 flex items-center justify-between">
          <Link
            href="/wallet/select"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg"
          >
            ‹
          </Link>
          <h1 className="text-[17px] font-semibold">{t.deposit}</h1>
          <Link href="/wallet/history" className="text-[12px] text-[#9ec6ff]">
            {t.rechargeHistory}
          </Link>
        </header>

        <div className="deposit-hero mb-4 text-center">
          <div className="mx-auto mb-3 w-fit drop-shadow-lg">
            <CurrencyFlag id={asset.id} name={asset.name} network={asset.network} size={56} />
          </div>
          <h2 className="text-[20px] font-semibold">{asset.name}</h2>
          <span className="mt-2 inline-flex rounded-full bg-[#6d5bff]/25 px-3 py-1 text-[11px] tracking-wide text-[#c9b8ff]">
            {asset.network}
          </span>
          {plan ? (
            <p className="mt-2 text-[12px] text-white/55">
              {t.selectedPlan}: {plan.name}
            </p>
          ) : null}
        </div>

        <div className="deposit-card mb-4 p-4">
          <div className="mx-auto mb-4 flex h-[168px] w-[168px] items-center justify-center rounded-2xl bg-white p-3 shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
            <AddressQr value={asset.address} />
          </div>
          <p className="mb-3 text-center text-[12px] text-white/50">{t.scanQr}</p>
          <p className="mb-2 text-[12px] text-white/50">{t.depositAddress}</p>
          <div className="flex items-start gap-2 rounded-xl bg-black/25 p-3">
            <p className="min-w-0 flex-1 break-all font-mono text-[12px] leading-5 text-white/90">
              {asset.address}
            </p>
            <button
              type="button"
              onClick={copyAddress}
              className="shrink-0 rounded-lg bg-[#5b4dff] px-3 py-1.5 text-[12px] font-semibold"
            >
              {copied ? t.copied : t.copyAddress}
            </button>
          </div>
        </div>

        <div className="deposit-card mb-4 grid grid-cols-2 gap-3 p-4 text-center">
          <div>
            <p className="text-[11px] text-white/45">{t.network}</p>
            <p className="mt-1 text-sm font-semibold">{asset.network}</p>
          </div>
          <div>
            <p className="text-[11px] text-white/45">{t.minAmount}</p>
            <p className="mt-1 text-sm font-semibold">
              {asset.min} {asset.symbol}
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-[#ffd27a]/30 bg-[#ffd27a]/10 px-3 py-3 text-[12px] leading-5 text-[#ffd27a]">
          {t.onlySend}
        </div>

        <div className="deposit-card mb-4 p-4">
          <p className="mb-3 text-[13px] font-semibold">{t.howTo}</p>
          <ol className="space-y-2 text-[12px] text-white/70">
            <li className="flex gap-2">
              <span className="step-no">1</span>
              {t.step1}
            </li>
            <li className="flex gap-2">
              <span className="step-no">2</span>
              {t.step2}
            </li>
            <li className="flex gap-2">
              <span className="step-no">3</span>
              {t.step3}
            </li>
          </ol>
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
          <div>
            <p className="mb-2 text-[12px] text-white/55">
              {t.amount} ({asset.symbol})
            </p>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t.enterAmount}
              className="auth-input"
              inputMode="decimal"
            />
            <div className="mt-2 flex gap-2">
              {quick.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAmount(value)}
                  className="flex-1 rounded-full bg-white/10 py-1.5 text-[12px]"
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          <input
            value={hash}
            onChange={(e) => setHash(e.target.value)}
            placeholder={t.txHash}
            className="auth-input"
          />
          <button type="submit" className="vip-recharge-btn w-full">
            {t.submitOrder}
          </button>
        </form>

        {message ? (
          <p className="mt-4 rounded-xl bg-[#3dff9a]/10 py-3 text-center text-sm text-[#3dff9a]">
            {message}
          </p>
        ) : null}

        <Link
          href="/support"
          className="mt-4 block text-center text-sm text-[#9ec6ff]"
        >
          {t.support}
        </Link>
      </div>
    </div>
  );
}

function AddressQr({ value }: { value: string }) {
  const size = 21;
  const cells: boolean[] = [];
  for (let i = 0; i < size * size; i++) {
    const code = value.charCodeAt(i % value.length) + i * 13;
    cells.push(code % 3 !== 0);
  }

  function finder(x: number, y: number) {
    for (let r = 0; r < 7; r += 1) {
      for (let c = 0; c < 7; c += 1) {
        const on = r === 0 || r === 6 || c === 0 || c === 6 || (r > 1 && r < 5 && c > 1 && c < 5);
        cells[(y + r) * size + (x + c)] = on;
      }
    }
  }
  finder(0, 0);
  finder(size - 7, 0);
  finder(0, size - 7);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full">
      <rect width={size} height={size} fill="#fff" />
      {cells.map((on, i) =>
        on ? (
          <rect
            key={i}
            x={i % size}
            y={Math.floor(i / size)}
            width="1"
            height="1"
            fill="#111"
          />
        ) : null
      )}
    </svg>
  );
}
