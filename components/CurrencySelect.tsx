"use client";

import { useEffect, useRef, useState } from "react";
import { CurrencyFlag } from "@/components/CurrencyFlag";

export type CurrencyOption = {
  id: string;
  name: string;
  network?: string;
};

export function CurrencySelect({
  coins,
  value,
  onChange,
}: {
  coins: CurrencyOption[];
  value: string;
  onChange: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const selected = coins.find((c) => c.name === value) || coins[0];

  useEffect(() => {
    function hide(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", hide);
    return () => document.removeEventListener("mousedown", hide);
  }, []);

  if (!selected) return null;

  return (
    <div ref={box} className="relative mt-2">
      <button type="button" className="wd-select wd-input" onClick={() => setOpen((v) => !v)}>
        <span className="flex min-w-0 items-center gap-2">
          <CurrencyFlag id={selected.id} name={selected.name} network={selected.network} size={22} />
          <span className="truncate">
            {selected.name}
            {selected.network ? ` — ${selected.network}` : ""}
          </span>
        </span>
        <span className="text-white/45">{open ? "▴" : "▾"}</span>
      </button>
      {open ? (
        <ul className="wd-menu absolute z-30 max-h-64 w-full overflow-auto">
          {coins.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className={`wd-option ${c.name === selected.name ? "is-on" : ""}`}
                onClick={() => {
                  onChange(c.name);
                  setOpen(false);
                }}
              >
                <CurrencyFlag id={c.id} name={c.name} network={c.network} size={22} />
                <span>
                  {c.name}
                  {c.network ? ` — ${c.network}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
