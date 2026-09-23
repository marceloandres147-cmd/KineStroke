/* KineStroke — service worker
   Guarda la aplicación en el dispositivo para que abra sin conexión.
   Sube el número de VERSION cada vez que publiques una versión nueva. */
const VERSION = "kinestroke-v1";
const ARCHIVOS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if(req.method !== "GET") return;

  /* La página se busca primero en la red, para recibir actualizaciones,
     y si no hay señal se entrega la copia guardada. */
  if(req.mode === "navigate"){
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copia = res.clone();
          caches.open(VERSION).then((c) => c.put("./index.html", copia));
          return res;
        })
        .catch(() => caches.match("./index.html").then((r) => r || caches.match("./")))
    );
    return;
  }

  /* El resto (iconos, manifiesto) se entrega desde la copia local. */
  e.respondWith(
    caches.match(req).then((r) => r || fetch(req).then((res) => {
      if(res && res.status === 200 && res.type === "basic"){
        const copia = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copia));
      }
      return res;
    }).catch(() => r))
  );
});
