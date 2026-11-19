'use strict';
// Regresión: ningún ejercicio puede utilizar entradas ajenas a la asignatura,
// modalidad o grupo de unidades elegido; tampoco sus distractores.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const raw=fs.readFileSync(path.join(root,'data.js'),'utf8');
assert.ok(raw.startsWith('window.VOCAB='));
const entries=JSON.parse(raw.replace(/^window\.VOCAB\s*=\s*/,'').replace(/;\s*$/,''));
const {vocabularyForScope}=require('../scope.js');
assert.ok(entries.length>1000,'El banco de vocabulario parece incompleto');
const ids=new Set(),groups=new Map();
for(const e of entries){
 assert.ok(!ids.has(e.id),'ID repetido: '+e.id);ids.add(e.id);
 assert.ok(['lat1','lat2','lat4','gr1'].includes(e.subject),'Asignatura desconocida');
 assert.ok(['general','examen'].includes(e.mode),'Modalidad desconocida');
 assert.ok(Array.isArray(e.units)&&e.units.length&&e.units.every(Boolean),'Unidad vacía: '+e.form);
 assert.ok(Array.isArray(e.answers)&&e.answers.length,'Sin respuestas: '+e.form);
 const key=e.subject+'/'+e.mode;
 if(!groups.has(key))groups.set(key,new Set());
 for(const u of e.units)groups.get(key).add(u);
}
assert.equal(groups.size,8,'Falta algún curso o modalidad');

const context=vm.createContext({accepted:e=>e.answers.map(x=>String(x).toLowerCase().normalize('NFD').replace(/\p{M}/gu,''))});
const choiceSource=fs.readFileSync(path.join(root,'choice.js'),'utf8');
vm.runInContext(choiceSource+'\nthis.pick=pickDistractors;this.conflict=choiceConflicts;this.info=choiceInfo;',context);
let combinations=0,questions=0,distractors=0;
for(const [key,names] of groups){
 const [subject,mode]=key.split('/'),units=[...names];
 for(let mask=0;mask<2**units.length;mask++){
  const selected=units.filter((_,i)=>(mask&(1<<i))!==0);
  const found=vocabularyForScope(entries,subject,mode,selected);
  const expected=entries.filter(e=>e.subject===subject&&e.mode===mode&&e.units.some(u=>selected.includes(u)));
  assert.deepEqual(found,expected,'Filtrado incorrecto: '+key+' '+selected.join(','));
  combinations++;
 }
 assert.deepEqual(vocabularyForScope(entries,subject,mode,[]),[]);
 for(const u of units){
  const pool=vocabularyForScope(entries,subject,mode,[u]);
  assert.ok(pool.length,key+' '+u+' sin palabras');
  const progress=Object.fromEntries(pool.slice(0,3).map(e=>[e.id,{failed:true}]));
  assert.deepEqual(vocabularyForScope(entries,subject,mode,[u],progress),pool.slice(0,3));
  for(const e of [...pool.slice(0,3),...pool.slice(-2)]){
   const picks=context.pick(e,pool,3);
   assert.ok(picks.length<=3,'Demasiadas opciones');
   assert.equal(new Set(picks.map(x=>x.id)).size,picks.length,'Distractores repetidos');
   for(const x of picks){
    assert.ok(pool.includes(x),'Distractor fuera de unidades: '+key+' '+u+' '+x.form);
    assert.ok(!context.conflict(e,x,context.info(e),context.info(x)),'Respuesta ambigua');
    distractors++;
   }
   questions++;
  }
 }
}
assert.deepEqual(vocabularyForScope(entries,'lat1','general',['UD 999']),[]);
assert.deepEqual(vocabularyForScope(entries,'lat1','general',['UD 1–2']),[],'No inferir grupos inexistentes');
assert.deepEqual(vocabularyForScope(entries,'gr1','examen',['Sin unidad acreditada']),[]);
console.log('OK vocabulario: '+entries.length+' fichas, '+combinations+' combinaciones, '+questions+' preguntas y '+distractors+' distractores verificados.');
