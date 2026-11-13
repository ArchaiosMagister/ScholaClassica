import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {triageNounCandidates} from '../scripts/nominal-pending-triage.mjs';
const root=resolve(import.meta.dirname,'..');
const audit=join(root,'build/morfologia');
const catalog=JSON.parse(readFileSync(join(audit,'catalogo-nominal-total.json'),'utf8'));
const report=JSON.parse(readFileSync(join(audit,'candidaturas-triaje-filologico.json'),'utf8'));
const manifest=JSON.parse(readFileSync(join(root,'config/nominal-teacher-decisions.json'),'utf8'));
const rerun=triageNounCandidates(catalog.catalog,manifest);
test('el triaje es reproducible, sin modificar los paradigmas ni elevar evidencias',()=>{
  assert.deepEqual(report,rerun);
  assert.equal(report.total,Object.values(report.counts).reduce((a,b)=>a+b,0));
  assert.equal(report.total,catalog.catalog.filter(x=>x.status==='pendiente').length);
  assert.ok(report.counts['verbo-para-fase-posterior']>=20);
  assert.ok(report.counts['adjetivo-para-fase-posterior']>=20);
  assert.ok(report.counts['fuente-incompleta-o-ausente']>30);
  assert.match(report.policy,/no calificación/);
});
test('no se convierten verbos y adjetivos en sustantivos pendientes de flexión nominal',()=>{
  const find=(lang,lemma)=>report.classified.find(x=>x.language===lang&&
    x.lemma.normalize('NFD').replace(/\p{M}/gu,'')===lemma.normalize('NFD').replace(/\p{M}/gu,''));
  for(const lemma of ['timeo','conor','revertor'])
    assert.equal(find('latin',lemma)?.group,'verbo-para-fase-posterior');
  for(const lemma of ['brevis','fortis','omnis'])
    assert.equal(find('latin',lemma)?.group,'adjetivo-para-fase-posterior');
  assert.equal(find('griego','ἀδικός')?.group,'adjetivo-para-fase-posterior');
});
test('las decisiones docentes tienen opciones explícitas y no se aplican sin respuesta',()=>{
  const ids=new Set();
  assert.equal(report.teacherChoices.length,6);
  for(const c of report.teacherChoices){
    assert.ok(!ids.has(c.id));ids.add(c.id);
    assert.ok(c.choices.length>=3);
    assert.ok(c.choices.some(x=>x.value===c.recommendation));
    assert.ok(/^https:\/\//.test(c.source));
    const key=c.id.replace(/^(?:latin|griego)-/u,'');
    assert.equal(c.decision,manifest.choices[key]);
    assert.equal(c.applied,true);
  }
});
