import { zuvoAdmin } from "@/lib/zuvo";

export type SupportTicket = {
  id: string;
  account: string;
  subject: string;
  status: string;
  lastMessage: string;
  createdAt: string;
  updatedAt: string;
};

export type SupportMessage = {
  id: string;
  ticketId: string;
  account: string;
  message: string;
  type: string;
  attachmentUrl: string;
  isAdmin: boolean;
  createdAt: string;
};

function db() {
  return zuvoAdmin();
}

function key(account: string) {
  return account.trim().toLowerCase();
}

function mapTicket(row: Record<string, unknown>): SupportTicket {
  return {
    id: String(row.id),
    account: String(row.account || ""),
    subject: String(row.subject || "Customer Support"),
    status: String(row.status || "open"),
    lastMessage: String(row.last_message || ""),
    createdAt: String(row.created_at || ""),
    updatedAt: String(row.updated_at || ""),
  };
}

function mapMessage(row: Record<string, unknown>): SupportMessage {
  return {
    id: String(row.id),
    ticketId: String(row.ticket_id || ""),
    account: String(row.account || ""),
    message: String(row.message || ""),
    type: String(row.type || "text"),
    attachmentUrl: String(row.attachment_url || ""),
    isAdmin: row.is_admin === true,
    createdAt: String(row.created_at || ""),
  };
}

function newId(prefix: string) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export async function getOrCreateTicket(account: string): Promise<SupportTicket> {
  const acc = key(account);
  const { data, error } = await db()
    .from("support_tickets")
    .select("*")
    .eq("account", acc)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (data) return mapTicket(data as Record<string, unknown>);

  const row = {
    id: newId("t"),
    account: acc,
    subject: "Customer Support",
    status: "open",
    last_message: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { error: insertError } = await db().from("support_tickets").insert(row);
  if (insertError) throw insertError;
  return mapTicket(row);
}

export async function listMessages(ticketId: string, limit = 80): Promise<SupportMessage[]> {
  const { data, error } = await db()
    .from("support_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data || []).map((row) => mapMessage(row as Record<string, unknown>));
}

export async function sendMemberMessage(opts: {
  account: string;
  message: string;
  type?: string;
  attachmentUrl?: string;
}) {
  const ticket = await getOrCreateTicket(opts.account);
  const text = String(opts.message || "").trim();
  const attachmentUrl = String(opts.attachmentUrl || "").trim();
  if (!text && !attachmentUrl) throw new Error("empty");

  const msg = {
    id: newId("m"),
    ticket_id: ticket.id,
    account: key(opts.account),
    message: text || (attachmentUrl ? "[Attachment]" : ""),
    type: opts.type || (attachmentUrl ? "image" : "text"),
    attachment_url: attachmentUrl,
    is_admin: false,
    created_at: new Date().toISOString(),
  };
  const { error } = await db().from("support_messages").insert(msg);
  if (error) throw error;

  const { error: upError } = await db()
    .from("support_tickets")
    .update({
      last_message: msg.message.slice(0, 160),
      status: "open",
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticket.id);
  if (upError) throw upError;

  return { ticketId: ticket.id, message: mapMessage(msg) };
}

export async function listTickets(limit = 100): Promise<SupportTicket[]> {
  const { data, error } = await db()
    .from("support_tickets")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map((row) => mapTicket(row as Record<string, unknown>));
}

export async function sendAdminMessage(opts: { ticketId: string; message: string; attachmentUrl?: string }) {
  const text = String(opts.message || "").trim();
  const attachmentUrl = String(opts.attachmentUrl || "").trim();
  if (!text && !attachmentUrl) throw new Error("empty");

  const msg = {
    id: newId("m"),
    ticket_id: opts.ticketId,
    account: "admin",
    message: text || (attachmentUrl ? "[Attachment]" : ""),
    type: attachmentUrl ? "image" : "text",
    attachment_url: attachmentUrl,
    is_admin: true,
    created_at: new Date().toISOString(),
  };
  const { error } = await db().from("support_messages").insert(msg);
  if (error) throw error;

  const { error: upError } = await db()
    .from("support_tickets")
    .update({
      last_message: msg.message.slice(0, 160),
      status: "replied",
      updated_at: new Date().toISOString(),
    })
    .eq("id", opts.ticketId);
  if (upError) throw upError;

  return mapMessage(msg);
}

export async function setTicketStatus(ticketId: string, status: "open" | "replied" | "closed") {
  const { error } = await db()
    .from("support_tickets")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", ticketId);
  if (error) throw error;
}

export async function countOpenTickets() {
  const { count, error } = await db()
    .from("support_tickets")
    .select("id", { count: "exact", head: true })
    .in("status", ["open", "replied"]);
  if (error) throw error;
  return count || 0;
}
