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
const revision=read(base+'revisio-26.json');
const audit215=read(base+'auditoria-215.json');
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
test('Estados editoriales honestos: 153 documentados léxicamente, 88 propuestas, 281 sin propuesta',()=>{
 assert.deepEqual(matrix.summary,{total:522,lexicoDocumentado:153,propuestas:88,
  sinPropuesta:281,normasVerificadas:0,aptasParaPractica:0,
  analisisEditoriales:26,casosConDiscrepancia:0});
 for(const r of matrix.records){
  assert.ok(['documentat','proposta','pendent'].includes(r.valenciano.estadoLexico));
  if(r.valenciano.estadoLexico==='documentat'){
    assert.ok(['analisi_editorial_revisada','analisi_editorial_provisional_docent','pendent'].includes(r.valenciano.estadoNormas));
    if(['analisi_editorial_revisada','analisi_editorial_provisional_docent'].includes(r.valenciano.estadoNormas)){
      assert.ok(Array.isArray(r.valenciano.normas));
      assert.equal(r.valenciano.dnvIndividualChecked,false);
      assert.ok(r.valenciano.explicacion);
    }else{
      assert.equal(r.valenciano.estadoNormas,'pendent');
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
test('26 análisis editoriales, decisiones de criterio y ninguna ficha publicable',()=>{
 const good=matrix.records.filter(w=>['analisi_editorial_revisada','analisi_editorial_provisional_docent'].includes(w.valenciano.estadoNormas));
 const disputed=matrix.records.filter(w=>w.valenciano.estadoNormas==='discrepancia_documentada');
 assert.equal(good.length,26);
 assert.equal(disputed.length,0);
 const allowed=new Set(norms.selectable.map(r=>r.id));
 for(const w of good){
  const letters=[...w.latin];
  for(const change of w.valenciano.normas){
   assert.ok(allowed.has(change.rule)||change.rule==='FIX_M');
   if(change.rule==='FIX_M')assert.equal(change.spans[0][0],letters.length-1);
   for(const [a,b] of change.spans)assert.ok(a>=0&&a<b&&b<=letters.length);
  }
  assert.equal(w.valenciano.aprobadoDocente,false);
  assert.equal(w.valenciano.aptoParaPractica,false);
  assert.notEqual(w.valenciano.dnvIndividualChecked,true);
 }
 assert.deepEqual(record('mel').valenciano.normas,[]);
 assert.ok(record('scalam').valenciano.normas.some(c=>c.rule==='PROT'&&c.anchor===0));
 assert.ok(record('clauem').valenciano.normas.some(c=>c.rule==='VOC'));
 assert.ok(record('lupum').valenciano.normas.some(c=>c.rule==='PALAT'));
 assert.ok(record('focum').valenciano.normas.some(c=>c.rule==='APOC'));
});
test('Las decisiones docentes preservan su alcance: clasificación, no autorización de ejercicios',()=>{
 const resolved={
  noctem:['VOC','SIMPL','APOC','FIX_M'],
  matrem:['SIMPL','FIX_M'],
  fabam:['FIX_M'],
  caballum:['PALAT','APOC','FIX_M']
 };
 for(const [latin,rules] of Object.entries(resolved)){
  const w=record(latin).valenciano;
  assert.deepEqual(w.normas.map(c=>c.rule),rules);
  assert.equal(w.criterioDocente.date,'2026-11-13');
  assert.equal(w.criterioDocente.scope,'criterio_de_clasificacion');
  assert.equal(w.aprobadoDocente,false);
  assert.equal(w.aptoParaPractica,false);
 }
 const nit=record('noctem').valenciano;
 assert.equal(nit.criterioDocente.approval,'provisional');
 assert.equal(nit.estadoNormas,'analisi_editorial_provisional_docent');
 assert.equal(nit.normas.find(c=>c.rule==='SIMPL').historicalStage,'nuit');
 assert.equal(nit.normas.find(c=>c.rule==='SIMPL').provisional,true);
 assert.deepEqual(nit.normas.find(c=>c.rule==='SIMPL').spans,[]);
 assert.equal(nit.normas.find(c=>c.rule==='SIMPL').anchor,2);
 assert.match(nit.explicacion,/nuit/);
 assert.deepEqual(record('matrem').valenciano.normas.find(c=>c.rule==='SIMPL').spans,[[2,3]]);
 for(const latin of ['fabam','caballum']){
  const w=record(latin).valenciano;
  assert.equal(w.criterioDocente.approval,'accepted');
  assert.deepEqual(w.fenomensNoSeleccionables.map(x=>x.type),['debilitament_intervocalic']);
  assert.equal(w.fenomensNoSeleccionables[0].selectable,false);
  assert.deepEqual(w.fenomensNoSeleccionables[0].spans,[[2,3]]);
  assert.ok(!w.normas.some(c=>c.rule==='SONOR'));
 }
 assert.equal(record('fabam').valenciano.normas.filter(x=>x.rule!=='FIX_M').length,0);
 assert.ok(record('caballum').valenciano.normas.some(x=>x.rule==='PALAT'));
 assert.ok(record('caballum').valenciano.normas.some(x=>x.rule==='APOC'));
});
test('Auditoría de las 215 candidaturas: 127 etimologías contrastadas, 88 pendientes, 0 publicables',()=>{
 assert.equal(audit215.schema,'schola-evolutio-va-review215/v1');
 assert.deepEqual(audit215.summary,{total:215,documentadasIndividualmente:127,pendientes:88,autorizadasParaPractica:0});
 assert.equal(audit215.records.length,215);
 assert.equal(new Set(audit215.records.map(x=>x.latin)).size,215);
 const original=new Set([...curation.documented.filter(x=>x.reference?.verification==='consulta_directa_de_articulo'),
                           ...curation.proposals].map(x=>x.latin));
 assert.equal(original.size,215);
 for(const item of audit215.records){
  assert.ok(original.has(item.latin),item.latin);
  const corresponding=record(item.latin);
  assert.equal(corresponding.valenciano.resultado,item.form);
  assert.equal(corresponding.valenciano.estadoNormas,'pendent');
  assert.equal(corresponding.valenciano.normas,null);
  assert.equal(item.eligibleForPractice,false);
  assert.equal(item.dnvChecked,false);
  assert.equal(item.phoneticLawsVerified,false);
  if(item.status==='etimologia_i_lema_DCVB_confirmats'){
   assert.ok(item.source?.url.startsWith('https://dcvb.iec.cat/results.asp?word='));
   assert.equal(item.source.verification,'consulta_directa_de_articulo');
   assert.equal(corresponding.valenciano.estadoLexico,'documentat');
   assert.deepEqual(corresponding.valenciano.evidencia,[item.source]);
  }else{
   assert.equal(item.status,'contrast_individual_pendent');
   assert.equal(item.source,null);
   assert.equal(corresponding.valenciano.estadoLexico,'proposta');
  }
 }
 assert.equal(audit215.records.filter(x=>x.status==='etimologia_i_lema_DCVB_confirmats').length,127);
 assert.equal(audit215.records.filter(x=>x.status==='contrast_individual_pendent').length,88);
 assert.match(audit215.records.find(x=>x.latin==='ocŭlum').reviewNote,/clásico/);
 assert.match(audit215.records.find(x=>x.latin==='sigĭllum').reviewNote,/arcaísmo/);
 assert.match(audit215.records.find(x=>x.latin==='pluuiam').reviewNote,/plŏia/);
 assert.match(audit215.records.find(x=>x.latin==='octo').reviewNote,/huit/);
 for(const [latin,pattern] of [['datum',/incierta/],['sensum',/germánico/],
                                      ['serpĕntem',/serpe/],['pluuiam',/plŏia/]]){
  const row=audit215.records.find(x=>x.latin===latin);
  assert.equal(row.status,'contrast_individual_pendent');
  assert.equal(row.source,null);
  assert.match(row.reviewNote,pattern);
 }
 assert.equal(matrix.records.filter(x=>x.valenciano.aptoParaPractica).length,0);
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
test('No se admiten falsos fenómenos, aprobación ficticia ni fases históricas sin respaldo provisional',()=>{
 const change=structuredClone(revision);
 const fava=change.analyses.find(x=>x.latin==='fabam');
 fava.nonSelectablePhenomena[0].at=1;
 assert.throws(()=>assembleEvolutioValenciano(bank,curation,norms,lock.sources.evolutio.sha,change),/Debilitament intervocàlic/);
 const approval=structuredClone(revision);
 approval.analyses.find(x=>x.latin==='matrem').teacherApproved=true;
 assert.throws(()=>assembleEvolutioValenciano(bank,curation,norms,lock.sources.evolutio.sha,approval),/marcada como practicable/);
 const stage=structuredClone(revision);
 stage.analyses.find(x=>x.latin==='noctem').teacherDecision.approval='accepted';
 assert.throws(()=>assembleEvolutioValenciano(bank,curation,norms,lock.sources.evolutio.sha,stage),/Estadio històric/);
 const duplicate=structuredClone(revision);
 duplicate.pending.push({...duplicate.analyses.find(x=>x.latin==='matrem'),status:'criteri_pendent',reason:'fictici',changes:undefined});
 assert.throws(()=>assembleEvolutioValenciano(bank,curation,norms,lock.sources.evolutio.sha,duplicate),/Revisión duplicada/);
});
test('La matriz de trabajo no se publica ni sustituye los recursos originales',()=>{
 const dist=join(root,'dist');
 assert.equal(existsSync(join(dist,'apps/evolucion-fonetica/data/matriz-522.json')),false);
 assert.equal(existsSync(join(dist,'shared/academic/evolutio-valenciano/matriz-522.json')),false);
 assert.equal(existsSync(join(dist,'apps/evolucion-fonetica/data/valenciano.json')),false);
 const built=JSON.parse(readFileSync(join(dist,'apps/evolucion-fonetica/data/pilot.json'),'utf8'));
 assert.deepEqual(built,bank);
});
