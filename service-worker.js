const CACHE_NAME = "menoufia-dental-congress-v2";

const FILES_TO_CACHE = [
  "/menoufia-dental-congress/",
  "/menoufia-dental-congress/index.html",
  "/menoufia-dental-congress/registration.html",
  "/menoufia-dental-congress/checkin.html",
  "/menoufia-dental-congress/speakers.html",
  "/menoufia-dental-congress/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // تجاهل أي طلب ليس GET (مثل POST أو PUT أو DELETE)
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).then((networkResponse) => {
        // تأكد من أن الاستجابة سليمة قبل تخزينها
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // نسخ الاستجابة لتخزينها
        const responseToCache = networkResponse.clone();

        caches.open('v2').then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});
