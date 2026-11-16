import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {compilePais} from '../scripts/nominal-pais.mjs';
import {greekNounPhrasePairs,makeGreekNounPhraseTables}
 from '../public/morfologia/greek-noun-phrases.mjs';
import {makeWrittenQuestions,makeTableExercises,evaluateTable,correctWritten}
 from '../public/morfologia/written.mjs';
import {availableRecords} from '../public/morfologia/engine.mjs';
const root=resolve(import.meta.dirname,'..');
const read=f=>readFileSync(join(root,f),'utf8');
const bank=JSON.parse(read('dist/apps/morfologia/data/paradigmas.json'));
const manifest=JSON.parse(read('config/nominal-teacher-decisions.json'));
const parts=Array.from({length:8},(_,i)=>JSON.parse(read('.sources/vocabula/data/unimorph-syllabus/grc/part-0'+i+'.json')));
const lock=JSON.parse(read('config/sources.lock.json'));
const source=read('.sources/vocabula/data.js');
const recompile=()=>compilePais({vocabulaData:source,unimorphParts:parts,
 vocabulaSha:lock.sources.vocabula.sha,decisions:manifest});
const entry=bank.records.find(x=>x.id==='griego-sustantivo-decision-pais');
test('παῖς se importa sin dual, con diez casillas exactas y los ID anteriores inmutables',()=>{
 assert.ok(entry);
 assert.deepEqual(entry,recompile());
 assert.equal(bank.records.at(-1).id,entry.id,'No desplazar registros históricos');
 assert.equal(entry.unit,8);
 assert.equal(entry.gender,'común');
 assert.deepEqual(entry.agreementGenders,['masculino','femenino']);
 assert.equal(entry.forms.length,10);
 assert.equal(new Set(entry.forms.map(x=>x.analysis)).size,10);
 const get=(c,n)=>entry.forms.find(x=>x.case===c&&x.number===n).form;
 assert.equal(get('nominativo','singular'),'παῖς');
 assert.equal(get('vocativo','singular'),'παῖ');
 assert.equal(get('genitivo','singular'),'παιδός');
 assert.equal(get('dativo','singular'),'παιδί');
 assert.equal(get('nominativo','plural'),'παῖδες');
 assert.equal(get('dativo','plural'),'παισί');
 assert.ok(!entry.forms.some(x=>x.number==='dual'));
 assert.ok(!availableRecords(bank,{language:'griego',unit:7}).some(x=>x.id===entry.id));
});
test('Doble concordancia de παῖς sin duplicar su declinación',()=>{
 const pairs=greekNounPhrasePairs(bank,{language:'griego',unit:8})
  .filter(x=>x.noun.id===entry.id);
 assert.equal(pairs.length,6);
 assert.equal(new Set(pairs.map(p=>p.id)).size,6);
 for(const gender of ['masculino','femenino']){
  const gp=pairs.filter(x=>x.gender===gender);
  assert.equal(gp.length,3);
  assert.ok(gp.every(x=>x.id.endsWith(':'+gender)));
 }
 const sub={...bank,records:bank.records.filter(r=>[
  'griego-articulo','griego-adj-agathos','griego-adj-barbaros',
  'griego-adj-megas',entry.id].includes(r.id))};
 const tables=makeGreekNounPhraseTables(sub,{language:'griego',unit:8,limit:20,rng:()=>.4});
 assert.equal(tables.length,6);
 for(const table of tables){
  const noun=table.cells.find(x=>x.id==='nominativo:singular');
  assert.ok(noun.acceptedForms.every(x=>
   x.startsWith(table.gender==='masculino'?'ὁ ':'ἡ ')));
  assert.equal(evaluateTable(table,Object.fromEntries(table.cells.map(x=>[x.id,x.acceptedForms[0]]))).complete,true);
 }
 const written=makeWrittenQuestions({...bank,records:[entry]},{language:'griego',unit:8,limit:25,rng:()=>.2});
 assert.ok(written.length>=8);
 assert.ok(written.every(x=>correctWritten(x,x.acceptedForms[0]).correct));
 const tablesBare=makeTableExercises({...bank,records:[entry]},{language:'griego',unit:8,limit:10,rng:()=>.4});
 assert.equal(tablesBare.length,1,'No duplicar la declinación nominal por género');
});
test('Cambios de fuente se rechazan sin generar formas por analogía',()=>{
 const altered=structuredClone(parts);
 const r=altered.flat().find(x=>x[0]==='παῖς'&&x[2]==='N;DAT;PL');
 r[1]='Forma-No-Acreditada';
 assert.notDeepEqual(compilePais({vocabulaData:source,unimorphParts:altered,
  vocabulaSha:lock.sources.vocabula.sha,decisions:manifest}),entry);
 const malformed=structuredClone(parts);
 const p=malformed.find(x=>x.some(z=>z[0]==='παῖς'&&z[2]==='N;NOM;SG'));
 p.splice(p.findIndex(x=>x[0]==='παῖς'&&x[2]==='N;NOM;SG'),1);
 assert.throws(()=>compilePais({vocabulaData:source,unimorphParts:malformed,
  vocabulaSha:lock.sources.vocabula.sha,decisions:manifest}),/diez|UniMorph/i);
});
