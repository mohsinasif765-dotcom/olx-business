"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { fetchContent } from "@/lib/fetch-content";
import { getCoin } from "@/lib/coins";
import { type CurrencyRow, isCryptoId, payDestination } from "@/lib/currencies";
import { CurrencyFlag } from "@/components/CurrencyFlag";
import { useLanguage } from "@/lib/i18n";
import { useCarPlans } from "@/lib/use-car-plans";
import { postLedger } from "@/lib/ledger";
import { getSessionAccount } from "@/lib/session";

type HistoryItem = {
  id: string;
  coin: string;
  amount: string;
  status: string;
  at: string;
};

type PayAsset = CurrencyRow & { symbol: string };

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
  const [asset, setAsset] = useState<PayAsset>({
    id: fallback.id,
    name: fallback.name,
    network: fallback.network,
    min: fallback.min,
    address: fallback.address,
    symbol: fallback.symbol,
    payKind: isCryptoId(fallback.id) ? "crypto" : "bank",
    bankName: "",
    accountName: "",
    accountNumber: "",
    iban: "",
    swift: "",
    branch: "",
    instructions: "",
  });
  const [paused, setPaused] = useState(false);
  const [copied, setCopied] = useState("");
  const [amount, setAmount] = useState("");
  const [hash, setHash] = useState("");
  const [slip, setSlip] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetchContent()
      .then((data: { flags?: { rechargeOn?: boolean }; coins?: CurrencyRow[] } | null) => {
        if (data?.flags?.rechargeOn === false) setPaused(true);
        const row = data?.coins?.find((c) => c.id === coinId) || data?.coins?.[0];
        if (row) {
          setAsset({
            ...row,
            symbol: row.name || row.id.toUpperCase(),
            payKind: row.payKind || (isCryptoId(row.id) ? "crypto" : "bank"),
          });
        }
      })
      .catch(() => {});
  }, [coinId]);

  const plan = useMemo(
    () => vipPlans.find((item) => item.id === params.get("plan")) ?? null,
    [params, vipPlans]
  );
  const dest = payDestination(asset);
  const crypto = asset.payKind === "crypto" || isCryptoId(asset.id);
  const minN = Number(asset.min) || 0;
  const quick = [asset.min, String(minN * 2 || 50), String(minN * 5 || 100), String(minN * 10 || 500)];
  const qrValue = dest || asset.iban || asset.address;
  const ready = Boolean(dest || asset.iban || asset.bankName);

  const rows = [
    !crypto && asset.bankName ? { key: "bank", label: t.bankName, value: asset.bankName } : null,
    !crypto && asset.accountName ? { key: "title", label: t.accountTitle, value: asset.accountName } : null,
    dest ? { key: "dest", label: crypto ? t.depositAddress : t.accountNumber, value: dest } : null,
    asset.iban ? { key: "iban", label: t.ibanLabel, value: asset.iban } : null,
    asset.swift ? { key: "swift", label: t.swiftLabel, value: asset.swift } : null,
    asset.branch ? { key: "branch", label: t.branchLabel, value: asset.branch } : null,
  ].filter(Boolean) as { key: string; label: string; value: string }[];

  async function copyValue(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(""), 1500);
    } catch {
      setCopied("");
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!getSessionAccount()) {
      setMessage(t.login);
      return;
    }
    if (paused) {
      setMessage("Funding is paused in admin settings.");
      return;
    }
    if (!ready) {
      setMessage(t.payNotReady);
      return;
    }
    if (!amount.trim() || Number(amount) <= 0) {
      setMessage(t.amountRequired);
      return;
    }
    if (minN > 0 && Number(amount) < minN) {
      setMessage(`${t.minAmount} ${asset.min} ${asset.symbol}`);
      return;
    }
    if (!slip) {
      setMessage(t.slipRequired);
      return;
    }
    setBusy(true);
    let slipUrl = "";
    try {
      const form = new FormData();
      form.append("file", slip);
      const up = await fetch("/api/proof", { method: "POST", body: form });
      const upData = (await up.json()) as { url?: string };
      if (!up.ok || !upData.url) {
        setBusy(false);
        setMessage(t.slipRequired);
        return;
      }
      slipUrl = upData.url;
    } catch {
      setBusy(false);
      setMessage(t.slipRequired);
      return;
    }
    const item: HistoryItem = {
      id: String(Date.now()),
      coin: asset.name,
      amount: `${amount} ${asset.symbol}`,
      status: t.pending,
      at: new Date().toLocaleString(),
    };
    const prev = JSON.parse(window.localStorage.getItem("olx-recharge-history") || "[]") as HistoryItem[];
    window.localStorage.setItem("olx-recharge-history", JSON.stringify([item, ...prev].slice(0, 20)));
    await postLedger({
      kind: "recharges",
      amount: Number(amount),
      network: asset.name,
      txHash: hash,
      slipUrl,
      status: "pending",
    });
    setBusy(false);
    setMessage(t.submittedPending);
    setAmount("");
    setHash("");
    setSlip(null);
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

        <div className="deposit-hero mb-4 px-4 py-5 text-center">
          <div className="mx-auto mb-3 w-fit">
            <CurrencyFlag id={asset.id} name={asset.name} network={asset.network} size={56} />
          </div>
          <h2 className="text-[20px] font-semibold">{asset.name}</h2>
          <span className="mt-2 inline-flex rounded-full bg-[#6d5bff]/25 px-3 py-1 text-[11px] tracking-wide text-[#c9b8ff]">
            {crypto ? asset.network : t.bankName}
            {asset.network && !crypto ? ` · ${asset.network}` : ""}
          </span>
          {plan ? (
            <p className="mt-2 text-[12px] text-white/55">
              {t.selectedPlan}: {plan.name}
            </p>
          ) : null}
          <p className="mt-3 text-[12px] leading-5 text-white/60">{t.payToCompany}</p>
        </div>

        {ready ? (
          <div className="deposit-card mb-4 p-4">
            {qrValue ? (
              <>
                <div className="mx-auto mb-3 flex h-[160px] w-[160px] items-center justify-center rounded-2xl bg-white p-3">
                  <AddressQr value={qrValue} />
                </div>
                <p className="mb-4 text-center text-[12px] text-white/50">{t.scanQr}</p>
              </>
            ) : null}
            <div className="space-y-2">
              {rows.map((row) => (
                <div key={row.key} className="flex items-start gap-2 rounded-xl bg-black/25 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">{row.label}</p>
                    <p className="mt-0.5 break-all font-mono text-[12px] leading-5 text-white/90">{row.value}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyValue(row.key, row.value)}
                    className="shrink-0 rounded-lg bg-[#5b4dff] px-2.5 py-1.5 text-[11px] font-semibold"
                  >
                    {copied === row.key ? t.copied : t.copy}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="mb-4 rounded-xl border border-[#ffd27a]/25 bg-[#ffd27a]/10 px-3 py-3 text-[13px] leading-5 text-[#ffd27a]">
            {t.payNotReady}
          </p>
        )}

        <div className="deposit-card mb-4 grid grid-cols-2 gap-3 p-4 text-center">
          <div>
            <p className="text-[11px] text-white/45">{crypto ? t.network : t.bankName}</p>
            <p className="mt-1 text-sm font-semibold">{asset.bankName || asset.network}</p>
          </div>
          <div>
            <p className="text-[11px] text-white/45">{t.minAmount}</p>
            <p className="mt-1 text-sm font-semibold">
              {asset.min} {asset.symbol}
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-[#ffd27a]/30 bg-[#ffd27a]/10 px-3 py-3 text-[12px] leading-5 text-[#ffd27a]">
          {t.onlySend.replace("{asset}", asset.symbol)}
          {asset.instructions ? ` ${asset.instructions}` : ""}
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
              {t.step2.replace("{asset}", asset.symbol)}
            </li>
            <li className="flex gap-2">
              <span className="step-no">3</span>
              {t.step3}
            </li>
          </ol>
        </div>

        <form className="space-y-3" onSubmit={(e) => void onSubmit(e)}>
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
          <label className="block">
            <span className="mb-1 block text-[12px] text-white/55">
              {crypto ? t.cryptoRefLabel : t.bankRefLabel}
            </span>
            <p className="mb-2 text-[11px] leading-4 text-white/40">
              {crypto ? t.cryptoRefHint : t.bankRefHint}
            </p>
            <input
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              placeholder={crypto ? t.cryptoRefPlaceholder : t.bankRefPlaceholder}
              className="auth-input"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-[12px] text-white/55">{t.uploadSlip}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="auth-input"
              onChange={(event) => setSlip(event.target.files?.[0] || null)}
            />
            {slip ? <p className="mt-1 text-[12px] text-white/50">{slip.name}</p> : null}
          </label>
          <button type="submit" className="vip-recharge-btn w-full" disabled={busy || paused}>
            {t.submitOrder}
          </button>
        </form>

        {message ? (
          <p className="mt-4 rounded-xl bg-[#3dff9a]/10 py-3 text-center text-sm text-[#3dff9a]">
            {message}
          </p>
        ) : null}

        <Link href="/support" className="mt-4 block text-center text-sm text-[#9ec6ff]">
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
    const code = value.charCodeAt(i % Math.max(value.length, 1)) + i * 13;
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
        on ? <rect key={i} x={i % size} y={Math.floor(i / size)} width="1" height="1" fill="#111" /> : null
      )}
    </svg>
  );
}
