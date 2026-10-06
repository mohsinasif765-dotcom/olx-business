const BY_ID: Record<string, string> = {
  pkr: "pk",
  usd: "us",
  eur: "eu",
  gbp: "gb",
  aed: "ae",
  sar: "sa",
  inr: "in",
  cny: "cn",
  bdt: "bd",
  try: "tr",
  cad: "ca",
  aud: "au",
  npr: "np",
  afn: "af",
  irr: "ir",
  egp: "eg",
  qar: "qa",
  kwd: "kw",
  omr: "om",
  bhd: "bh",
  jpy: "jp",
  krw: "kr",
  myr: "my",
  idr: "id",
  thb: "th",
  vnd: "vn",
  php: "ph",
  rub: "ru",
  uah: "ua",
  ngn: "ng",
  zar: "za",
  kes: "ke",
  brl: "br",
  mxn: "mx",
};

const BY_COUNTRY: Record<string, string> = {
  pakistan: "pk",
  "united states": "us",
  usa: "us",
  america: "us",
  europe: "eu",
  "united kingdom": "gb",
  uk: "gb",
  britain: "gb",
  uae: "ae",
  "saudi arabia": "sa",
  india: "in",
  china: "cn",
  bangladesh: "bd",
  turkey: "tr",
  canada: "ca",
  australia: "au",
  nepal: "np",
  afghanistan: "af",
  iran: "ir",
  egypt: "eg",
  qatar: "qa",
  kuwait: "kw",
  oman: "om",
  bahrain: "bh",
  japan: "jp",
  "south korea": "kr",
  malaysia: "my",
  indonesia: "id",
  thailand: "th",
  vietnam: "vn",
  philippines: "ph",
};

export function countryCodeForCurrency(id: string, name?: string, network?: string) {
  const key = String(id || "").toLowerCase();
  if (key === "usdt" || String(name).toUpperCase() === "USDT") return "";
  if (BY_ID[key]) return BY_ID[key];
  const n = String(name || "").toLowerCase();
  if (BY_ID[n]) return BY_ID[n];
  const country = String(network || "").trim().toLowerCase();
  if (BY_COUNTRY[country]) return BY_COUNTRY[country];
  return "";
}

export function flagUrl(code: string, width = 80) {
  return `https://flagcdn.com/w${width}/${code}.png`;
}
