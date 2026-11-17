import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {assembleEvolutioValenciano} from '../scripts/reconcile-evolutio-valenciano.mjs';

const root=resolve(import.meta.dirname,'..');
const file=p=>JSON.parse(readFileSync(join(root,p),'utf8'));
const academic='shared/academic/evolutio-valenciano/';
const curation=file(academic+'conciliacion-curada.json');
const first=file(academic+'revisio-dcvb-prioritaria-2026-11-17.json');
const second=file(academic+'revisio-restants-63-2026-11-17.json');
const matrix=file(academic+'matriz-522.json');
const phoneticsQueue=file(academic+'cola-fonetica-66-2026-11-17.json');
const laws=file(academic+'normas.json');
const revision=file(academic+'revisio-120-2026-11-17.json');
const lock=file('config/sources.lock.json');
const bank=file('.sources/evolutio/data/pilot.json');

test('Promoció lèxica exacta de 66 fonts i 15 reserves, sense inventar normes ni alterar els 522 identificadors',()=>{
 const expected=[
  ...first.items.filter(x=>x.reviewOutcome==='etimologia_i_acepcio_dcvb_contrastades')
    .map(x=>({latin:x.latin,form:x.proposta,url:x.source.url,
      authority:x.source.authority,review:'revisio-dcvb-prioritaria-2026-11-17.json'})),
  ...second.entries.filter(x=>x.lexicalReview==='relacio_lexica_etimologica_documentada')
    .map(x=>({latin:x.latin,form:x.proposta,url:x.evidence.url,
      authority:x.evidence.authority,review:'revisio-restants-63-2026-11-17.json'}))
 ];
 assert.equal(expected.length,66);
 assert.equal(new Set(expected.map(x=>x.latin)).size,66);
 assert.equal(curation.documented.length,120);
 assert.equal(curation.lexicallyReviewed.length,66);
 assert.equal(curation.proposals.length,52);
 assert.deepEqual(matrix.summary,{total:522,lexicoDocumentado:120,
  contrasteLexicoPendienteFonetica:66,propuestas:52,sinPropuesta:284,
  reservasSoloCastellano:3,normasVerificadas:0,aptasParaPractica:0,
  analisisEditoriales:120,casosConDiscrepancia:0});
 const indexed=new Map(curation.lexicallyReviewed.map(x=>[x.latin,x]));
 const bankIds=new Map(bank.words.map(x=>[x.latin,x.id]));
 for(const source of expected){
  const staged=indexed.get(source.latin);
  assert.ok(staged,source.latin);
  assert.equal(staged.form,source.form);
  assert.equal(staged.lexicalStatus,'contrastat_lexic_sense_fonetica');
  assert.equal(staged.reference.url,source.url);
  assert.equal(staged.reference.authority,source.authority);
  assert.equal(staged.reviewSource,source.review);
  for(const key of ['dnvIndividualChecked','teacherApproved','playable'])
   assert.equal(staged[key],false,source.latin+': '+key);
  const row=matrix.records.find(x=>x.latin===source.latin);
  assert.ok(row,source.latin);
  assert.equal(row.id,bankIds.get(source.latin));
  assert.equal(row.valenciano.estadoLexico,'contrastat_lexic_sense_fonetica');
  assert.equal(row.valenciano.resultado,source.form);
  assert.equal(row.valenciano.estadoNormas,'pendent');
  assert.equal(row.valenciano.normas,null);
  assert.equal(row.valenciano.explicacion,null);
  assert.equal(row.valenciano.revisionLexica,source.review);
  assert.equal(row.valenciano.aprobadoDocente,false);
  assert.equal(row.valenciano.aptoParaPractica,false);
 }
 const reserved=[
  ...first.items.filter(x=>x.reviewOutcome!=='etimologia_i_acepcio_dcvb_contrastades').map(x=>x.latin),
  ...second.entries.filter(x=>x.lexicalReview!=='relacio_lexica_etimologica_documentada').map(x=>x.latin)
 ];
 assert.equal(reserved.length,15);
 for(const latin of reserved){
  assert.ok(curation.proposals.some(x=>x.latin===latin),latin);
  assert.equal(matrix.records.find(x=>x.latin===latin).valenciano.estadoLexico,'proposta');
 }
 const authorities=curation.lexicallyReviewed.reduce((map,x)=>map.set(x.reference.authority,(map.get(x.reference.authority)||0)+1),new Map());
 assert.equal(authorities.get('DCVB'),64);
 assert.equal(authorities.get("Institut d'Estudis Catalans"),1);
 assert.equal(authorities.get('Gran Diccionari de la Llengua Catalana'),1);
 assert.equal(matrix.records.length,522);
 assert.equal(matrix.records.filter(x=>x.valenciano.aptoParaPractica).length,0);
 assert.equal(revision.analyses.length,120);
 assert.equal(matrix.records.filter(x=>x.valenciano.estadoNormas==='analisi_editorial_revisada').length,120);
});

