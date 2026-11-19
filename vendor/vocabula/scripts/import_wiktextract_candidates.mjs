#!/usr/bin/env node
/**
 * Candidate-only importer for Wiktextract language-specific JSONL from kaikki.org.
 * NEVER inject these forms into student-facing correction without independent verification.
 *
 * node scripts/import_wiktextract_candidates.mjs grc
 * node scripts/import_wiktextract_candidates.mjs grc tests/fixtures/wiktextract-grc.jsonl
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import {Readable} from 'node:stream';
import crypto from 'node:crypto';
import vm from 'node:vm';

const ROOT=path.resolve(import.meta.dirname,'..');
const SOURCES={
 lat:{url:'https://kaikki.org/dictionary/Latin/kaikki.org-dictionary-Latin.jsonl',lang_code:'la'},
 grc:{url:'https://kaikki.org/dictionary/Ancient%20Greek/kaikki.org-dictionary-AncientGreek.jsonl',lang_code:'grc'}
};
const language=process.argv[2],fixture=process.argv[3];
if(!Object.hasOwn(SOURCES,language))throw Error('Utiliza el idioma lat o grc');
const source=SOURCES[language];
const normalize=s=>String(s||'').toLowerCase().normalize('NFD')
 .replace(/\u0345/g,'ι').replace(/\p{M}/gu,'').replace(/æ/g,'ae').replace(/œ/g,'oe')
 .replace(/ς/g,'σ').trim();
const head=s=>normalize(String(s||'').split(/[,+(]/)[0].trim().split('/')[0]);
const ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(ROOT,'data.js'),'utf8'),ctx);
const vocab=ctx.window.VOCAB.filter(x=>language==='grc'?x.subject==='gr1':['lat1','lat4'].includes(x.subject));
const accepted=new Map();
for(const e of vocab){
 const k=head(e.form);if(!k)continue;
 if(!accepted.has(k))accepted.set(k,{entry:e.form,subjects:new Set()});
 accepted.get(k).subjects.add(e.subject);
}
const posSet=new Set(['verb','noun','adj','pron','det']);
const banned=new Set(['romanization','canonical','table-tags','inflection-template','table-header',
 'form-of','alternative','reconstructed','unattested','hypothetical','rare','archaic',
 'poetic','Epic','Ionic','Doric','Aeolic','Homeric','dialectal']);
const morphology=new Set(['indicative','subjunctive','imperative','optative','infinitive','participle',
 'present','imperfect','future','aorist','perfect','pluperfect',
 'active','passive','middle','mediopassive',
 'nominative','genitive','dative','accusative','vocative','ablative',
 'singular','plural','dual','masculine','feminine','neuter']);
const canonicalTags=tags=>tags.filter(t=>typeof t==='string').sort();
function analyze(record){
 if(!record||record.lang_code!==source.lang_code||!posSet.has(record.pos)||!Array.isArray(record.forms))return null;
 const k=head(record.word),v=accepted.get(k);
 if(!v)return null;
 const byKey=new Map();
 for(const f of record.forms){
  const form=String(f.form||'').trim(),tags=canonicalTags(Array.isArray(f.tags)?f.tags:[]);
  if(!form||form==='-'||form==='—'||/\s/u.test(form)||form.length>70)continue;
  if(tags.some(t=>banned.has(t))||!tags.some(t=>morphology.has(t)))continue;
  if(language==='grc'&&!/[\u0370-\u03ff\u1f00-\u1fff]/u.test(form))continue;
  if(language==='lat'&&!/[a-z]/iu.test(form))continue;
  const recognized=tags.filter(t=>morphology.has(t));
  if(!recognized.length)continue;
  const id=normalize(form)+'|'+tags.join(';');
  if(byKey.has(id))continue;
  byKey.set(id,{form,tags:recognized,raw_tags:tags});
  if(byKey.size>=500)break; // bounded per lemma and part of speech
 }
 if(!byKey.size)return null;
 return {lemma:k,word:record.word,entry:v.entry,
  subjects:[...v.subjects].sort(),pos:record.pos,forms:[...byKey.values()],
  source_page:'https://en.wiktionary.org/wiki/'+encodeURIComponent(record.word)};
}
async function sourceStream(){
 if(fixture){
  const local=path.resolve(ROOT,fixture);
  if(!local.startsWith(ROOT+path.sep))throw Error('Ruta de prueba fuera del proyecto');
  return {stream:fs.createReadStream(local,{encoding:'utf8'}),origin:'fixture:'+fixture};
 }
 const response=await fetch(source.url,{headers:{'User-Agent':'ClassicsVocabularyAudit/1.0'},signal:AbortSignal.timeout(18*60*1000)});
 if(!response.ok||!response.body)throw Error('No se pudo descargar Wiktextract: HTTP '+response.status);
 return {stream:Readable.fromWeb(response.body),origin:source.url};
}
const records=new Map(),hash=crypto.createHash('sha256');
let scanned=0,matched=0,bad=0;
const {stream,origin}=await sourceStream();
const reader=readline.createInterface({input:stream,crlfDelay:Infinity});
for await(const line of reader){
 if(!line.trim())continue;
 scanned++;
 // Filter by headword only after JSON parsing: field order differs between extracts.
 let value;
 try{value=JSON.parse(line)}catch{bad++;continue}
 const parsed=analyze(value);
 if(!parsed)continue;
 const k=parsed.lemma+'|'+parsed.pos;
 if(!records.has(k))records.set(k,parsed);
 else{
  // Variants and etymology sections may create multiple records.
  const current=records.get(k);
  const seen=new Set(current.forms.map(x=>normalize(x.form)+'|'+(x.raw_tags||x.tags).join(';')));
  for(const f of parsed.forms){
   const id=normalize(f.form)+'|'+(f.raw_tags||f.tags).join(';');
   if(seen.has(id))continue;
   current.forms.push(f);seen.add(id);
   if(current.forms.length>=500)break;
  }
 }
 hash.update(line);matched++;
}
if(scanned<1||!records.size)throw Error('No se encontraron paradigmas candidatos para el vocabulario '+language);
const allEntries=[...records.values()];
const quality={
 distinct_lemmas:new Set(allEntries.map(e=>e.lemma)).size,
 by_part_of_speech:Object.fromEntries([...new Set(allEntries.map(e=>e.pos))].sort().map(pos=>[
  pos,{entries:allEntries.filter(e=>e.pos===pos).length,forms:allEntries.filter(e=>e.pos===pos).reduce((s,e)=>s+e.forms.length,0)}
 ])),
 nominal_case_and_number:allEntries.filter(e=>e.pos!=='verb').reduce((sum,e)=>sum+e.forms.filter(f=>
  f.tags.some(t=>['nominative','genitive','dative','accusative','vocative','ablative'].includes(t))&&
  f.tags.some(t=>['singular','plural'].includes(t))&&!f.tags.includes('dual')).length,0),
 finite_verbs_with_tense_person_number:allEntries.filter(e=>e.pos==='verb').reduce((sum,e)=>sum+e.forms.filter(f=>
  f.tags.some(t=>['present','imperfect','aorist','future','perfect','pluperfect'].includes(t))&&
  f.tags.some(t=>['first-person','second-person','third-person'].includes(t))&&
  f.tags.some(t=>['singular','plural'].includes(t))&&
  f.tags.some(t=>['indicative','imperative','subjunctive','optative'].includes(t))).length,0)
};
const destination=path.join(ROOT,'data','wiktextract-candidates-'+language+'.json');
const data={
 schema:1,lang:language,source:origin,generated_at:new Date().toISOString(),
 license:'CC BY-SA 4.0 (Wiktionary contributors)',
 license_url:'https://creativecommons.org/licenses/by-sa/4.0/',
 attribution:'Wiktionary contributors, via Wiktextract/kaikki.org; only modified and filtered data.',
 source_rows_scanned:scanned,matched_entries:matched,invalid_rows:bad,
 matched_rows_sha256:hash.digest('hex'),quality,
 status:'CANDIDATE_ONLY_NOT_VALIDATED',
 entries:allEntries.sort((a,b)=>a.lemma.localeCompare(b.lemma))
};
fs.writeFileSync(destination,JSON.stringify(data,null,2)+'\n');
console.log('CANDIDATOS '+language+': '+scanned+' entradas examinadas, '+data.entries.length+' lemas+categorías, '+data.entries.reduce((n,x)=>n+x.forms.length,0)+' formas; '+quality.nominal_case_and_number+' nominales con caso/número y '+quality.finite_verbs_with_tense_person_number+' verbales con tiempo/persona/número. NO PUBLICADOS COMO RESPUESTAS.');
