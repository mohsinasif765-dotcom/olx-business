const CACHE = "olx-pwa-v4";
const PRECACHE = ["/app-icon-192.png", "/app-icon-512.png", "/apple-touch-icon.png", "/logo.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then(
        (hit) =>
          hit ||
          new Response("OLX Business is offline.", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          })
      )
    )
  );
});
