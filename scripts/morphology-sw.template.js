/* ScholaClassica: caché exclusivamente de /apps/morfologia/. */
const CACHE_PREFIX='schola-morphology-';
const CACHE_NAME=CACHE_PREFIX+'__MORPHOLOGY_CACHE_VERSION__';
const CORE=[
  './','./index.html','./style.css','./app.mjs','./engine.mjs',
  './written.mjs','./review.mjs','./greek-keyboard.mjs','./sintagmas.mjs','./data/paradigmas.json'
];
const SCOPE=new URL(self.registration.scope);
const OWN=new Set(CORE.map(path=>new URL(path,SCOPE).pathname));
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>
    cache.addAll(CORE.map(path=>new Request(new URL(path,SCOPE),{cache:'reload'})))
  ));
  // La instalación no fuerza skipWaiting: no interrumpe ejercicios en curso.
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
  if(event.data?.type==='SCHOLA_MORPHOLOGY_ACTIVATE')
    event.waitUntil(self.skipWaiting());
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==SCOPE.origin||!OWN.has(url.pathname))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    const canonical=new URL(url.pathname,SCOPE.origin);
    const saved=await cache.match(canonical.href,{ignoreSearch:true});
    return saved||fetch(req);
  })());
});
