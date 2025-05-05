const CACHE_NAME = "writepad-v1";

// Base URLs to cache
const baseUrlsToCache = [
  "/writepad/writepad.html",
  "/writepad/letters.json",
  "/writepad/icons/icon-192x192.png",
  "/writepad/icons/icon-512x512.png",
  "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
];

// All letter images from the JSON
const letterFiles = [
  // Uppercase
  "/writepad/letter_images/Uppercase/K.png",
  "/writepad/letter_images/Uppercase/J.png",
  "/writepad/letter_images/Uppercase/H.png",
  "/writepad/letter_images/Uppercase/I.png",
  "/writepad/letter_images/Uppercase/Z.png",
  "/writepad/letter_images/Uppercase/M.png",
  "/writepad/letter_images/Uppercase/AA.png",
  "/writepad/letter_images/Uppercase/L.png",
  "/writepad/letter_images/Uppercase/Y.png",
  "/writepad/letter_images/Uppercase/N.png",
  "/writepad/letter_images/Uppercase/AE.png",
  "/writepad/letter_images/Uppercase/O.png",
  "/writepad/letter_images/Uppercase/X.png",
  "/writepad/letter_images/Uppercase/U.png",
  "/writepad/letter_images/Uppercase/B.png",
  "/writepad/letter_images/Uppercase/C.png",
  "/writepad/letter_images/Uppercase/T.png",
  "/writepad/letter_images/Uppercase/V.png",
  "/writepad/letter_images/Uppercase/A.png",
  "/writepad/letter_images/Uppercase/W.png",
  "/writepad/letter_images/Uppercase/D.png",
  "/writepad/letter_images/Uppercase/S.png",
  "/writepad/letter_images/Uppercase/OE.png",
  "/writepad/letter_images/Uppercase/R.png",
  "/writepad/letter_images/Uppercase/E.png",
  "/writepad/letter_images/Uppercase/G.png",
  "/writepad/letter_images/Uppercase/P.png",
  "/writepad/letter_images/Uppercase/Q.png",
  "/writepad/letter_images/Uppercase/F.png",

  // Lowercase
  "/writepad/letter_images/Lowercase/k.png",
  "/writepad/letter_images/Lowercase/j.png",
  "/writepad/letter_images/Lowercase/h.png",
  "/writepad/letter_images/Lowercase/i.png",
  "/writepad/letter_images/Lowercase/z.png",
  "/writepad/letter_images/Lowercase/m.png",
  "/writepad/letter_images/Lowercase/aa.png",
  "/writepad/letter_images/Lowercase/l.png",
  "/writepad/letter_images/Lowercase/y.png",
  "/writepad/letter_images/Lowercase/n.png",
  "/writepad/letter_images/Lowercase/ae.png",
  "/writepad/letter_images/Lowercase/o.png",
  "/writepad/letter_images/Lowercase/x.png",
  "/writepad/letter_images/Lowercase/u.png",
  "/writepad/letter_images/Lowercase/b.png",
  "/writepad/letter_images/Lowercase/c.png",
  "/writepad/letter_images/Lowercase/t.png",
  "/writepad/letter_images/Lowercase/v.png",
  "/writepad/letter_images/Lowercase/a.png",
  "/writepad/letter_images/Lowercase/w.png",
  "/writepad/letter_images/Lowercase/d.png",
  "/writepad/letter_images/Lowercase/s.png",
  "/writepad/letter_images/Lowercase/oe.png",
  "/writepad/letter_images/Lowercase/r.png",
  "/writepad/letter_images/Lowercase/e.png",
  "/writepad/letter_images/Lowercase/g.png",
  "/writepad/letter_images/Lowercase/p.png",
  "/writepad/letter_images/Lowercase/q.png",
  "/writepad/letter_images/Lowercase/f.png",

  // Numbers and Specials
  "/writepad/letter_images/NumbersAndSpecials/8.png",
  "/writepad/letter_images/NumbersAndSpecials/9.png",
  "/writepad/letter_images/NumbersAndSpecials/_.png",
  "/writepad/letter_images/NumbersAndSpecials/4.png",
  "/writepad/letter_images/NumbersAndSpecials/5.png",
  "/writepad/letter_images/NumbersAndSpecials/7.png",
  "/writepad/letter_images/NumbersAndSpecials/6.png",
  "/writepad/letter_images/NumbersAndSpecials/2.png",
  "/writepad/letter_images/NumbersAndSpecials/3.png",
  "/writepad/letter_images/NumbersAndSpecials/1.png",
  "/writepad/letter_images/NumbersAndSpecials/0.png",
];

// Combine all URLs to cache
const urlsToCache = [...baseUrlsToCache, ...letterFiles];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache files in smaller chunks to avoid timeouts
      const chunkSize = 20;
      const chunks = [];
      for (let i = 0; i < urlsToCache.length; i += chunkSize) {
        const chunk = urlsToCache.slice(i, i + chunkSize);
        chunks.push(cache.addAll(chunk));
      }
      return Promise.all(chunks);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        // Return cached version or fetch new version
        return response || fetch(event.request);
      })
      .catch(() => {
        // If both cache and fetch fail, show a fallback
        console.log("Failed to fetch:", event.request.url);
        return new Response("Offline content not available");
      })
  );
});

// Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
