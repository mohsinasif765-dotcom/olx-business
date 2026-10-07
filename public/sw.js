const CACHE = "olx-pwa-v5";
const PRECACHE = ["/app-icon-192.png", "/app-icon-512.png", "/apple-touch-icon.png", "/logo.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Don't fail the whole SW if one asset 404s — that blocks Chrome install.
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

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
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
