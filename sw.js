const CACHE_NAME = 'Dr. Pebsv1'  + Date.now();
const ASSETS = [
  'sw.js',
  '/',
  'index.html',
  'quiz.html',
  'analytics.html',
  'results.html',
  'css/quiz.css',
  'css/analytics.css',
  'css/print.css',
  'css/results.css',
  'css/style.css',
  'js/quiz.js',
  'js/analytics.js',
  'js/questions.js',
  'js/app.js',
  'js/results.js',
  'images/logo.png',
  'images/icon.jpg',
  'images/icon32.jpg',
  'images/icon192.jpg',
  'images/icon512.jpg',
  'manifest.json',
  // Add other assets you want cached
];


self.addEventListener('install', (e) => {
    e.waitUntil(
      caches.open(CACHE_NAME)
        .then(cache => cache.addAll(ASSETS))
        .then(() => self.skipWaiting())
    );
  });
  
  self.addEventListener('fetch', (e) => {
    e.respondWith(
      caches.match(e.request)
        .then(response => response || fetch(e.request))
    );
  });