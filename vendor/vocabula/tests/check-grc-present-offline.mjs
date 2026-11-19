#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { corpus, normalizeGreek, lemmatizeGreekPresent, expandOptionalNu } from '../scripts/grc_present_lookup.mjs';

const keySet = ['1sg','2sg','3sg','1pl','2pl','3pl'];
const ids = new Set();
const allowed = new Set(['direct_paradigm','pattern_and_lexeme','pattern_only','candidate_only']);
const perForm = new Set(['reference_checked','rule_checked','candidate']);
let paradigms=0, forms=0, deponents=0, lexicalMiddle=0, reviewedDirect=0, reviewedLexical=0, candidates=0;

assert.equal(corpus.language,'grc');
assert.equal(corpus.schema_version,2);
for(const e of corpus.entries) {
 const k=normalizeGreek(e.lemma);
 assert.ok(!ids.has(k), 'Lema duplicado: '+e.lemma);
 ids.add(k);
 assert.ok(e.paradigms.length>=1, 'Sin paradigmas: '+e.lemma);
 if(e.deponent)deponents++;
 if(e.paradigms.some(p=>p.voice==='middle-lexical'))lexicalMiddle++;
 for(const p of e.paradigms) {
  paradigms++;
  assert.deepEqual(Object.keys(p.forms),keySet,'Persona omitida: '+e.lemma);
  assert.ok(['rule_generated','explicit_exception'].includes(p.status));
  assert.ok(allowed.has(p.review?.tier),'Revisión indefinida: '+e.lemma);
  assert.ok(Array.isArray(p.review.source_urls));
  assert.deepEqual(Object.keys(p.review.per_person),keySet);
  if(p.review.tier==='direct_paradigm')reviewedDirect++;
  if(p.review.tier==='pattern_and_lexeme')reviewedLexical++;
  if(p.review.tier==='candidate_only')candidates++;
  if(e.deponent)assert.equal(p.voice,'deponent','Clasificación deponente: '+e.lemma);
  for(const [slot,form] of Object.entries(p.forms)){
   forms++;
   assert.equal(form,form.normalize('NFC'),'Unicode no NFC: '+e.lemma+' '+slot);
   assert.ok(perForm.has(p.review.per_person[slot]));
   const all=[form,...(p.alternates?.[slot]??[])];
   for(const formVariant of all)for(const variant of expandOptionalNu(formVariant)){
    const analysis=lemmatizeGreekPresent(variant).find(x=>
      x.lemma===e.lemma&&x.voice===p.voice&&x.person===Number(slot[0])&&
      x.number===(slot.endsWith('sg')?'singular':'plural'));
    assert.ok(analysis,'No hay lematización para '+e.lemma+': '+variant);
    assert.equal(analysis.verification,p.review.per_person[slot]);
    assert.equal(analysis.accent_match,'exact');
   }
  }
 }
}
assert.deepEqual(corpus.summary,{
 lexemes:ids.size,paradigms,finiteForms:forms,deponents,lexicalMiddle,
 reviewedDirect,reviewedLexical,candidates
});
assert.equal(ids.size,81);
assert.equal(paradigms,135);
assert.equal(forms,810);
assert.equal(deponents,7);
assert.equal(lexicalMiddle,1);
assert.equal(reviewedDirect,8);
assert.equal(reviewedLexical,17);
assert.equal(candidates,2);
assert.deepEqual(corpus.entries.flatMap(e=>e.paradigms.filter(p=>p.review.tier==='candidate_only').map(()=>e.lemma)).sort(),['ἀναγιγνώσκω','εἰσβάλλω'].sort());

