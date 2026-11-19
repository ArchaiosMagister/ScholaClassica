#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const r=JSON.parse(fs.readFileSync(path.join(root,'data/collatinus-verified-adjectives.json'),'utf8'));
const checked=JSON.parse(fs.readFileSync(path.join(root,'data/wiktextract-crosscheck-lat.json'),'utf8'));
assert.equal(r.schema,1);
assert.equal(r.language,'lat');
assert.equal(r.status,'INDEPENDENT_MODEL_CROSSCHECK_NOT_PUBLISHED');
assert.equal(r.sources.collatinus_license,'GPL-3.0');
assert.ok(r.counts.checked>0&&r.counts.verified<=r.counts.checked);
assert.equal(r.verified.length,r.counts.verified);
assert.equal(r.counts.checked,r.counts.verified+r.counts.notRegularAdjective+r.counts.modelNotFound+r.counts.disagree);
const ids=new Set();
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/\p{M}/gu,'')
 .replace(/æ/g,'ae').replace(/œ/g,'oe');
for(const e of r.verified){
 assert.ok(['doctus','aureus'].includes(e.model),'Modelo distinto del aprobado');
 assert.ok(e.entry.split(',').length>=3,'No consta enunciado adjetival de tres terminaciones');
 const head=norm(e.entry.split(',')[0]);
 assert.ok(head.endsWith('us'),'Enunciado con terminación inesperada');
 assert.equal(e.expected_without_quantities,head.slice(0,-2)+'ae');
 assert.deepEqual(new Set(e.cells.map(c=>c.cell)),new Set(['GEN:SG:FEM','DAT:SG:FEM']));
 for(const f of e.cells)assert.equal(norm(f.form),e.expected_without_quantities);
 const id=e.lemma;
 assert.ok(!ids.has(id),'Lema duplicado');
 ids.add(id);
 assert.ok(checked.candidates.some(c=>c.lemma===id&&c.pos==='adj'));
}
const page=fs.readFileSync(path.join(root,'gramatica.html'),'utf8');
assert.ok(!page.includes('collatinus-verified-adjectives'),'No publicar candidatos sin adecuación curricular');
console.log('Collatinus: '+r.counts.verified+' adjetivos y '+2*r.counts.verified+' casillas verificadas mediante modelo.');
