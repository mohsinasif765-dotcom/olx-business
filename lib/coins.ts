export const COINS = [
  { id: "bep20-usdt", name: "BEP20-USDT", network: "BEP20", symbol: "USDT", color: "#26a17b", letter: "₮", min: "10", address: "0xDEMO_BEP20_USDT_ADDRESS_OLX" },
  { id: "trc20-usdt", name: "TRC20-USDT", network: "TRC20", symbol: "USDT", color: "#26a17b", letter: "₮", min: "10", address: "TDEMO_TRC20_USDT_ADDRESS_OLX99" },
  { id: "polygon-usdt", name: "POLYGON-USDT", network: "POLYGON", symbol: "USDT", color: "#8247e5", letter: "₮", min: "10", address: "0xDEMO_POLYGON_USDT_ADDRESS" },
  { id: "trx", name: "TRX", network: "TRON", symbol: "TRX", color: "#eb0029", letter: "T", min: "50", address: "TDEMO_TRX_ADDRESS_OLXBUSINESS", telegram: true },
  { id: "bnb", name: "BNB", network: "BEP20", symbol: "BNB", color: "#f3ba2f", letter: "B", min: "0.05", address: "0xDEMO_BNB_ADDRESS_OLXBUSINESS" },
  { id: "bep20-usdc", name: "BEP20-USDC", network: "BEP20", symbol: "USDC", color: "#2775ca", letter: "$", min: "10", address: "0xDEMO_BEP20_USDC_ADDRESS_OLX" },
  { id: "eth-usdt", name: "ETH-USDT", network: "ERC20", symbol: "USDT", color: "#26a17b", letter: "₮", min: "20", address: "0xDEMO_ETH_USDT_ADDRESS_OLX99" },
  { id: "polygon-usdc", name: "POLYGON-USDC", network: "POLYGON", symbol: "USDC", color: "#2775ca", letter: "$", min: "10", address: "0xDEMO_POLYGON_USDC_ADDRESS" },
  { id: "eth-usdc", name: "ETH-USDC", network: "ERC20", symbol: "USDC", color: "#2775ca", letter: "$", min: "20", address: "0xDEMO_ETH_USDC_ADDRESS_OLX99" },
  { id: "eth", name: "ETH", network: "ERC20", symbol: "ETH", color: "#627eea", letter: "Ξ", min: "0.01", address: "0xDEMO_ETH_ADDRESS_OLXBUSINESS" },
  { id: "polygon", name: "POLYGON", network: "POLYGON", symbol: "POL", color: "#8247e5", letter: "P", min: "20", address: "0xDEMO_POLYGON_ADDRESS_OLX99" },
  { id: "eth-pyusd", name: "ETH-PYUSD", network: "ERC20", symbol: "PYUSD", color: "#3868ff", letter: "P", min: "20", address: "0xDEMO_ETH_PYUSD_ADDRESS_OLX" },
] as const;

export type CoinId = (typeof COINS)[number]["id"];

export function getCoin(id: string | null) {
  return COINS.find((coin) => coin.id === id) ?? null;
}
