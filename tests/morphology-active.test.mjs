import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {makeWrittenQuestions,makeTableExercises,correctWritten,evaluateTable} from '../public/morfologia/written.mjs';
import {emptyReview,applyReview,reviewCounts,reviewKey,selectReviewCandidates,
  sanitizeReview,readReview,writeReview,REVIEW_STORAGE_KEY} from '../public/morfologia/review.mjs';
const root=resolve(import.meta.dirname,'..');
const bank=JSON.parse(readFileSync(join(root,'dist/apps/morfologia/data/paradigmas.json'),'utf8'));
const rng=()=>.41;
const subset=record=>({...bank,records:[record]});
const find=(start)=>bank.records.find(r=>r.paradigm.startsWith(start));
test('producción escrita: no se generan formas fuera de las tablas, conserva procedencia',()=>{
  for(const [language,unit] of [['latin',5],['griego',5]]){
    const qs=makeWrittenQuestions(bank,{language,unit,limit:30,rng});
    assert.equal(qs.length,30);
    for(const q of qs){
      assert.equal(q.language,language);
      assert.equal(q.activity,'written');
      assert.ok(q.acceptedForms.length>=1);
      assert.equal(q.evidence.status,'paradigma-documentado');
      assert.equal(correctWritten(q,q.acceptedForms[0]).correct,true);
      assert.equal(correctWritten(q,' ').status,'empty');
    }
  }
  assert.throws(()=>makeWrittenQuestions(bank,{language:'latin',unit:6}),/Unidad todavía no disponible/);
});
test('civis: las variantes cives y civis son correctas por igual',()=>{
  const q=makeWrittenQuestions(subset(find('civis,')),{language:'latin',unit:4,limit:30,rng})
    .find(q=>q.prompt.includes('acusativo plural'));
  assert.ok(q);
  assert.deepEqual(q.acceptedForms,['cives','civis']);
  assert.equal(correctWritten(q,'cives').status,'correct');
  assert.equal(correctWritten(q,'CiViS').status,'correct');
  assert.equal(correctWritten(q,'civem').status,'morphology');
});
test('ortografía griega: acento, espíritu y sigma final se distinguen de errores morfológicos',()=>{
  const q={activity:'written',language:'griego',kind:'adjetivo',
    acceptedForms:['ἀγαθός']};
  assert.equal(correctWritten(q,'ἀγαθός').status,'correct');
  assert.equal(correctWritten(q,'ἀγαθος').status,'orthography');
  assert.equal(correctWritten(q,'αγαθος').status,'orthography');
  assert.equal(correctWritten(q,'ἀγαθὸς').status,'orthography');
  assert.equal(correctWritten(q,'ἀγαθον').status,'morphology');
  assert.equal(correctWritten(q,'ἀγαθός').correct,true);
  assert.equal(correctWritten(q,'αγαθος').correct,false);
  const iota={...q,acceptedForms:['τῇ']};
  assert.equal(correctWritten(iota,'τῇ').status,'correct');
  assert.equal(correctWritten(iota,'τῆ').status,'morphology',
    'La iota suscrita no debe ignorarse como una simple tilde');
});
test('ligaduras latinas y terminaciones con o sin guion se admiten sin alterar la morfología',()=>{
  const rose={activity:'written',language:'latin',kind:'sustantivo',
    acceptedForms:['rosæ']};
  assert.equal(correctWritten(rose,'rosae').status,'correct');
  assert.equal(correctWritten(rose,'ROSÆ').status,'correct');
  const ending={activity:'written',language:'griego',kind:'desinencia',
    acceptedForms:['–ῃ']};
  assert.equal(correctWritten(ending,'ῃ').status,'correct');
  assert.equal(correctWritten(ending,'-ῃ').status,'correct');
  assert.equal(correctWritten(ending,'η').status,'morphology');
});
test('tablas completas: casos y números existentes, y variantes no penalizadas',()=>{
  const latin=makeTableExercises(subset(find('civis,')),{language:'latin',unit:4,limit:10,rng});
  assert.equal(latin.length,1);
  assert.equal(latin[0].cells.length,12);
  const cell=latin[0].cells.find(c=>c.id==='acusativo:plural');
  assert.deepEqual(cell.acceptedForms,['cives','civis']);
  const answers=Object.fromEntries(latin[0].cells.map(c=>[c.id,c.acceptedForms[0]]));
  assert.equal(evaluateTable(latin[0],answers).complete,true);
  answers['acusativo:plural']='civis';
  assert.equal(evaluateTable(latin[0],answers).complete,true);
  answers['acusativo:plural']='civem';
  const r=evaluateTable(latin[0],answers);
  assert.equal(r.correct,11);assert.equal(r.complete,false);
  const greek=makeTableExercises(bank,{language:'griego',unit:5,kind:'adjetivo',limit:30,rng});
  assert.ok(greek.length>=9);
  assert.ok(greek.every(q=>q.gender));
  assert.ok(greek.every(q=>q.cells.length===10));
  assert.ok(greek.every(q=>q.cells.every(c=>c.acceptedForms.length>=1)));
  const early=makeTableExercises(bank,{language:'griego',unit:3,kind:'artículo',limit:10,rng});
  assert.ok(early.length>0);
  assert.ok(early.every(q=>q.cells.length===8),'No inventar vocativo del artículo griego');
});
test('repetición inteligente: errores inmediatos, aciertos espaciados y estados locales',()=>{
  const now=Date.UTC(2026,10,13);
  const all=[{id:'rose:one'},{id:'rose:two'},{id:'rose:three'}];
  let state=emptyReview();
  assert.equal(reviewCounts(state,now).practiced,0);
  state=applyReview(state,'rose:one',false,now);
  state=applyReview(state,'rose:two',true,now);
  assert.equal(state.items['rose:one'].box,0);
  assert.equal(state.items['rose:one'].dueAt,now);
  assert.equal(state.items['rose:two'].dueAt,now+86400000);
  assert.equal(reviewCounts(state,now).due,1);
  assert.deepEqual(selectReviewCandidates(all,{mode:'errors',state,limit:10,rng,now}).map(q=>q.id),['rose:one']);
  assert.deepEqual(selectReviewCandidates(all,{mode:'due',state,limit:10,rng,now}).map(q=>q.id),['rose:one']);
  assert.deepEqual(selectReviewCandidates(all,{mode:'new',state,limit:10,rng,now}).map(q=>q.id),['rose:three']);
  assert.ok(selectReviewCandidates(all,{mode:'smart',state,limit:10,rng,now}).length>=2);
  state=applyReview(state,'rose:one',true,now+1);
  assert.equal(state.items['rose:one'].box,1);
  assert.equal(state.items['rose:one'].dueAt,now+1+86400000);
  assert.equal(selectReviewCandidates(all,{mode:'due',state,now:now+10}).length,0);
  assert.equal(selectReviewCandidates(all,{mode:'due',state,now:now+86400002}).length,2);
  assert.throws(()=>reviewKey({id:'../../admin'}),/inválido/);
  assert.throws(()=>selectReviewCandidates(all,{mode:'all',limit:0}),/Filtro/);
});
test('persistencia local: entradas corruptas fuera y sin interacción con redes',()=>{
  const storage={
    entries:new Map(),
    getItem(key){return this.entries.get(key)||null},
    setItem(key,value){this.entries.set(key,value)}
  };
  assert.deepEqual(readReview(storage),emptyReview());
  const state=applyReview(emptyReview(),'greek:accent',false,100);
  assert.equal(writeReview(storage,state),true);
  assert.equal(storage.entries.has(REVIEW_STORAGE_KEY),true);
  assert.equal(readReview(storage).items['greek:accent'].wrong,1);
  storage.setItem(REVIEW_STORAGE_KEY,JSON.stringify({version:1,items:{
    valid:{seen:1,right:0,wrong:1,box:0,dueAt:100,lastAt:100},
    '<img>':{seen:1,right:0,wrong:1,box:0,dueAt:100,lastAt:100},
    nope:{seen:'a',right:1,wrong:0,box:1,dueAt:100,lastAt:100}
  }}));
  const safe=readReview(storage);
  assert.deepEqual(Object.keys(safe.items),['valid']);
  assert.deepEqual(sanitizeReview({version:777,items:{valid:{}}}),emptyReview());
});
