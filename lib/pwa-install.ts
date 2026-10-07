type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PwaWindow = Window & { __olxPwa?: InstallPrompt };

let deferred: InstallPrompt | null = null;
let listening = false;
let swReady: Promise<ServiceWorkerRegistration | null> | null = null;

function store(event: InstallPrompt) {
  deferred = event;
  if (typeof window !== "undefined") {
    (window as PwaWindow).__olxPwa = event;
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("olx-install-ready"));
  }
}

export function getDeferredInstall() {
  return deferred || (typeof window !== "undefined" ? (window as PwaWindow).__olxPwa : undefined) || null;
}

export function clearDeferredInstall() {
  deferred = null;
  if (typeof window !== "undefined") {
    delete (window as PwaWindow).__olxPwa;
  }
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

/** Open the site in real Chrome — required when user opens from WhatsApp/Instagram. */
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

export function initPwaInstall() {
  if (typeof window === "undefined") return;
  const existing = (window as PwaWindow).__olxPwa;
  if (existing) deferred = existing;
  if (listening) return;
  listening = true;

  // Must preventDefault so our Install button can open the home-screen dialog.
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    store(event as InstallPrompt);
  });
  window.addEventListener("appinstalled", () => {
    clearDeferredInstall();
  });
}

export async function ensureServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  if (!swReady) {
    swReady = (async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        await reg.update().catch(() => undefined);
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
        if (!navigator.serviceWorker.controller) {
          await new Promise<void>((resolve) => {
            const done = () => {
              navigator.serviceWorker.removeEventListener("controllerchange", done);
              resolve();
            };
            navigator.serviceWorker.addEventListener("controllerchange", done);
            window.setTimeout(resolve, 5000);
          });
        }
        return reg;
      } catch {
        return null;
      }
    })();
  }
  return swReady;
}

/**
 * Shows Chrome's native install dialog (adds icon to Home Screen).
 * Must be called directly from a tap — do not await long work before this.
 */
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
