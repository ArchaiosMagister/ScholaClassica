#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const d=JSON.parse(fs.readFileSync(path.join(root,'data/greek-regular-datives.json'),'utf8'));
const src=JSON.parse(fs.readFileSync(path.join(root,'data/wiktextract-crosscheck-grc.json'),'utf8'));
assert.equal(d.schema,1);assert.equal(d.language,'grc');
assert.equal(d.status,'REGULAR_DECLENSION_RULE_CROSSCHECK_NOT_PUBLISHED');
assert.equal(d.totals.checked,d.totals.verified+d.totals.unresolved);
assert.equal(d.totals.verified,d.verified.length);
assert.equal(d.totals.unresolved,d.unresolved.length);
const seen=new Set();
for(const q of d.verified){
 assert.equal(q.case,'dativo');assert.equal(q.number,'singular');
 assert.ok(q.form&&q.source_page.startsWith('https://en.wiktionary.org/wiki/'));
 assert.match(q.rule,/primera|segunda|tercera/);
 assert.ok(!seen.has(q.lemma),'Dativo duplicado '+q.lemma);
 seen.add(q.lemma);
 const original=src.candidates.find(x=>x.lemma===q.lemma&&x.pos==='noun');
 assert.ok(original&&original.new_cells.some(x=>x.form===q.form&&x.cell==='DAT:SG:'),
  'El resultado no procede del cotejo anterior: '+q.lemma);
}
const html=fs.readFileSync(path.join(root,'gramatica.html'),'utf8');
assert.ok(!html.includes('greek-regular-datives.json'),'El banco de alumnos todavía no debe cargar candidatos');
console.log('Griego: '+d.totals.verified+' dativos regulares comprobados y '+d.totals.unresolved+' pendientes.');
