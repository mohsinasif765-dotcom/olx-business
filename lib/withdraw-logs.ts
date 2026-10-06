export const SAMPLE_WITHDRAW_LOGS = [
  { user: "ah***@gmail.com", amount: "50.00 USDT" },
  { user: "na***@outlook.com", amount: "120.00 USDT" },
  { user: "+92***1144", amount: "80.00 USDT" },
  { user: "im***@gmail.com", amount: "200.00 USDT" },
  { user: "sa***@hotmail.com", amount: "35.00 USDT" },
  { user: "+91***8821", amount: "90.00 USDT" },
  { user: "yu***@gmail.com", amount: "150.00 USDT" },
  { user: "fa***@yahoo.com", amount: "60.00 USDT" },
  { user: "+971***3344", amount: "250.00 USDT" },
  { user: "ko***@gmail.com", amount: "40.00 USDT" },
  { user: "bi***@gmail.com", amount: "75.00 USDT" },
  { user: "+86***6677", amount: "100.00 USDT" },
];

export function fillWithdrawLogs(live: { user: string; amount: string }[]) {
  if (live.length >= 12) return live.slice(0, 12);
  const extra = SAMPLE_WITHDRAW_LOGS.filter(
    (row) => !live.some((item) => item.user === row.user && item.amount === row.amount)
  );
  return [...live, ...extra].slice(0, 12);
}
