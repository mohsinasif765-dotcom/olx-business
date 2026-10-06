type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: InstallPrompt | null = null;
let listening = false;

export function getDeferredInstall() {
  return deferred;
}

export function clearDeferredInstall() {
  deferred = null;
}

export function initPwaInstall() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as InstallPrompt;
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
  });
}

export function waitForInstallPrompt(ms = 2500) {
  if (deferred) return Promise.resolve(deferred);
  return new Promise<InstallPrompt | null>((resolve) => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (deferred || Date.now() - started >= ms) {
        window.clearInterval(timer);
        resolve(deferred);
      }
    }, 120);
  });
}

export function saveAppShortcut(origin: string) {
  const home = `${origin}/home`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="OLX Business">
  <link rel="apple-touch-icon" href="${origin}/logo.png">
  <title>OLX Business</title>
  <script>location.replace(${JSON.stringify(home)});</script>
</head>
<body style="margin:0;background:#0a1a4a;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh">
  Opening OLX Business…
</body>
</html>`;
  const blob = new Blob([html], { type: "text/html" });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = "OLX-Business.html";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 1000);
}
