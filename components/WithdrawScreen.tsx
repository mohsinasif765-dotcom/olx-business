"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getSessionAccount, verifySecurityPassword } from "@/lib/session";
import { useLanguage } from "@/lib/i18n";
import { debitWallet, loadWallets } from "@/lib/wallets";
import { fetchContent } from "@/lib/fetch-content";
import { postLedger } from "@/lib/ledger";
import { isBankCurrency, moneyPrefix, normalizeWalletMode, type WalletMode } from "@/lib/currencies";
import { CurrencySelect } from "@/components/CurrencySelect";

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

type CoinOpt = { id: string; name: string; network?: string; payKind?: string };
type PayoutTab = "USDT" | "Bank";

function isUsdtCoin(c: CoinOpt) {
  return (
    String(c.id).toLowerCase() === "usdt" ||
    c.name === "USDT" ||
    c.payKind === "crypto" ||
    !isBankCurrency(c.id, c.name)
  );
}

export function WithdrawScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState("");

  const [fee, setFee] = useState(1);
  const [minPayout, setMinPayout] = useState(1);
  const [paused, setPaused] = useState(false);
  const [coins, setCoins] = useState<CoinOpt[]>([
    { id: "pkr", name: "PKR", network: "Pakistan", payKind: "bank" },
    { id: "usdt", name: "USDT", network: "Tether", payKind: "crypto" },
  ]);
  const [coin, setCoin] = useState("PKR");
  const [walletMode, setWalletMode] = useState<WalletMode>("pkr");
  const [usdtToPkrRate, setUsdtToPkrRate] = useState(280);
  const [payoutTab, setPayoutTab] = useState<PayoutTab>("Bank");

  useEffect(() => {
    void loadWallets().then((w) => setBalance(w.invest));
    const account = getSessionAccount();
    const qs = account ? `?account=${encodeURIComponent(account)}` : "";
    void fetch(`/api/me${qs}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (data: {
          finance?: { minWithdraw?: number; payoutFee?: number };
          flags?: { withdrawOn?: boolean };
          usdtToPkrRate?: number;
          walletMode?: string;
        } | null) => {
          if (data?.finance?.minWithdraw) setMinPayout(data.finance.minWithdraw);
          if (data?.finance?.payoutFee != null) setFee(data.finance.payoutFee);
          if (data?.flags?.withdrawOn === false) setPaused(true);
          if (data?.usdtToPkrRate) setUsdtToPkrRate(Number(data.usdtToPkrRate) || 280);
          if (data?.walletMode) setWalletMode(normalizeWalletMode(data.walletMode));
        }
      )
      .catch(() => {});
    void fetchContent()
      .then(
        (data: {
          coins?: CoinOpt[];
          walletMode?: string;
          usdtToPkrRate?: number;
        } | null) => {
          if (data?.usdtToPkrRate) setUsdtToPkrRate(Number(data.usdtToPkrRate) || 280);
          const mode = normalizeWalletMode(data?.walletMode || "pkr");
          setWalletMode(mode);
          if (!data?.coins?.length) return;
          setCoins(data.coins);
          const usdt = data.coins.find(isUsdtCoin);
          const bank = data.coins.find((c) => !isUsdtCoin(c));
          if (mode === "usdt") {
            setPayoutTab(usdt && bank ? "USDT" : bank ? "Bank" : "USDT");
            setCoin((usdt || data.coins[0]).name);
          } else if (mode === "dual") {
            setPayoutTab(usdt && bank ? "USDT" : bank ? "Bank" : "USDT");
            setCoin((usdt || bank || data.coins[0]).name);
          } else {
            setPayoutTab("Bank");
            setCoin((bank || data.coins[0]).name);
          }
        }
      )
      .catch(() => {});
  }, []);

  const usdtCoins = useMemo(() => coins.filter(isUsdtCoin), [coins]);
  const bankCoins = useMemo(() => coins.filter((c) => !isUsdtCoin(c)), [coins]);
  const showTabs = usdtCoins.length > 0 && bankCoins.length > 0 && walletMode === "dual";
  const dual = walletMode === "dual";
  const balanceCode = walletMode === "pkr" ? "PKR" : "USDT";
  const balanceCash = moneyPrefix(balanceCode);
  const balancePkr =
    (walletMode === "usdt" || dual) && usdtToPkrRate > 0
      ? Number((balance * usdtToPkrRate).toFixed(2))
      : null;

  function selectTab(tab: PayoutTab) {
    setPayoutTab(tab);
    setAddress("");
    if (tab === "USDT") {
      setCoin((usdtCoins[0] || coins[0]).name);
    } else {
      setCoin((bankCoins[0] || coins[0]).name);
    }
  }

  const selected = coins.find((c) => c.name === coin) || coins[0];
  const bankMode = selected ? isBankCurrency(selected.id, selected.name) : true;
  const showPkrEstimate =
    bankMode && (walletMode === "usdt" || walletMode === "dual") && usdtToPkrRate > 0;

  const parsedAmount = Number(amount);
  const arrival = useMemo(() => {
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return 0;
    return Math.max(0, parsedAmount - fee);
  }, [parsedAmount, fee]);

  const estimatedPkr = useMemo(() => {
    if (!showPkrEstimate || arrival <= 0) return 0;
    return Number((arrival * usdtToPkrRate).toFixed(2));
  }, [showPkrEstimate, arrival, usdtToPkrRate]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!address.trim()) {
      setError(bankMode ? t.bankDetailsRequired : t.addressRequired);
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

    if (paused) {
      setError("Withdraw is paused in admin settings.");
      return;
    }

    const okPass = await verifySecurityPassword(password);
    if (!okPass) {
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
        wallet: coin,
        address: address.trim(),
        amount: parsedAmount.toFixed(2),
        fee: fee.toFixed(2),
        arrival: arrival.toFixed(2),
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
      void postLedger({
        kind: "withdraws",
        amount: parsedAmount,
        wallet: coin,
        address: address.trim(),
        status: "pending",
      });
      router.push(
        `/withdraw/result?amount=${item.amount}&wallet=${encodeURIComponent(coin)}&arrival=${item.arrival}`
      );
    });
  }

  const tabCoins = payoutTab === "USDT" ? usdtCoins : bankCoins;
  const methodCoins = showTabs ? (tabCoins.length ? tabCoins : coins) : coins;

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
          {dual ? (
            <p className="mt-1 text-[11px] tracking-[0.14em] text-[#9ee7ff]/80">PKR + USDT</p>
          ) : null}
          <p className="mt-2 text-[28px] font-semibold tracking-wide text-[#7ee0ff]">
            {balanceCode === "USDT"
              ? `${balance.toFixed(2)} USDT`
              : `${balanceCash} ${balance.toFixed(2)}`}
          </p>
          {balancePkr != null && !dual ? (
            <p className="mt-1.5 text-[13px] text-white/45">
              ≈ Rs {balancePkr.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          ) : null}
          {dual ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-black/20 px-3 py-2 text-center">
                <p className="text-[10px] uppercase tracking-wide text-white/40">USDT</p>
                <p className="mt-1 text-[14px] font-semibold text-white/90">{balance.toFixed(2)}</p>
              </div>
              <div className="rounded-xl bg-black/20 px-3 py-2 text-center">
                <p className="text-[10px] uppercase tracking-wide text-white/40">PKR</p>
                <p className="mt-1 text-[14px] font-semibold text-white/90">
                  Rs {(balancePkr ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="pay-card">
            <p className="text-[11px] tracking-wide text-white/45 uppercase">{t.payoutMethod}</p>
            {showTabs ? (
              <div className="mt-2 mb-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`rounded-xl py-2.5 text-[13px] font-semibold ${
                    payoutTab === "USDT"
                      ? "bg-[#3b82f6] text-white"
                      : "bg-white/5 text-white/60"
                  }`}
                  onClick={() => selectTab("USDT")}
                >
                  USDT
                </button>
                <button
                  type="button"
                  className={`rounded-xl py-2.5 text-[13px] font-semibold ${
                    payoutTab === "Bank"
                      ? "bg-[#3b82f6] text-white"
                      : "bg-white/5 text-white/60"
                  }`}
                  onClick={() => selectTab("Bank")}
                >
                  Bank
                </button>
              </div>
            ) : null}
            {methodCoins.length > 1 ? (
              <CurrencySelect coins={methodCoins} value={coin} onChange={setCoin} />
            ) : (
              <p className="mt-2 text-[15px] font-medium text-white/90">{coin}</p>
            )}
            <p className="mt-1 text-[13px] text-white/50">
              {bankMode ? t.payoutHintBank : t.payoutHint}
            </p>
          </div>

          <label className="block">
            <span className="mb-2 block text-[12px] text-white/55">
              {bankMode ? t.bankAccountLabel : t.withdrawalAddress}
            </span>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={bankMode ? t.bankAccountPlaceholder : t.addressPlaceholder}
              className="wd-input min-h-[88px] resize-y py-3"
              autoComplete="off"
              rows={bankMode ? 3 : 2}
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
                onClick={() => setAmount(balance.toFixed(2))}
              >
                {t.all}
              </button>
            </div>
          </label>

          <div className="flex justify-between text-[12px] text-white/50">
            <span>
              {t.minWithdraw}: {minPayout.toFixed(2)} {coin}
            </span>
            <span>
              {t.handlingFee}: {fee.toFixed(0)} {coin}
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
            {t.actualArrival}: {arrival.toFixed(2)} {coin}
          </p>

          {showPkrEstimate && arrival > 0 ? (
            <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-3">
              <p className="text-[11px] uppercase tracking-wide text-emerald-200/70">
                Estimated PKR
              </p>
              <p className="mt-1 text-[20px] font-semibold text-emerald-200">
                Rs {estimatedPkr.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="mt-1 text-[11px] text-white/45">
                Rate 1 USDT ≈ Rs {usdtToPkrRate.toLocaleString("en-US")}
              </p>
            </div>
          ) : null}

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
              <p className="mt-1">{bankMode ? t.warm1BodyBank : t.warm1Body}</p>
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
