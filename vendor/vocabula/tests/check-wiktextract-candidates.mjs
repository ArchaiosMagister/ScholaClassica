#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
for(const lang of ['lat','grc']){
 const file='tests/fixtures/wiktextract-'+lang+'.jsonl';
 const result=execFileSync(process.execPath,['scripts/import_wiktextract_candidates.mjs',lang,file],{cwd:root,encoding:'utf8'});
 assert.match(result,/CANDIDATOS/);
 const json=JSON.parse(fs.readFileSync(path.join(root,'data/wiktextract-candidates-'+lang+'.json'),'utf8'));
 assert.equal(json.schema,1);
 assert.equal(json.lang,lang);
 assert.equal(json.status,'CANDIDATE_ONLY_NOT_VALIDATED');
 assert.match(json.license,/CC BY-SA 4.0/);
 assert.ok(json.entries.length>=1);
 assert.ok(json.entries.every(x=>x.forms.length>0&&x.forms.every(y=>Array.isArray(y.tags)&&y.tags.length>0)));
 assert.ok(json.entries.every(x=>x.forms.every(y=>!y.tags.some(tag=>['table-tags','romanization','canonical'].includes(tag)))));
 if(lang==='lat'){
  const amo=json.entries.find(x=>x.lemma==='amo');
  assert.ok(amo,'No se encontró el verbo amo');
  assert.ok(amo.forms.some(x=>x.form==='amābam'));
  assert.ok(!json.entries.some(x=>x.lemma==='exemplum-non-existent'));
 }else{
  const lyo=json.entries.find(x=>x.lemma==='λυω');
  assert.ok(lyo,'No se encontró λύω');
  assert.ok(lyo.forms.some(x=>x.form==='λύεις'));
  assert.ok(!lyo.forms.some(x=>x.form==='έλυσα'),'Se ha mezclado griego antiguo y moderno');
 }
}
const html=fs.readFileSync(path.join(root,'gramatica.html'),'utf8');
assert.ok(!html.includes('wiktextract-candidates-'),'Nunca usar automáticamente candidatos sin validar en los ejercicios');
console.log('Importador Wiktextract probado: normalización, licencias, coincidencia de lema, filtros y aislamiento de candidatos.');
