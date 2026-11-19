#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=rel=>fs.readFileSync(new URL('../'+rel,import.meta.url),'utf8');
const r=JSON.parse(read('data/morphology-coverage.json'));
const manifest=JSON.parse(read('data/unimorph-syllabus/manifest.json'));
// Los recuentos de manifest.subjects son una fotografía de la importación,
// no el denominador actual: pueden variar cuando se corrige un lema.
const ctx=vm.createContext({window:{}});
vm.runInContext(read('data.js'),ctx,{filename:'data.js'});
vm.runInContext(read('gramatica-importada.js'),ctx,{filename:'gramatica-importada.js'});
const norm=ctx.window.GrammarImported.norm;
const currentLemmas=subject=>{
 const lemmas=new Set();
 for(const entry of ctx.window.VOCAB){
  if(entry.subject!==subject)continue;
  const first=String(entry.form||'').split(/[,+(]/)[0].trim().split('/')[0].trim();
  if(first&&!/\s/u.test(first))lemmas.add(norm(first));
 }
 return lemmas.size;
};
assert.equal(r.schema,1);
assert.match(r.definition,/NO supone paradigma completo/);
for(const subject of ['lat1','lat4','gr1']){
 const x=r.subjects[subject],m=manifest.subjects[subject];
 assert.ok(m.distinct_lemmas>0,'Falta la fotografía inicial del importador: '+subject);
 assert.equal(x.lemmas,currentLemmas(subject),'Error en el denominador actual de '+subject);
 assert.equal(x.withExercises+x.withoutExercises,x.lemmas);
 assert.ok(x.importedLemmas<=x.withExercises);
 assert.ok(x.curatedLemmas<=x.withExercises);
 assert.ok(x.importedQuestions>20);
 assert.equal(x.uncovered.length,x.withoutExercises);
 assert.ok(new Set(x.uncovered.map(y=>y.lemma)).size===x.uncovered.length);
 assert.ok(x.uncovered.every(y=>y.status===undefined),'No se debe confundir la cobertura con paradigmas completos');
 assert.ok(Object.values(x.types).reduce((n,y)=>n+y.lemmas,0)===x.lemmas);
}
const latin=r.subjects.lat1;
assert.ok(latin.curatedLemmas>=18,'Falta la ampliación docente latina');
assert.ok(latin.importedLemmas>100);
assert.ok(r.subjects.gr1.importedLemmas>25);
console.log('Cobertura auditada: '+Object.entries(r.subjects).map(([s,v])=>s+'='+v.withExercises+'/'+v.lemmas).join(', '));
