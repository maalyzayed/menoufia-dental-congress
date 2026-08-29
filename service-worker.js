const CACHE_NAME = "menoufia-dental-congress-v4";

const FILES_TO_CACHE = [
  "/menoufia-dental-congress/",
  "/menoufia-dental-congress/index.html",
  "/menoufia-dental-congress/registration.html",
  "/menoufia-dental-congress/checkin.html",
  "/menoufia-dental-congress/speakers.html",
  "/menoufia-dental-congress/manifest.json"
];


// ==========================================
// تثبيت Service Worker الجديد
// ==========================================

self.addEventListener("install", (event) => {

  event.waitUntil(

    caches.open(CACHE_NAME).then((cache) => {

      return cache.addAll(FILES_TO_CACHE);

    })

  );

  // تشغيل النسخة الجديدة فورًا
  self.skipWaiting();

});



// ==========================================
// تفعيل Service Worker وحذف الـ Cache القديم
// ==========================================

self.addEventListener("activate", (event) => {

  event.waitUntil(

    caches.keys().then((keys) => {

      return Promise.all(

        keys

          .filter((key) => key !== CACHE_NAME)

          .map((key) => caches.delete(key))

      );

    }).then(() => {

      // التحكم في الصفحات المفتوحة فورًا
      return self.clients.claim();

    })

  );

});



// ==========================================
// التعامل مع الطلبات
// ==========================================

self.addEventListener("fetch", (event) => {

  // تجاهل POST / PUT / DELETE
  if (event.request.method !== "GET") {
    return;
  }


  const requestUrl = new URL(event.request.url);



  // ==========================================
  // صورة الشهادة
  //
  // دائمًا نحاول تحميل أحدث نسخة من الإنترنت
  // وإذا لم يوجد إنترنت نستخدم النسخة القديمة
  // ==========================================

  if (
    requestUrl.pathname.endsWith("certificate-template.jpg")
  ) {

    event.respondWith(

      fetch(event.request)

        .then((networkResponse) => {

          if (
            networkResponse &&
            networkResponse.status === 200
          ) {

            const responseClone =
              networkResponse.clone();


            caches.open(CACHE_NAME).then((cache) => {

              cache.put(
                event.request,
                responseClone
              );

            });

          }


          return networkResponse;

        })

        .catch(() => {

          return caches.match(event.request);

        })

    );


    return;
  }



  // ==========================================
  // صفحات HTML
  //
  // دائمًا نجيب أحدث نسخة من الإنترنت
  // ==========================================

  if (

    requestUrl.pathname.endsWith(".html") ||

    requestUrl.pathname.endsWith("/")

  ) {

    event.respondWith(

      fetch(event.request)

        .then((networkResponse) => {

          if (
            networkResponse &&
            networkResponse.status === 200
          ) {

            const responseClone =
              networkResponse.clone();


            caches.open(CACHE_NAME).then((cache) => {

              cache.put(
                event.request,
                responseClone
              );

            });

          }


          return networkResponse;

        })

        .catch(() => {

          // في حالة عدم وجود إنترنت
          // استخدم النسخة الموجودة في Cache

          return caches.match(event.request);

        })

    );


    return;
  }



  // ==========================================
  // باقي الملفات
  //
  // Cache First
  // ==========================================

  event.respondWith(

    caches.match(event.request)

      .then((cachedResponse) => {

        // لو موجود في Cache استخدمه
        if (cachedResponse) {

          return cachedResponse;

        }


        // لو مش موجود حمله من الإنترنت
        return fetch(event.request)

          .then((networkResponse) => {

            if (

              networkResponse &&

              networkResponse.status === 200 &&

              networkResponse.type === "basic"

            ) {

              const responseClone =
                networkResponse.clone();


              caches.open(CACHE_NAME).then((cache) => {

                cache.put(
                  event.request,
                  responseClone
                );

              });

            }


            return networkResponse;

          });

      })

  );

});
