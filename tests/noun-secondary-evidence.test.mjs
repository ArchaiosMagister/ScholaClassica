import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {readNounSecondaryEvidence,crosscheckNounInventory} from '../scripts/noun-secondary-evidence.mjs';
const root=resolve(import.meta.dirname,'..');
const lock=JSON.parse(readFileSync(join(root,'config/sources.lock.json'),'utf8'));
const report=JSON.parse(readFileSync(join(root,'build/morfologia/catalogo-nominal-total.json'),'utf8'));
const greek=report.catalog.filter(x=>x.language==='griego');
const latin=report.catalog.filter(x=>x.language==='latin');
const src=await readNounSecondaryEvidence(join(root,'.sources/examenes'));
const evidence=crosscheckNounInventory({
  ...src,greekCatalog:greek,latinCatalog:latin,sourceSha:lock.sources.examenes.sha
});
test('todas las fichas de Griego I y del latín quedan inventariadas, incluso pendientes',()=>{
  assert.ok(greek.length>50);
  assert.ok(latin.length>150);
  assert.equal(evidence.counts.greekCatalog,greek.length);
  assert.equal(evidence.counts.latinCatalog,latin.length);
  assert.equal(new Set(greek.map(x=>x.lemma.normalize('NFD'))).size,greek.length);
  assert.ok(evidence.counts.wiktionaryNouns>=50);
  assert.ok(evidence.counts.matchedGreek>0);
  assert.ok(evidence.counts.editorialMatched>0);
});
test('Wiktionary/Eulexis/Perseus/Logeion no generan falsos aprobados',()=>{
  assert.equal(evidence.sources.wiktionary.status,'WIKTIONARY_CANDIDATES_NOT_FOR_GRADING');
  assert.equal(evidence.sources.wiktionary.license,'CC BY-SA 4.0');
  assert.equal(evidence.sources.editorial.verifiedMorphology,false);
  for(const k of ['eulexis','perseus','logeion']){
    assert.equal(evidence.sources[k].status,'no-consultado-en-este-compilador');
  }
  assert.ok(evidence.greekReviews.some(x=>x.status==='pendiente'));
  assert.ok(evidence.greekReviews.some(x=>x.status==='incorporado'));
  assert.ok(evidence.greekReviews.every(x=>!x.wiktionary||x.wiktionary.policy.includes('No valida')));
  assert.ok(evidence.externalOnly.every(x=>x.status==='solo-propuesta-externa'));
});
test('la salida persistida coincide exactamente con un cotejo reproducible de fuentes fijadas',()=>{
  const saved=JSON.parse(readFileSync(join(root,'build/morfologia/contraste-nominal-secundario.json'),'utf8'));
  assert.deepEqual(saved,evidence);
  assert.equal(saved.sourceSha,lock.sources.examenes.sha);
  assert.throws(()=>crosscheckNounInventory({...src,sourceSha:'main'}),/40/);
});