function get(lemma,voice) {
 const e=corpus.entries.find(x=>normalizeGreek(x.lemma)===normalizeGreek(lemma));
 assert.ok(e, 'Falta '+lemma);
 const p=e.paradigms.find(x=>x.voice===voice);
 assert.ok(p, 'Falta voz '+lemma+' '+voice);
 return p;
}
function check(surface,lemma,voice,person,number){
 const results=lemmatizeGreekPresent(surface);
 assert.ok(results.some(x=>x.lemma===lemma&&x.voice===voice&&x.person===person&&
 x.number===number&&x.tense==='present'&&x.mood==='indicative'), 'No reconoce '+surface+' -> '+lemma);
}
for(const [lemma,voice,expected] of [
 ['λύω','active',['λύω','λύεις','λύει','λύομεν','λύετε','λύουσι(ν)']],
 ['λύω','middle-passive',['λύομαι','λύῃ','λύεται','λυόμεθα','λύεσθε','λύονται']],
 ['εἰμί','active',['εἰμί','εἶ','ἐστί(ν)','ἐσμέν','ἐστέ','εἰσί(ν)']],
 ['βούλομαι','deponent',['βούλομαι','βούλει','βούλεται','βουλόμεθα','βούλεσθε','βούλονται']],
 ['νικάω','active',['νικῶ','νικᾷς','νικᾷ','νικῶμεν','νικᾶτε','νικῶσι(ν)']],
 ['νικάω','middle-passive',['νικῶμαι','νικᾷ','νικᾶται','νικώμεθα','νικᾶσθε','νικῶνται']],
 ['φιλέω','active',['φιλῶ','φιλεῖς','φιλεῖ','φιλοῦμεν','φιλεῖτε','φιλοῦσι(ν)']],
 ['φιλέω','middle-passive',['φιλοῦμαι','φιλῇ','φιλεῖται','φιλούμεθα','φιλεῖσθε','φιλοῦνται']]
]){
 const p=get(lemma,voice);
 assert.equal(p.review.tier,'direct_paradigm');
 assert.deepEqual(Object.values(p.forms),expected,'Discrepancia con referencia de '+lemma);
}
for(const [surface,lemma,voice,person,number] of [
 ['λύω','λύω','active',1,'singular'],
 ['λυομαι','λύω','middle-passive',1,'singular'],
 ['λύουσι','λύω','active',3,'plural'],
 ['λύουσιν','λύω','active',3,'plural'],
 ['λύει','λύω','active',3,'singular'],
 ['λύει','λύω','middle-passive',2,'singular'],
 ['γίγνεται','γίγνομαι','deponent',3,'singular'],
 ['ΓΙΓΝΟΜΕΘΑ','γίγνομαι','deponent',1,'plural'],
 ['γίγνει','γίγνομαι','deponent',2,'singular'],
 ['ἔρχῃ','ἔρχομαι','deponent',2,'singular'],
 ['βούλῃ','βούλομαι','deponent',2,'singular'],
 ['βούλει','βούλομαι','deponent',2,'singular'],
 ['μάχονται','μάχομαι','deponent',3,'plural'],
 ['ἡγεῖται','ἡγέομαι','deponent',3,'singular'],
 ['ἡγεῖ','ἡγέομαι','deponent',2,'singular'],
 ['ἡγῇ','ἡγέομαι','deponent',2,'singular'],
 ['ἀφικνούμεθα','ἀφικνέομαι','deponent',1,'plural'],
 ['ὁρμῶμαι','ὁρμάομαι','middle-lexical',1,'singular'],
 ['εὐφραίνομαι','εὐφραίνω','middle-passive',1,'singular'],
 ['κομιζόμεθα','κομίζω','middle-passive',1,'plural'],
 ['στρατεύονται','στρατεύω','middle-passive',3,'plural'],
 ['φυόμεθα','φύω','middle-passive',1,'plural'],
 ['νικᾷ','νικάω','middle-passive',2,'singular'],
 ['φιλοῦμεν','φιλέω','active',1,'plural'],
 ['ἐπιθυμῶ','ἐπιθυμέω','active',1,'singular'],
 ['πλέομεν','πλέω','active',1,'plural'],
 ['ἀποπλεῖτε','ἀποπλέω','active',2,'plural'],
 ['εἶ','εἰμί','active',2,'singular'],
 ['ἐστίν','εἰμί','active',3,'singular'],
 ['εἰσίν','εἰμί','active',3,'plural']
])check(surface,lemma,voice,person,number);
assert.ok(lemmatizeGreekPresent('λύει').length>=2,'Debe conservar lecturas ambiguas');
assert.equal(lemmatizeGreekPresent('λυομαι')[0]?.accent_match,'folded');
assert.equal(lemmatizeGreekPresent('λύομαι')[0]?.accent_match,'exact');
assert.deepEqual(lemmatizeGreekPresent(''),[]);
assert.deepEqual(lemmatizeGreekPresent('δύναμαι'),[]);
assert.deepEqual(lemmatizeGreekPresent('palabra-inexistente'),[]);
// Los lemas no deben proceder de listas externas: únicamente del vocabulario
// docente de Griego I, además del paradigma de εἰμί introducido en gramática.
const voc=JSON.parse(readFileSync(new URL('../data.js',import.meta.url),'utf8')
 .replace(/^window.VOCAB=/,'').replace(/;\s*$/,''));
const greekSource=new Set(voc.filter(x=>x.subject==='gr1')
 .flatMap(x=>x.form.split(/[,+(]/)[0].split(/\s+o\s+/u))
 .map(normalizeGreek));
for(const e of corpus.entries)
 assert.ok(e.lemma==='εἰμί'||greekSource.has(normalizeGreek(e.lemma)),
  'Lema no docente: '+e.lemma);
console.log('OK: '+ids.size+' lemas, '+paradigms+' paradigmas, '+forms+
 ' formas; '+reviewedDirect+' paradigmas comprobados directamente, '+
 candidates+' medios candidatos y '+deponents+' deponentes estrictos.');
