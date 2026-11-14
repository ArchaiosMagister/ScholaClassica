// Solo Griego I consulta la versión corregida, sin afectar a Griego II ni Latín.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
function once(s,before,after,label){
 assert.equal(s.split(before).length,2,'Cambió el cargador integrado: '+label);
 return s.replace(before,after);
}
export function adaptGreek1App(source,locale){
 assert.ok(locale==='es'||locale==='val');
 const asset=locale==='es'?'assets/curriculum-griego1.json':
  'curriculum-griego1.json';
 const ordinary=locale==='es'?'assets/curriculum.json?v=20261110-final1':
  'curriculum.json?v=20261110-final1';
 source=once(source,
  'let curriculum,curriculumLatin4,curriculumLatin1,visibleSearch=[],requestId=0;',
  'let curriculum,curriculumLatin4,curriculumLatin1,curriculumGreek1,visibleSearch=[],requestId=0;',
  'caché de Griego I');
 source=once(source,
  "  else curriculum??=await loadJSON('"+ordinary+"');",
  "  else if(selection.year==='1'&&selection.language==='griego')"+
   "curriculumGreek1??=await loadJSON('"+asset+"');\n"+
   "  else curriculum??=await loadJSON('"+ordinary+"');",
  'selección de fuente del curso');
 const before="  const currentUnits=selection.year==='4'?curriculumLatin4.latin.units:"+
  "selection.year==='1'&&selection.language==='latin'?curriculumLatin1.latin.units:"+
  "curriculum[selection.language].units;";
 const after="  const currentUnits=selection.year==='4'?curriculumLatin4.latin.units:"+
  "selection.year==='1'&&selection.language==='latin'?curriculumLatin1.latin.units:"+
  "selection.year==='1'&&selection.language==='griego'?curriculumGreek1.griego.units:"+
  "curriculum[selection.language].units;";
 return once(source,before,after,'lista de unidades para Griego I');
}
export async function adaptAppendixGreek1UI(destination){
 for(const [locale,folder,file] of [
  ['es','','assets/app.js'],['val','val','app.js']
 ]){
  const path=join(destination,folder,file);
  await writeFile(path,adaptGreek1App(await readFile(path,'utf8'),locale));
 }
}
