import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { RULES } from '../src/rules.mjs';
import { chars, validationErrors, requiredRules, availableWords, checkResult, checkAllChanges, newCardState, optionRuleIds } from '../src/engine.mjs';
const read=path=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url),'utf8'));
const root=read('data/pilot.json');
const manifest=read('data/batches/2026-11-12-100-tercero.json');
const old=root.words.slice(0,manifest.previousCount);
const added=root.words.slice(manifest.previousCount,manifest.previousCount+manifest.newCount);
const byRow=row=>added.find(w=>w.id===`xl-${row}`);

const normalize=x=>x.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');

test('Lote III: 100 nuevas fichas y 252 acumuladas; anteriores preservadas salvo grafía u/v',()=>{
 assert.equal(manifest.previousCount,152);
 assert.equal(manifest.newCount,100);
 assert.ok(root.words.length>=manifest.totalCount);
 assert.equal(added.length,100);
 assert.deepEqual(added.map(w=>w.id),manifest.ids);
 assert.deepEqual(added.map(w=>w.source.row),manifest.rows);
 // Snapshot actualizado tras la grafía docente u/v; el manifiesto histórico se conserva.
 assert.equal(createHash('sha256').update(JSON.stringify(old)).digest('hex'),'896ba8a9a244ae4d9657742e714c2b490d1eca1a29284c08bde2ed288318a828');
 assert.equal(new Set(root.words.map(w=>w.id)).size,root.words.length);
 assert.equal(new Set(root.words.map(w=>normalize(w.latin))).size,root.words.length);
 assert.deepEqual(validationErrors(root),[]);
});

test('Procedencia, lotes de origen y exclusión de cultismos discutidos',()=>{
 const lots=new Map();
 for(const w of added){
  assert.equal(w.source.file,'banco_evolucion_fonetica_con_filtro_didactico.xlsx');
  assert.equal(w.source.sheet,'Banco');
  assert.equal(w.source.classification,'PATRIMONIAL');
  assert.equal(w.status,'reviewed-pilot');
  assert.ok(w.explanation && w.changes.length && w.answers.length);
  lots.set(w.source.lot,(lots.get(w.source.lot)||0)+1);
 }
 assert.deepEqual(Object.fromEntries([...lots].map(([x,y])=>[x,y])),manifest.bySourceLot);
 assert.ok(!added.some(w=>['miraculum','spiritum','plumbum','maxillam','lyram','chordam','chŏrdam'].includes(w.latin)));
});

test('Variedad real de normas y subtipos con prioridad en palatalización',()=>{
 const ids=new Set(added.flatMap(requiredRules));
 assert.ok(ids.size>=12,'La selección no debe limitarse a dos o tres normas');
 assert.ok(ids.has('PALAT') && ids.has('SIMPL') && ids.has('CUL') && ids.has('MIN_MBR') && ids.has('DISIMIL'));
 assert.ok(added.filter(w=>requiredRules(w).includes('PALAT')).length>=35);
 const subtypes=new Set(added.flatMap(w=>w.changes.filter(t=>t.rule==='PALAT').map(t=>t.subtype)));
 for(const subtype of ['-mn- > -ñ-','-nn- > -ñ-','-gn- > -ñ-','pl- > ll-','-di- + vocal > -y-','-ni- + vocal > -ñ-','-ti- + vocal > -ci-','-ct- > -ch-','-x- > -j-','-li- + vocal > -j-'])assert.ok(subtypes.has(subtype),subtype);
 assert.equal(RULES.length,20);
 assert.ok(RULES.every(r=>root.words.some(w=>requiredRules(w).includes(r.id))));
});

test('En -um se exigen abertura y pérdida fija por separado',()=>{
 for(const w of added){
  const letters=chars(w.latin),length=letters.length;
  const m=w.changes.filter(t=>t.rule==='FIX_M');
  assert.equal(m.length,letters.at(-1)?.toLowerCase()==='m'?1:0,w.latin);
  if(m.length)assert.equal(optionRuleIds(w,new Set(RULES.map(r=>r.id)))[0],'FIX_M',w.latin);
  if(w.latin.endsWith('um')){
   assert.ok(w.changes.some(t=>t.rule==='ABER'&&t.output==='o'&&t.spans.some(([a,b])=>a===length-2&&b===length-1)),w.latin);
   assert.ok(m.length,w.latin);
  }
 }
 assert.deepEqual(byRow(33).changes.find(t=>t.note==='La u postónica se abre en o.').spans,[[3,4]]);
});

test('Todos los filtros respetan las normas estudiadas, incluso sin ninguna',()=>{
 const all=new Set(RULES.map(r=>r.id));
 assert.equal(availableWords(root.words,all).length,root.words.length);
 assert.equal(availableWords(root.words,new Set()).length,0);
 for(const w of added){
  const need=requiredRules(w);
  assert.ok(need.length);
  assert.equal(availableWords([w],new Set(need)).length,1,w.id);
  for(const r of need){const reduced=new Set(need);reduced.delete(r);assert.equal(availableWords([w],reduced).length,0,`${w.id}, falta ${r}`);}
 }
});

test('Las 100 tarjetas se resuelven con Comprobar todo en guiado y a ciegas',()=>{
 for(const w of added){
  for(const guided of [true,false]){
   const state=newCardState(w);
   assert.equal(checkAllChanges(state,w.changes).complete,false);
   assert.equal(checkResult(state,'RESPUESTA INCORRECTA'),false);
   assert.equal(state.phase,1);
   assert.equal(checkResult(state,w.answers[0]),true,w.latin);
   const guesses=w.changes.map(t=>({...t,...(guided?{targetId:t.id}:{})}));
   const verdict=checkAllChanges(state,guesses);
   assert.equal(verdict.complete,true,`${w.id} guided=${guided}: ${verdict.message}`);
   assert.equal(state.phase,3);
  }
 }
});

test('Tramos no contiguos, solapamientos, grupos y puntos de inserción',()=>{
 const mn=byRow(97).changes.find(t=>t.rule==='PALAT');
 assert.equal(mn.spans.length,2); // m y n separadas por la ĭ que desaparece
 assert.deepEqual(byRow(239).changes.find(t=>t.rule==='PALAT').spans,[[0,2]]); // pl-
 assert.deepEqual(byRow(855).changes.find(t=>t.rule==='PALAT').spans,[[3,5]]); // -ni-
 assert.equal(byRow(1040).changes.find(t=>t.rule==='CUL').subtype,'-CUL- > -J-');
 const cell=byRow(1039).changes;
 assert.ok(cell.some(t=>t.rule==='CUL')&&cell.some(t=>t.rule==='SINC'));
 assert.ok(cell.find(t=>t.rule==='CUL').spans[0][0]<=cell.find(t=>t.rule==='SINC').spans[0][0]);
 assert.equal(byRow(301).changes.find(t=>t.rule==='PROT').anchor,0);
 assert.equal(byRow(608).changes.find(t=>t.rule==='DISIMIL').spans.length,2);
});

test('La documentación de las grafías griegas nunca convierte cultismos en patrimoniales',()=>{
 assert.ok(!added.some(w=>w.changes.some(t=>t.rule==='GRIE')));
 assert.ok(root.words.some(w=>w.changes.some(t=>t.rule==='GRIE')),'La categoría permanece disponible con ejemplos anteriores');
});
