import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const read=p=>readFileSync(join(root,p),'utf8');
const original=read('vendor/vocabula/app.js');
const integrated=read('dist/apps/vocabulario/app.js');
const originalHTML=read('vendor/vocabula/index.html');
const integratedHTML=read('dist/apps/vocabulario/index.html');
const bankFrom=path=>JSON.parse(read(path).replace(/^window\.VOCAB\s*=\s*/,'').replace(/;\s*$/,''));
const older=bankFrom('vendor/vocabula/data.js');
const newer=bankFrom('dist/apps/vocabulario/data.js');

test('Los 2055 identificadores originales siguen aceptándose en la app integrada',()=>{
 assert.equal(older.length,2055);
 assert.equal(newer.length,2055);
 const idsOld=older.map(entry=>entry.id).sort(),idsNew=newer.map(entry=>entry.id).sort();
 assert.equal(new Set(idsOld).size,2055,'IDs antiguos duplicados');
 assert.equal(new Set(idsNew).size,2055,'IDs integrados duplicados');
 assert.deepEqual(idsNew,idsOld,'No deben cambiar ni eliminarse IDs que aparezcan en un JSON exportado');
});
test('Exportación e importación de progreso v1 permanecen exactamente compatibles',()=>{
 const line=(source,prefix)=>source.split('\n').find(x=>x.startsWith(prefix));
 for(const control of ["$('export').onclick=","$('import').onchange="]){
  const before=line(original,control),after=line(integrated,control);
  assert.ok(before&&after,'Falta controlador de '+control);
  assert.equal(after,before,'Cambió el formato del archivo de '+control);
 }
 for(const source of [original,integrated]){
  assert.match(source,/localStorage\.getItem\('classics-progress-v1'\)/);
  assert.match(source,/localStorage\.setItem\('classics-progress-v1',JSON\.stringify\(progress\)\)/);
  assert.match(source,/JSON\.stringify\(\{version:1,progress\}\)/);
  assert.match(source,/parsed\.version!==1/);
  assert.match(source,/progress=\{\.\.\.progress,\.\.\.parsed\.progress\}/);
 }
});
test('La interfaz muestra importar y exportar en ambos módulos',()=>{
 for(const html of [originalHTML,integratedHTML]){
  assert.match(html,/id="export"/);
  assert.match(html,/id="import"/);
  assert.match(html,/accept="application\/json"/);
  assert.match(html,/>Exportar progreso</);
  assert.ok(html.includes('Importar progreso <input type="file"'),'Control de importación ausente');
 }
});
