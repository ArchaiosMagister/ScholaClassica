#!/usr/bin/env node
/**
 * Process EVERY UniMorph TSV row, retaining all attested inflections whose
 * lemmas match the teacher's vocabulary.  No inference or fabricated forms.
 * The output is sharded for GitHub Pages and records its exact upstream commit.
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import https from 'node:https';
import crypto from 'node:crypto';

const ROOT=path.resolve(import.meta.dirname,'..');
const TARGET=path.join(ROOT,'data','unimorph-syllabus');
const SOURCES={
 lat:{sha:'050924c9f013e6aba4d7c87be243a1d79b6c5b10',parts:32,subjects:['lat1','lat4']},
 grc:{sha:'7f4a58df733726c75c1355dd3a038e950d5e308f',parts:8,subjects:['gr1']}
};
const canonical=s=>String(s||'').toLowerCase().normalize('NFD')
 .replace(/\u0345/g,'ι').replace(/\p{M}/gu,'').replace(/æ/g,'ae').replace(/œ/g,'oe')
 .replace(/ς/g,'σ').trim();
// El griego ático necesita identidad léxica con acento y espíritu; ignorar
// solo cantidad y la alternancia final agudo/grave (no otros dialectos).
const greekHeadKey=s=>String(s||'').trim().toLowerCase().normalize('NFD')
 .replace(/[\u0304\u0306]/g,'').replace(/\u0300/g,'\u0301')
 .normalize('NFC');
function bucket(s,count){let hash=2166136261;for(const ch of s)hash=Math.imul(hash^ch.codePointAt(0),16777619)>>>0;return hash%count}
function readVocab(){
 const data=fs.readFileSync(path.join(ROOT,'data.js'),'utf8').trim();
 const prefix='window.VOCAB=';
 if(!data.startsWith(prefix))throw Error('data.js no contiene window.VOCAB');
 return JSON.parse(data.slice(prefix.length).replace(/;\s*$/,''));
}
function lemma(form){
 const head=String(form||'').split(/[,+(]/)[0].trim();
 if(!head||/\s/u.test(head))return null;
 return canonical(head.split('/')[0]);
}
/* Greek UniMorph includes definite articles in noun surfaces; remove only
   explicitly recognized article prefixes. Preserve the original for audit. */
const ARTICLES=new Set(['ο','η','το','τον','την','του','τησ','τω','τη','οι','αι',
 'τουσ','τασ','τα','των','τοισ','ταισ','τοιν','τωι','τηι'].map(canonical));
