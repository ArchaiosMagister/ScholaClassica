import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
const root=resolve(import.meta.dirname,'..');
const moduleDir=join(root,'dist/apps/etymologicon');
const fromModule=path=>readFileSync(join(moduleDir,path));
const read=path=>fromModule(path).toString('utf8');
const core=[
  'index.html','practicar.html','estudio.html','style.css','portada.css','portada.mjs','estudio.css','estudio.mjs','app.mjs','progress.mjs','study.mjs','activities-ui.mjs','quiz.mjs','quiz-ui.mjs','decomposition.mjs','decomposition-ui.mjs','greek-keyboard.mjs','corrector/write-two.mjs',
  'data/gr1.json','data/gr1-study.json','data/gr1-decomposition.json','manifest.webmanifest','icons/icon.svg',
  'icons/icon-192.png','icons/icon-512.png',
  'icons/icon-maskable-512.png','icons/apple-touch-icon.png'
];

function verifyPng(filename,size){
  const image=fromModule('icons/'+filename);
  assert.equal(image.subarray(0,8).toString('hex'),'89504e470d0a1a0a',filename);
  assert.equal(image.toString('ascii',12,16),'IHDR',filename);
  assert.equal(image.readUInt32BE(16),size,'Anchura PNG '+filename);
  assert.equal(image.readUInt32BE(20),size,'Altura PNG '+filename);
  assert.equal(image[24],8,'Profundidad de color '+filename);
  assert.equal(image.subarray(-8).toString('hex'),'49454e44ae426082','IEND '+filename);
  let offset=8;
  const deflated=[];
  while(offset<image.length){
    const length=image.readUInt32BE(offset);
    const type=image.toString('ascii',offset+4,offset+8);
    if(type==='IDAT')deflated.push(image.subarray(offset+8,offset+8+length));
    offset+=12+length;
  }
  const raw=inflateSync(Buffer.concat(deflated));
  assert.equal(raw.length,size*(size+1),'Descompresión correcta '+filename);
}
test('la PWA Etymologicon declara instalación local y Griego I sin heredar el ámbito del portal',()=>{
  const manifest=JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.id,'./');
  assert.equal(manifest.start_url,'./index.html');
  assert.equal(manifest.scope,'./');
  assert.equal(manifest.display,'standalone');
  assert.equal(manifest.lang,'es');
  assert.ok(manifest.icons.some(x=>x.purpose==='maskable'&&x.sizes==='512x512'));
  assert.ok(manifest.icons.some(x=>x.sizes==='192x192'&&x.purpose==='any'));
  for(const item of manifest.icons)
    assert.ok(existsSync(join(moduleDir,item.src)),'Icono faltante: '+item.src);
  const html=read('index.html');
  assert.match(html,/rel="manifest" href="\.\/manifest\.webmanifest"/);
  assert.match(html,/rel="apple-touch-icon" sizes="180x180"/);
  assert.match(html,/apple-mobile-web-app-capable/);
  assert.match(html,/id="install-button"/);
  assert.match(html,/id="check-update"/);
  assert.match(html,/id="apply-update"/);
  assert.match(html,/Añadir a pantalla de inicio/);
});
test('los PNG de iOS, Android y maskable son imágenes reales y legibles',()=>{
  verifyPng('icon-192.png',192);
  verifyPng('icon-512.png',512);
  verifyPng('icon-maskable-512.png',512);
  verifyPng('apple-touch-icon.png',180);
});
test('el service worker tiene un hash derivado del contenido completo, y no se borra caché ajena',()=>{
  const sw=read('sw.js');
  const template=readFileSync(join(root,'scripts/etymologicon-sw.template.js'),'utf8');
  const hash=createHash('sha256');
  hash.update(template);
  for(const item of core){
    hash.update(item+'\0');
    hash.update(fromModule(item));
  }
  const expected=hash.digest('hex').slice(0,20);
  assert.ok(!sw.includes('__ETYM_CACHE_VERSION__'));
  assert.ok(sw.includes("const CACHE_PREFIX='schola-etymologicon-';"));
  assert.ok(sw.includes("const CACHE_NAME=CACHE_PREFIX+'"+expected+"';"));
  assert.match(sw,/key\.startsWith\(CACHE_PREFIX\)&&key!==CACHE_NAME/);
  assert.match(sw,/new URL\(self\.registration\.scope\)/);
  assert.match(sw,/!url\.pathname\.startsWith\(SCOPE\.pathname\)/);
  assert.match(sw,/ETYM_ACTIVATE_UPDATE/);
  assert.match(sw,/cache\.addAll\(CORE/);
  assert.ok(!sw.includes("keys.filter(key=>key!==CACHE_NAME)"));
  assert.ok(!sw.includes("self.addEventListener('push'"));
  assert.ok(!sw.includes("navigator.storage.clear"));
  assert.ok(!read('index.html').includes('apps/examenes'));
});
test('los archivos precargados coinciden exactamente con los publicados por el módulo',()=>{
  const template=readFileSync(join(root,'scripts/etymologicon-sw.template.js'),'utf8');
  const names=[...template.matchAll(/'\.\/([^']*)'/g)].map(x=>x[1]);
  for(const item of core)assert.ok(names.includes(item),'Recurso sin precargar: '+item);
  assert.ok(names.includes(''),'Falta precargar el inicio con barra final');
  assert.equal(new Set(names).size,names.length,'No debe precargar dos veces una ruta');
  const corrector=readFileSync(join(root,'shared/academic/greek-etymology/corrector/write-two.mjs'));
  assert.deepEqual(fromModule('corrector/write-two.mjs'),corrector);
});
