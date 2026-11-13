/* ScholaClassica: PWA de la PORTADA. No administrar las apps hijas. */
const CACHE_PREFIX='schola-portal-';
const VERSION=CACHE_PREFIX+'__SCHOLA_PORTAL_CACHE_VERSION__';
const CORE=[
  './','./index.html','./app.js','./theme.js','./style.css','./manifest.webmanifest',
  './icons/icon.svg','./icons/icon-192.png','./icons/icon-512.png',
  './icons/icon-maskable-512.png','./icons/apple-touch-icon.png'
];
const SCOPE=new URL(self.registration.scope);
const OWN_PATHS=new Set(CORE.map(path=>new URL(path,SCOPE).pathname));
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(VERSION).then(cache=>
    cache.addAll(CORE.map(path=>new Request(new URL(path,SCOPE),{cache:'reload'})))
  ));
  // No activar una actualización automáticamente durante un ejercicio.
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==VERSION)
      .map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('message',event=>{
  if(event.data?.type==='SCHOLA_ACTIVATE_PORTAL_UPDATE')
    event.waitUntil(self.skipWaiting());
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==SCOPE.origin||!OWN_PATHS.has(url.pathname))return;
  // Al navegar hacia /apps/* (incluso antes de instalar su SW), no hacer
  // respondWith: se deja que el navegador y los SW de cada app gestionen todo.
  event.respondWith((async()=>{
    const cache=await caches.open(VERSION);
    const canonical=new URL(url.pathname,SCOPE.origin);
    const stored=await cache.match(canonical.href,{ignoreSearch:true});
    if(stored)return stored;
    return fetch(req);
  })());
});
