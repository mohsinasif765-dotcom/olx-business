export const COINS = [
  { id: "usdt", name: "USDT", network: "Tether", symbol: "USDT", color: "#26a17b", letter: "₮", min: "10", address: "OLB-USDT-WALLET" },
  { id: "pkr", name: "PKR", network: "Pakistan", symbol: "PKR", color: "#01411c", letter: "Rs", min: "1000", address: "OLB-PKR-BANK" },
  { id: "usd", name: "USD", network: "United States", symbol: "USD", color: "#2e7d32", letter: "$", min: "10", address: "OLB-USD-BANK" },
  { id: "eur", name: "EUR", network: "Europe", symbol: "EUR", color: "#003399", letter: "€", min: "10", address: "OLB-EUR-BANK" },
  { id: "gbp", name: "GBP", network: "United Kingdom", symbol: "GBP", color: "#012169", letter: "£", min: "10", address: "OLB-GBP-BANK" },
  { id: "aed", name: "AED", network: "UAE", symbol: "AED", color: "#00732f", letter: "د", min: "20", address: "OLB-AED-BANK" },
  { id: "sar", name: "SAR", network: "Saudi Arabia", symbol: "SAR", color: "#006c35", letter: "ر", min: "20", address: "OLB-SAR-BANK" },
  { id: "inr", name: "INR", network: "India", symbol: "INR", color: "#ff9933", letter: "₹", min: "500", address: "OLB-INR-BANK" },
  { id: "cny", name: "CNY", network: "China", symbol: "CNY", color: "#de2910", letter: "¥", min: "50", address: "OLB-CNY-BANK" },
] as const;

export type CoinId = (typeof COINS)[number]["id"];

export function getCoin(id: string | null) {
  return COINS.find((coin) => coin.id === id) ?? COINS[0];
}
