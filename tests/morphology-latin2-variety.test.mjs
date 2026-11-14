import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {makeQuestions,displayLatin2VerbHeadword,displayLatin2QuestionText}
  from '../public/morfologia/engine.mjs';
import {makeWrittenQuestions,makeTableExercises}
  from '../public/morfologia/written.mjs';
import {emptyReview,applyReview,selectReviewCandidates}
  from '../public/morfologia/review.mjs';

const root=resolve(import.meta.dirname,'..');
const bank=JSON.parse(readFileSync(join(root,'dist/apps/morfologia/data/paradigmas.json'),'utf8'));
const rng=()=>.41;
const base={language:'latin2',unit:0,kind:'todos',limit:10,rng};

function assertVariety(questions,kinds,minimum){
  assert.equal(questions.length,10);
  const present=new Set(questions.map(q=>q.kind));
  assert.ok(present.size>=minimum,
    '«Todas las categorías» concentró la tanda: '+JSON.stringify([...present]));
  for(const type of kinds)assert.ok(present.has(type),'Falta '+type);
}
test('Latín II mezcla las seis categorías en una tanda de análisis, pese al predominio verbal',()=>{
  const q=makeQuestions(bank,{...base,activity:'analysis'});
  assertVariety(q,['sustantivo','adjetivo','pronombre','verbo','participio','infinitivo'],6);
  assert.ok(q.every(x=>x.options.length===4&&x.options.includes(x.correct)));
});
test('La selección escrita también distribuye las categorías disponibles',()=>{
  const q=makeWrittenQuestions(bank,base);
  assertVariety(q,['sustantivo','adjetivo','pronombre','verbo','participio','infinitivo'],6);
});
test('El ejercicio de formas y el de tablas no monopolizan una familia',()=>{
  const q=makeQuestions(bank,{...base,activity:'form'});
  assert.ok(new Set(q.map(x=>x.kind)).size>=4);
  const tables=makeTableExercises(bank,base);
  assert.ok(new Set(tables.map(x=>x.kind)).size>=3);
});
test('Si se elige una categoría específica, no se mezcla ni se cambia el criterio',()=>{
  for(const kind of ['sustantivo','adjetivo','pronombre','verbo','participio','infinitivo']){
    const q=makeQuestions(bank,{...base,kind,activity:'analysis'});
    assert.ok(q.length>0);
    assert.ok(q.every(x=>x.kind===kind));
  }
});
test('El repaso inteligente conserva prioridades dentro de cada categoría',()=>{
  const now=1000000000;
  const candidates=[
    ...Array.from({length:25},(_,i)=>({id:'v'+i,kind:'verbo'})),
    ...Array.from({length:5},(_,i)=>({id:'n'+i,kind:'sustantivo'})),
    ...Array.from({length:5},(_,i)=>({id:'a'+i,kind:'adjetivo'}))
  ];
  let state=emptyReview();
  state=applyReview(state,'v0',false,now);
  state=applyReview(state,'n0',false,now);
  const selection=selectReviewCandidates(candidates,{
    mode:'smart',state,limit:10,rng,now,balanceByKind:true
  });
  assert.equal(selection.length,10);
  assert.equal(new Set(selection.map(x=>x.kind)).size,3);
  assert.ok(selection.some(x=>x.id==='v0'));
  assert.ok(selection.some(x=>x.id==='n0'));
  const errors=selectReviewCandidates(candidates,{
    mode:'errors',state,limit:10,rng,now,balanceByKind:true
  });
  assert.deepEqual(new Set(errors.map(x=>x.id)),new Set(['v0','n0']));
});
test('Enunciado regular: presente, perfecto y supino, sin infinitivo',()=>{
  assert.equal(displayLatin2VerbHeadword('amo, amare, amavi, amatum (1.ª)'),
    'amo, amavi, amatum (1.ª)');
  assert.equal(displayLatin2VerbHeadword('fero, ferre, tuli, latum (irregular)'),
    'fero, tuli, latum (irregular)');
  assert.equal(displayLatin2VerbHeadword('amo, amavi, amatum (1.ª)'),
    'amo, amavi, amatum (1.ª)');
});
test('Enunciado deponente: presente, perfecto compuesto y conjugación',()=>{
  for(const [source,expected] of [
    ['moror, morari, moratus sum (1.ª deponente)','moror, moratus sum (1.ª deponente)'],
    ['utor, uti, usus sum (3.ª deponente)','utor, usus sum (3.ª deponente)'],
    ['patior, pati, passus sum (3.ª mixta deponente)','patior, passus sum (3.ª mixta deponente)']
  ])assert.equal(displayLatin2VerbHeadword(source),expected);
});
test('Irregulares sin supino: solo presente y perfecto',()=>{
  assert.equal(displayLatin2VerbHeadword('sum, esse, fui (irregular)'),
    'sum, fui (irregular)');
  assert.equal(displayLatin2VerbHeadword('volo, velle, volui (irregular)'),
    'volo, volui (irregular)');
  assert.equal(displayLatin2VerbHeadword('sum, fui, — (irregular)'),
    'sum, fui (irregular)');
});
test('La presentación se aplica a análisis, opciones y encabezados, sin mutar soluciones',()=>{
  const raw='utor, uti, usus sum (3.ª deponente)';
  const q={language:'latin2',kind:'verbo',headword:raw,paradigm:raw};
  const answer='verbo · '+raw+' · 3.ª persona · singular · perfecto · indicativo · voz pasiva';
  assert.equal(displayLatin2QuestionText(q,answer),
    answer.replace(raw,'utor, usus sum (3.ª deponente)'));
  assert.equal(displayLatin2QuestionText(q,raw),'utor, usus sum (3.ª deponente)');
  assert.equal(q.headword,raw);
  assert.equal(displayLatin2QuestionText({...q,language:'latin'},answer),answer);
  assert.equal(displayLatin2QuestionText({...q,kind:'sustantivo'},answer),answer);
});
