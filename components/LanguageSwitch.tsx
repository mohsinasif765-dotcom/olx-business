"use client";

import { useState } from "react";
import { LANGUAGES, useLanguage } from "@/lib/i18n";

export function LanguageSwitch({ globe = false }: { globe?: boolean }) {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((item) => item.code === lang)?.label ?? "English";

  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center gap-1.5 text-sm text-white/85"
        onClick={() => setOpen((value) => !value)}
      >
        {globe ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.6" />
            <path d="M4 12h16M12 4c2.6 2.4 3.8 5.2 3.8 8s-1.2 5.6-3.8 8c-2.6-2.4-3.8-5.2-3.8-8s1.2-5.6 3.8-8z" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        ) : null}
        {current} ▾
      </button>
      {open && (
        <div className="lang-menu absolute right-0 top-8 z-30 min-w-[120px] overflow-hidden rounded-lg bg-[#121c4e] shadow-xl">
          {LANGUAGES.map((item) => (
            <button
              key={item.code}
              type="button"
              className={`block w-full px-4 py-2 text-left text-sm hover:bg-white/10 ${
                item.code === lang ? "text-[#9ec6ff]" : "text-white"
              }`}
              onClick={() => {
                setLang(item.code);
                setOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
