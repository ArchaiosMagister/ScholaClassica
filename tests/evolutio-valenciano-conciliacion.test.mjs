import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {assembleEvolutioValenciano,auditEvolutioValenciano} from '../scripts/reconcile-evolutio-valenciano.mjs';

const root=resolve(import.meta.dirname,'..');
const read=path=>JSON.parse(readFileSync(join(root,path),'utf8'));
const base='shared/academic/evolutio-valenciano/';
const lock=read('config/sources.lock.json');
const norms=read(base+'normas.json');
const curation=read(base+'conciliacion-curada.json');
const matrix=read(base+'matriz-522.json');
const source=resolve(process.env.EVOLUTIO_SOURCE||join(root,'.sources/evolutio'));
const bank=JSON.parse(readFileSync(join(source,'data/pilot.json'),'utf8'));
const record=latin=>matrix.records.find(w=>w.latin===latin);

test('La matriz recoge exactamente el banco bloqueado por SHA, y no inventa entradas',()=>{
 const sha=execFileSync('git',['-C',source,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
 assert.equal(sha,lock.sources.evolutio.sha);
 assert.equal(matrix.origin.sha,sha);
 assert.equal(matrix.origin.wordCount,522);
 assert.equal(matrix.records.length,522);
 assert.deepEqual(matrix.records.map(r=>r.id),bank.words.map(w=>w.id));
 assert.deepEqual(matrix.records.map(r=>r.latin),bank.words.map(w=>w.latin));
 assert.deepEqual(matrix.records.map(r=>r.castellano),bank.words.map(w=>w.answers));
 assert.equal(new Set(matrix.records.map(r=>r.id)).size,522);
 assert.equal(new Set(matrix.records.map(r=>r.latin)).size,522);
});
test('La conciliación completa es reproducible y está bloqueada contra cambios imprevistos',()=>{
 const recreated=assembleEvolutioValenciano(bank,curation,norms,lock.sources.evolutio.sha);
 assert.deepEqual(recreated,matrix);
 assert.deepEqual(auditEvolutioValenciano(matrix,bank,curation,norms,lock.sources.evolutio.sha),[]);
});
test('Las 17 normas valencianas coinciden exactamente con el repertorio docente',()=>{
 const expected=[
  'AFÈRESI','APÒCOPE','ASSIMILACIÓ','CONSONANTITZACIÓ','DIFTONGACIÓ',
  'DISSIMILACIÓ','EPÈNTESI','EVOLUCIÓ DE GRAFIES GREGUES','METÀTESI',
  'MONOFTONGACIÓ','OBERTURA','PALATALITZACIÓ','PRÒTESI','SIMPLIFICACIÓ',
  'SÍNCOPE','SONORITZACIÓ','VOCALITZACIÓ'
 ];
 assert.deepEqual(norms.selectable.map(r=>r.name),expected);
 assert.equal(new Set(norms.selectable.map(r=>r.id)).size,17);
 assert.equal(norms.fixed.id,'FIX_M');
 assert.equal(norms.fixed.selectable,false);
 assert.ok(norms.spanishSpecialNotTransferable.some(r=>r.id==='ASPIR'));
 assert.ok(norms.spanishSpecialNotTransferable.some(r=>r.id==='MIN_MBR'));
 assert.ok(norms.spanishSpecialNotTransferable.some(r=>r.id==='CUL'));
});
test('Estados editoriales honestos: 26 documentados léxicamente, 215 propuestas, 281 sin propuesta',()=>{
 assert.deepEqual(matrix.summary,{total:522,lexicoDocumentado:26,propuestas:215,
  sinPropuesta:281,normasVerificadas:0,aptasParaPractica:0});
 for(const r of matrix.records){
  assert.ok(['documentat','proposta','pendent'].includes(r.valenciano.estadoLexico));
  assert.equal(r.valenciano.estadoNormas,'pendent');
  assert.equal(r.valenciano.normas,null);
  assert.equal(r.valenciano.explicacion,null);
  assert.equal(r.valenciano.dificultad,null);
  assert.equal(r.valenciano.aprobadoDocente,false);
  assert.equal(r.valenciano.aptoParaPractica,false);
  if(r.valenciano.estadoLexico==='documentat'){
   assert.equal(r.valenciano.evidencia.length,1);
   assert.match(r.valenciano.evidencia[0].url,/^https:\/\/dcvb\.iec\.cat\/results\.asp\?word=/);
  }else{
   assert.deepEqual(r.valenciano.evidencia,[]);
  }
  if(r.valenciano.estadoLexico==='pendent')assert.equal(r.valenciano.resultado,null);
  else assert.ok(r.valenciano.resultado);
 }
});
test('Casos filológicos documentados y cautela con dobletes y base vulgar',()=>{
 for(const [latin,spanish,valencian] of [
  ['uitam','vida','vida'],['focum','fuego','foc'],['noctem','noche','nit'],
  ['clauem','llave','clau'],['lupum','lobo','llop'],
  ['filium','hijo','fill'],['matrem','madre','mare'],['pŏrtam','puerta','porta'],
  ['tĕrram','tierra','terra'],['caballum','caballo','cavall']
 ]){
  const r=record(latin);
  assert.ok(r,latin);
  assert.equal(r.castellano[0],spanish);
  assert.equal(r.valenciano.resultado,valencian);
  assert.equal(r.valenciano.estadoLexico,'documentat');
  assert.equal(r.valenciano.aptoParaPractica,false);
 }
 assert.match(record('clauem').valenciano.notas,/llave/);
 assert.equal(record('pluuiam').valenciano.estadoLexico,'proposta');
 assert.match(record('pluuiam').valenciano.notas,/plŏia/);
});
test('Propuestas sin fuente no se promueven a verificadas',()=>{
 const clone=structuredClone(curation);
 clone.proposals[0].lexicalStatus='documentat';
 assert.throws(()=>assembleEvolutioValenciano(bank,clone,norms,lock.sources.evolutio.sha),/Documentación incompleta/);
 const dup=structuredClone(curation);
 dup.proposals.push({...dup.proposals[0]});
 assert.throws(()=>assembleEvolutioValenciano(bank,dup,norms,lock.sources.evolutio.sha),/Dos propuestas/);
 const extraneous=structuredClone(curation);
 extraneous.proposals.push({latin:'ficticium',form:'fictici',lexicalStatus:'proposta',reference:null});
 assert.throws(()=>assembleEvolutioValenciano(bank,extraneous,norms,lock.sources.evolutio.sha),/sin étimo/);
});
test('La matriz de trabajo no se publica ni sustituye los recursos originales',()=>{
 const dist=join(root,'dist');
 assert.equal(existsSync(join(dist,'apps/evolucion-fonetica/data/matriz-522.json')),false);
 assert.equal(existsSync(join(dist,'shared/academic/evolutio-valenciano/matriz-522.json')),false);
 assert.equal(existsSync(join(dist,'apps/evolucion-fonetica/data/valenciano.json')),false);
 const built=JSON.parse(readFileSync(join(dist,'apps/evolucion-fonetica/data/pilot.json'),'utf8'));
 assert.deepEqual(built,bank);
});
