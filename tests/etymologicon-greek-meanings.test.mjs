import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compileTeacherAudit} from '../scripts/compile-etymologicon-gr1.mjs';

const bank=compileTeacherAudit();
const data=JSON.parse(readFileSync(new URL('../shared/academic/greek-etymology/review/meaning-completion-v1.json',import.meta.url),'utf8'));
const find=lemma=>bank.etymons.find(x=>x.lemma===lemma);
test('las 54 glosas restantes cubren sin duplicaciones los 111 étimos',()=>{
 assert.equal(data.entries.length,54);
 assert.equal(new Set(data.entries.map(x=>x.id)).size,54);
 assert.equal(bank.etymons.length,111);
 assert.equal(bank.etymons.filter(x=>x.meaning!==null).length,111);
 assert.equal(bank.summary.greekMeaningsPending,0);
 assert.equal(bank.summary.meaningCompletionChecked,25);
 assert.equal(bank.summary.meaningCompletionDrafts,29);
 assert.equal(bank.summary.greekMeaningsPendingIndependentReview,80);
});
test('glosas propuestas no se hacen pasar por diccionario ya consultado',()=>{
 for(const e of bank.etymons.filter(x=>x.meaningCompletionEvidence?.status==='meaning_draft_pending_dictionary_check')){
   assert.equal(e.independentLexicographicReview,false);
   assert.ok(e.meaningCompletionEvidence.suggestedLookup.startsWith('https://logeion.uchicago.edu/'));
   assert.equal(e.meaningCompletionEvidence.checkedSource,null);
 }
 for(const e of bank.etymons.filter(x=>x.meaningReviewStatus==='dictionary_entry_checked')){
   assert.equal(e.independentLexicographicReview,true);
   assert.equal(e.meaningCompletionEvidence.checkedSource.individuallyChecked,true);
 }
});
test('lemas compuestos se representan con ambos miembros; ἐκ y ἐξ son alomorfos',()=>{
 for(const e of ['γράφω | γράμμα','σοφός | σοφία','ἀρχή | ἄρχω','λέγω | λόγος']){
  const r=find(e);
  assert.ok(r,e);
  assert.equal(r.meaningCompletionEvidence.components.type,'associated_lexemes');
  assert.equal(r.meaningCompletionEvidence.components.parts.length,2);
  assert.equal(r.meaningEvidence.status,'partial_compound');
 }
 const ek=find('ἐκ | ἐξ');
 assert.ok(ek);
 assert.equal(ek.meaningCompletionEvidence.components.type,'allomorphs');
 assert.match(ek.meaningCompletionEvidence.components.note,/ante vocal/);
 const messenger=find('ἀγγέλλω | ἄγγελος');
 assert.ok(messenger);
 assert.deepEqual(messenger.meaningCompletionEvidence.components.parts.map(p=>p.lemma),['ἀγγέλλω','ἄγγελος']);
});
test('casos sensibles se documentan y no se confunden étimos distintos',()=>{
 const limit=find('ὅρος');
 assert.match(limit.meaning,/límite/);
 assert.match(limit.meaningCompletionEvidence.philologicalCaution,/ὄρος/);
 const cosmos=find('κόσμος');
 assert.match(cosmos.meaning,/orden/);
 assert.match(cosmos.meaning,/universo/);
 const itis=find('−ῖτις');
 assert.match(itis.meaning,/adjetival femenino/);
 assert.match(itis.meaningCompletionEvidence.philologicalCaution,/sufijo/);
 assert.equal(find('πρωκτός').meaning,'ano');
 assert.equal(find('ψευδής, –ές').meaning,'falso; engañoso');
});
test('se preserva el inventario editorial y no se publican ejercicios nuevos',()=>{
 assert.equal(bank.derivatives.length,201);
 assert.equal(bank.relations.length,217);
 assert.equal(bank.etymons.filter(x=>x.editorialStatus==='reference_only').length,3);
 assert.ok(bank.relations.every(x=>x.inverseReady===false&&x.decompositionReady===false));
 assert.equal(bank.greek2.etymons.length,0);
 assert.equal(bank.summary.published,false);
});
