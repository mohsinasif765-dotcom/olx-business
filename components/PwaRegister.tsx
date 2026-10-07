"use client";

import { useEffect } from "react";
import { ensureServiceWorker, initPwaInstall } from "@/lib/pwa-install";

export function PwaRegister() {
  useEffect(() => {
    initPwaInstall();
    void ensureServiceWorker();
  }, []);
  return null;
}
