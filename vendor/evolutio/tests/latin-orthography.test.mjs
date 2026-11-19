import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {latinU,latinKey,normalizeLatinLemmaMentions} from '../src/latin.mjs';
import {findStudyWords} from '../src/study.mjs';
import {RULES} from '../src/rules.mjs';
import {validationErrors} from '../src/engine.mjs';
import {annotateDirect,auditImport} from '../tools/import-generador.mjs';

const bank=JSON.parse(readFileSync(new URL('../data/pilot.json',import.meta.url),'utf8'));
const words=bank.words;
const get=id=>words.find(w=>w.id===id);
const source=JSON.parse(readFileSync(new URL('../data/imports/generador-655.json',import.meta.url),'utf8'));

test('Grafía latina uniforme en las 522 fichas, sin cambiar el castellano',()=>{
 assert.equal(words.length,522);
 assert.equal(words.filter(w=>/[vV]/u.test(w.latin)).length,0);
 assert.equal(get('ge-EVF-0338').latin,'uitam');
 assert.deepEqual(get('ge-EVF-0338').answers,['vida']);
 assert.equal(get('xl-61').latin,'clauem');
 assert.deepEqual(get('xl-61').answers,['llave']);
 assert.equal(get('xl-343').latin,'uiuite');
 assert.deepEqual(get('xl-343').answers,['vivid']);
 assert.equal(get('ge-EVF-0545').latin,'uerrucam');
 assert.equal(get('xl-164').latin,'iuuentutem');
 assert.deepEqual(validationErrors(bank),[]);
});
test('u/v conservan longitud y no alteran la localización exacta de las normas',()=>{
 assert.equal(latinU('vitam'),'uitam');
 assert.equal(latinU('Vĭrĭdem'),'Uĭrĭdem');
 assert.equal(latinU('vivite'),'uiuite');
 assert.equal(latinU('clavem'),'clauem');
 assert.equal(latinKey('vĕntrem'),latinKey('uĕntrem'));
 assert.equal(latinKey('VĕNTREM'),latinKey('UENTREM'));
 for(const w of words)for(const change of w.changes){
  for(const [start,end] of change.spans??[]){
   assert.ok(start>=0&&end<=[...w.latin].length&&start<end,w.latin);
  }
 }
});
test('Las explicaciones cambian sólo el lema latino, nunca la traducción romance',()=>{
 assert.equal(normalizeLatinLemmaMentions('vitam → vida: Vita y vida.','vitam'),'uitam → vida: Vita y vida.');
 assert.equal(normalizeLatinLemmaMentions('Vĕntum > viento; ventum > viento.','ventum'),'Uĕntum > viento; uentum > viento.');
 assert.match(get('xl-61').explanation,/clauem > llave/);
 assert.match(get('xl-61').explanation,/u consonántica latina/);
 assert.match(get('xl-217').explanation,/octauum > ochavo/);
 assert.match(get('ge-EVF-0338').explanation,/uitam → vida/);
});
test('La búsqueda admite indistintamente v y u en latín, sin alterar la v castellana',()=>{
 for(const [historic,current,id] of [
  ['vitam','uitam','ge-EVF-0338'],
  ['clavem','clauem','xl-61'],
  ['viridem','uiridem','xl-458'],
  ['Vĕntrem','Uĕntrem','ge-EVF-0331']
 ]){
  assert.ok(findStudyWords(words,historic).some(w=>w.id===id),historic);
  assert.ok(findStudyWords(words,current).some(w=>w.id===id),current);
 }
 assert.ok(findStudyWords(words,'vida').some(w=>w.id==='ge-EVF-0338'));
 assert.ok(findStudyWords(words,'vivid').some(w=>w.id==='xl-343'));
 assert.ok(findStudyWords(words,'llave').some(w=>w.id==='xl-61'));
});
test('La fuente externa original se conserva y no duplica lemas con v tras importar',()=>{
 const src=source.items.find(x=>x.id==='EVF-0338');
 assert.ok(src);
 assert.equal(src.latin,'vitam');
 const converted=annotateDirect(src);
 assert.equal(converted.status,'auto_aligned');
 assert.equal(converted.word.latin,'uitam');
 assert.equal(converted.word.answers[0],'vida');
 assert.deepEqual(converted.word.changes,get('ge-EVF-0338').changes);
 const audit=auditImport({esquema:'evoluciones-latin-castellano/v1',items:[src]},
   {version:1,words:[get('ge-EVF-0338')]});
 assert.equal(audit.overlap.length,1);
 assert.equal(audit.accepted.length,0);
 assert.equal(audit.pending.length,0);
});
test('El ejemplo de palatalización usa u latina',()=>{
 const palat=RULES.find(r=>r.id==='PALAT');
 assert.ok(palat.examples.includes('clauem → llave'));
 assert.ok(!palat.examples.some(e=>/clavem/i.test(e)));
});
