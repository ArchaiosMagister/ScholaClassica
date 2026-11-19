import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {RULES,FIXED_RULE} from '../src/rules.mjs';
import {chars,validationErrors,availableWords,availableFocusedWords,assessedChanges,requiredRules,newCardState,checkResult,checkAllChanges,coverage} from '../src/engine.mjs';
import {studyWordsForRule,studyHighlight,findStudyWords} from '../src/study.mjs';
const get=path=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url),'utf8'));
const db=get('data/pilot.json');
const manifest=get('data/batches/2026-11-12-normas-escasas.json');
const existing=db.words.slice(0,manifest.previousCount);
const added=db.words.slice(manifest.previousCount,manifest.totalCount);
const byRow=id=>added.find(w=>w.id===`xl-${id}`);
const normalize=x=>x.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const guess=t=>({id:t.id,rule:t.rule,spans:t.spans,anchor:t.anchor,targetId:t.id});

test('Lote de escasas: exactamente 30 entradas nuevas y 282 en total, 252 anteriores conservadas salvo grafía u/v',()=>{
 assert.equal(manifest.previousCount,252);assert.equal(manifest.newCount,30);
 assert.equal(manifest.totalCount,282);assert.ok(db.words.length>=282);
 // El manifiesto preserva la suma antigua; snapshot didáctico tras u/v.
 assert.equal(hash(existing),'850eddc881e74a46367b582941a0e78817b77734ad63a36399000af798233cf5');
 assert.deepEqual(added.map(w=>w.id),manifest.ids);
 assert.deepEqual(added.map(w=>w.source.row),manifest.rows);
 assert.equal(new Set(db.words.map(w=>w.id)).size,db.words.length);
 assert.equal(new Set(db.words.map(w=>normalize(w.latin))).size,db.words.length);
 assert.deepEqual(validationErrors(db),[]);
});

test('Todo el lote procede de filas patrimoniales docentes con nota y trazabilidad individual',()=>{
 for(const w of added){
  assert.equal(w.source.file,'banco_evolucion_fonetica_con_filtro_didactico.xlsx');
  assert.equal(w.source.sheet,'Banco');assert.equal(w.source.classification,'PATRIMONIAL');
  assert.ok(Number.isInteger(w.source.row)&&w.source.row>1);
  assert.ok(w.source.lot>=1&&w.source.lot<=10);
  assert.equal(w.status,'reviewed-pilot');assert.ok(w.explanation?.length>15);
  for(const change of w.changes){
   assert.ok(change.note.length>=24);
   assert.ok(change.spans.length>0||Number.isInteger(change.anchor));
  }
 }
 assert.ok(!added.some(w=>w.id==='xl-559'), 'chordam duplicada no debe incorporarse');
 assert.ok(!added.some(w=>w.source.classification!=='PATRIMONIAL'));
});

test('Prioridad real en normas poco frecuentes y sin falsos incrementos de las agotadas',()=>{
 const old=coverage(existing),now=coverage(db.words.slice(0,manifest.totalCount));
 assert.equal(RULES.length,20);
 for(const id of ['EPENT','VOC','GRIE','CONS','MIN_MBR','METAT','CUL','SIMPL'])
  assert.ok(now[id]>old[id],`No ha mejorado ${id}`);
 for(const id of ['AFER','ASMIL','DISIMIL'])
  assert.equal(now[id],old[id],`No se puede inventar un ejemplo de ${id}`);
 assert.equal(now['EPENT'],3);assert.equal(now['VOC'],3);
 assert.equal(now['GRIE'],6);assert.equal(now['CONS'],7);
 assert.equal(now['MIN_MBR'],10);assert.equal(now['METAT'],13);
 assert.equal(now['CUL'],19);
 const count=Object.fromEntries(Object.keys(now).map(k=>[k,now[k]-old[k]]));
 assert.deepEqual(count,{
  ABER:7,AFER:0,APOC:11,ASMIL:0,ASPIR:4,CONS:2,DIPT:1,DISIMIL:0,
  EPENT:1,GRIE:1,METAT:7,MONOP:5,PALAT:5,PROT:0,SIMPL:6,SINC:7,SONOR:6,VOC:1,MIN_MBR:4,CUL:4
 });
});

