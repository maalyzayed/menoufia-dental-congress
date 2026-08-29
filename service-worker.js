const CACHE_NAME = "menoufia-dental-congress-v3";

const FILES_TO_CACHE = [
  "/menoufia-dental-congress/",
  "/menoufia-dental-congress/index.html",
  "/menoufia-dental-congress/registration.html",
  "/menoufia-dental-congress/checkin.html",
  "/menoufia-dental-congress/speakers.html",
  "/menoufia-dental-congress/manifest.json"
];

// تثبيت النسخة الجديدة
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  // تفعيل الـ Service Worker الجديد فورًا
  self.skipWaiting();
});

// حذف أي Cache قديم
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// التعامل مع الطلبات
self.addEventListener("fetch", (event) => {

  // نتعامل فقط مع GET
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  // ==========================================
  // صفحات HTML وملفات الشهادات
  // نحاول دائمًا جلب أحدث نسخة من الإنترنت
  // ==========================================
  if (
    requestUrl.pathname.endsWith(".html") ||
    requestUrl.pathname.endsWith("/")
  ) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {

          // تحديث النسخة الموجودة في Cache
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }

          return networkResponse;
        })
        .catch(() => {
          // لو مفيش إنترنت، استخدم النسخة الموجودة
          return caches.match(event.request);
        })
    );

    return;
  }

  // ==========================================
  // باقي الملفات:
  // الصور - CSS - JS - manifest
  // ==========================================
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {

      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {

        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === "basic"
        ) {

          const responseClone = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }

        return networkResponse;
      });
    })
  );
});
