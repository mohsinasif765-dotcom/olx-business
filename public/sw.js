/* Minimal SW — fetch handler required for Chrome beforeinstallprompt */
const CACHE = "olx-pwa-v8";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll(["/app-icon-192.png", "/app-icon-512.png", "/apple-touch-icon.png"]).catch(() => undefined)
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then(
        (hit) =>
          hit ||
          new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } })
      )
    )
  );
});
