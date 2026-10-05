"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { getCurrentAccount, updatePasswords } from "@/lib/session";

export function PasswordScreen({ kind }: { kind: "login" | "security" }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(Boolean(getCurrentAccount()));
    setReady(true);
  }, []);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setDone("");
    const session = getCurrentAccount();
    if (!session) {
      router.replace("/");
      return;
    }
    if (next.length < 6) {
      setError(t.minPassword);
      return;
    }
    if (next !== confirm) {
      setError(t.passwordMismatch);
      return;
    }
    const expected = kind === "login" ? session.loginPassword : session.securityPassword;
    if (expected && expected !== current) {
      setError(t.wrongPassword);
      return;
    }
    updatePasswords(kind === "login" ? { loginPassword: next } : { securityPassword: next });
    setCurrent("");
    setNext("");
    setConfirm("");
    setDone(t.passwordUpdated);
  }

  const title = kind === "login" ? t.loginPassword : t.securityPassword;

  return (
    <div className="star-field">
      <div className="page-enter mx-auto min-h-screen w-full max-w-[430px] px-4 pb-28 pt-3">
        <header className="mb-5 flex items-center justify-between">
          <Link
            href="/me"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg"
          >
            ‹
          </Link>
          <h1 className="text-[17px] font-semibold">{title}</h1>
          <span className="w-9" />
        </header>

        {!ready ? null : !loggedIn ? (
          <div className="deposit-card p-5 text-center">
            <p className="text-[14px] text-white/75">{t.tapToLogin}</p>
            <Link href="/" className="vip-recharge-btn mt-4 w-full">
              {t.login}
            </Link>
          </div>
        ) : (
        <form className="deposit-card space-y-3 p-4" onSubmit={onSubmit}>
          <input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder={t.currentPassword}
            className="auth-input"
          />
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder={t.newPassword}
            className="auth-input"
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={t.confirmNew}
            className="auth-input"
          />
          {error ? <p className="text-center text-[13px] text-[#ff9aa8]">{error}</p> : null}
          {done ? <p className="text-center text-[13px] text-[#7dffc2]">{done}</p> : null}
          <button type="submit" className="vip-recharge-btn w-full">
            {t.confirm}
          </button>
        </form>
        )}
      </div>
    </div>
  );
}
