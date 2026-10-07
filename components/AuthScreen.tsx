"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { fetchContent } from "@/lib/fetch-content";
import { signIn, getSessionAccount } from "@/lib/session";
import { flagUrl } from "@/lib/currency-flag";

type Mode = "login" | "register";
type Tab = "email" | "mobile";

const COUNTRY_CODES = [
  { code: "+92", name: "PK", flag: "pk" },
  { code: "+91", name: "IN", flag: "in" },
  { code: "+86", name: "CN", flag: "cn" },
  { code: "+1", name: "US", flag: "us" },
  { code: "+44", name: "UK", flag: "gb" },
  { code: "+971", name: "AE", flag: "ae" },
  { code: "+966", name: "SA", flag: "sa" },
];

function DialFlag({ iso }: { iso: string }) {
  return (
    <img
      src={flagUrl(iso, 40)}
      alt=""
      width={20}
      height={14}
      className="shrink-0 rounded-[2px] object-cover"
    />
  );
}

export function AuthScreen({ mode }: { mode: Mode }) {
  const [tab, setTab] = useState<Tab>("email");
  const [country, setCountry] = useState("+92");
  const [codesOpen, setCodesOpen] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showConfirmSecurity, setShowConfirmSecurity] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [siteName, setSiteName] = useState("OLX Business");
  const [loginOn, setLoginOn] = useState(true);
  const [registerOn, setRegisterOn] = useState(true);
  const router = useRouter();
  const inviteDefault = useSearchParams().get("invite") || "";

  const isLogin = mode === "login";

  useEffect(() => {
    if (getSessionAccount()) router.replace("/home");
    void fetchContent()
      .then((data: { siteName?: string; flags?: { loginOn?: boolean; registerOn?: boolean } } | null) => {
        if (data?.siteName) setSiteName(data.siteName);
        if (data?.flags?.loginOn === false) setLoginOn(false);
        if (data?.flags?.registerOn === false) setRegisterOn(false);
      })
      .catch(() => {});
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const account =
      tab === "email"
        ? String(data.get("email") || "")
        : `${country}${data.get("mobile") || ""}`;
    const password = String(data.get("password") || "");

    if (!account.trim() || !password.trim()) {
      setMessage("Please fill in all required fields.");
      return;
    }
    if (isLogin && !loginOn) {
      setMessage("Login is paused in admin settings.");
      return;
    }
    if (!isLogin && !registerOn) {
      setMessage("Register is paused in admin settings.");
      return;
    }

    if (!isLogin) {
      if (password !== String(data.get("confirmPassword") || "")) {
        setMessage("Login passwords do not match.");
        return;
      }
      if (
        String(data.get("securityPassword") || "") !==
        String(data.get("confirmSecurityPassword") || "")
      ) {
        setMessage("Security passwords do not match.");
        return;
      }
      if (!String(data.get("securityPassword") || "").trim()) {
        setMessage("Please fill in all required fields.");
        return;
      }
      if (!String(data.get("fullName") || "").trim()) {
        setMessage("Please enter your name.");
        return;
      }
    }

    setBusy(true);
    const result = await signIn({
      account,
      loginPassword: password,
      securityPassword: String(data.get("securityPassword") || ""),
      isRegister: !isLogin,
      invite: String(data.get("invite") || ""),
      name: String(data.get("fullName") || ""),
    });
    setBusy(false);
    if (!result.ok) {
      setMessage(
        result.error === "exists"
          ? "This account is already registered."
          : result.error === "badpass"
            ? "Email or password is incorrect."
            : result.error === "paused"
              ? isLogin
                ? "Login is paused in admin settings."
                : "Register is paused in admin settings."
              : result.error === "frozen"
                ? "This account is frozen."
                : result.error === "missing"
                  ? "No account found. Please register first."
                  : "Could not reach the database. Try again."
      );
      return;
    }

    router.push("/home");
  }

  return (
    <div id="app" className="star-field">
      <div className="page-enter mx-auto flex min-h-screen w-full max-w-[420px] flex-col px-6 py-10">
        <div className="mb-4 flex justify-end">
          <LanguageSwitch globe />
        </div>
        <div className="flex flex-col items-center">
          <div className="logo-slot mb-4 flex items-center justify-center">
            <BrandLogo size={112} variant="splash" />
          </div>

          <h1 className="mb-8 text-center text-[32px] font-semibold text-white">
            {siteName}
          </h1>

          <div className="mb-6 grid w-full grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setTab("email");
                setCodesOpen(false);
              }}
              className={`h-12 rounded-full text-[15px] font-medium ${
                tab === "email" ? "auth-tab-active" : "auth-tab-idle"
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setTab("mobile")}
              className={`h-12 rounded-full text-[15px] font-medium ${
                tab === "mobile" ? "auth-tab-active" : "auth-tab-idle"
              }`}
            >
              Mobile
            </button>
          </div>

          <form className="w-full space-y-4" onSubmit={onSubmit}>
            {tab === "email" ? (
              <input
                name="email"
                type="email"
                placeholder="Email"
                className="auth-input"
              />
            ) : (
              <div className="auth-phone-row">
                <div className="auth-dial-wrap">
                  <button
                    type="button"
                    className="auth-input auth-dial"
                    aria-label="Country code"
                    aria-expanded={codesOpen}
                    onClick={() => setCodesOpen((open) => !open)}
                  >
                    <span className="flex items-center gap-1.5">
                      <DialFlag iso={COUNTRY_CODES.find((c) => c.code === country)?.flag || "pk"} />
                      <span>{country}</span>
                    </span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                  {codesOpen ? (
                    <ul className="auth-dial-menu">
                      {COUNTRY_CODES.map((item) => (
                        <li key={item.code}>
                          <button
                            type="button"
                            className={`auth-dial-option ${country === item.code ? "is-on" : ""}`}
                            onClick={() => {
                              setCountry(item.code);
                              setCodesOpen(false);
                            }}
                          >
                            <DialFlag iso={item.flag} />
                            <span>{item.name}</span>
                            <span>{item.code}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <input
                  name="mobile"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="Mobile number"
                  className="auth-input min-w-0"
                />
              </div>
            )}

            <PasswordInput
              name="password"
              placeholder="Login password"
              visible={showLoginPass}
              onToggle={() => setShowLoginPass((v) => !v)}
            />

            {isLogin && (
              <label className="flex items-center gap-2 text-[14px] text-white/80">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 accent-[#6d5bff]"
                />
                Remember me
              </label>
            )}

            {!isLogin && (
              <>
                <input name="fullName" autoComplete="name" placeholder="Full name" className="auth-input" />
                <PasswordInput
                  name="confirmPassword"
                  placeholder="Confirm password"
                  visible={showConfirmPass}
                  onToggle={() => setShowConfirmPass((v) => !v)}
                />
                <PasswordInput
                  name="securityPassword"
                  placeholder="Security password"
                  visible={showSecurity}
                  onToggle={() => setShowSecurity((v) => !v)}
                />
                <PasswordInput
                  name="confirmSecurityPassword"
                  placeholder="Confirm security password"
                  visible={showConfirmSecurity}
                  onToggle={() => setShowConfirmSecurity((v) => !v)}
                />
                <input
                  name="invite"
                  defaultValue={inviteDefault}
                  placeholder="Invitation code"
                  className="auth-input"
                />
              </>
            )}

            <button
              type="submit"
              className="auth-btn mt-3 h-14 w-full rounded-full text-[16px] font-semibold tracking-[0.2em]"
              disabled={busy}
            >
              {busy ? "PLEASE WAIT" : isLogin ? "LOGIN" : "REGISTER"}
            </button>
          </form>

          {message ? (
            <p className="mt-3 text-center text-sm font-medium text-[#ff5c5c]">{message}</p>
          ) : null}

          <p className="mt-5 text-center text-[14px] text-white/70">
            {isLogin ? (
              <>
                No account?{" "}
                <Link href="/register" className="text-[#7eb6ff]">
                  Register
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link href="/" className="text-[#7eb6ff]">
                  Login
                </Link>
              </>
            )}
          </p>

          <p className="mt-4 text-center text-[12px] leading-5 text-white/60">
            Agree with our{" "}
            <Link href="/agreement" className="text-[#7eb6ff]">
              《User Agreement
            </Link>
            <span> and </span>
            <Link href="/privacy" className="text-[#7eb6ff]">
              Privacy Policy》
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function PasswordInput({
  name,
  placeholder,
  visible,
  onToggle,
}: {
  name: string;
  placeholder: string;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <input
        name={name}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        className="auth-input pr-12"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80"
        aria-label="Toggle password visibility"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="12" cy="12" r="2.4" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}
