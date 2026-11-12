import test from 'node:test';
import assert from 'node:assert/strict';
import {compileTeacherAudit} from '../scripts/compile-etymologicon-gr1.mjs';
import {createWriteTwoCorrector} from '../shared/academic/greek-etymology/corrector/write-two.mjs';
import {
  PROGRESS_KEY,emptyProgress,validateProgress,loadProgress,saveProgress,removeProgress,
  exportProgress,importProgress,recordExercise,progressSummary,
  filteredEtyma,chooseAdaptive,reviewWeight
} from '../apps/etymologicon/progress.mjs';

const bank=compileTeacherAudit();
const eligible=bank.etymons.filter(e=>e.editorialStatus==='approved_for_documented_derivatives');
const engine=createWriteTwoCorrector(bank);
const at='2026-11-12T18:00:00.000Z';
const score=(id,one,two)=>engine.grade(id,[one,two]);
const records=(state)=>state.courses.gr1.records;
const storage=()=>{
  const map=new Map();
  return {map,getItem:k=>map.get(k)??null,
    setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
};
function practice(state,id,one,two,time=at){
  return recordExercise(state,eligible,score(id,one,two),time);
}
test('esquema versionado y separado por curso, sin almacenar respuestas ni datos personales',()=>{
  const p=emptyProgress();
  assert.equal(PROGRESS_KEY,'scholaclassica-etymologicon-progress-v1');
  assert.equal(p.schema,'etymologicon-progress/v1');
  assert.deepEqual(Object.keys(p.courses),['gr1','gr2']);
  assert.deepEqual(p.courses.gr2.records,{});
  assert.deepEqual(validateProgress(p,eligible),p);
  assert.equal(JSON.stringify(p).includes('submitted'),false);
});
test('registrar ejercicio de 1,5/2; suma exactos, faltas, errores y estadística local',()=>{
  const p=practice(emptyProgress(),'grc:προσ','proselito','prosodia');
  const r=records(p)['grc:προσ'];
  assert.deepEqual([r.attempts,r.exact,r.typo,r.incorrect,r.points,r.lastScore],
    [1,1,1,0,1.5,1.5]);
  assert.equal(r.perfectStreak,0);
  assert.equal(r.needsReview,true);
  assert.equal(r.lastPracticed,at);
  const summary=progressSummary(p,eligible);
  assert.equal(summary.exercises,1);
  assert.equal(summary.average,1.5);
  assert.equal(summary.exact,1);
  assert.equal(summary.typo,1);
  assert.equal(summary.incorrect,0);
  assert.equal(summary.needingReview,1);
  assert.equal(summary.practiced,1);
});
test('0 puntos aumenta urgencia, pero no se registran los textos de los alumnos',()=>{
  let p=practice(emptyProgress(),'grc:προσ','heliópolis','ginecólogo');
  assert.equal(records(p)['grc:προσ'].lastScore,0);
  assert.equal(records(p)['grc:προσ'].incorrect,2);
  assert.equal(reviewWeight(records(p)['grc:προσ']),10);
  assert.equal(JSON.stringify(p).includes('heliópolis'),false);
  assert.equal(JSON.stringify(p).includes('ginecólogo'),false);
});
test('dos ejercicios perfectos después de un fallo liquidan la repetición pendiente',()=>{
  let p=practice(emptyProgress(),'grc:προσ','proselito','prosodia');
  p=practice(p,'grc:προσ','prosélito','prosodia','2026-11-12T18:01:00.000Z');
  assert.equal(records(p)['grc:προσ'].needsReview,true);
  assert.equal(records(p)['grc:προσ'].perfectStreak,1);
  p=practice(p,'grc:προσ','prosélito','prosodia','2026-11-12T18:02:00.000Z');
  assert.equal(records(p)['grc:προσ'].needsReview,false);
  assert.equal(records(p)['grc:προσ'].perfectStreak,2);
  assert.equal(records(p)['grc:προσ'].attempts,3);
  assert.equal(records(p)['grc:προσ'].points,5.5);
  assert.equal(filteredEtyma(eligible,p,{mode:'errors'}).length,0);
});
test('filtrar por unidad, repaso general y errores sin mezclar Griego II',()=>{
  let p=practice(emptyProgress(),'grc:προσ','proselito','prosodia');
  const general=filteredEtyma(eligible,p,{mode:'general'});
  const errors=filteredEtyma(eligible,p,{mode:'errors'});
  assert.equal(general.length,108);
  assert.deepEqual(errors.map(x=>x.id),['grc:προσ']);
  const units=[...new Set(eligible.flatMap(e=>e.units))];
  for(const unit of units){
    const unitPool=filteredEtyma(eligible,p,{mode:'unit',unit});
    assert.ok(unitPool.length>0,unit);
    assert.ok(unitPool.every(x=>x.units.includes(unit)),unit);
  }
  assert.deepEqual(filteredEtyma(eligible,p,{mode:'unit',unit:'all'}),[]);
  assert.throws(()=>filteredEtyma(eligible,p,{mode:'unknown'}),/Modo desconocido/);
  assert.deepEqual(p.courses.gr2.records,{});
});
test('repetición ponderada: los fallos tienen prioridad y no se repite inmediatamente si hay alternativas',()=>{
  let p=practice(emptyProgress(),'grc:προσ','heliópolis','ginecólogo');
  const first=eligible.find(e=>e.id==='grc:προσ');
  const second=eligible.find(e=>e.id!==first.id);
  assert.ok(reviewWeight(records(p)[first.id])>reviewWeight(records(p)[second.id]));
  assert.equal(chooseAdaptive([first,second],p,{random:()=>0.4}).id,first.id);
  assert.equal(chooseAdaptive([first,second],p,{random:()=>0.99}).id,second.id);
  assert.equal(chooseAdaptive([first,second],p,{excludeId:first.id,random:()=>0}).id,second.id);
  assert.equal(chooseAdaptive([first],p,{excludeId:first.id,random:()=>0}).id,first.id);
  assert.equal(chooseAdaptive([],p),null);
  assert.throws(()=>chooseAdaptive([first],p,{random:()=>1}),/generador/);
});
test('exportar e importar JSON conserva todas las cifras y la separación por curso',()=>{
  let p=practice(emptyProgress(),'grc:προσ','proselito','prosodia');
  const text=exportProgress(p,eligible,'2026-11-12T20:00:00.000Z');
  assert.ok(text.includes('"exportedAt"'));
  assert.ok(!text.includes('prosodia'));
  const restored=importProgress(text,eligible);
  assert.deepEqual(restored,p);
  assert.deepEqual(restored.courses.gr2.records,{});
  const s=storage();
  assert.equal(saveProgress(s,p,eligible).saved,true);
  assert.ok(s.map.has(PROGRESS_KEY));
  assert.deepEqual(loadProgress(s,eligible).state,p);
  assert.equal(removeProgress(s),true);
  assert.equal(s.map.has(PROGRESS_KEY),false);
  assert.equal(loadProgress(s,eligible).state.schema,p.schema);
});
test('archivos malformados, con IDs ajenos, Griego II activo o notas incoherentes se rechazan',()=>{
  const p=practice(emptyProgress(),'grc:προσ','proselito','prosodia');
  for(const bad of ['{',"",JSON.stringify({...p,schema:'etymologicon-progress/v0'}),'{not json',
    JSON.stringify({...p,courses:{...p.courses,gr2:{records:{'grc:προσ':records(p)['grc:προσ']}}}})]){
    assert.throws(()=>importProgress(bad,eligible));
  }
  const unknown=structuredClone(p);
  unknown.courses.gr1.records['grc:inventado']=unknown.courses.gr1.records['grc:προσ'];
  assert.throws(()=>validateProgress(unknown,eligible),/desconocido/);
  const corrupt=structuredClone(p);
  corrupt.courses.gr1.records['grc:προσ'].points=2;
  assert.throws(()=>validateProgress(corrupt,eligible),/puntuación incoherente/);
  const negative=structuredClone(p);
  negative.courses.gr1.records['grc:προσ'].attempts=-1;
  assert.throws(()=>validateProgress(negative,eligible));
  const oversized='a'.repeat(250001);
  assert.throws(()=>importProgress(oversized,eligible),/250 KB/);
});
test('la importación no contamina prototipos con claves __proto__ y no acepta datos de otros cursos',()=>{
  const p=practice(emptyProgress(),'grc:προσ','proselito','prosodia');
  const object=JSON.parse(JSON.stringify(p));
  Object.defineProperty(object.courses.gr1.records,'__proto__',{enumerable:true,
    value:object.courses.gr1.records['grc:προσ']});
  assert.throws(()=>importProgress(JSON.stringify(object),eligible),/desconocido/);
  assert.equal(Object.prototype.polluted,undefined);
});
test('lectura fallida no borra los datos originales; guardado sin almacenamiento ofrece aviso',()=>{
  const s=storage();
  s.map.set(PROGRESS_KEY,'{corrupt');
  const loaded=loadProgress(s,eligible);
  assert.equal(loaded.persisted,false);
  assert.ok(loaded.warning.includes('No se ha podido leer'));
  assert.equal(s.getItem(PROGRESS_KEY),'{corrupt');
  const broken={getItem(){throw new Error('privacy');},setItem(){throw new Error('privacy');},
    removeItem(){throw new Error('privacy');}};
  assert.equal(loadProgress(broken,eligible).persisted,false);
  assert.equal(saveProgress(broken,emptyProgress(),eligible).saved,false);
  assert.equal(removeProgress(broken),false);
});
test('no almacenar sesiones duplicadas tras pulsar el botón de corrección repetidamente: la función es explícita',()=>{
  const r=score('grc:προσ','proselito','prosodia');
  let p=recordExercise(emptyProgress(),eligible,r,at);
  assert.equal(progressSummary(p,eligible).exercises,1);
  // El controlador del navegador bloquea una segunda confirmación sin editar.
  // Si el usuario decide repetir el mismo ejercicio, el modelo cuenta un nuevo intento.
  p=recordExercise(p,eligible,r,'2026-11-12T18:03:00.000Z');
  assert.equal(progressSummary(p,eligible).exercises,2);
});
