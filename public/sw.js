const CACHE = "olx-pwa-v7";
const PRECACHE = ["/", "/app-icon-192.png", "/app-icon-512.png", "/apple-touch-icon.png", "/logo.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => undefined)));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Always network-first so installability + live content stay correct.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.ok && event.request.destination === "document") {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => undefined);
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(
          (hit) =>
            hit ||
            caches.match("/").then(
              (home) =>
                home ||
                new Response("OLX Business is offline.", {
                  status: 503,
                  headers: { "Content-Type": "text/plain" },
                })
            )
        )
      )
  );
});
