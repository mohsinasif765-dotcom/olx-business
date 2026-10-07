"use client";

import { useEffect } from "react";
import { initPwaInstall } from "@/lib/pwa-install";

export function PwaRegister() {
  useEffect(() => {
    initPwaInstall();
    if (!("serviceWorker" in navigator)) return;

    void (async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        await reg.update().catch(() => undefined);
        // Wait until SW controls the page — required for Chrome install prompt.
        if (!navigator.serviceWorker.controller) {
          await new Promise<void>((resolve) => {
            const onChange = () => {
              navigator.serviceWorker.removeEventListener("controllerchange", onChange);
              resolve();
            };
            navigator.serviceWorker.addEventListener("controllerchange", onChange);
            window.setTimeout(resolve, 4000);
          });
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);
  return null;
}
