/* Saathi service worker.
 * 1. Offline: keeps a copy of the app files, so Saathi (including the emergency
 *    card and its QR) opens with no internet. Your data is in the browser, not here.
 * 2. Notifications: shows reminders when Saathi is in the background, and
 *    opens the right screen when one is tapped.
 * 3. Ready for Web Push from the server later (the "push" handler below).
 * Bump VERSION whenever you change any file, so phones get the update. */
const VERSION = "saathi-v0.3.0";
const FILES = [
  "./", "index.html", "manifest.webmanifest", "css/styles.css", "icons/icon-192.png",
  "js/vendor/qrcode.js", "js/state.js", "js/data.js", "js/helpers.js", "js/color.js", "js/reminders.js",
  "js/medcard.js", "js/overlays.js", "js/screens/today.js", "js/screens/checkin.js", "js/screens/tools.js",
  "js/screens/body.js", "js/screens/support.js", "js/screens/settings.js", "js/app.js"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Network first so updates show straight away; the saved copy is used when offline.
// Only this site's own files are handled (fonts from Google fall back to system fonts offline).
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || url.pathname.includes("/api/")) return;
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(hit => hit || caches.match("index.html")))
  );
});

// Tapping a notification opens Saathi on the right screen.
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const open = e.notification.data?.open || "today";
  e.waitUntil((async () => {
    const wins = await clients.matchAll({ type: "window", includeUncontrolled: true });
    if (wins.length) { await wins[0].focus(); wins[0].postMessage({ type: "open", open }); return; }
    await clients.openWindow(`./?open=${encodeURIComponent(open)}`);
  })());
});

// Web Push from the server (later). Expected payload: {"title","body","tag","open"}.
self.addEventListener("push", e => {
  let d = {}; try { d = e.data.json(); } catch (_) { d = { title: "Saathi", body: e.data?.text() || "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "Saathi", {
    body: d.body || "", tag: d.tag, renotify: true, icon: "icons/icon-192.png", badge: "icons/icon-192.png",
    vibrate: [200, 100, 200, 100, 300], data: { open: d.open || "today" }
  }));
});
