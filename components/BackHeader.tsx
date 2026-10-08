import Link from "next/link";
import { ReactNode } from "react";

export function BackHeader({
  href,
  title,
  right,
}: {
  href: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <header className="app-topbar mb-5 flex items-center justify-between">
      <Link
        href={href}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg"
        aria-label="Back"
      >
        ‹
      </Link>
      <h1 className="px-2 text-center text-[17px] font-semibold">{title}</h1>
      {right ?? <span className="w-9 shrink-0" />}
    </header>
  );
}
