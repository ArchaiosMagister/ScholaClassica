import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'),out=join(root,'dist');
const read=path=>readFileSync(join(out,path),'utf8');
test('la portada es instalable y tiene iconos válidos para iPhone/Android',()=>{
 const html=read('index.html'),manifest=JSON.parse(read('manifest.webmanifest'));
 assert.match(html,/rel="manifest" href="\.\/manifest.webmanifest"/);
 assert.match(html,/rel="apple-touch-icon" sizes="180x180"/);
 assert.match(html,/id="portal-update"/);
 assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');
 assert.equal(manifest.display,'standalone');
 for(const [name,size] of [['icon-192.png',192],['icon-512.png',512],['icon-maskable-512.png',512],['apple-touch-icon.png',180]]){
   const buffer=readFileSync(join(out,'icons',name));
   assert.equal(buffer.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
   assert.equal(buffer.readUInt32BE(16),size);assert.equal(buffer.readUInt32BE(20),size);
   assert.ok(buffer.length>200);
 }
 assert.match(read('icons/icon.svg'),/<svg/);
 assert.ok(manifest.icons.some(i=>i.purpose==='maskable'));
});
test('el worker raíz solo intercepta recursos del propio portal',()=>{
 const sw=read('sw.js'),js=read('app.js');
 assert.match(sw,/const CACHE_PREFIX='schola-portal-'/);
 assert.ok(!sw.includes('__SCHOLA_PORTAL_CACHE_VERSION__'));
 assert.match(sw,/key\.startsWith\(CACHE_PREFIX\)&&key!==VERSION/);
 assert.match(sw,/!OWN_PATHS\.has\(url\.pathname\)/);
 assert.match(sw,/SCHOLA_ACTIVATE_PORTAL_UPDATE/);
 for(const module of ['gramatica','evolucion-fonetica','etymologicon','vocabulario'])
   assert.ok(!sw.includes("'./apps/"+module));
 assert.match(js,/serviceWorker\.register\('\.\/sw\.js',\{scope:'\.\/'/);
 assert.match(js,/portalRegistration\.update\(\)/);
});
test('Evolutio: 522 fichas, actualización y SW aislado',()=>{
 const lock=JSON.parse(readFileSync(join(root,'config/sources.lock.json'),'utf8'));
 assert.equal(lock.sources.evolutio.sha,'901dacb125ee7894ea9d11faf7b0d0afa7e713b5');
 const data=JSON.parse(read('apps/evolucion-fonetica/data/pilot.json'));
 assert.equal(data.words.length,522);
 assert.ok(data.words.some(w=>w.latin==='uitam'));
 for(const p of ['src/difficulty.mjs','src/result-difficulty.mjs','src/latin.mjs','src/update.mjs','data/difficulty.json'])
   assert.ok(existsSync(join(out,'apps/evolucion-fonetica',p)),p);
 assert.match(read('apps/evolucion-fonetica/index.html'),/id="refresh-app"/);
 const sw=read('apps/evolucion-fonetica/sw.js');
 assert.match(sw,/CACHE_PREFIX='schola-evolutio-'/);
 assert.match(sw,/key\.startsWith\(CACHE_PREFIX\)&&key!==VERSION/);
 assert.match(sw,/src\/difficulty\.mjs/);
 assert.match(sw,/src\/result-difficulty\.mjs/);
 assert.match(sw,/resultado-v2/);
 assert.match(sw,/data\/difficulty\.json/);
 assert.match(sw,/url\.pathname\.startsWith\(scope\.pathname\)/);
 assert.ok(!sw.includes('keys.filter(key=>key!==VERSION)'));
});
test('Etymologicon mantiene su caché exclusiva y exámenes fuera',()=>{
 const sw=read('apps/etymologicon/sw.js');
 assert.match(sw,/CACHE_PREFIX='schola-etymologicon-'/);
 assert.match(sw,/url\.pathname\.startsWith\(SCOPE\.pathname\)/);
 assert.equal(existsSync(join(out,'apps/examenes')),false);
});
