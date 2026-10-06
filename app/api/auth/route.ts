import { NextResponse } from "next/server";
import { displayName } from "@/lib/member-name";
import { readSite } from "@/lib/server/site";
import { zuvoAdmin } from "@/lib/zuvo";

function accountKey(account: string) {
  return account.trim().toLowerCase().replace(/\s+/g, "");
}

function memberPayload(row: {
  account?: string;
  invite?: string;
  vip?: string;
  status?: string;
  upline?: string;
  name?: string;
}) {
  const account = String(row.account || "");
  return {
    ok: true as const,
    account,
    name: displayName(row.name, account),
    invite: String(row.invite || ""),
    vip: String(row.vip || "—"),
    status: String(row.status || "active"),
    upline: String(row.upline || "—"),
  };
}

async function findMember(db: ReturnType<typeof zuvoAdmin>, account: string) {
  const withName = await db
    .from("members")
    .select("id,account,login_password,security_password,invite,vip,status,upline,name")
    .eq("account", account)
    .maybeSingle();
  if (!withName.error) return withName;
  return db
    .from("members")
    .select("id,account,login_password,security_password,invite,vip,status,upline")
    .eq("account", account)
    .maybeSingle();
}

export async function GET(request: Request) {
  const account = accountKey(new URL(request.url).searchParams.get("account") || "");
  if (!account) return NextResponse.json({ error: "required" }, { status: 400 });
  const { data, error } = await findMember(zuvoAdmin(), account);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "missing" }, { status: 404 });
  return NextResponse.json(memberPayload(data));
}

export async function POST(request: Request) {
  let body: {
    account?: string;
    loginPassword?: string;
    securityPassword?: string;
    isRegister?: boolean;
    invite?: string;
    name?: string;
    action?: "login" | "register" | "verify";
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "required" }, { status: 400 });
  }

  const account = accountKey(String(body.account || ""));
  const loginPassword = String(body.loginPassword || "").trim();
  const securityPassword = String(body.securityPassword || "").trim();
  const action =
    body.action === "verify" || body.action === "register" || body.action === "login"
      ? body.action
      : body.isRegister
        ? "register"
        : "login";

  if (!account) return NextResponse.json({ error: "required" }, { status: 400 });

  const db = zuvoAdmin();

  if (action === "verify") {
    const { data, error } = await db
      .from("members")
      .select("security_password,status")
      .eq("account", account)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "missing" }, { status: 404 });
    if (String(data.security_password || "") !== securityPassword) {
      return NextResponse.json({ error: "badpass" }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  }

  if (!loginPassword) return NextResponse.json({ error: "required" }, { status: 400 });

  const [site, existingRes] = await Promise.all([
    readSite(),
    findMember(db, account),
  ]);
  if (action === "register" && !site.flags.registerOn) {
    return NextResponse.json({ error: "paused" }, { status: 403 });
  }
  if (action === "login" && !site.flags.loginOn) {
    return NextResponse.json({ error: "paused" }, { status: 403 });
  }
  const { data: existing, error } = existingRes;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (action === "login") {
    if (!existing) return NextResponse.json({ error: "missing" }, { status: 404 });
    if (existing.status === "frozen" || existing.status === "banned") {
      return NextResponse.json({ error: "frozen" }, { status: 403 });
    }
    if (String(existing.login_password || "") !== loginPassword) {
      return NextResponse.json({ error: "badpass" }, { status: 401 });
    }
    return NextResponse.json(memberPayload(existing));
  }

  if (existing) return NextResponse.json({ error: "exists" }, { status: 409 });
  if (!securityPassword) return NextResponse.json({ error: "required" }, { status: 400 });

  const fullName = String(body.name || "").trim();
  if (!fullName) return NextResponse.json({ error: "required" }, { status: 400 });

  const inviteCode = String(body.invite || "").trim();
  let upline = "—";
  if (inviteCode) {
    const { data: sponsor } = await db.from("members").select("account").eq("invite", inviteCode).maybeSingle();
    if (sponsor && String(sponsor.account).toLowerCase() !== account) upline = inviteCode;
  }
  let invite = String(Date.now()).slice(-6);
  for (let i = 0; i < 8; i += 1) {
    const code = String(100000 + Math.floor(Math.random() * 900000));
    const { data: taken } = await db.from("members").select("id").eq("invite", code).maybeSingle();
    if (!taken) {
      invite = code;
      break;
    }
  }

  const row = {
    id: `m${Date.now().toString(36)}`,
    account,
    login_password: loginPassword,
    security_password: securityPassword,
    invite,
    upline,
    name: fullName,
    vip: "—",
    invest: 0,
    brokerage: 0,
    status: "active",
    joined: new Date().toISOString().slice(0, 10),
  };
  const { error: insertError } = await db.from("members").insert(row);
  if (insertError) {
    const { name: _name, ...withoutName } = row;
    const retry = await db.from("members").insert(withoutName);
    if (retry.error) return NextResponse.json({ error: retry.error.message }, { status: 500 });
  }
  return NextResponse.json(
    memberPayload({ account, invite, vip: "—", status: "active", upline, name: fullName })
  );
}
