import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {generatePortalIcons} from './generate-portal-icons.mjs';
const CORE=[
  'index.html','app.js','style.css','manifest.webmanifest',
  'icons/icon.svg','icons/icon-192.png','icons/icon-512.png',
  'icons/icon-maskable-512.png','icons/apple-touch-icon.png'
];
export async function buildPortalPwa(out,root){
  await generatePortalIcons(out);
  const manifest=JSON.parse(await readFile(join(out,'manifest.webmanifest'),'utf8'));
  assert.equal(manifest.scope,'./');
  assert.equal(manifest.start_url,'./');
  assert.equal(manifest.display,'standalone');
  const template=await readFile(join(root,'scripts/portal-sw.template.js'),'utf8');
  const marker='__SCHOLA_PORTAL_CACHE_VERSION__';
  assert.equal(template.split(marker).length,2,'El marcador de versión debe ser único');
  const hasher=createHash('sha256');hasher.update(template);
  for(const path of CORE){
    hasher.update(path+'\\0');hasher.update(await readFile(join(out,path)));
  }
  const version=hasher.digest('hex').slice(0,20);
  await writeFile(join(out,'sw.js'),template.replace(marker,version));
  console.log('ScholaClassica: PWA del portal generada con caché independiente schola-portal-'+version);
}
