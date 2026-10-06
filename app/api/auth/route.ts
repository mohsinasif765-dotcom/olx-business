import { NextResponse } from "next/server";
import { zuvoAdmin } from "@/lib/zuvo";

function accountKey(account: string) {
  return account.trim().toLowerCase();
}

export async function POST(request: Request) {
  let body: { account?: string; loginPassword?: string; securityPassword?: string; isRegister?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "required" }, { status: 400 });
  }
  const account = String(body.account || "").trim();
  const loginPassword = String(body.loginPassword || "").trim();
  const isRegister = Boolean(body.isRegister);
  if (!account || !loginPassword) {
    return NextResponse.json({ error: "required" }, { status: 400 });
  }

  const db = zuvoAdmin();
  const { data: existing, error } = await db
    .from("members")
    .select("id,account,login_password")
    .eq("account", accountKey(account))
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (isRegister) {
    if (existing) return NextResponse.json({ error: "exists" }, { status: 409 });
    const { error: insertError } = await db.from("members").insert({
      id: `m${Date.now().toString(36)}`,
      account: accountKey(account),
      login_password: loginPassword,
      security_password: String(body.securityPassword || ""),
      joined: new Date().toISOString().slice(0, 10),
    });
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    return NextResponse.json({ ok: true, account });
  }

  if (existing) {
    if (existing.login_password !== loginPassword) {
      return NextResponse.json({ error: "badpass" }, { status: 401 });
    }
    return NextResponse.json({ ok: true, account: existing.account });
  }

  const { error: insertError } = await db.from("members").insert({
    id: `m${Date.now().toString(36)}`,
    account: accountKey(account),
    login_password: loginPassword,
    security_password: String(body.securityPassword || loginPassword),
    joined: new Date().toISOString().slice(0, 10),
  });
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  return NextResponse.json({ ok: true, account });
}
