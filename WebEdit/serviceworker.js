var cacheName = 'speckleedit102';
var filesToCache = [
  'index.html',
  'style.css',
  'functions.js',
  'favicon.png',
  'jquery-3.4.1.min.js',
  'api.js',
  'lib/fontawesome/all.css',
  'moment.js',
  'icons/icon-72x72.png',
  'icons/icon-96x96.png',
  'icons/icon-128x128.png',
  'icons/icon-144x144.png',
  'icons/icon-152x152.png',
  'icons/icon-192x192.png',
  'icons/icon-384x384.png',
  'icons/icon-512x512.png',
  'lib/webfonts/fa-regular-400.woff2'
  // 'lib/webfonts/fa-regular-400.eot',
  // 'lib/webfonts/fa-regular-400.svg',
  // 'lib/webfonts/fa-regular-400.ttf',
  // 'lib/webfonts/fa-regular-400.woff',
  // 'lib/webfonts/fa-solid-900.eot',
  // 'lib/webfonts/fa-solid-900.svg',
  // 'lib/webfonts/fa-solid-900.ttf',
  // 'lib/webfonts/fa-solid-900.woff',
  // 'lib/webfonts/fa-solid-900.woff2'
];

// installation phase
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
  e.waitUntil(
    caches.open(cacheName).then(function (cache) {
      console.log("returning cache");
      try {
        return cache.addAll(filesToCache);
      } catch (error) {
        console.log(error);
      }
    })
  );
});

self.addEventListener('activate', function (event) {
  console.log('[Service Worker] Activating');
  return self.clients.claim();
});

// serve files from cache when possible
self.addEventListener('fetch', function (event) {
  console.log("fetching...."+event.request.url);
  event.respondWith(caches.match(event.request)
    .then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});