#!/usr/bin/env node
/* Check that cross-index validation accepts compatible cells but rejects
 * conflicting forms and lexical-category homonyms. Synthetic forms are
 * test data, NEVER answer keys. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'data/unimorph-syllabus/manifest.json'),'utf8'));
const cases={NOM:'nominative',GEN:'genitive',DAT:'dative',ACC:'accusative',ABL:'ablative',VOC:'vocative'};
const nums={SG:'singular',PL:'plural'};
for(const lang of ['lat','grc']){
 const byLemma=new Map();
 for(let i=0;i<manifest.languages[lang].part_count;i++){
  const file=path.join(root,'data/unimorph-syllabus',lang,'part-'+String(i).padStart(2,'0')+'.json');
  for(const [lemma,form,tags]of JSON.parse(fs.readFileSync(file,'utf8'))){
   const [pos,cas,num]=String(tags).split(';');
   if(pos!=='N'||!cases[cas]||!nums[num])continue;
   if(!byLemma.has(lemma))byLemma.set(lemma,new Map());
   const slot=cas+':'+num;
   if(!byLemma.get(lemma).has(slot))byLemma.get(lemma).set(slot,{form,tags:[cases[cas],nums[num]]});
  }
 }
 const minimum=lang==='lat'?10:8;
 const entry=[...byLemma.entries()].find(([,slots])=>slots.size>=minimum);
 assert.ok(entry,'No se encontró un sustantivo de referencia con '+minimum+' casillas: '+lang);
 const [originalLemma,slots]=entry;
 const lemma=originalLemma.toLowerCase().normalize('NFD').replace(/\u0345/g,'ι').replace(/\p{M}/gu,'').replace(/æ/g,'ae').replace(/œ/g,'oe').replace(/ς/g,'σ');
 const base={lemma,word:originalLemma,entry:originalLemma,subjects:[lang==='lat'?'lat1':'gr1'],
  pos:'noun',forms:[...slots.values()].map(f=>({form:f.form,tags:f.tags,raw_tags:f.tags})),
  source_page:'https://en.wiktionary.org/wiki/'+encodeURIComponent(lemma)};
 const fixturePath='tests/fixtures/crosscheck-'+lang+'-synthetic.json';
 const target=path.join(root,fixturePath);
 const check=entries=>{
  fs.writeFileSync(target,JSON.stringify({
   schema:1,lang,status:'CANDIDATE_ONLY_NOT_VALIDATED',
   source:'synthetic test only',entries
  }));
  execFileSync(process.execPath,['scripts/crosscheck_wiktextract_nominals.mjs',lang,fixturePath],{cwd:root});
  return JSON.parse(fs.readFileSync(path.join(root,'data/wiktextract-crosscheck-'+lang+'.json'),'utf8'));
 };
 try{
  const compatible=check([base]);
  assert.equal(compatible.qualifying_paradigms,1,'Paradigma completo y compatible rechazado: '+lang);
  assert.ok(compatible.explicit_matching_cells>=minimum);
  const changed=JSON.parse(JSON.stringify(base));
  changed.forms[0].form='FORMA-SINTÉTICA-INEXISTENTE';
  const conflict=check([changed]);
  assert.equal(conflict.qualifying_paradigms,0,'Se aceptó una casilla contradictoria: '+lang);
  assert.equal(conflict.contradictory,1);
  const ambiguous=check([base,{...base,pos:'adj'}]);
  assert.equal(ambiguous.qualifying_paradigms,0,'No se rechazó la homonimia de categorías');
  assert.equal(ambiguous.ambiguous_lemmas,2);
 }finally{
  fs.rmSync(target,{force:true});
 }
 console.log('Prueba de validación nominal '+lang+': acuerdo, contradicción y homonimia correctos.');
}
