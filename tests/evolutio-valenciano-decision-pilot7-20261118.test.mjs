import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const dir='shared/academic/evolutio-valenciano/';
const load=name=>JSON.parse(readFileSync(join(root,dir+name),'utf8'));
const decision=load('decisio-pilot-escolar-7-2026-11-18.json');
const matrix=load('matriz-522.json');
const pilot=load('pilot-candidats-12-2026-11-18.json');
const normCatalog=load('normas.json');
const matrixById=new Map(matrix.records.map(x=>[x.id,x]));
const originalById=new Map(pilot.entries.map(x=>[x.id,x]));
const selected=decision.recommendedForPilot;
const intro=decision.demonstrationOnly;
const hold=decision.philologicalHolds;

test('Piloto académico: siete candidatos con nueve reglas y grados de prueba independientes',()=>{
 assert.equal(decision.schema,'schola-evolutio-va-initial-pilot-decision/v1');
 assert.equal(decision.parentPR,122);
 assert.equal(decision.parentPRBase,119);
 assert.equal(matrix.records.length,522);
 assert.deepEqual(decision.summary,{
  originalRecords:522,reviewedInPilot:12,quizCandidates:7,firstTierCandidates:5,secondTierCandidates:2,
  selectableLawInstancesInSeven:9,directlyWordExemplifiedLawInstances:7,generalRuleLawInstances:2,
  introOnly:3,philologicalHoldWithinPilot:2,noctemExternalHold:1,teacherApproved:0,playable:0,mainChanges:0
 });
 const selectedLatins=new Set(['uitam','buccam','cuppam','focum','pontem','catenam','aucam']);
 assert.deepEqual(new Set(selected.map(x=>x.latin)),selectedLatins);
 assert.equal(selected.length,7);
 const ids=new Set([...selected,...intro,...hold].map(x=>x.id));
 assert.equal(ids.size,12);
 assert.deepEqual(ids,new Set(pilot.entries.map(x=>x.id)));
 let direct=0,general=0;
 const known=new Set(normCatalog.selectable.map(x=>x.id));
 const schoolPolicy=new Set(['exemple_individual_del_canvi','regla_general_i_etimologia']);
 for(const row of selected){
  const matrixRow=matrixById.get(row.id);
  const original=originalById.get(row.id);
  assert.ok(matrixRow&&original,row.latin);
  assert.equal(matrixRow.latin,row.latin);
  assert.equal(matrixRow.valenciano.resultado,row.form);
  assert.equal(original.form,row.form);
  assert.equal(row.academicDecision,'recomanada_per_a_primer_pilot_si_validacio_docent_i_politica_normativa');
  assert.equal(row.approvedByTeacher,false);
  assert.equal(row.playable,false);
  assert.equal(row.normativeSpelling.avlGnvExampleAttested,true);
  assert.equal(row.normativeSpelling.currentDnvIndividualEntryChecked,false);
  assert.match(row.normativeSpelling.officialAVLSource,/gramatica_normativa_valenciana\.pdf$/);
  assert.match(row.lexicalEtimology.url,/^https:\/\/dcvb\.iec\.cat\//);
  assert.ok(row.independentHistoricalReferences.length);
  assert.ok(row.reason.length);
  assert.equal(row.fullyCertifiedHistoricalChain,false);
  assert.deepEqual(row.requestedSelectableLaws.map(x=>x.rule),original.candidateSelectableLaws);
  const editable=(matrixRow.valenciano.normas||[]).filter(x=>x.rule!=='FIX_M');
  assert.deepEqual(row.requestedSelectableLaws.map(x=>x.unicodeSpans),editable.map(x=>x.spans));
  for(const law of row.requestedSelectableLaws){
   assert.ok(known.has(law.rule),row.latin+'/'+law.rule);
   assert.ok(schoolPolicy.has(law.evidenceDegree));
   assert.equal(law.individuallyHistoricallyCertifiedAsCompleteChain,false);
   assert.equal(law.teacherApproved,false);
   if(law.evidenceDegree==='exemple_individual_del_canvi')direct++;
   if(law.evidenceDegree==='regla_general_i_etimologia')general++;
   for(const [start,end] of law.unicodeSpans){
    assert.ok(start>=0&&end>start&&end<=[...row.latin].length,row.latin+'/'+law.rule);
   }
  }
  assert.equal(row.finalMLoss,'fixa_no_seleccionable');
  assert.equal(matrixRow.valenciano.aptoParaPractica,false);
  assert.equal(matrixRow.valenciano.aprobadoDocente,false);
 }
 assert.equal(direct,7);
 assert.equal(general,2);
 assert.equal(selected.filter(x=>x.priority==='primer_bloc').length,5);
 assert.equal(selected.filter(x=>x.priority==='segon_bloc_condicional').length,2);
});

test('Los tres casos sin ley y las dos reservas quedan excluidos del examen',()=>{
 assert.deepEqual(new Set(intro.map(x=>x.latin)),new Set(['tĕrram','pŏrtam','farinam']));
 assert.deepEqual(new Set(hold.map(x=>x.latin)),new Set(['matrem','cælum']));
 for(const row of intro){
  assert.equal(row.academicDecision,'exclusiu_demo_no_examen_identificacio_normes');
  assert.equal(originalById.get(row.id).candidateSelectableLaws.length,0);
  assert.equal(row.teacherApproved,false);
  assert.equal(row.playable,false);
 }
 for(const row of hold){
  assert.equal(row.academicDecision,'reserva_filologica_sense_practica');
  assert.ok(row.reason.length>50);
  assert.equal(row.teacherApproved,false);
  assert.equal(row.playable,false);
 }
 assert.equal(decision.externalHold.latin,'noctem');
 assert.equal(decision.externalHold.form,'nit');
 assert.equal(decision.externalHold.playable,false);
 assert.equal(pilot.entries.some(x=>x.latin==='noctem'),false);
 assert.ok(!selected.some(x=>['matrem','cælum','noctem','octo','dictum','sigĭllum'].includes(x.latin)));
});

test('No sustituir verificación DNV por obra AVL ni activar sin aprobación docente',()=>{
 assert.equal(decision.normativeGate.currentDnvIndividualChecks,0);
 assert.match(decision.normativeGate.observed,/DNV online/);
 assert.match(decision.normativeGate.possibleAlternativeForTeacherApproval,/aprobación docente explícita/);
 assert.equal(decision.normativeGate.publishWithoutTeacherApproval,false);
 assert.equal(decision.normativeGate.canEnableInMain,false);
 assert.equal(decision.normativeGate.userFacingStatus,'desactivado');
 assert.equal(decision.readinessChecks.length,5);
 assert.equal(decision.summary.teacherApproved,0);
 assert.equal(decision.summary.playable,0);
 assert.equal(matrix.summary.aptasParaPractica,0);
 assert.equal(matrix.records.filter(x=>x.valenciano.aptoParaPractica).length,0);
 assert.equal(matrix.records.filter(x=>x.valenciano.aprobadoDocente).length,0);
});
