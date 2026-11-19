#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const ROOT=path.resolve(import.meta.dirname,'..');
const DIR=path.join(ROOT,'data','unimorph-syllabus');
const manifest=JSON.parse(fs.readFileSync(path.join(DIR,'manifest.json'),'utf8'));
assert.equal(manifest.schema,1);
// En griego los diacríticos distinguen lexemas; los índices regenerados
// deben contener solo cabeceras compatibles con el vocabulario docente.
const accentless=s=>String(s).toLowerCase().normalize('NFD')
 .replace(/\u0345/g,'ι').replace(/\p{M}/gu,'').replace(/ς/g,'σ').trim();
const accented=s=>String(s).toLowerCase().normalize('NFD')
 .replace(/[\u0304\u0306]/g,'').replace(/\u0300/g,'\u0301').normalize('NFC').trim();
const vocabData=JSON.parse(fs.readFileSync(path.join(ROOT,'data.js'),'utf8')
 .replace(/^window\.VOCAB\s*=\s*/,'').replace(/;\s*$/,''));
const greekHeads=new Map();
for(const entry of vocabData.filter(e=>e.subject==='gr1')){
 const head=String(entry.form).split(/[,+(]/)[0].trim().split('/')[0].trim();
 const key=accentless(head);
 if(!greekHeads.has(key))greekHeads.set(key,new Set());
 greekHeads.get(key).add(accented(head));
}
for(const lang of ['lat','grc']){
 const info=manifest.languages[lang];assert.ok(info);
 assert.ok(info.source_rows>10000);
 assert.ok(info.retained_rows>100);
 assert.ok(info.retained_lemmas>25);
 assert.match(info.source_sha256,/^[0-9a-f]{64}$/);
 let count=0,greekProvenance=0;
 const ids=new Set();
 for(let n=0;n<info.part_count;n++){
  const fp=path.join(DIR,lang,'part-'+String(n).padStart(2,'0')+'.json');
  const raw=fs.readFileSync(fp,'utf8');
  assert.ok(Buffer.byteLength(raw)<2*1024*1024,'Shard excesivo: '+fp);
  for(const row of JSON.parse(raw)){
   count++;
   assert.ok(Array.isArray(row)&&row.length>=3,'Fila incompleta');
   const [lemma,form,tags]=row;
   assert.ok(lemma&&form&&tags&&tags.includes(';'),'Fila inválida');
   if(lang==='grc'&&manifest.greek_headword_policy){
    const k=accentless(lemma),matches=greekHeads.get(k);
    assert.ok(matches&&matches.has(accented(lemma)),
     'Cabecera de UniMorph confundida por acento o espíritu: '+lemma);
   }
   const id=[lemma,form,tags].join('|');
   assert.equal(ids.has(id),false,'Fila duplicada '+id);
   ids.add(id);
   if(lang==='grc'){
    assert.ok(!/\s/u.test(form),'Forma griega con artículo: '+form);
    if(row[3])greekProvenance++;
   }
  }
 }
 assert.equal(count,info.retained_rows,'Recuento erróneo en '+lang);
 if(lang==='grc')assert.ok(greekProvenance>0,'Falta conservar el griego original');
}
const window={};
const file=name=>fs.readFileSync(path.join(ROOT,name),'utf8');
const fetch=async url=>{
 const fp=path.resolve(ROOT,url);
 if(!fp.startsWith(ROOT+path.sep))throw Error('Ruta fuera de proyecto');
 try{return {ok:true,json:async()=>JSON.parse(fs.readFileSync(fp,'utf8'))}}
 catch(e){return {ok:false,status:404,json:async()=>{throw e}}}
};
const ctx=vm.createContext({window,fetch,console});
vm.runInContext(file('data.js'),ctx);
vm.runInContext(file('gramatica-enunciados.js'),ctx);
vm.runInContext(file('gramatica-importada.js'),ctx);
for(const subject of ['lat1','lat4','gr1']){
 const result=await window.GrammarImported.load(subject);
 const ids=new Set();
 assert.ok(result.rows>0,subject+' sin lemas importados');
 assert.ok(result.items.length>10,subject+' sin ejercicios');
 for(const item of result.items){
  assert.equal(ids.has(item.id),false,'ID duplicado '+item.id);
  ids.add(item.id);
  assert.equal(item.subject,subject);
  assert.ok(item.unit&&item.topic&&item.answer);
  if(item.mode==='write')assert.ok(item.accepted.includes(window.GrammarImported.norm(item.answer.replaceAll('(ν)',''))),'Respuesta descartada '+item.id);
  if(item.mode==='write'&&item.language==='lat'&&item.category==='Morfología verbal')assert.match(item.prompt,/, [^,]+, [^,]+ \((?:1ª|2ª|3ª|4ª|mx\.|irr\.)\)|, [^,]+ \((?:1ª|2ª|3ª|4ª)\)/,'Enunciado importado incompleto: '+item.id);
  if(item.mode==='choice')assert.equal(item.options.filter(x=>x===item.answer).length,1,'Opción ambigua '+item.id);
  if(item.language==='grc'&&item.mode==='write')assert.ok(!/\s/u.test(item.answer),'Griego no limpiado '+item.id);
 }
 console.log(subject+': '+result.rows+' filas; '+result.items.length+' ejercicios importados.');
}
console.log('Corpus comprobado: '+manifest.languages.lat.retained_rows+' filas latinas y '+manifest.languages.grc.retained_rows+' griegas.');
