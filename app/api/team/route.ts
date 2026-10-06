import { NextResponse } from "next/server";
import { loadTeam } from "@/lib/server/team";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const account = (url.searchParams.get("account") || "").trim().toLowerCase();
  const date = (url.searchParams.get("date") || "").trim();
  const level = (url.searchParams.get("level") || "").trim();
  if (!account) return NextResponse.json({ error: "required" }, { status: 400 });
  try {
    const data = await loadTeam(account, date, level);
    if ("error" in data && data.error === "login") {
      return NextResponse.json({ error: "login" }, { status: 401 });
    }
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Zuvo read failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
