type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallBlockReason =
  | "ssr"
  | "standalone"
  | "in-app-browser"
  | "no-service-worker"
  | "waiting-for-prompt"
  | "prompt-unavailable"
  | "ready";

function logPwa(message: string, detail?: unknown) {
  if (typeof console !== "undefined") {
    if (detail !== undefined) console.info(`[olx-pwa] ${message}`, detail);
    else console.info(`[olx-pwa] ${message}`);
  }
}

export function getDeferredInstall(): InstallPrompt | null {
  if (typeof window === "undefined") return null;
  const fromWindow = window.__olxPwa as InstallPrompt | null | undefined;
  if (fromWindow && typeof fromWindow.prompt === "function") return fromWindow;
  return null;
}

export function clearDeferredInstall() {
  if (typeof window !== "undefined") window.__olxPwa = null;
}

export function isStandaloneApp() {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || Boolean(nav.standalone);
}

export function isInAppBrowser() {
  if (typeof navigator === "undefined") return false;
  return /FBAN|FBAV|Instagram|Line\/|WhatsApp|Twitter|MicroMessenger|BytedanceWebview|TikTok/i.test(
    navigator.userAgent
  );
}

export function isAndroidDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

export function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isDesktopChromium() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  return !mobile && (/Chrome|Edg|OPR|Brave/i.test(ua) || Boolean((window as Window & { chrome?: unknown }).chrome));
}

export function openInChrome() {
  if (typeof window === "undefined") return;
  const url = window.location.href;
  if (isAndroidDevice()) {
    const hostPath = url.replace(/^https?:\/\//, "");
    window.location.href = `intent://${hostPath}#Intent;scheme=https;package=com.android.chrome;end`;
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

export function getInstallBlockReason(): InstallBlockReason {
  if (typeof window === "undefined") return "ssr";
  if (isStandaloneApp()) return "standalone";
  if (isInAppBrowser()) return "in-app-browser";
  if (!("serviceWorker" in navigator)) return "no-service-worker";
  if (getDeferredInstall()?.prompt) return "ready";
  return "waiting-for-prompt";
}

/**
 * On Android: do NOT preventDefault — Chrome must keep its Install banner /
 * Add to Home screen path so the icon can appear on the phone.
 * On desktop: preventDefault so our Install button owns the prompt.
 */
export function initPwaInstall() {
  if (typeof window === "undefined") return;
  if (window.__olxPwaBooted) return;
  window.__olxPwaBooted = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    const android = isAndroidDevice();
    if (!android) {
      event.preventDefault();
    }
    window.__olxPwa = event as InstallPrompt;
    logPwa(android ? "beforeinstallprompt (Android native UI kept)" : "beforeinstallprompt captured");
    window.dispatchEvent(new Event("olx-install-ready"));
  });
  window.addEventListener("appinstalled", () => {
    clearDeferredInstall();
    logPwa("appinstalled — icon should be on home screen / app drawer");
    window.dispatchEvent(new Event("olx-appinstalled"));
  });
}

declare global {
  interface Window {
    __olxPwa?: InstallPrompt | Event | null;
    __olxPwaBooted?: boolean;
  }
}

export async function ensureServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
    await reg.update().catch(() => undefined);
    if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
    logPwa("service worker registered", { scope: reg.scope, controlling: !!navigator.serviceWorker.controller });
    return reg;
  } catch (error) {
    logPwa("service worker registration failed", error);
    return null;
  }
}

/** Call only from a direct user tap/click. */
export async function promptInstall(): Promise<{
  ok: boolean;
  reason: InstallBlockReason | "accepted" | "dismissed" | "prompt-failed";
}> {
  initPwaInstall();
  if (isStandaloneApp()) return { ok: true, reason: "standalone" };
  if (isInAppBrowser()) {
    logPwa("install blocked: in-app browser");
    return { ok: false, reason: "in-app-browser" };
  }

  const pending = getDeferredInstall();
  if (!pending?.prompt) {
    const reason = getInstallBlockReason();
    logPwa("install blocked: no deferred prompt", reason);
    return { ok: false, reason: reason === "ready" ? "prompt-unavailable" : reason };
  }

  try {
    await pending.prompt();
    const choice = await pending.userChoice;
    clearDeferredInstall();
    logPwa("userChoice", choice);
    return { ok: choice.outcome === "accepted", reason: choice.outcome };
  } catch (error) {
    logPwa("prompt() failed", error);
    return { ok: false, reason: "prompt-failed" };
  }
}

export function canPromptInstall() {
  initPwaInstall();
  return Boolean(getDeferredInstall()?.prompt) && !isStandaloneApp();
}
