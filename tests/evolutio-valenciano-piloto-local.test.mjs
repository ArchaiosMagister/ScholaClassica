import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat,mkdtemp,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {runInNewContext} from 'node:vm';
import {createValencianPilotData,renderValencianPilotHtml,buildValencianPilot} from '../scripts/build-evolutio-va-preview.mjs';

const root=resolve(import.meta.dirname,'..');
const dir=join(root,'shared/academic/evolutio-valenciano');
const read=async(path)=>JSON.parse(await readFile(path,'utf8'));
const inputs=async()=>Promise.all([
 read(join(dir,'matriz-522.json')),
 read(join(dir,'decisio-pilot-escolar-7-2026-11-18.json')),
 read(join(dir,'normas.json'))
]);
const getEngine=async()=>runInNewContext(
 (await readFile(join(root,'preview/evolutio-valenciano/engine.js'),'utf8'))+'\nEvolutioVaPilotEngine;',
 {Math,Set,String,Error});

test('Siete IDs, nueve reglas, GNV sin suplantar DNV ni añadir fichas reservadas',async()=>{
 const [matrix,decision,rules]=await inputs();
 const data=createValencianPilotData(matrix,decision,rules);
 assert.equal(data.schema,'schola-evolutio-va-offline-local-pilot/v1');
 assert.equal(data.words.length,7);
 assert.deepEqual(new Set(data.words.map(x=>x.id)),new Set([
  'ge-EVF-0338','xl-354','xl-52','xl-26','xl-587','xl-82','xl-567']));
 assert.deepEqual(new Set(data.rules.map(r=>r.id)),new Set(['SONOR','ABER','SIMPL','MONOP','APOC']));
 assert.equal(data.words.reduce((n,x)=>n+x.changes.length,0),9);
 assert.equal(data.limitations.dnvEntriesIndividuallyChecked,0);
 assert.equal(data.limitations.studentReleaseApproved,false);
 assert.equal(data.limitations.noPersistentProgress,true);
 const banned=['matrem','cælum','noctem','tĕrram','pŏrtam','farinam','octo','dictum','sigĭllum'];
 assert.ok(data.words.every(x=>!banned.includes(x.latin)));
 assert.ok(data.words.every(x=>x.changes.every(c=>c.rule!=='FIX_M')));
 assert.ok(data.words.every(x=>Object.keys(x).sort().join(',')==='answer,changes,id,latin'));
 assert.ok(data.words.every(x=>Object.keys(x.changes[0]).sort().join(',')==='fragment,id,rule,span'));
 assert.equal(matrix.summary.aptasParaPractica,0);
 assert.equal(matrix.records.length,522);
});

test('Motor aislado: respuesta patrimonial, normas por fragmento y tres intentos',async()=>{
 const data=createValencianPilotData(...await inputs());
 const e=await getEngine();
 assert.equal(e.validate(data),true);
 assert.equal(e.normalize('  ViDA  '),'vida');
 const deck=e.shuffle(data.words,7,()=>0.999999);
 assert.deepEqual(deck.map(x=>x.id),data.words.map(x=>x.id));
 assert.equal(new Set(deck.map(x=>x.id)).size,7);
 const first=e.card(data.words.find(x=>x.latin==='uitam'));
 assert.equal(first.phase,'result');
 assert.equal(e.answer(first,'vida').status,'correct');
 assert.equal(first.phase,'rules');
 assert.equal(e.checkRules(first,['SONOR']).status,'correct');
 assert.equal(first.phase,'solved');
 assert.equal(first.correct,true);
 const mouth=e.card(data.words.find(x=>x.latin==='buccam'));
 assert.equal(e.answer(mouth,'BOCA').status,'correct');
 assert.equal(e.checkRules(mouth,['SIMPL','ABER']).status,'incorrect');
 assert.equal(mouth.ruleAttempts,1);
 assert.equal(e.checkRules(mouth,['ABER','SIMPL']).status,'correct');
 assert.equal(mouth.correct,true);
 const crown=e.card(data.words.find(x=>x.latin==='aucam'));
 assert.equal(e.answer(crown,'equivocada').status,'incorrect');
 assert.equal(e.answer(crown,'equivocada').status,'incorrect');
 assert.equal(e.answer(crown,'equivocada').status,'revealed');
 assert.equal(crown.phase,'revealed');
 assert.equal(crown.correct,false);
 assert.equal(e.answer(crown,'oca').status,'invalid');
 const bad=e.card(data.words.find(x=>x.latin==='cuppam'));
 assert.equal(e.answer(bad,'copa').status,'correct');
 assert.equal(e.checkRules(bad,['ABER','SIMPL']).status,'correct');
 assert.equal(e.reveal(bad),false);
 const focus=e.fragments('buccam',[2,4]);
 assert.equal([...focus].join(''),'buccam');
});

test('HTML autosuficiente: sin conexión, sin almacenamiento, fuera de dist, sin informes docentes',async()=>{
 const [matrix,decision,rules]=await inputs();
 const data=createValencianPilotData(matrix,decision,rules);
 const location=join(root,'preview/evolutio-valenciano');
 const [template,css,engine,app]=await Promise.all([
  readFile(join(location,'index.template.html'),'utf8'),
  readFile(join(location,'style.css'),'utf8'),
  readFile(join(location,'engine.js'),'utf8'),
  readFile(join(location,'app.js'),'utf8')
 ]);
 const html=renderValencianPilotHtml(template,css,engine,app,data);
 assert.match(html,/<html lang="ca-ES">/);
 assert.match(html,/EVOLVTIO/);
 assert.match(html,/EvolutioVaPilotEngine/);
 assert.match(html,/catenam/);
 assert.match(html,/sense progrés desat/);
 assert.ok(!html.includes('localStorage')&&!html.includes('serviceWorker.register'));
 assert.ok(!html.includes('matrem')&&!html.includes('cælum')&&!html.includes('noctem'));
 assert.ok(!html.includes('dcvb.iec.cat')&&!html.includes('publicacions.iec.cat'));
 assert.ok(!html.includes('matriz-522')&&!html.includes('reconciliacio-pr45'));
 assert.ok(!html.includes('src=')&&!html.includes('href='));
 assert.throws(()=>createValencianPilotData(
  {...matrix,summary:{...matrix.summary,aptasParaPractica:1}},decision,rules));
 assert.throws(()=>createValencianPilotData(matrix,
  {...decision,normativeGate:{...decision.normativeGate,currentDnvIndividualChecks:1}},rules));
 const temp=await mkdtemp(join(tmpdir(),'schola-va-'));
 try{
  const target=join(temp,'index.html');
  const output=await buildValencianPilot(root,target);
  assert.equal(output.words,7);assert.ok(output.bytes>5000);
  assert.equal((await stat(target)).isFile(),true);
  assert.equal(await readFile(target,'utf8'),html);
 }finally{await rm(temp,{recursive:true,force:true});}
});
