export const COINS = [
  {
    id: "usdt",
    name: "USDT",
    network: "USDT",
    symbol: "USDT",
    color: "#26a17b",
    letter: "₮",
    min: "10",
    address: "OLX-USDT-WALLET-DEMO",
  },
] as const;

export type CoinId = (typeof COINS)[number]["id"];

export function getCoin(id: string | null) {
  return COINS.find((coin) => coin.id === id) ?? COINS[0];
}
