import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {greekNounPhrasePairs,makeGreekNounPhraseTables} from '../public/morfologia/greek-noun-phrases.mjs';
import {correctWritten} from '../public/morfologia/written.mjs';

const root=resolve(import.meta.dirname,'..');
const load=path=>JSON.parse(readFileSync(join(root,path),'utf8'));
const manifest=load('config/nominal-teacher-decisions.json');
const reserved=load('data/morfologia/adjetivos-reservados.json');
const bank=load('dist/apps/morfologia/data/paradigmas.json');
const choices={anthropos:'masculino-docente',
 athenae:'plural-documentado-pendiente-fuente',
 cantus:'cuarta-sin-mezcla',
 domus:'conservar-variantes-documentadas',
 liber:'guardar-ambos',
 pais:'ambos-generos'};

test('Seis decisiones docentes históricas exactas y una reserva no calificable',()=>{
 assert.equal(manifest.schema,'schola-nominal-teacher-decisions/v1');
 assert.equal(manifest.status,'aprobado-por-docente');
 assert.deepEqual(manifest.choices,choices);
 assert.equal(reserved.schema,'schola-morphology-pending-adjectives/v1');
 assert.equal(reserved.records.length,1);
 const adjective=reserved.records[0];
 assert.equal(adjective.id,'latin-adjetivo-reserva-liber-free');
 assert.equal(adjective.entry,'līber, lībera, līberum');
 assert.equal(adjective.notForGrading,true);
 assert.equal(bank.records.some(x=>x.id===adjective.id),false);
 for(const path of ['dist/data/morfologia/adjetivos-reservados.json',
  'dist/config/nominal-teacher-decisions.json',
  'dist/apps/morfologia/data/adjetivos-reservados.json']){
  assert.equal(existsSync(join(root,path)),false,'La reserva fue publicada: '+path);
 }
});

test('ἄνθρωπος conserva sus diez casillas y su género común; masculino solo en sintagmas',()=>{
 const r=bank.records.find(x=>x.id==='griego-sustantivo-anthropos');
 assert.ok(r);
 assert.equal(r.gender,'común');
 assert.equal(r.unit,1);
 assert.equal(r.forms.length,10);
 assert.deepEqual(r.agreementGenders,['masculino']);
 assert.equal(r.evidence.teacherDecision,choices.anthropos);
 const pairs=greekNounPhrasePairs(bank,{language:'griego',unit:5})
  .filter(x=>x.noun.id===r.id);
 assert.equal(pairs.length,3);
 assert.ok(pairs.every(x=>x.gender==='masculino'&&x.id.endsWith(':masculino')));
 assert.equal(new Set(pairs.map(x=>x.id)).size,3);
 const subset={...bank,records:bank.records.filter(x=>
  ['griego-articulo','griego-adj-agathos','griego-adj-barbaros',
   'griego-adj-megas',r.id].includes(x.id))};
 const tables=makeGreekNounPhraseTables(subset,{language:'griego',unit:5,limit:3,rng:()=>.8});
 assert.equal(tables.length,3);
 for(const table of tables){
  const first=table.cells.find(x=>x.id==='nominativo:singular');
  assert.ok(first.acceptedForms.every(x=>x.startsWith('ὁ ')));
  for(const form of first.acceptedForms)
   assert.equal(correctWritten({activity:'written',language:'griego',acceptedForms:first.acceptedForms},form).correct,true);
 }
});

test('Las cinco decisiones importadas mantienen IDs nuevos y origen exacto',()=>{
 for(const id of ['griego-sustantivo-decision-pais',
  'griego-sustantivo-decision-athenai','latin-sustantivo-decision-cantus',
  'latin-sustantivo-decision-liber','latin-sustantivo-decision-domus'])
  assert.equal(bank.records.filter(r=>r.id===id).length,1,id);
 const vocabula=load('config/sources.lock.json').sources.vocabula.sha;
 assert.equal(bank.vocabulaSha,vocabula);
 const source=readFileSync(join(root,'.sources/vocabula/data.js'),'utf8');
 const entries=JSON.parse(source.replace(/^window\.VOCAB\s*=\s*/u,'').replace(/;\s*$/u,''));
 assert.equal(entries.length,2055);
 for(const id of ['1a703effffd80925','2132b8254922c90c',
  '4ccc9935d413eed4','b8e417b32b6f3692',
  'd20502b9069bd664','b13943225955db33','f2f776558dba45b1'])
  assert.ok(entries.some(x=>x.id===id),'Falta identidad de origen '+id);
});
