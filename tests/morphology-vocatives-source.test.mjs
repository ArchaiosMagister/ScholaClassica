import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const read=path=>readFileSync(join(root,path),'utf8');
const bank=JSON.parse(read('dist/apps/morfologia/data/paradigmas.json'));
const sources=JSON.parse(read('config/sources.lock.json'));
const byId=new Map(bank.records.map(x=>[x.id,x]));
const fixed=[
 ['latin-adj-acer','acer','vocativo','singular'],
 ['latin4-appendix-latin-adj-acer','acer','vocativo','singular'],
 ['griego-ud8-noun-113-0-0','ἐλπί','vocativo','singular']
];
test('El banco proviene del Appendix fijo corregido, sin tocar Vocabula',()=>{
 assert.equal(bank.appendixSha,sources.sources.appendix.sha);
 assert.equal(bank.vocabulaSha,sources.sources.vocabula.sha);
});
test('Las tres casillas morfológicas corregidas coinciden con sus fuentes',()=>{
 for(const [id,expected,caseName,number] of fixed){
  const record=byId.get(id);
  assert(record, 'Falta ficha '+id);
  const choices=record.forms.filter(f=>f.case===caseName&&f.number===number&&
   (id.includes('acer')?f.gender==='masculino':true));
  assert.equal(choices.length,1,'Casilla inesperada en '+id);
  assert.equal(choices[0].form,expected,'Vocativo erróneo en '+id);
 }
});
test('Las gramáticas castellana y valenciana reproducen la fuente fija',()=>{
 for(const lang of ['','val/']){
  const adj=read('dist/apps/gramatica/'+lang+'adjetivos.html');
  const grc=read('dist/apps/gramatica/'+lang+'griego-sustantivos.html');
  assert(adj.includes('<i lang="la">acer</i></td><td><i lang="la">acris</i></td>'));
  assert(grc.includes('ἐλπί</td><td>ἐλπίδ<strong>ες</strong></td>'));
 }
});
