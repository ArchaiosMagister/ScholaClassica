import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {auditGreekUnassigned,loadGreekUnassigned,headword,lemmaKey,LEDGER_SCHEMA}
  from '../scripts/audit-greek-unassigned-individual.mjs';
import {GREEK1_KINDYNOS_GENERAL_ID,GREEK1_KINDYNOS_EXAM_ID}
  from '../scripts/greek1-kindynos-ud5-decision.mjs';

const root=resolve(import.meta.dirname,'..');
const sources=loadGreekUnassigned(root);
const data=auditGreekUnassigned(sources);

test('Se cotejan individualmente las 184 fichas General y ninguna pasa a Examen',()=>{
  assert.equal(data.schema,LEDGER_SCHEMA);
  assert.equal(data.basis.totalSourceEntries,2055);
  assert.equal(data.basis.greekEntries,503);
  assert.equal(data.basis.greekMorphologyModels,94);
  assert.equal(data.basis.greekUnassignedGeneral,184);
  assert.equal(data.basis.greekUnassignedIntegratedGeneral,183);
  assert.equal(data.basis.approvedGeneralUd5,1);
  assert.equal(data.basis.greekUnassignedExam,0);
  assert.equal(data.decisions.length,184);
  assert.equal(new Set(data.decisions.map(x=>x.id)).size,184);
  assert.ok(data.decisions.every(x=>x.examPromotion===false&&
    x.sourceMode==='general'&&x.sourceUnits.includes('Sin unidad acreditada')));
  assert.equal(data.decisions.filter(x=>x.assignUnit===5).length,1);
  assert.equal(data.decisions.filter(x=>x.assignUnit===null).length,183);
  assert.ok(data.decisions.filter(x=>x.id!==GREEK1_KINDYNOS_GENERAL_ID)
    .every(x=>x.assignUnit===null&&x.integratedUnits.includes('Sin unidad acreditada')));
  assert.ok(data.decisions.filter(x=>x.evidence.grammarCommonUnits.length)
    .every(x=>x.assignUnit===null&&x.integratedUnits.includes('Sin unidad acreditada')));
  assert.equal(data.summary.withNoDirectCandidate,168);
});

test('La coincidencia gramatical ES y VAL proporciona ejemplos, NO exigibilidad',()=>{
  assert.equal(data.summary.mentionedInBothGrammars,15);
  const hits=data.decisions.filter(x=>x.evidence.grammarCommonUnits.length);
  assert.equal(hits.length,15);
  for(const x of hits){
    assert.deepEqual(x.evidence.grammarCommonUnits,
      [...new Set(x.evidence.grammarSpanish.map(r=>r.unit))].sort((a,b)=>a-b));
    assert.deepEqual(x.evidence.grammarCommonUnits,
      [...new Set(x.evidence.grammarValencian.map(r=>r.unit))].sort((a,b)=>a-b));
    assert.equal(x.assignUnit,null);
  }
  const byUnit={};
  for(const x of hits)for(const u of x.evidence.grammarCommonUnits)
    byUnit[u]=(byUnit[u]||0)+1;
  assert.deepEqual(byUnit,{'8':3,'10':1,'12':9,'13':1,'14':1});
});

test('κίνδυνος se asigna solo en General UD5, sin modificar su origen ni Examen',()=>{
  assert.equal(data.summary.matchingExamLemmaAndGloss,1);
  const row=data.decisions.find(e=>lemmaKey(e.form)===lemmaKey('κίνδυνος'));
  assert.ok(row);
  const hits=row.evidence.unitTaggedVocabularyPeers.filter(p=>
    p.mode==='examen'&&p.sameMeaning);
  assert.equal(hits.length,1);
  assert.deepEqual(hits[0].units,['UD 5']);
  assert.equal(row.id,GREEK1_KINDYNOS_GENERAL_ID);
  assert.equal(hits[0].id,GREEK1_KINDYNOS_EXAM_ID);
  assert.equal(row.assignUnit,5);
  assert.deepEqual(row.integratedUnits,['UD 5']);
  assert.deepEqual(row.sourceUnits,['Sin unidad acreditada']);
  const exam=sources.integrated.find(e=>e.id===GREEK1_KINDYNOS_EXAM_ID);
  assert.deepEqual(exam,sources.source.find(e=>e.id===GREEK1_KINDYNOS_EXAM_ID));
  assert.equal(row.category,'coincide-con-examen-de-otra-ficha');
  assert.equal(headword(row.form).normalize('NFC'),'κίνδυνος');
});

test('Los 184 resultados separan origen, evidencia y decisión sin borrar registros',()=>{
  const grades=new Set([
    'coincide-con-examen-de-otra-ficha',
    'ejemplo-documentado-en-gramatica-bilingue',
    'candidato-paradigma-de-morfologia',
    'sin-evidencia-curricular-directa'
  ]);
  assert.ok(data.decisions.every(x=>grades.has(x.category)));
  assert.equal(Object.values(data.summary.classified)
    .reduce((a,b)=>a+b,0),184);
  assert.ok(data.summary.withAtLeastOneDirectCandidate>=16);
  assert.equal(data.summary.withAtLeastOneDirectCandidate+
    data.summary.withNoDirectCandidate,184);
  assert.equal(data.summary.approvedGeneralUd5,1);
  assert.equal(data.summary.unchangedGeneralUnassigned,183);
  assert.ok(data.decisions.every(x=>x.id&&x.form&&x.meaning&&x.decision));
});

test('Bloqueo de correcciones implícitas: ni unidades, ni idiomas, ni Examen',()=>{
  const edit=structuredClone(sources);
  const id=data.decisions[0].id;
  edit.integrated.find(x=>x.id===id).units=['UD 5'];
  assert.throws(()=>auditGreekUnassigned(edit),/Cambio sin autorización en ficha griega/);
  const approvedChanged=structuredClone(sources);
  approvedChanged.integrated.find(x=>x.id===GREEK1_KINDYNOS_GENERAL_ID)
    .units=['Sin unidad acreditada'];
  assert.throws(()=>auditGreekUnassigned(approvedChanged),
    /debe pertenecer únicamente a UD5/);
  const exam=structuredClone(sources);
  exam.source.find(x=>x.id===id).mode='examen';
  assert.throws(()=>auditGreekUnassigned(exam),/184 fichas/);
  const missingTranslation=structuredClone(sources);
  missingTranslation.curriculumVal.griego.units[11].topics[0].html='';
  assert.throws(()=>auditGreekUnassigned(missingTranslation),
    /presencia de lema en ES y VAL difiere/);
});
