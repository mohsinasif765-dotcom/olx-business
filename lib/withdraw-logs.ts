export const SAMPLE_WITHDRAW_LOGS = [
  { user: "+92***1144", amount: "25,000 PKR" },
  { user: "na***@outlook.com", amount: "120.00 USD" },
  { user: "im***@gmail.com", amount: "200.00 EUR" },
  { user: "sa***@hotmail.com", amount: "80.00 GBP" },
  { user: "+971***3344", amount: "920.00 AED" },
  { user: "+966***5512", amount: "400.00 SAR" },
  { user: "+91***8821", amount: "8,500 INR" },
  { user: "+86***6677", amount: "680.00 CNY" },
  { user: "ah***@gmail.com", amount: "50.00 USDT" },
  { user: "fa***@yahoo.com", amount: "60.00 USD" },
  { user: "ko***@gmail.com", amount: "75.00 EUR" },
  { user: "yu***@gmail.com", amount: "15,500 PKR" },
];

export function fillWithdrawLogs(live: { user: string; amount: string }[]) {
  if (live.length >= 12) return live.slice(0, 12);
  const extra = SAMPLE_WITHDRAW_LOGS.filter(
    (row) => !live.some((item) => item.user === row.user && item.amount === row.amount)
  );
  return [...live, ...extra].slice(0, 12);
}
