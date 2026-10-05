"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n";

function isTabActive(href: string, pathname: string) {
  if (href === "/me") {
    return (
      pathname === "/me" ||
      pathname.startsWith("/me/") ||
      pathname === "/records" ||
      pathname === "/transfer" ||
      pathname === "/support"
    );
  }
  if (href === "/team") {
    return pathname === "/team" || pathname.startsWith("/team/");
  }
  if (href === "/mining-pool") {
    return pathname === "/mining-pool" || pathname === "/mining";
  }
  return pathname === href;
}

const TABS = [
  { href: "/home", key: "home" as const, icon: HomeIcon },
  { href: "/vip", key: "vip" as const, icon: CrownIcon },
  { href: "/mining-pool", key: "miningPool" as const, icon: PoolIcon },
  { href: "/team", key: "team" as const, icon: TeamIcon },
  { href: "/me", key: "me" as const, icon: MeIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  if (
    pathname === "/" ||
    pathname === "/register" ||
    pathname === "/agreement" ||
    pathname === "/privacy"
  ) {
    return null;
  }

  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => {
        const active = isTabActive(tab.href, pathname);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`bottom-nav-item ${active ? "is-active" : ""}`}
          >
            <Icon />
            <span>{t[tab.key]}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 11.2L12 4l8 7.2V20a1.5 1.5 0 01-1.5 1.5H14v-6H10v6H5.5A1.5 1.5 0 014 20v-8.8z" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 18h14l1.6-10-4.8 3.2L12 5.5 8.2 11.2 3.4 8 5 18z" />
    </svg>
  );
}

function PoolIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3l3.2 3.2L12 9.4 8.8 6.2 12 3zM6.2 8.8L9.4 12 6.2 15.2 3 12l3.2-3.2zM17.8 8.8L21 12l-3.2 3.2L14.6 12l3.2-3.2zM12 14.6l3.2 3.2L12 21l-3.2-3.2L12 14.6z" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="8" r="3" />
      <circle cx="16.5" cy="8.5" r="2.3" />
      <path d="M3.2 18.8c0-3.1 2.8-5.4 6-5.4s6 2.3 6 5.4V19H3.2v-.2z" />
      <path d="M14.4 14.1c2.5.5 4.4 2.4 4.4 4.7V19h-3.2v-.2c0-1.8-.7-3.4-1.9-4.5.2 0 .5-.1.7-.2z" />
    </svg>
  );
}

function MeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <circle cx="12" cy="10" r="2.4" fill="currentColor" stroke="none" />
      <path d="M7.4 18c.8-2 2.4-3.1 4.6-3.1s3.8 1.1 4.6 3.1" />
    </svg>
  );
}
