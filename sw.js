const CACHE_NAME = "quran-reader-v1";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./app.js",
  "./manifest.json"
];


self.addEventListener("install", event => {

  event.waitUntil(

    caches.open(CACHE_NAME)
      .then(cache => {

        return cache.addAll(
          FILES_TO_CACHE
        );

      })

  );

});


self.addEventListener("fetch", event => {

  event.respondWith(

    caches.match(event.request)
      .then(cachedFile => {

        if (cachedFile) {
          return cachedFile;
        }

        return fetch(event.request);

      })

  );

});