// Canonical(τῷ) = τωι and canonical(τῇ) = τηι: ignoring the iota subscript
// used to delete virtually every article-prefixed Greek dative singular.
function cleanSurface(lang,surface){
 const raw=String(surface||'').trim();
 if(lang!=='grc'||!/\s/u.test(raw))return raw;
 const split=raw.lastIndexOf(' ');
 const last=raw.slice(split+1),prefix=raw.slice(0,split).trim();
 const parts=prefix.split(/[,\s]+/u).filter(Boolean).map(canonical);
 return parts.length&&parts.every(p=>ARTICLES.has(p))?last:null;
}
// Validate the article-stripping logic independently of upstream downloads.
for(const [raw,expected] of [
 ['τῷ λόγῳ','λόγῳ'],
 ['τῇ γῇ','γῇ'],
 ['τοῖς λόγοις','λόγοις'],
 ['τῆς γῆς','γῆς'],
 ['λόγῳ','λόγῳ']
]){
 if(cleanSurface('grc',raw)!==expected)
  throw Error('No se conserva una forma griega con artículo: '+raw);
}
function selectVocab(data){
 const chosen={lat:new Set(),grc:new Set()},metadata={};
 const greekAuthorizedHeads=new Map();
 for(const row of data){
  if(!['lat1','lat4','gr1'].includes(row.subject))continue;
  const lang=row.subject==='gr1'?'grc':'lat';
  const key=lemma(row.form);
  if(!key)continue;
  chosen[lang].add(key);
  if(lang==='grc'){
   if(!greekAuthorizedHeads.has(key))greekAuthorizedHeads.set(key,new Set());
   greekAuthorizedHeads.get(key).add(greekHeadKey(String(row.form).split(/[,+(]/)[0].trim().split('/')[0]));
  }
  if(!metadata[row.subject])metadata[row.subject]={lemmas:new Set(),entries:0};
  metadata[row.subject].lemmas.add(key);
  metadata[row.subject].entries++;
 }
 return {chosen,metadata,greekAuthorizedHeads};
}
function openStream(url){
 return new Promise((resolve,reject)=>{
  https.get(url,{headers:{'User-Agent':'classics-grammar-import/1.0'}},response=>{
   if([301,302,307,308].includes(response.statusCode)){
    const redirect=response.headers.location;response.resume();
    if(!redirect||!redirect.startsWith('https://'))return reject(Error('Redirección no segura'));
    return openStream(redirect).then(resolve,reject);
   }
   if(response.statusCode!==200){const code=response.statusCode;response.resume();reject(Error('Descarga fallida: HTTP '+code));return}
   resolve(response);
  }).on('error',reject);
 });
}
async function importOne(lang,source,chosen,greekAuthorizedHeads){
 const url='https://raw.githubusercontent.com/unimorph/'+lang+'/'+source.sha+'/'+lang;
 const stream=await openStream(url),hash=crypto.createHash('sha256');
 const shards=Array.from({length:source.parts},()=>[]);
 const seen=new Set(),seenLemmas=new Set();
 let sourceRows=0,matchedRows=0,bad=0,rawSize=0;
 stream.on('data',chunk=>{hash.update(chunk);rawSize+=chunk.length});
 const lines=readline.createInterface({input:stream,crlfDelay:Infinity});
 for await(const line of lines){
  if(!line||line[0]==='#')continue;
  sourceRows++;
  const fields=line.split('\t');
  if(fields.length<3){bad++;continue}
  const [head,surface,...rest]=fields;
  const features=rest.join('\t').trim(),key=canonical(head);
  if(!head.trim()||!surface.trim()||!features){bad++;continue}
  if(!chosen.has(key))continue;
  // Un acento diferente puede cambiar el lema (νόμος/νομός, βίος/βιός).
  // El TSV no marca dialecto en cada fila. Esta barrera previene confusiones
  // léxicas, pero NO equivale a acreditar cada flexión como ática.
  if(lang==='grc'&&!greekAuthorizedHeads?.get(key)?.has(greekHeadKey(head)))continue;
  const form=cleanSurface(lang,surface);
  if(!form){bad++;continue}
  const id=key+'\t'+canonical(form)+'\t'+features;
  if(seen.has(id))continue;seen.add(id);
  matchedRows++;seenLemmas.add(key);
  shards[bucket(key,source.parts)].push(form===surface.trim()?[head,form,features]:[head,form,features,surface]);
 }
 if(sourceRows<1000)throw Error('Archivo fuente demasiado pequeño: '+lang+' '+sourceRows);
 const dest=path.join(TARGET,lang);
 fs.mkdirSync(dest,{recursive:true});
 const files=[];
 for(let i=0;i<shards.length;i++){
  shards[i].sort((a,b)=>canonical(a[0]).localeCompare(canonical(b[0]))||a[2].localeCompare(b[2])||a[1].localeCompare(b[1]));
  const name='part-'+String(i).padStart(2,'0')+'.json';
  const payload=JSON.stringify(shards[i]);
  fs.writeFileSync(path.join(dest,name),payload+'\n');
  files.push({path:lang+'/'+name,rows:shards[i].length,bytes:Buffer.byteLength(payload,'utf8')});
 }
 return {
  source:url,source_commit:source.sha,license:'CC BY-SA 3.0',license_url:'https://creativecommons.org/licenses/by-sa/3.0/',
  source_sha256:hash.digest('hex'),source_bytes:rawSize,source_rows:sourceRows,malformed_rows:bad,
  retained_rows:matchedRows,retained_lemmas:seenLemmas.size,
  vocabulary_lemmas:chosen.size,missing_vocabulary_lemmas:[...chosen].filter(x=>!seenLemmas.has(x)).sort(),
  part_count:source.parts,files
 };
}
async function main(){
 const {chosen,metadata,greekAuthorizedHeads}=selectVocab(readVocab());
 fs.rmSync(TARGET,{recursive:true,force:true});
 fs.mkdirSync(TARGET,{recursive:true});
 const results={};
 for(const [lang,src] of Object.entries(SOURCES)){
  console.log('Importando',lang,'lemas del curso:',chosen[lang].size);
  results[lang]=await importOne(lang,src,chosen[lang],greekAuthorizedHeads);
  console.log(lang,'original:',results[lang].source_rows,'filas; incorporadas:',results[lang].retained_rows,'lemas:',results[lang].retained_lemmas);
 }
 const manifest={
  schema:1,
  scope:'UniMorph attestations filtered to the teacher vocabulary. Greek headwords must match diacritics; individual surface dialect is not certified.',
  source_license:'CC BY-SA 3.0',
  attribution:'UniMorph lat (English Wiktionary) and UniMorph grc (Wikipedia); original contributors credited in upstream READMEs.',
  greek_headword_policy:'Attic teaching: only accent-and-breathing-matched source Greek headwords; source surface dialect tags unavailable. Not sufficient to certify every inflected form.',
  subjects:Object.fromEntries(Object.entries(metadata).map(([subject,v])=>[subject,{vocabulary_entries:v.entries,distinct_lemmas:v.lemmas.size}])),
  languages:results
 };
 fs.writeFileSync(path.join(TARGET,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 fs.writeFileSync(path.join(TARGET,'LICENSE-DATA.md'),
  '# UniMorph corpus data\n\nThis directory incorporates, filters and reindexes data from [UniMorph Latin](https://github.com/unimorph/lat) and [UniMorph Ancient Greek](https://github.com/unimorph/grc). They are distributed under [Creative Commons Attribution-ShareAlike 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Derivative corpus indexes under this directory carry that license and require attribution and share-alike. Upstream original source SHA, source checksums and counts are in manifest.json. Code outside this directory is separate.\n');
 if(!results.lat.retained_rows||!results.grc.retained_rows)throw Error('No se encontraron registros para un idioma');
}
main().catch(e=>{console.error(e);process.exitCode=1});
