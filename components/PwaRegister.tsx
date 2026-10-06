"use client";

import { useEffect } from "react";
import { initPwaInstall } from "@/lib/pwa-install";

export function PwaRegister() {
  useEffect(() => {
    initPwaInstall();
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {});
  }, []);
  return null;
}
