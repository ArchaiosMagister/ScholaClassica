// Después del adaptador de 4.º, habilita el currículo derivado de Latín I.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
function once(s,before,after,label){
 assert.equal(s.split(before).length,2,'Cambió el cargador de Appendix: '+label);
 return s.replace(before,after);
}
export function adaptLatin1App(source,locale){
 assert.ok(locale==='es'||locale==='val');
 const es=locale==='es';
 source=once(source,
  'let curriculum,curriculumLatin4,visibleSearch=[],requestId=0;',
  'let curriculum,curriculumLatin4,curriculumLatin1,visibleSearch=[],requestId=0;',
  'caché separada de Latín I');
 const asset=es?'assets/curriculum-latin1.json':'curriculum-latin1.json';
 const ordinary=es?'assets/curriculum.json?v=20261110-final1':
  'curriculum.json?v=20261110-final1';
 source=once(source,
  "  else curriculum??=await loadJSON('"+ordinary+"');",
  "  else if(selection.year==='1'&&selection.language==='latin')"+
   "curriculumLatin1??=await loadJSON('"+asset+"');\n"+
  "  else curriculum??=await loadJSON('"+ordinary+"');",
  'carga por curso');
 source=once(source,
  "  const currentUnits=selection.year==='4'?curriculumLatin4.latin.units:curriculum[selection.language].units;",
  "  const currentUnits=selection.year==='4'?curriculumLatin4.latin.units:"+
   "selection.year==='1'&&selection.language==='latin'?curriculumLatin1.latin.units:"+
   "curriculum[selection.language].units;",
  'selección de unidades sin alterar Griego I');
 return source;
}
export async function adaptAppendixLatin1UI(destination){
 for(const [locale,folder,file] of [
  ['es','','assets/app.js'],['val','val','app.js']
 ]){
  const path=join(destination,folder,file);
  await writeFile(path,adaptLatin1App(await readFile(path,'utf8'),locale));
 }
}
