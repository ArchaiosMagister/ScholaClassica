#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const langs=process.argv[2]?[process.argv[2]]:['lat','grc'];
for(const lang of langs){
 assert.ok(['lat','grc'].includes(lang));
 const file=path.join(root,'data/wiktextract-crosscheck-'+lang+'.json');
 const result=JSON.parse(fs.readFileSync(file,'utf8'));
 const source=JSON.parse(fs.readFileSync(path.join(root,'data/wiktextract-candidates-'+lang+'.json'),'utf8'));
 assert.equal(result.schema,1);
 assert.equal(result.language,lang);
 assert.equal(result.status,'CROSS_INDEX_CONSISTENCY_ONLY_NOT_PUBLISHED');
 assert.match(result.warning,/NOT independent verification/);
 assert.ok(result.scanned_entries>0);
 assert.equal(result.candidates.length,result.qualifying_paradigms);
 assert.equal(result.candidate_new_cells,result.candidates.reduce((n,p)=>n+p.new_cells.length,0));
 assert.equal(result.explicit_matching_cells,result.candidates.reduce((n,p)=>n+p.matching_cells,0));
 assert.ok(result.qualifying_paradigms<=result.scanned_entries);
 assert.ok(result.candidates.every(p=>p.review_status==='REQUIRES_INDEPENDENT_VALIDATION'));
 const ids=new Set();
 for(const p of result.candidates){
  assert.ok(['noun','adj'].includes(p.pos));
  assert.ok(p.matching_cells>0&&p.total_cells>=8);
  assert.ok(p.source_page.startsWith('https://en.wiktionary.org/wiki/'));
  const id=p.lemma+'|'+p.pos;assert.ok(!ids.has(id),'Candidato duplicado '+id);ids.add(id);
  assert.ok(p.new_cells.every(x=>typeof x.cell==='string'&&x.form));
  const original=source.entries.find(e=>e.lemma===p.lemma&&e.pos===p.pos);
  assert.ok(original,'El cotejo debe conservar su entrada de Wiktextract: '+id);
 }
 const html=fs.readFileSync(path.join(root,'gramatica.html'),'utf8');
 assert.ok(!html.includes('wiktextract-crosscheck-'),'Los cotejos aún no son ejercicios');
 console.log(lang+': '+result.qualifying_paradigms+' paradigmas nominales compatibles, '+result.candidate_new_cells+' casillas para validación independiente.');
}
