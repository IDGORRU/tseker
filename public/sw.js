const CACHE_NAME = "email-checker-v1"
const urlsToCache = [
  "/",
  "/index.html",
  "/index.tsx",
  "/App.tsx",
  "/types.ts",
  "/constants.ts",
  "/metadata.json",
  "/components/AccountManager.tsx",
  "/components/CollapsiblePanel.tsx",
  "/components/Icon.tsx",
  "/components/ProxyManager.tsx",
  "/components/StatCard.tsx",
  "/components/Terminal.tsx",
  "/services/apiService.ts",
  "/icon.png",
]

self.addEventListener("install", (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache")
      return cache.addAll(urlsToCache)
    }),
  )
})

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }
      return fetch(event.request)
    }),
  )
})
