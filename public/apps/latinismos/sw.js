const CACHE='schola-latinismos-v3';
const ASSETS=['./','./index.html','./latinismos.css','./app.mjs','./model.mjs','./banco.mjs','../../theme.js','../../style.css','../../icons/icon.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('schola-latinismos-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const url=new URL(e.request.url);const allowed=ASSETS.map(p=>new URL(p,self.registration.scope).href);url.search='';if(!allowed.includes(url.href))return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(url.href,copy)));}return r;}).catch(async()=>await caches.match(url.href,{cacheName:CACHE})??Response.error()));});