test('No es pot suplantar una font o autoritzar una fitxa en fase lèxica',()=>{
 const run=c=>assembleEvolutioValenciano(bank,c,laws,lock.sources.evolutio.sha,revision);
 const approved=structuredClone(curation);
 approved.lexicallyReviewed[0].playable=true;
 assert.throws(()=>run(approved),/Correspondencia léxica pendiente sin evidencia individual segura/);
 const fakedDnv=structuredClone(curation);
 fakedDnv.lexicallyReviewed[0].dnvIndividualChecked=true;
 assert.throws(()=>run(fakedDnv),/Correspondencia léxica pendiente sin evidencia individual segura/);
 const fakeUrl=structuredClone(curation);
 fakeUrl.lexicallyReviewed[0].reference.url='https://example.com/forca';
 assert.throws(()=>run(fakeUrl),/Correspondencia léxica pendiente sin evidencia individual segura/);
 const duplicated=structuredClone(curation);
 duplicated.lexicallyReviewed.push({...duplicated.lexicallyReviewed[0]});
 assert.throws(()=>run(duplicated),/Dos propuestas/);
 const fakeReview=structuredClone(curation);
 fakeReview.lexicallyReviewed[0].reviewSource='review-inexistent.json';
 assert.throws(()=>run(fakeReview),/Correspondencia léxica pendiente sin evidencia individual segura/);
});

test('Cua de 66 revisions fonètiques sense dreceres ni lleis fictícies',()=>{
 assert.equal(phoneticsQueue.entries.length,66);
 assert.equal(phoneticsQueue.summary.playable,0);
 assert.equal(phoneticsQueue.summary.pendingDnv,66);
 assert.equal(phoneticsQueue.summary.pendingHistoricalChain,66);
 assert.equal(phoneticsQueue.summary.pendingLawsAndSpans,66);
 assert.equal(phoneticsQueue.summary.pendingTeacherApproval,66);
 assert.equal(phoneticsQueue.lockedSource,lock.sources.evolutio.sha);
 const staged=new Map(curation.lexicallyReviewed.map(x=>[x.latin,x]));
 assert.deepEqual(new Set(phoneticsQueue.entries.map(x=>x.latin)),new Set(staged.keys()));
 for(const r of phoneticsQueue.entries){
  const source=staged.get(r.latin);
  assert.equal(r.form,source.form);
  assert.deepEqual(r.lexicalSource,source.reference);
  assert.equal(r.reviewSource,source.reviewSource);
  assert.equal(r.changes,null);
  assert.ok(r.nextChecks.length>=4);
  for(const key of ['dnvIndividualChecked','historicalChainIndividuallyChecked',
   'lawsVerified','unicodeSpansVerified','teacherApproved','playable'])
   assert.equal(r[key],false,r.latin+': '+key);
 }
});
