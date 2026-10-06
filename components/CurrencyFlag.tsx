"use client";

import { CoinIcon } from "@/components/CoinIcon";
import { countryCodeForCurrency, flagUrl } from "@/lib/currency-flag";

export function CurrencyFlag({
  id,
  name,
  network,
  size = 28,
}: {
  id: string;
  name?: string;
  network?: string;
  size?: number;
}) {
  const code = countryCodeForCurrency(id, name, network);
  if (!code) {
    return <CoinIcon symbol={name || id} size={size} />;
  }
  return (
    <img
      src={flagUrl(code, size >= 40 ? 80 : 40)}
      alt=""
      width={size}
      height={Math.round(size * 0.72)}
      className="shrink-0 rounded-[4px] object-cover"
    />
  );
}
