// Service Worker for 學生會會費追蹤系統
const VERSION = "1.0.3";
const CACHE_NAME = `rwsa-fee-tracker-${VERSION}`;

// Detect development environment
const isDevelopment =
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1" ||
  location.hostname === "0.0.0.0";

// Core assets to cache
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
];

// Install event
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");

  if (isDevelopment) {
    console.log("[SW] Development mode - skipping cache");
    self.skipWaiting();
    return;
  }

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch(() => console.log("[SW] Cache failed")),
  );

  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");

  if (isDevelopment) {
    event.waitUntil(self.clients.claim());
    return;
  }

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Fetch event
self.addEventListener("fetch", (event) => {
  if (isDevelopment) {
    return; // Skip caching in development
  }

  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    caches
      .match(request)
      .then((response) => {
        return (
          response ||
          fetch(request).then((fetchResponse) => {
            if (fetchResponse.ok) {
              const responseClone = fetchResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return fetchResponse;
          })
        );
      })
      .catch(() => new Response("Network error", { status: 503 })),
  );
});

console.log(
  `[SW] Service Worker loaded (${isDevelopment ? "Development" : "Production"} mode)`,
);
