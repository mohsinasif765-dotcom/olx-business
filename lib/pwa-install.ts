type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function win() {
  return typeof window !== "undefined" ? window : null;
}

export function getDeferredInstall(): InstallPrompt | null {
  const w = win();
  const fromWindow = w?.__olxPwa;
  if (fromWindow && typeof fromWindow.prompt === "function") return fromWindow as InstallPrompt;
  return null;
}

export function clearDeferredInstall() {
  const w = win();
  if (w) w.__olxPwa = null;
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
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  return !mobile && (/Chrome|Edg|OPR|Brave/i.test(ua) || !!(window as Window & { chrome?: unknown }).chrome);
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

/**
 * Capture install event as early as possible.
 * NOTE: we do NOT call preventDefault here in a way that blocks forever —
 * layout boot script handles early capture; this is the React fallback.
 */
export function initPwaInstall() {
  if (typeof window === "undefined") return;
  if (window.__olxPwaBooted) return;
  window.__olxPwaBooted = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    window.__olxPwa = event as InstallPrompt;
    window.dispatchEvent(new Event("olx-install-ready"));
  });
  window.addEventListener("appinstalled", () => {
    clearDeferredInstall();
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
    return reg;
  } catch {
    return null;
  }
}

/** Call only from a direct user tap/click. */
export async function promptInstall() {
  initPwaInstall();
  if (isStandaloneApp()) return true;
  if (isInAppBrowser()) return false;

  const pending = getDeferredInstall();
  if (!pending?.prompt) return false;

  try {
    await pending.prompt();
    const choice = await pending.userChoice;
    clearDeferredInstall();
    return choice.outcome === "accepted";
  } catch {
    return false;
  }
}

export function canPromptInstall() {
  initPwaInstall();
  return Boolean(getDeferredInstall()?.prompt) && !isStandaloneApp();
}
