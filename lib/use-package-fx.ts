"use client";

import { useEffect, useMemo, useState } from "react";
import { moneyPrefix } from "@/lib/currencies";
import {
  defaultUsdtFx,
  formatPackageMoneyText,
  formatUsdtAsDisplay,
  type UsdtFxTable,
} from "@/lib/package-money";
import { fetchContent } from "@/lib/fetch-content";
import { getSessionAccount } from "@/lib/session";

type FxPayload = {
  displayCurrency?: string;
  walletMode?: string;
  usdtToPkrRate?: number;
  usdtFx?: UsdtFxTable;
};

/** Member display currency + USDT FX table for package price conversion. */
export function usePackageFx() {
  const [code, setCode] = useState("PKR");
  const [walletMode, setWalletMode] = useState("pkr");
  const [fx, setFx] = useState<UsdtFxTable>(() => defaultUsdtFx(280));

  useEffect(() => {
    const account = getSessionAccount();
    const qs = account ? `?account=${encodeURIComponent(account)}` : "";
    const url = account ? `/api/me${qs}` : "/api/content";
    void fetch(url, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: FxPayload | null) => {
        apply(data);
      })
      .catch(() => {
        void fetchContent()
          .then((data: FxPayload | null) => apply(data))
          .catch(() => {});
      });

    function apply(data: FxPayload | null) {
      if (!data) return;
      const mode = String(data.walletMode || "").toLowerCase();
      const fromMode =
        mode === "usdt" || mode === "dual" ? "USDT" : mode === "pkr" ? "PKR" : "";
      const nextCode = String(fromMode || data.displayCurrency || "PKR").toUpperCase();
      setCode(nextCode);
      setWalletMode(mode === "usdt" || mode === "dual" || mode === "pkr" ? mode : "pkr");
      const pkr = Number(data.usdtToPkrRate) || 280;
      const table = data.usdtFx && typeof data.usdtFx === "object" ? data.usdtFx : defaultUsdtFx(pkr);
      setFx({ ...defaultUsdtFx(pkr), ...table, PKR: Number(table.PKR) || pkr, USDT: 1 });
    }
  }, []);

  const api = useMemo(
    () => ({
      code,
      fx,
      walletMode,
      dual: walletMode === "dual",
      cash: moneyPrefix(code),
      fundLabel: code,
      /** Catalog invest/returns (USDT base) → display string */
      money: (raw: unknown) => formatPackageMoneyText(raw, code, fx),
      moneyPkr: (raw: unknown) => formatPackageMoneyText(raw, "PKR", fx),
      /** Single USDT amount → display label */
      fromUsdt: (amountUsdt: number) => formatUsdtAsDisplay(amountUsdt, code, fx),
    }),
    [code, fx, walletMode],
  );

  return api;
}
