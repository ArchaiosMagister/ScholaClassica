/* Etymologicon: trabajador offline aislado en /apps/etymologicon/.
 * El proceso de construcción sustituye el marcador de versión por un
 * hash de contenido de los recursos realmente empaquetados. */
const CACHE_PREFIX='schola-etymologicon-';
const CACHE_NAME=CACHE_PREFIX+'__ETYM_CACHE_VERSION__';
const CORE=[
  './','./index.html','./style.css','./app.mjs','./progress.mjs','./study.mjs','./activities-ui.mjs','./quiz.mjs','./quiz-ui.mjs','./corrector/write-two.mjs',
  './data/gr1.json','./manifest.webmanifest','./icons/icon.svg',
  './icons/icon-192.png','./icons/icon-512.png',
  './icons/icon-maskable-512.png','./icons/apple-touch-icon.png'
];
const SCOPE=new URL(self.registration.scope);
const CORE_URLS=new Set(CORE.map(path=>new URL(path,SCOPE).href));
self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache=>
      cache.addAll(CORE.map(path=>new Request(new URL(path,SCOPE),{cache:'reload'})))
    )
  );
  // No llamar a skipWaiting automáticamente: el usuario decide cuándo
  // activar una versión nueva para no interrumpir un ejercicio.
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>
      key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME
    ).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('message',event=>{
  if(event.data?.type==='ETYM_ACTIVATE_UPDATE')
    event.waitUntil(self.skipWaiting());
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin||!url.pathname.startsWith(SCOPE.pathname))return;
  // Nunca interceptar el portal raíz, Appendix o Evolutio.
  if(!CORE_URLS.has(url.origin+url.pathname)&&
     !CORE_URLS.has(url.href.split('?')[0]))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    const canonical=new URL(url.pathname,SCOPE.origin).href;
    const cached=await cache.match(canonical,{ignoreSearch:true});
    if(cached)return cached;
    // La instalación normal es atómica y precarga todos los recursos.
    // Esta salida solo atiende a una caché borrada manualmente.
    return fetch(req);
  })());
});
