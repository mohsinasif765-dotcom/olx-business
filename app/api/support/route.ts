import { NextResponse } from "next/server";
import {
  getOrCreateTicket,
  listMessages,
  sendMemberMessage,
} from "@/lib/server/support";

function key(account: string) {
  return account.trim().toLowerCase();
}

export async function GET(request: Request) {
  const account = key(new URL(request.url).searchParams.get("account") || "");
  if (!account) return NextResponse.json({ error: "login" }, { status: 401 });

  try {
    const ticket = await getOrCreateTicket(account);
    const messages = await listMessages(ticket.id);
    return NextResponse.json(
      { ticket, messages },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Zuvo read failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: {
    account?: string;
    message?: string;
    type?: string;
    attachmentUrl?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const account = key(String(body.account || ""));
  if (!account) return NextResponse.json({ error: "login" }, { status: 401 });

  try {
    const result = await sendMemberMessage({
      account,
      message: String(body.message || ""),
      type: body.type,
      attachmentUrl: body.attachmentUrl,
    });
    const messages = await listMessages(result.ticketId);
    return NextResponse.json({ ok: true, message: result.message, messages });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Send failed";
    if (message === "empty") return NextResponse.json({ error: "empty" }, { status: 400 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
