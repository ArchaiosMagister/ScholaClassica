import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {auditGreekUnassigned,loadGreekUnassigned,headword,lemmaKey,LEDGER_SCHEMA}
  from '../scripts/audit-greek-unassigned-individual.mjs';

const root=resolve(import.meta.dirname,'..');
const sources=loadGreekUnassigned(root);
const data=auditGreekUnassigned(sources);

test('Se cotejan individualmente las 184 fichas General y ninguna pasa a Examen',()=>{
  assert.equal(data.schema,LEDGER_SCHEMA);
  assert.equal(data.basis.totalSourceEntries,2055);
  assert.equal(data.basis.greekEntries,503);
  assert.equal(data.basis.greekMorphologyModels,94);
  assert.equal(data.basis.greekUnassignedGeneral,184);
  assert.equal(data.basis.greekUnassignedExam,0);
  assert.equal(data.decisions.length,184);
  assert.equal(new Set(data.decisions.map(x=>x.id)).size,184);
  assert.ok(data.decisions.every(x=>x.assignUnit===null&&
    x.examPromotion===false&&x.sourceMode==='general'&&
    x.sourceUnits.includes('Sin unidad acreditada')));
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

test('κίνδυνος coincide en lema y glosa con Examen UD5, pero conserva General sin UD',()=>{
  assert.equal(data.summary.matchingExamLemmaAndGloss,1);
  const row=data.decisions.find(e=>lemmaKey(e.form)===lemmaKey('κίνδυνος'));
  assert.ok(row);
  const hits=row.evidence.unitTaggedVocabularyPeers.filter(p=>
    p.mode==='examen'&&p.sameMeaning);
  assert.equal(hits.length,1);
  assert.deepEqual(hits[0].units,['UD 5']);
  assert.equal(row.assignUnit,null);
  assert.deepEqual(row.sourceUnits,['Sin unidad acreditada']);
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
  assert.ok(data.decisions.every(x=>x.id&&x.form&&x.meaning&&x.decision));
});

test('Bloqueo de correcciones implícitas: ni unidades, ni idiomas, ni Examen',()=>{
  const edit=structuredClone(sources);
  const id=data.decisions[0].id;
  edit.integrated.find(x=>x.id===id).units=['UD 5'];
  assert.throws(()=>auditGreekUnassigned(edit),/Cambio sin autorización en ficha griega/);
  const exam=structuredClone(sources);
  exam.source.find(x=>x.id===id).mode='examen';
  assert.throws(()=>auditGreekUnassigned(exam),/184 fichas/);
  const missingTranslation=structuredClone(sources);
  missingTranslation.curriculumVal.griego.units[11].topics[0].html='';
  assert.throws(()=>auditGreekUnassigned(missingTranslation),
    /presencia de lema en ES y VAL difiere/);
});
