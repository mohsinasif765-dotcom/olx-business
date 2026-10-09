"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { getSessionAccount } from "@/lib/session";
import { useLanguage } from "@/lib/i18n";
import { fetchContent } from "@/lib/fetch-content";
import { TELEGRAM_HANDLE, TELEGRAM_HELP } from "@/lib/links";

type Msg = {
  id: string;
  message: string;
  type: string;
  attachmentUrl: string;
  isAdmin: boolean;
  createdAt: string;
};

const QUICK = ["Withdrawal not received", "Forgot password", "How to deposit?"];

export function SupportChatScreen() {
  const { t } = useLanguage();
  const [account, setAccount] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [ticketStatus, setTicketStatus] = useState("open");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [telegram, setTelegram] = useState(TELEGRAM_HELP);
  const [handle, setHandle] = useState(TELEGRAM_HANDLE);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadChat(acc: string) {
    const res = await fetch(`/api/support?account=${encodeURIComponent(acc)}`, { cache: "no-store" });
    const data = (await res.json()) as {
      ticket?: { status?: string };
      messages?: Msg[];
      error?: string;
    };
    if (!res.ok) {
      setError(data.error || "Could not load chat. Run support-chat.sql on Zuvo.");
      return;
    }
    setError("");
    setTicketStatus(data.ticket?.status || "open");
    setMessages(Array.isArray(data.messages) ? data.messages : []);
  }

  useEffect(() => {
    const session = getSessionAccount();
    setAccount(session);
    void fetchContent()
      .then((data: { telegram?: string; handle?: string } | null) => {
        if (data?.telegram) setTelegram(data.telegram);
        if (data?.handle) setHandle(data.handle);
      })
      .catch(() => {});
    if (!session) {
      setLoading(false);
      return;
    }
    void loadChat(session).finally(() => setLoading(false));
    const tick = window.setInterval(() => {
      void loadChat(session);
    }, 4000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(message: string, attachmentUrl = "", type = "text") {
    if (!account || busy) return;
    const trimmed = message.trim();
    if (!trimmed && !attachmentUrl) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account, message: trimmed, attachmentUrl, type }),
      });
      const data = (await res.json()) as { messages?: Msg[]; error?: string };
      if (!res.ok) {
        setError(data.error || "Send failed");
        return;
      }
      setText("");
      if (Array.isArray(data.messages)) setMessages(data.messages);
      else await loadChat(account);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await send(text);
  }

  async function onPickFile(file: File | null) {
    if (!file || !account) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("account", account);
      const up = await fetch("/api/proof", { method: "POST", body: form });
      const upData = (await up.json()) as { url?: string; error?: string };
      if (!up.ok || !upData.url) {
        setError(upData.error || "Upload failed");
        return;
      }
      await send("Photo", upData.url, "image");
    } catch {
      setError("Upload failed");
    } finally {
      setBusy(false);
    }
  }

  if (!account) {
    return (
      <div className="star-field">
        <div className="page-enter mx-auto min-h-screen w-full max-w-[430px] px-4 pb-28 pt-3">
          <header className="mb-5 flex items-center justify-between">
            <Link href="/me" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg">
              ‹
            </Link>
            <h1 className="text-[17px] font-semibold">{t.customerService}</h1>
            <span className="w-9" />
          </header>
          <p className="mb-4 text-center text-[13px] text-white/60">Sign in to chat with support.</p>
          <Link href="/" className="car-invest block text-center">
            {t.login}
          </Link>
          <a href={telegram} target="_blank" rel="noreferrer" className="deposit-card mt-4 flex items-center gap-3 p-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2aa1d8] text-lg font-bold">T</span>
            <span>
              <span className="block font-medium">{t.telegram}</span>
              <span className="text-[12px] text-white/50">{handle}</span>
            </span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="star-field">
      <div className="page-enter mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-4 pb-28 pt-3">
        <header className="mb-3 flex shrink-0 items-center justify-between">
          <Link href="/me" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg">
            ‹
          </Link>
          <div className="text-center">
            <h1 className="text-[17px] font-semibold">{t.customerService}</h1>
            <p className="text-[11px] text-white/45">{ticketStatus === "closed" ? "Closed" : "Online"}</p>
          </div>
          <a href={telegram} target="_blank" rel="noreferrer" className="text-[12px] text-[#9ec6ff]" aria-label="Telegram">
            TG
          </a>
        </header>

        <div className="mb-3 flex shrink-0 gap-2 overflow-x-auto pb-1">
          {QUICK.map((item) => (
            <button
              key={item}
              type="button"
              className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] text-white/75"
              onClick={() => void send(item)}
              disabled={busy || ticketStatus === "closed"}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mb-3 min-h-0 flex-1 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
          {loading ? (
            <p className="py-8 text-center text-[13px] text-white/50">{t.loading}</p>
          ) : messages.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-[14px] font-medium text-white/80">Welcome to OLX Business support</p>
              <p className="mt-2 text-[12px] text-white/50">Send a message and our team will reply here.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isAdmin ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[82%] rounded-2xl px-3 py-2 text-[13px] leading-5 ${
                    msg.isAdmin
                      ? "rounded-bl-md bg-white/10 text-white/90"
                      : "rounded-br-md bg-[#3b82f6] text-white"
                  }`}
                >
                  {msg.attachmentUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={msg.attachmentUrl} alt="" className="mb-1 max-h-48 rounded-lg" />
                  ) : null}
                  {msg.message && msg.message !== "Photo" && msg.message !== "[Attachment]" ? (
                    <p>{msg.message}</p>
                  ) : null}
                  <p className={`mt-1 text-[10px] ${msg.isAdmin ? "text-white/40" : "text-white/70"}`}>
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ""}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {error ? <p className="mb-2 text-center text-[12px] text-[#ff8aa0]">{error}</p> : null}

        <form onSubmit={onSubmit} className="flex shrink-0 items-end gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => void onPickFile(e.target.files?.[0] || null)}
          />
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg"
            onClick={() => fileRef.current?.click()}
            disabled={busy || ticketStatus === "closed"}
            aria-label="Attach"
          >
            +
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="wd-input min-h-11 flex-1"
            disabled={busy || ticketStatus === "closed"}
          />
          <button
            type="submit"
            className="flex h-11 shrink-0 items-center justify-center rounded-full bg-[#3b82f6] px-4 text-[13px] font-semibold disabled:opacity-50"
            disabled={busy || ticketStatus === "closed" || !text.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