test('Todas las normas exigibles participan en el filtro estricto y el focal sigue evaluando solo la elegida',()=>{
 const all=new Set(RULES.map(x=>x.id));
 assert.equal(availableWords(db.words.slice(0,manifest.totalCount),all).length,282);
 for(const w of added){
  const ids=requiredRules(w);assert.ok(ids.length>0);
  assert.equal(availableWords([w],new Set(ids)).length,1,w.latin);
  for(const id of ids){
   const other=new Set(ids);other.delete(id);
   assert.equal(availableWords([w],other).length,0,`${w.latin} con ${id} excluida`);
   assert.deepEqual(assessedChanges(w,id),w.changes.filter(t=>t.rule===id));
   assert.equal(availableFocusedWords([w],id).length,1);
  }
  assert.deepEqual(assessedChanges(w,'FIX_M'),[]);
 }
});

test('Las 30 tarjetas se resuelven con comprobación conjunta y sólo después del resultado',()=>{
 for(const w of added)for(const guided of [true,false]){
  const s=newCardState(w);const answers=w.changes.map(t=>guided?guess(t):({id:t.id,rule:t.rule,spans:t.spans,anchor:t.anchor}));
  assert.equal(checkAllChanges(s,answers).complete,false);
  assert.equal(checkResult(s,w.answers[0]),true,w.latin);
  assert.equal(checkAllChanges(s,answers).complete,true,w.latin);
  assert.equal(s.phase,3);
 }
 for(const w of added)for(const id of requiredRules(w)){
  const s=newCardState(w,id);checkResult(s,w.answers[0]);
  assert.equal(checkAllChanges(s,assessedChanges(w,id).map(guess)).complete,true,w.latin+'/'+id);
 }
});

test('La -m del acusativo y la abertura final de -um se anotan por separado, sin falsas apócopes',()=>{
 for(const w of added){
  const len=chars(w.latin).length;
  const fixed=w.changes.filter(t=>t.rule===FIXED_RULE.id);
  assert.equal(fixed.length,w.latin.endsWith('m')?1:0,w.latin);
  if(w.latin.endsWith('m'))assert.deepEqual(fixed[0].spans,[[len-1,len]]);
  if(w.latin.endsWith('um')){
   assert.ok(w.changes.some(t=>t.rule==='ABER'&&t.output==='o'&&t.spans.some(([a,b])=>a===len-2&&b===len-1)),w.latin);
  }
  for(const t of w.changes.filter(t=>t.rule==='APOC')){
   assert.equal(t.spans.length,1,w.latin);
   assert.equal(t.spans[0][1],w.latin.endsWith('m')?len-1:len,`${w.latin}: la apócope debe apuntar al sonido final tras la caída de -m`);
  }
 }
});

test('Ejemplos críticos: epéntesis con anclaje, vocalización, -MIN-, -CUL- y cambios discontinuos',()=>{
 const hojaldre=byRow(611),coz=byRow(1027),hambre=byRow(1031),periglo=byRow(234),tio=byRow(711);
 assert.ok(hojaldre&&coz&&hambre&&periglo&&tio);
 assert.equal(hojaldre.changes.find(x=>x.rule==='EPENT').anchor,6);
 assert.deepEqual(hojaldre.changes.find(x=>x.rule==='SINC').spans,[[6,7]]);
 assert.equal(hojaldre.changes.find(x=>x.rule==='METAT').spans.length,2);
 assert.deepEqual(coz.changes.find(x=>x.rule==='VOC').spans,[[1,3]]);
 assert.deepEqual(hambre.changes.find(x=>x.rule==='MIN_MBR').spans,[[2,5]]);
 assert.equal(periglo.changes.find(x=>x.rule==='CUL').subtype,'-CUL- > -G-');
 assert.equal(tio.changes.find(x=>x.rule==='GRIE').output,'t');
 assert.ok(findStudyWords(db.words,'coz').some(w=>w.id===coz.id));
 assert.equal(studyHighlight(hojaldre,hojaldre.changes.find(t=>t.rule==='EPENT')).anchor,6);
});

test('Cada norma mejorada aparece automáticamente en Estudiar y en el repaso focalizado',()=>{
 for(const rule of RULES){
  assert.equal(studyWordsForRule(db.words,rule.id).length,availableFocusedWords(db.words,rule.id).length);
 }
 for(const w of added){
  assert.ok(findStudyWords(db.words,w.latin).some(x=>x.id===w.id));
  assert.ok(findStudyWords(db.words,w.answers[0]).some(x=>x.id===w.id));
 }
});
