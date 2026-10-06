import { insertLedger, type RechargeRow, type TransferRow, type WithdrawRow } from "@/lib/server/db-tables";

export async function appendList(key: string, row: Record<string, unknown>) {
  if (key === "recharges") {
    await insertLedger("recharges", row as unknown as RechargeRow);
    return;
  }
  if (key === "withdraws") {
    await insertLedger("withdraws", row as unknown as WithdrawRow);
    return;
  }
  if (key === "transfers") {
    await insertLedger("transfers", row as unknown as TransferRow);
  }
}
