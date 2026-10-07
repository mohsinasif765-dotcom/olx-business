type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PwaWindow = Window & { __olxPwa?: InstallPrompt };

let deferred: InstallPrompt | null = null;
let listening = false;

function store(event: InstallPrompt) {
  deferred = event;
  if (typeof window !== "undefined") {
    (window as PwaWindow).__olxPwa = event;
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

export function initPwaInstall() {
  if (typeof window === "undefined") return;
  const existing = (window as PwaWindow).__olxPwa;
  if (existing) deferred = existing;
  if (listening) return;
  listening = true;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    store(event as InstallPrompt);
  });
  window.addEventListener("appinstalled", () => {
    clearDeferredInstall();
  });
}

/** Returns true if the native install prompt was shown and accepted. */
export async function promptInstall() {
  initPwaInstall();
  if (isStandaloneApp()) return true;
  const pending = getDeferredInstall();
  if (!pending?.prompt) return false;
  await pending.prompt();
  const choice = await pending.userChoice;
  clearDeferredInstall();
  return choice.outcome === "accepted";
}

export function canPromptInstall() {
  initPwaInstall();
  return Boolean(getDeferredInstall()?.prompt) && !isStandaloneApp();
}
