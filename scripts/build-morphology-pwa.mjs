import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const CORE=['index.html','style.css','app.mjs','engine.mjs','written.mjs',
  'review.mjs','greek-keyboard.mjs','sintagmas.mjs','greek-noun-phrases.mjs',
  'data/paradigmas.json','data/LICENSE-SUSTANTIVOS-GRIEGOS.md'];
export async function buildMorphologyPwa(out,root){
  const moduleDir=join(out,'apps/morfologia');
  const template=await readFile(join(root,'scripts/morphology-sw.template.js'),'utf8');
  const marker='__MORPHOLOGY_CACHE_VERSION__';
  assert.equal(template.split(marker).length,2);
  const hash=createHash('sha256');hash.update(template);
  for(const file of CORE){
    hash.update(file+'\0');hash.update(await readFile(join(moduleDir,file)));
  }
  await writeFile(join(moduleDir,'sw.js'),template.replace(marker,hash.digest('hex').slice(0,20)));
  console.log('Morfología: SW offline independiente con prefijo schola-morphology-');
}
