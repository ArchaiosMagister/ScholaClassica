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
const revision=read(base+'revisio-80-2026-11-17.json');
const fourthQueue=read(base+'cola-revisio-18-2026-11-17.json');
const newQueue=read(base+'cola-revisio-19-2026-11-17.json');
const queue=read(base+'cola-revisio-24.json');
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
 const recreated=assembleEvolutioValenciano(bank,curation,norms,lock.sources.evolutio.sha,revision);
 assert.deepEqual(recreated,matrix);
 assert.deepEqual(auditEvolutioValenciano(matrix,bank,curation,norms,lock.sources.evolutio.sha,revision),[]);
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
test('Estados editoriales honestos: 80 documentados, 158 propuestas, 284 pendientes y 3 reservas españolas',()=>{
 assert.deepEqual(matrix.summary,{total:522,lexicoDocumentado:80,propuestas:158,
  sinPropuesta:284,reservasSoloCastellano:3,normasVerificadas:0,aptasParaPractica:0,
  analisisEditoriales:80,casosConDiscrepancia:0});
 for(const r of matrix.records){
  assert.ok(['documentat','proposta','pendent'].includes(r.valenciano.estadoLexico));
  if(r.valenciano.estadoLexico==='documentat'){
    assert.ok(['analisi_editorial_revisada','discrepancia_documentada'].includes(r.valenciano.estadoNormas));
    if(r.valenciano.estadoNormas==='analisi_editorial_revisada'){
      assert.ok(Array.isArray(r.valenciano.normas));
      assert.equal(r.valenciano.dnvIndividualChecked,false);
      assert.ok(r.valenciano.explicacion);
    }else{
      assert.equal(r.valenciano.normas,null);
      assert.equal(r.valenciano.explicacion,null);
    }
  }else{
    assert.equal(r.valenciano.estadoNormas,'pendent');
    assert.equal(r.valenciano.normas,null);
    assert.equal(r.valenciano.explicacion,null);
  }
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
  ['clauem','llave','clau'],['lupum','lobo','llop'],['cælum','cielo','cel'],
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
test('80 análisis editoriales revisados, cuatro decisiones docentes y cero análisis jugables',()=>{
 const good=matrix.records.filter(w=>w.valenciano.estadoNormas==='analisi_editorial_revisada');
 const disputed=matrix.records.filter(w=>w.valenciano.estadoNormas==='discrepancia_documentada');
 assert.equal(good.length,80);
 assert.equal(disputed.length,0);
 assert.deepEqual(revision.pending,[]);
 const allowed=new Set(norms.selectable.map(r=>r.id));
 for(const w of good){
  const letters=[...w.latin];
  for(const change of w.valenciano.normas){
   assert.ok(allowed.has(change.rule)||change.rule==='FIX_M');
   if(change.rule==='FIX_M')assert.equal(change.spans[0][0],letters.length-1);
   for(const [a,b] of change.spans)assert.ok(a>=0&&a<b&&b<=letters.length);
  }
 }
 assert.deepEqual(record('mel').valenciano.normas,[]);
 assert.ok(record('scalam').valenciano.normas.some(c=>c.rule==='PROT'&&c.anchor===0));
 assert.ok(record('clauem').valenciano.normas.some(c=>c.rule==='VOC'));
 assert.ok(record('lupum').valenciano.normas.some(c=>c.rule==='PALAT'));
 assert.ok(record('focum').valenciano.normas.some(c=>c.rule==='APOC'));
 assert.ok(good.every(w=>w.valenciano.aptoParaPractica===false));
 const rulesFor=latin=>record(latin).valenciano.normas.filter(x=>x.rule!=='FIX_M').map(x=>x.rule);
 assert.deepEqual(rulesFor('noctem'),['VOC','SIMPL']);
 assert.deepEqual(rulesFor('matrem'),['SIMPL']);
 assert.deepEqual(rulesFor('fabam'),[]);
 assert.deepEqual(rulesFor('caballum'),['PALAT','APOC']);
 assert.deepEqual(rulesFor('cælum'),['MONOP','PALAT']);
 assert.deepEqual(rulesFor('ocŭlum'),['SINC','PALAT']);
 assert.deepEqual(rulesFor('fĕrrum'),['ABER']);
 assert.deepEqual(rulesFor('scholam'),['PROT','GRIE']);
 assert.deepEqual(rulesFor('fŏntem'),['APOC']);
 assert.deepEqual(rulesFor('salutem'),['APOC']);
 assert.deepEqual(rulesFor('portum'),['APOC']);
 assert.match(record('noctem').valenciano.explicacion,/provisional/);
 assert.match(record('fabam').valenciano.explicacion,/no figura com a llei seleccionable/);
 assert.match(record('caballum').valenciano.explicacion,/no avaluable/);
 assert.match(record('ocŭlum').valenciano.explicacion,/ŏclu/);
});
test('Octo, dictum y sigillum permanecen sólo en castellano sin perder el historial histórico',()=>{
 const expected=['octo','dictum','sigĭllum'];
 assert.deepEqual(curation.reserved.map(x=>x.latin),expected);
 for(const latin of expected){
  const w=record(latin);
  assert.equal(w.valenciano.resultado,null);
  assert.equal(w.valenciano.estadoLexico,'pendent');
  assert.equal(w.valenciano.normas,null);
  assert.equal(w.valenciano.aptoParaPractica,false);
  assert.equal(w.valenciano.reserva.mode,'solo_castellano');
  assert.ok(!curation.proposals.some(p=>p.latin===latin));
  assert.ok(!curation.documented.some(p=>p.latin===latin));
 }
 assert.equal(record('sigĭllum').valenciano.reserva.historicalStudy,true);
 assert.match(record('sigĭllum').valenciano.notas,/reintroduït en la llengua culta/);
 const invalid=structuredClone(curation);
 invalid.proposals.push({latin:'octo',form:'huit',lexicalStatus:'proposta',reference:null});
 assert.throws(()=>assembleEvolutioValenciano(bank,invalid,norms,lock.sources.evolutio.sha,revision),
   /reserva solo castellana/);
 const broken=structuredClone(curation);
 broken.reserved[0].mode='auto';
 assert.throws(()=>assembleEvolutioValenciano(bank,broken,norms,lock.sources.evolutio.sha,revision),
   /Reserva docente inválida/);
});
test('Los seis étimos añadidos tienen fuente DCVB pero no autorización normativa ni práctica',()=>{
 for(const [latin,form] of [['cælum','cel'],['ocŭlum','ull'],
  ['scholam','escola'],['fŏntem','font'],['salutem','salut'],['portum','port']]){
  const w=record(latin);
  assert.equal(w.valenciano.resultado,form);
  assert.equal(w.valenciano.estadoLexico,'documentat');
  assert.equal(w.valenciano.estadoNormas,'analisi_editorial_revisada');
  assert.equal(w.valenciano.evidencia[0].authority,'DCVB');
  assert.equal(w.valenciano.dnvIndividualChecked,false);
  assert.equal(w.valenciano.aprobadoDocente,false);
  assert.equal(w.valenciano.aptoParaPractica,false);
 }
});
test('No se admiten posiciones erróneas ni aprobaciones ficticias de leyes',()=>{
 const bad=structuredClone(revision);
 const selected=bad.analyses.find(x=>x.latin==='lupum');
 selected.changes[0].find='p';
 assert.throws(()=>assembleEvolutioValenciano(bank,curation,norms,lock.sources.evolutio.sha,bad),/Segmento no coincide/);
 const invalid=structuredClone(revision);
 invalid.analyses[0].playable=true;
 assert.throws(()=>assembleEvolutioValenciano(bank,curation,norms,lock.sources.evolutio.sha,invalid),/marcada como practicable/);
});
test('La cola histórica de 24 propuestas conserva 18 documentadas y 6 reservadas, ninguna jugable',()=>{
 assert.equal(queue.schema,'schola-evolutio-va-review-queue/v1');
 assert.equal(queue.candidates.length,24);
 assert.equal(queue.totalProposals,188);
 assert.equal(queue.approvedForPractice,0);
 assert.equal(queue.verifiedByThisQueue,18);
 const proposalSet=new Set(curation.proposals.map(w=>w.latin));
 const documentedSet=new Set(curation.documented.map(w=>w.latin));
 const latinSet=new Set(queue.candidates.map(w=>w.latin));
 assert.equal(latinSet.size,24);
 assert.deepEqual(queue.candidates.map(w=>w.order),Array.from({length:24},(_,i)=>i+1));
 let verified=0,reserved=0;
 for(const item of queue.candidates){
  const word=record(item.latin);
  assert.ok(word,'La cola no puede contener fichas ajenas');
  assert.equal(item.approvedForPractice,false);
  assert.equal(item.ruleVerified,false);
  assert.equal(word.valenciano.aptoParaPractica,false);
  assert.ok(item.reviewScope&&item.plannedChecks.length===4);
  if(item.lexicalVerified){
   verified++;
   assert.ok(documentedSet.has(item.latin));
   assert.equal(item.sourceStatus,'documentat_dcvb_sense_dnv');
   assert.equal(item.reviewOutcome,'etimologia_i_acepcio_dcvb_contrastades');
   assert.equal(word.valenciano.estadoLexico,'documentat');
   assert.equal(word.valenciano.estadoNormas,'analisi_editorial_revisada');
   assert.equal(word.valenciano.dnvIndividualChecked,false);
   assert.equal(word.valenciano.evidencia[0].authority,'DCVB');
   assert.deepEqual(word.valenciano.evidencia[0],item.lexicalEvidence);
  }else{
   reserved++;
   assert.ok(proposalSet.has(item.latin));
   assert.equal(word.valenciano.estadoLexico,'proposta');
   assert.equal(word.valenciano.estadoNormas,'pendent');
   assert.equal(word.valenciano.normas,null);
   assert.ok(item.editorialNotes.length>20);
  }
 }
 assert.equal(verified,18);
 assert.equal(reserved,6);
 assert.ok(!latinSet.has('octo'));
 assert.ok(!latinSet.has('dictum'));
 assert.ok(!latinSet.has('sigĭllum'));
 assert.ok(!queue.candidates.some(c=>c.latin==='cælum'||c.latin==='ocŭlum'));
 const special=new Map(queue.candidates.filter(x=>!x.lexicalVerified).map(x=>[x.latin,x]));
 assert.deepEqual([...special.keys()].sort(),['senatum','uirtutem','uitem','caput','spissum','falcem'].sort());
 assert.equal(special.get('senatum').sourceStatus,'reserva_cultisme');
 assert.equal(special.get('uirtutem').sourceStatus,'reserva_cultisme');
 assert.equal(special.get('uitem').sourceStatus,'reserva_homonimia');
 assert.equal(special.get('caput').sourceStatus,'reserva_base_vulgar');
 assert.equal(special.get('spissum').sourceStatus,'pendent_font');
 assert.equal(special.get('falcem').sourceStatus,'pendent_dcvb');
});
test('Las 18 fichas nuevas muestran cambios editados individualmente, no trasplantes castellanos',()=>{
 const rulesFor=latin=>record(latin).valenciano.normas.filter(x=>x.rule!=='FIX_M').map(x=>x.rule);
 assert.deepEqual(rulesFor('spicam'),['PROT','SONOR']);
 const sound=record('spicam').valenciano.normas.find(x=>x.rule==='SONOR');
 assert.deepEqual(sound.spans,[[3,4]],'Se sonoriza c, no p');
 assert.match(sound.note,/-c- intervocàlica en -g-/);
 assert.deepEqual(rulesFor('septem'),['SIMPL','APOC']);
 assert.deepEqual(rulesFor('guttam'),['ABER','SIMPL']);
 assert.deepEqual(rulesFor('pannum'),['PALAT','APOC']);
 assert.deepEqual(rulesFor('pœnam'),['MONOP']);
 assert.deepEqual(rulesFor('fŏrtia'),['PALAT']);
 assert.deepEqual(rulesFor('rŏtam'),['SONOR']);
 assert.deepEqual(rulesFor('iuncum'),['CONS','ABER','APOC']);
 assert.deepEqual(rulesFor('crustam'),['ABER']);
 assert.match(record('crustam').valenciano.explicacion,/influència/);
 assert.match(record('septem').valenciano.notas,/numeral '7'/);
 assert.match(record('pœnam').valenciano.notas,/penna\/pinna/);
 assert.ok(!record('senatum').valenciano.normas);
 assert.ok(!record('uirtutem').valenciano.normas);
 assert.ok(!record('uitem').valenciano.normas);
});
test('Tercera cola de 19: 16 etimologías DCVB y 3 reservas motivadas sin activar ejercicios',()=>{
 assert.equal(newQueue.schema,'schola-evolutio-va-review-queue/v1');
 assert.equal(newQueue.date,'2026-11-17');
 assert.equal(newQueue.candidates.length,19);
 assert.equal(newQueue.totalProposals,172);
 assert.equal(newQueue.verifiedByThisQueue,16);
 assert.equal(newQueue.unresolvedByThisQueue,3);
 assert.equal(newQueue.approvedForPractice,0);
 const documented=new Set(curation.documented.map(x=>x.latin));
 const proposed=new Set(curation.proposals.map(x=>x.latin));
 let countDocumented=0,countUnresolved=0;
 for(const entry of newQueue.candidates){
  const row=record(entry.latin);
  assert.ok(row);
  assert.equal(entry.approvedForPractice,false);
  assert.equal(entry.ruleVerified,false);
  assert.equal(row.valenciano.aptoParaPractica,false);
  assert.equal(row.valenciano.aprobadoDocente,false);
  if(entry.lexicalVerified){
   countDocumented++;
   assert.ok(documented.has(entry.latin));
   assert.equal(entry.sourceStatus,'documentat_dcvb_sense_dnv');
   assert.equal(row.valenciano.estadoLexico,'documentat');
   assert.equal(row.valenciano.estadoNormas,'analisi_editorial_revisada');
   assert.equal(row.valenciano.dnvIndividualChecked,false);
   assert.deepEqual(row.valenciano.evidencia[0],entry.lexicalEvidence);
  }else{
   countUnresolved++;
   assert.ok(proposed.has(entry.latin));
   assert.equal(row.valenciano.estadoLexico,'proposta');
   assert.equal(row.valenciano.estadoNormas,'pendent');
   assert.equal(row.valenciano.normas,null);
   assert.equal(row.valenciano.evidencia.length,0);
   assert.ok(Array.isArray(entry.references)&&entry.references.length>0);
  }
 }
 assert.equal(countDocumented,16);
 assert.equal(countUnresolved,3);
 const byLatin=new Map(newQueue.candidates.map(x=>[x.latin,x]));
 assert.equal(byLatin.get('fĕbrem').sourceStatus,'reserva_preferencia_normativa');
 assert.equal(byLatin.get('fibram').sourceStatus,'reserva_cultisme');
 assert.equal(byLatin.get('nigrum').sourceStatus,'reserva_cadena_historica');
 assert.match(byLatin.get('fĕbrem').editorialNotes,/febra/);
 assert.ok(byLatin.get('fĕbrem').references.some(x=>x.authority==='AVL'));
 assert.ok(byLatin.get('fĕbrem').references.some(x=>x.authority==='CVMC'));
});
test('16 evoluciones nuevas usan segmentos precisos y no atribuyen falsas leyes',()=>{
 const changesFor=latin=>record(latin).valenciano.normas.filter(c=>c.rule!=='FIX_M');
 const rulesFor=latin=>changesFor(latin).map(c=>c.rule);
 assert.deepEqual(rulesFor('clamare'),['APOC']);
 assert.deepEqual(rulesFor('spinam'),['PROT']);
 assert.deepEqual(rulesFor('cæcum'),['MONOP','PALAT','APOC']);
 assert.deepEqual(rulesFor('turrem'),['ABER']);
 assert.deepEqual(rulesFor('securum'),['SONOR','APOC']);
 assert.deepEqual(changesFor('securum')[0].spans,[[2,3]]);
 assert.deepEqual(rulesFor('formicam'),['SONOR']);
 assert.deepEqual(changesFor('formicam')[0].spans,[[5,6]]);
 assert.deepEqual(rulesFor('fumum'),['APOC']);
 assert.deepEqual(rulesFor('pŏrcum'),['APOC']);
 assert.deepEqual(rulesFor('truncum'),['ABER','APOC']);
 assert.deepEqual(rulesFor('paucum'),['MONOP','APOC']);
 assert.deepEqual(rulesFor('causam'),['MONOP']);
 assert.deepEqual(rulesFor('spumam'),['PROT']);
 for(const latin of ['hĕrbam','serram','fossam','fel'])
  assert.deepEqual(rulesFor(latin),[],'No inventar una ley para '+latin);
 assert.deepEqual(record('fel').valenciano.normas,[]);
 assert.equal(record('hĕrbam').valenciano.normas.at(-1).rule,'FIX_M');
 assert.match(record('cæcum').valenciano.explicacion,/No acceptar cego/);
 assert.match(record('spumam').valenciano.explicacion,/DNV/);
 for(const latin of ['fĕbrem','fibram','nigrum'])
  assert.equal(record(latin).valenciano.normas,null);
});
test('Cuarta cola: 14 lemas documentados DCVB y cuatro reservas históricas explícitas',()=>{
 assert.equal(fourthQueue.candidates.length,18);
 assert.equal(fourthQueue.totalProposals,158);
 assert.equal(fourthQueue.verifiedByThisQueue,14);
 assert.equal(fourthQueue.unresolvedByThisQueue,4);
 assert.equal(fourthQueue.approvedForPractice,0);
 const docs=new Set(curation.documented.map(x=>x.latin));
 const props=new Set(curation.proposals.map(x=>x.latin));
 assert.equal(new Set(fourthQueue.candidates.map(x=>x.latin)).size,18);
 let promoted=0,pending=0;
 for(const q of fourthQueue.candidates){
  const w=record(q.latin);
  assert.ok(w);
  assert.equal(q.approvedForPractice,false);
  assert.equal(q.ruleVerified,false);
  assert.equal(w.valenciano.aprobadoDocente,false);
  assert.equal(w.valenciano.aptoParaPractica,false);
  assert.ok(q.editorialNotes.length>15);
  if(q.lexicalVerified){
   promoted++;
   assert.ok(docs.has(q.latin));
   assert.equal(w.valenciano.estadoLexico,'documentat');
   assert.equal(w.valenciano.estadoNormas,'analisi_editorial_revisada');
   assert.equal(w.valenciano.dnvIndividualChecked,false);
   assert.deepEqual(w.valenciano.evidencia[0],q.lexicalEvidence);
  }else{
   pending++;
   assert.ok(props.has(q.latin));
   assert.equal(w.valenciano.estadoLexico,'proposta');
   assert.equal(w.valenciano.normas,null);
   assert.ok(q.references.some(r=>r.authority==='DCVB'));
  }
 }
 assert.equal(promoted,14);
 assert.equal(pending,4);
 assert.deepEqual(fourthQueue.candidates.filter(x=>!x.lexicalVerified).map(x=>x.latin),['totum','bonum','nouem','milium']);
 assert.equal(fourthQueue.candidates.find(x=>x.latin==='totum').sourceStatus,'reserva_base_vulgar');
 assert.equal(fourthQueue.candidates.find(x=>x.latin==='nouem').sourceStatus,'reserva_homonimia_i_cadena');
});
test('El nuevo repertorio editorial usa segmentos Unicode exactos y distingue las homonimias',()=>{
 const changes=latin=>record(latin).valenciano.normas.filter(x=>x.rule!=='FIX_M');
 const laws=latin=>changes(latin).map(x=>x.rule);
 assert.deepEqual(laws('molam'),[]);
 assert.deepEqual(laws('uallem'),['PALAT','APOC']);
 assert.deepEqual(changes('uallem')[0].spans,[[2,4]]);
 assert.match(record('uallem').valenciano.notas,/FEMENINA/);
 assert.deepEqual(laws('aurum'),['MONOP','APOC']);
 assert.deepEqual(changes('aurum')[0].spans,[[0,2]]);
 assert.deepEqual(laws('mensem'),['SIMPL','APOC']);
 assert.deepEqual(changes('mensem')[0].spans,[[2,4]]);
 assert.deepEqual(laws('uentum'),['APOC']);
 assert.deepEqual(laws('cŏrnu'),['APOC']);
 assert.deepEqual(record('cŏrnu').valenciano.normas.map(x=>x.rule),['APOC']);
 assert.deepEqual(laws('uĕntrem'),[]);
 assert.deepEqual(laws('ferum'),['APOC']);
 assert.match(record('ferum').valenciano.notas,/Adjectiu FER/);
 assert.deepEqual(laws('mŏllem'),['PALAT','APOC']);
 assert.deepEqual(laws('semper'),['METAT']);
 assert.deepEqual(changes('semper')[0].spans,[[4,6]]);
 assert.deepEqual(record('semper').valenciano.normas.map(x=>x.rule),['METAT']);
 assert.deepEqual(laws('ordinare'),['ABER','APOC']);
 assert.deepEqual(laws('intrare'),['ABER','APOC']);
 assert.deepEqual(laws('curtum'),['APOC']);
 assert.deepEqual(laws('calĕntem'),['APOC']);
 for(const latin of ['totum','bonum','nouem','milium'])assert.equal(record(latin).valenciano.normas,null);
 assert.ok(fourthQueue.candidates.every(x=>x.approvedForPractice===false));
});
test('La revisión histórica de 26, 32, 50 y 66 se conserva sin alteraciones',()=>{
 const historical=read(base+'revisio-26.json');
 const middle=read(base+'revisio-32-2026-11-16.json');
 assert.equal(historical.analyses.length,22);
 assert.equal(historical.pending.length,4);
 assert.equal(middle.analyses.length,32);
 assert.deepEqual(middle.analyses.slice(0,22),historical.analyses);
 const previous=read(base+'revisio-50-2026-11-16.json');
 assert.equal(previous.analyses.length,50);
 assert.deepEqual(previous.analyses.slice(0,32),middle.analyses);
 const previous66=read(base+'revisio-66-2026-11-17.json');
 assert.equal(previous66.analyses.length,66);
 assert.deepEqual(previous66.analyses.slice(0,50),previous.analyses);
 assert.equal(revision.analyses.length,80);
 assert.deepEqual(revision.analyses.slice(0,66),previous66.analyses);
 assert.deepEqual(revision.pending,[]);
});
test('La matriz de trabajo no se publica ni sustituye los recursos originales',()=>{
 const dist=join(root,'dist');
 assert.equal(existsSync(join(dist,'apps/evolucion-fonetica/data/matriz-522.json')),false);
 assert.equal(existsSync(join(dist,'shared/academic/evolutio-valenciano/matriz-522.json')),false);
 assert.equal(existsSync(join(dist,'apps/evolucion-fonetica/data/valenciano.json')),false);
 const built=JSON.parse(readFileSync(join(dist,'apps/evolucion-fonetica/data/pilot.json'),'utf8'));
 assert.equal(built.words.length,622);
 assert.deepEqual(built.words.slice(0,bank.words.length),bank.words);
 assert.equal(new Set(built.words.map(w=>w.id)).size,622);
 assert.deepEqual(built.words.slice(bank.words.length).map(w=>w.source.lot),Array(100).fill(21));
});
