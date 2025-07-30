// Service Worker for 學生會會費追蹤系統
const VERSION = "1.0.2";
const CACHE_NAME = `rwsa-fee-tracker-v2-${VERSION}`;
const STATIC_CACHE_NAME = `rwsa-static-${VERSION}`;
const DYNAMIC_CACHE_NAME = `rwsa-dynamic-${VERSION}`;

// Detect development environment
const isDevelopment =
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1" ||
  location.hostname === "0.0.0.0";

// Core assets to cache on install
const STATIC_ASSETS = [
  "/",
  "/database",
  "/about",
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/apple-touch-icon.png",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");

  if (isDevelopment) {
    console.log("[SW] Development mode - skipping initial cache");
    self.skipWaiting();
    return;
  }

  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Caching static assets");
        return cache.addAll(STATIC_ASSETS.filter((url) => url !== "/"));
      })
      .catch((error) => {
        console.error("[SW] Failed to cache static assets:", error);
      }),
  );

  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        if (isDevelopment) {
          // In development, clear all caches
          console.log("[SW] Development mode - clearing all caches");
          return Promise.all(
            cacheNames.map((cacheName) => {
              console.log("[SW] Deleting cache:", cacheName);
              return caches.delete(cacheName);
            }),
          );
        } else {
          // In production, only clear old caches
          return Promise.all(
            cacheNames
              .filter((cacheName) => {
                return (
                  cacheName !== STATIC_CACHE_NAME &&
                  cacheName !== DYNAMIC_CACHE_NAME
                );
              })
              .map((cacheName) => {
                console.log("[SW] Deleting old cache:", cacheName);
                return caches.delete(cacheName);
              }),
          );
        }
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      }),
  );
});

// Fetch event - implement caching strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip requests to other origins
  if (url.origin !== location.origin) {
    return;
  }

  // Handle different types of requests
  if (isDevelopment) {
    // In development, always try network first to get latest changes
    event.respondWith(networkFirstDev(request));
  } else if (isStaticAsset(request)) {
    // Cache first strategy for static assets
    event.respondWith(cacheFirst(request));
  } else if (isApiRequest(request)) {
    // Network first strategy for API requests
    event.respondWith(networkFirst(request));
  } else {
    // Stale while revalidate for pages
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Cache first strategy - good for static assets
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error("[SW] Cache first strategy failed:", error);
    return new Response("Network error occurred", {
      status: 408,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

// Network first strategy - good for API requests
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log("[SW] Network failed, trying cache:", error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response("Network error and no cache available", {
      status: 408,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

// Stale while revalidate strategy - good for pages
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.error("[SW] Network request failed:", error);
      return cachedResponse;
    });

  return cachedResponse || fetchPromise;
}

// Development strategy - always network first, no caching for pages
async function networkFirstDev(request) {
  try {
    // Always try network first in development
    const networkResponse = await fetch(request);

    // In development mode, don't cache pages at all
    // Only cache truly static assets like images and fonts
    if (
      networkResponse.ok &&
      isStaticAsset(request) &&
      !isPageRequest(request)
    ) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log("[SW] Development mode - network failed:", error);

    // Only try cache for static assets, not pages
    if (isStaticAsset(request) && !isPageRequest(request)) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    return new Response("Network error in development mode", {
      status: 408,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

// Helper functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(
    /\.(css|js|png|jpg|jpeg|svg|ico|woff|woff2|ttf|eot)$/,
  );
}

function isApiRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith("/api/");
}

function isPageRequest(request) {
  const url = new URL(request.url);
  return (
    url.pathname === "/" ||
    url.pathname.startsWith("/_next/") ||
    url.pathname.endsWith(".html") ||
    !url.pathname.includes(".")
  );
}

// Add message listener for cache clearing commands
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CLEAR_CACHE") {
    console.log("[SW] Received cache clear command");
    event.waitUntil(
      caches
        .keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              console.log("[SW] Clearing cache:", cacheName);
              return caches.delete(cacheName);
            }),
          );
        })
        .then(() => {
          console.log("[SW] All caches cleared");
          // Notify the client that cache is cleared
          event.ports[0].postMessage({ success: true });
        }),
    );
  }
});

console.log(
  `[SW] 學生會會費追蹤系統 Service Worker loaded (${isDevelopment ? "Development" : "Production"} mode)`,
);
