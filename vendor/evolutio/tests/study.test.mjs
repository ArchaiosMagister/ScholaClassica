import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {RULES,FIXED_RULE} from '../src/rules.mjs';
import {chars,validationErrors,newCardState,checkResult,checkAllChanges,availableWords} from '../src/engine.mjs';
import {normalizeStudyQuery,findStudyWords,sortStudyWords,studyWordsForRule,studySubtypes,studyRuleCounts,studyHighlight,shuffleStudyWords} from '../src/study.mjs';
const dataset=JSON.parse(readFileSync(new URL('../data/pilot.json',import.meta.url),'utf8'));
const words=dataset.words;
const word=latin=>words.find(w=>w.latin===latin);

test('Estudio reutiliza todo el banco ampliado sin añadir datos ni reglas',()=>{
 assert.ok(words.length>=252);
 assert.deepEqual(validationErrors(dataset),[]);
 assert.equal(RULES.length,20);
 assert.equal(sortStudyWords(words).length,words.length);
 assert.equal(findStudyWords(words,'').length,words.length);
 assert.equal(new Set(sortStudyWords(words).map(w=>w.id)).size,words.length);
});
test('El estudio baraja sin alterar datos, duplicar fichas ni repetir el orden alfabético',()=>{
 const original=words.map(w=>w.id);
 const sample=[{id:'a'},{id:'b'},{id:'c'},{id:'d'}];
 const shuffled=shuffleStudyWords(sample,()=>0);
 assert.deepEqual(sample.map(w=>w.id),['a','b','c','d']);
 assert.deepEqual(shuffled.map(w=>w.id),['b','c','d','a']);
 const all=shuffleStudyWords(words,()=>0.5);
 assert.equal(all.length,words.length);
 assert.deepEqual(new Set(all.map(w=>w.id)),new Set(original));
 assert.deepEqual(words.map(w=>w.id),original);
 assert.notDeepEqual(all.map(w=>w.id),sortStudyWords(words).map(w=>w.id));
 const another=shuffleStudyWords(words,()=>0);
 assert.notDeepEqual(another.map(w=>w.id),all.map(w=>w.id));
});
test('Búsqueda latina tolera æ/ae, œ/oe, cantidades, mayúsculas y espacios',()=>{
 assert.equal(normalizeStudyQuery(' PŒNAM '),'poenam');
 assert.equal(normalizeStudyQuery('cælum'),'caelum');
 assert.equal(normalizeStudyQuery('cAElum'),'caelum');
 assert.equal(normalizeStudyQuery('lĭgnum'),'lignum');
 assert.ok(findStudyWords(words,'poenam').some(w=>w.latin==='pœnam'));
 assert.ok(findStudyWords(words,'PŒNAM').some(w=>w.latin==='pœnam'));
 assert.ok(findStudyWords(words,'CAE LUM'.replace(' ','')).some(w=>w.latin==='cælum'));
});
test('Búsqueda bidireccional recupera resultados castellanos, tildes y coincidencias parciales',()=>{
 assert.ok(findStudyWords(words,'NOChE').some(w=>w.latin==='noctem'));
 assert.ok(findStudyWords(words,'marmol').some(w=>w.answers.includes('mármol')));
 assert.ok(findStudyWords(words,'milagro').some(w=>w.latin==='miraculum'));
 assert.ok(findStudyWords(words,'nomatchesxyz').length===0);
 const results=findStudyWords(words,'lobo');
 assert.equal(results[0].answers.some(a=>a==='lobo'),true);
});
test('Catálogo cuenta por palabra, no por cambio repetido y cubre las 20 normas',()=>{
 const counts=studyRuleCounts(words);
 assert.deepEqual(Object.keys(counts),RULES.map(r=>r.id));
 for(const rule of RULES){
  const entries=studyWordsForRule(words,rule.id);
  assert.equal(entries.length,counts[rule.id]);
  assert.ok(entries.length>0);
  assert.ok(entries.every(w=>w.changes.some(c=>c.rule===rule.id)));
 }
 assert.equal(studyWordsForRule(words,'FIX_M').length,0); // categoría fija, no filtro de estudio
});
test('La norma se puede consultar aunque la palabra contenga otros fenómenos',()=>{
 const fuego=word('focum');
 assert.ok(fuego);
 assert.ok(studyWordsForRule(words,'DIPT').some(w=>w.id===fuego.id));
 assert.ok(!availableWords(words,new Set(['DIPT'])).some(w=>w.id===fuego.id));
 assert.ok(fuego.changes.some(c=>c.rule==='FIX_M'));
});
test('El catálogo permite seleccionar subtipos realmente anotados',()=>{
 const variants=studySubtypes(words,'PALAT');
 assert.ok(variants.some(v=>v.name==='-ct- > -ch-'&&v.count>0));
 for(const v of variants){
  const list=studyWordsForRule(words,'PALAT',v.name);
  assert.equal(list.length,v.count);
  assert.ok(list.every(w=>w.changes.some(c=>c.rule==='PALAT'&&c.subtype===v.name)));
 }
 assert.ok(studySubtypes(words,'CUL').some(v=>v.name==='-CUL- > -G-' && v.count>=1));
 assert.equal(studyWordsForRule(words,'CUL','inexistente').length,0);
});
test('La tarjeta señala la ubicación exacta de grupos consonánticos y -m final',()=>{
 const nox=word('noctem');
 assert.ok(nox);
 const ct=nox.changes.find(x=>x.rule==='PALAT');
 const visible=studyHighlight(nox,ct);
 assert.equal([...visible.indices].map(i=>chars(nox.latin)[i]).join(''),'ct');
 const end=nox.changes.find(x=>x.rule===FIXED_RULE.id);
 assert.equal([...studyHighlight(nox,end).indices].map(i=>chars(nox.latin)[i]).join(''),'m');
});
test('Inserciones, discontiguidad y solapamientos se muestran con los datos existentes',()=>{
 const all=words.flatMap(w=>w.changes.map(c=>({w,c})));
 const insertion=all.find(x=>Number.isInteger(x.c.anchor));
 assert.ok(insertion);
 const inserted=studyHighlight(insertion.w,insertion.c);
 assert.equal(inserted.anchor,insertion.c.anchor);
 const spaced=all.find(x=>x.c.spans?.length>1);
 assert.ok(spaced);
 const shown=studyHighlight(spaced.w,spaced.c);
 assert.equal(shown.indices.size,spaced.c.spans.reduce((a,[s,e])=>a+e-s,0));
 const overlap=words.find(w=>w.changes.some(c=>w.changes.some(other=>c!==other&&c.spans.some(([a,b])=>other.spans.some(([d,e])=>a<e&&d<b)))));
 assert.ok(overlap);
});
test('El módulo de estudio no modifica la corrección ni el desbloqueo de la práctica',()=>{
 const normal=word('pœnam');
 const s=newCardState(normal);
 const original=JSON.stringify(normal);
 findStudyWords(words,'pena');studyWordsForRule(words,'MONOP');studyHighlight(normal,normal.changes[0]);
 assert.equal(JSON.stringify(normal),original);
 assert.equal(s.phase,1);
 assert.equal(checkResult(s,normal.answers[0]),true);
 const guesses=normal.changes.map(c=>({id:c.id,rule:c.rule,spans:c.spans,anchor:c.anchor,targetId:c.id}));
 assert.equal(checkAllChanges(s,guesses).complete,true);
 assert.equal(s.phase,3);
});
