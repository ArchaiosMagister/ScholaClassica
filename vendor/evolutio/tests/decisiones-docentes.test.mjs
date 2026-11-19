import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditImport,reconcileDecisions,key} from '../tools/import-generador.mjs';
import {validationErrors,requiredRules} from '../src/engine.mjs';

const load=path=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url),'utf8'));
const bank=load('data/pilot.json');
const source=load('data/imports/generador-655.json');
const decisions=load('data/imports/decisiones-docentes.json');
const review=load('data/imports/revision-generador.json');
const base={version:1,words:bank.words.slice(0,282)};

const expected=[
 ['seniorem','xl-283',['PALAT','APOC','FIX_M']],
 ['sensum','xl-284',['SIMPL','ABER','FIX_M']],
 ['sponsam','xl-304',['PROT','SIMPL','FIX_M']],
 ['sponsum','xl-305',['PROT','SIMPL','ABER','FIX_M']]
];
test('Las cuatro decisiones docentes son explícitas, únicas y mantienen el análisis existente',()=>{
 assert.equal(decisions.schema,1);
 assert.equal(decisions.decisiones.length,4);
 assert.equal(new Set(decisions.decisiones.map(x=>key(x.latin))).size,4);
 for(const [latin,id,rules] of expected){
  const w=bank.words.find(x=>key(x.latin)===latin);
  assert.equal(w?.id,id,latin);
  assert.deepEqual(w.changes.map(t=>t.rule),rules,latin);
  assert.deepEqual(validationErrors({version:1,words:[w]}),[],latin);
  const d=decisions.decisiones.find(x=>key(x.latin)===latin);
  assert.equal(d.decision,'conservar',latin);
  assert.equal(d.existingId,id,latin);
  assert.deepEqual(d.expectedCurrentRules,rules,latin);
  assert.ok(d.criterio.length>25);
  if(latin.endsWith('um')){
    const n=[...w.latin].length;
    assert.ok(w.changes.some(t=>t.rule==='ABER'&&t.output==='o'&&t.spans.some(s=>s[0]===n-2&&s[1]===n-1)));
    assert.ok(w.changes.some(t=>t.rule==='FIX_M'&&t.spans.some(s=>s[0]===n-1&&s[1]===n)));
    assert.ok(requiredRules(w).includes('ABER'));
    assert.ok(!requiredRules(w).includes('FIX_M'));
  }
 }
});

test('El sincronizador conserva la aprobación y no oculta conflictos nuevos',()=>{
 const original=auditImport(source,base);
 assert.equal(original.conflicts.length,4);
 const result=reconcileDecisions(original,decisions);
 assert.equal(result.conflicts.length,0);
 assert.equal(result.resolvedConflicts.length,4);
 assert.equal(result.pending.length,142);
 assert.equal(result.accepted.length,240);
 assert.deepEqual(review.pending,result.pending);
 assert.deepEqual(review.resolvedConflicts,result.resolvedConflicts);
 assert.deepEqual(review.conflicts,[]);
 assert.equal(review.summary.conflicts,0);
 assert.equal(review.summary.resolvedConflicts,4);
 assert.equal(bank.words.length,522);
 const before=JSON.stringify(original);
 const recheck=reconcileDecisions(original,decisions);
 assert.equal(JSON.stringify(original),before,'No debe mutar el resultado original de auditoría');
 assert.deepEqual(recheck,result);
 const broken={...original,conflicts:original.conflicts.map((c,i)=>i===0?{...c,currentRules:['PALAT','SINC','FIX_M']}:c)};
 const reopened=reconcileDecisions(broken,decisions);
 assert.equal(reopened.conflicts.length,1);
 assert.equal(reopened.resolvedConflicts.length,3);
 assert.equal(reopened.conflicts[0].item.latin,'seniorem');
});
