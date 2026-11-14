// Auditoría de preguntas: comprobaciones reproducibles sobre el banco real.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {makeQuestions,evaluate,practiceEligibleEntries,practiceOrdinaryEntries}
  from '../public/morfologia/engine.mjs';
import {makeWrittenQuestions,correctWritten,makeTableExercises,evaluateTable}
  from '../public/morfologia/written.mjs';
import {emptyReview,applyReview,selectReviewCandidates}
  from '../public/morfologia/review.mjs';

const bank=JSON.parse(readFileSync(join(resolve(import.meta.dirname,'..'),
  'dist/apps/morfologia/data/paradigmas.json'),'utf8'));
const latin2=bank.records.filter(r=>r.language==='latin2');
const only=record=>({...bank,records:[record]});
const seedRng=seed=>{
  let state=seed>>>0;
  return ()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
};
const base={language:'latin2',unit:0,kind:'todos',limit:30};
const readings=text=>text.split(' / ');
const deferred=f=>f.verification==='pendiente-de-cotejo-individual'||
  /excluir del sorteo/i.test(f.usage||'');

test('Inventario real: 6 categorías y formas preservadas, sin borrar reservas',()=>{
  assert.ok(latin2.length>=500);
  const all=latin2.flatMap(r=>r.forms);
  assert.ok(all.length>=22050);
  assert.deepEqual(new Set(latin2.map(r=>r.kind)),
    new Set(['sustantivo','adjetivo','pronombre','verbo','participio','infinitivo']));
  const noceo=latin2.find(r=>r.id==='latin2-pau-regular-verb-noceo');
  assert.ok(noceo);
  assert.equal(noceo.forms.filter(deferred).length,120);
  assert.ok(noceo.forms.some(f=>f.form==='noceor'&&deferred(f)));
  assert.ok(practiceEligibleEntries(noceo).every(f=>!deferred(f)));
  assert.ok(practiceOrdinaryEntries(noceo).every(f=>!deferred(f)));
  assert.ok(practiceEligibleEntries(noceo).some(f=>
    f.form==='nocetur'&&/impersonal/.test(f.analysis)));
});

test('Los 120 análisis personales no cotejados nunca son soluciones de ejercicios',()=>{
  const noceo=latin2.find(r=>r.id==='latin2-pau-regular-verb-noceo');
  const blocked=new Set(noceo.forms.filter(deferred).map(f=>f.analysis));
  const source=only(noceo);
  for(let seed=1;seed<=10;seed++){
    const config={...base,rng:seedRng(seed)};
    for(const q of makeQuestions(source,{...config,activity:'analysis'})){
      assert.ok(readings(q.correct).every(x=>!blocked.has(x)),
        'Lectura reservada en el análisis: '+q.form);
      assert.ok(q.options.every(option=>
        readings(option).every(x=>!blocked.has(x))),
        'Lectura reservada como distractor: '+q.form);
    }
    for(const q of makeQuestions(source,{...config,activity:'form'})){
      const analysis=q.prompt.replace(/^Selecciona la forma de /,'').replace(/\.$/,'');
      assert.ok(!blocked.has(analysis),'Flexión reservada en pregunta: '+analysis);
    }
    for(const q of makeWrittenQuestions(source,config)){
      const analysis=q.prompt.replace(/^Escribe la forma de /,'').replace(/\.$/,'');
      assert.ok(!blocked.has(analysis),'Forma reservada en ejercicio escrito: '+analysis);
      assert.ok(correctWritten(q,q.acceptedForms[0]).correct);
    }
  }
  assert.equal(noceo.forms.filter(deferred).length,120,
    'Las reservas se conservan en la fuente original');
});

test('No hay distractores que compartan una lectura correcta, ni cambios de categoría',()=>{
  let questions=0,alternatives=0;
  for(const r of latin2){
    const qs=makeQuestions(only(r),{...base,activity:'analysis',rng:seedRng(3)});
    for(const q of qs){
      questions++;
      assert.equal(q.options.length,4,q.id);
      assert.equal(new Set(q.options).size,4,q.id);
      assert.ok(q.options.includes(q.correct),q.id);
      const correct=new Set(readings(q.correct));
      if(correct.size>1)alternatives++;
      for(const option of q.options.filter(o=>o!==q.correct)){
        assert.ok(readings(option).every(x=>!correct.has(x)),
          'Distractor parcialmente correcto: '+q.id);
        assert.equal(option.split(' · ')[0],r.kind,
          'Distractor de otra clase gramatical: '+q.id);
      }
      assert.equal(evaluate(q,q.correct).correct,true,q.id);
    }
  }
  assert.ok(questions>3000,'Auditoría demasiado pequeña: '+questions);
  assert.ok(alternatives>100,'No se han examinado lecturas sincréticas suficientes');
});

test('is: las variantes ii/ei no ofrecen un distractor con nominativo verdadero',()=>{
  const is=latin2.find(r=>r.id==='latin2-pau-pronoun-is');
  assert.ok(is);
  const questions=makeQuestions(only(is),{
    ...base,activity:'analysis',rng:seedRng(11)
  });
  const question=questions.find(q=>q.form==='ii');
  assert.ok(question,'Debe poder examinarse ii');
  const correct=new Set(readings(question.correct));
  assert.ok(question.options.every(option=>option===question.correct||
    readings(option).every(x=>!correct.has(x))));
  assert.ok(question.options.every(option=>option.startsWith('pronombre · ')));
});

test('Elección de forma: soluciones alternativas y distractores permanecen separados',()=>{
  let analysed=0;
  for(const r of latin2){
    const qs=makeQuestions(only(r),{...base,activity:'form',rng:seedRng(8)});
    for(const q of qs){
      analysed++;
      assert.ok(q.acceptedForms.includes(q.correct));
      assert.ok(q.options.includes(q.correct));
      assert.equal(new Set(q.options).size,4);
      assert.ok(q.options.filter(x=>x!==q.correct).every(x=>
        !q.acceptedForms.includes(x)),'Opción alternativa válida tratada como falsa');
      assert.equal(evaluate(q,q.correct).correct,true);
    }
  }
  assert.ok(analysed>3000,'Faltan preguntas de elección en la auditoría');
});

test('Escritura y tablas: solo preguntas examinables y corrección de casillas reales',()=>{
  const nouns=latin2.filter(r=>r.kind==='sustantivo').slice(0,20);
  const records=[...nouns,
    latin2.find(r=>r.id==='latin2-pau-regular-verb-noceo')];
  let productive=0,tables=0;
  for(const r of records){
    const q=makeWrittenQuestions(only(r),{...base,rng:seedRng(5)});
    for(const item of q){
      productive++;
      assert.ok(correctWritten(item,item.acceptedForms[0]).correct,item.id);
    }
    const t=makeTableExercises(only(r),{...base,rng:seedRng(7)});
    for(const item of t){
      tables++;
      const answers=Object.fromEntries(item.cells.map(c=>[c.id,c.acceptedForms[0]]));
      assert.equal(evaluateTable(item,answers).complete,true,item.id);
    }
  }
  assert.ok(productive>100);
  assert.ok(tables>=15);
});

test('Modalidades de repaso: cinco filtros, categorías y prioridades conservadas',()=>{
  const candidates=[];
  for(const kind of ['sustantivo','adjetivo','pronombre','verbo','participio','infinitivo']){
    for(let i=0;i<8;i++)candidates.push({id:kind+':'+i,kind});
  }
  const now=Date.UTC(2026,10,14);
  let state=emptyReview();
  for(const kind of ['sustantivo','verbo','pronombre']){
    state=applyReview(state,kind+':0',false,now);
  }
  state=applyReview(state,'adjetivo:0',true,now);
  for(const mode of ['all','smart','errors','due','new']){
    const out=selectReviewCandidates(candidates,{
      mode,state,limit:10,rng:seedRng(3),now,balanceByKind:true
    });
    assert.equal(new Set(out.map(q=>q.id)).size,out.length,mode);
    if(mode==='all'||mode==='smart'||mode==='new')
      assert.ok(new Set(out.map(q=>q.kind)).size>=4,mode);
    if(mode==='errors'||mode==='due'){
      assert.equal(out.length,3,mode);
      assert.deepEqual(new Set(out.map(q=>q.id)),
        new Set(['sustantivo:0','verbo:0','pronombre:0']));
    }
    if(mode==='smart')for(const kind of ['sustantivo','verbo','pronombre'])
      assert.ok(out.some(q=>q.id===kind+':0'),'Se omitió repaso urgente de '+kind);
    if(mode==='new')assert.ok(out.every(q=>q.id!=='adjetivo:0'&&
      !q.id.endsWith(':0')||!state.items[q.id]));
  }
});

test('Dos enunciados verbales para el mismo lema reúnen las lecturas sin duplicarlas',()=>{
  const full='duco, ducere, duxi, ductum (3.ª)';
  const short='duco, duxi, ductum (3.ª)';
  const makeRecord=(id,headword,values)=>({
    id,language:'latin2',unit:0,kind:'verbo',headword,paradigm:headword,
    evidence:{status:'paradigma-documentado'},
    forms:values.map(([form,reading])=>({
      form,analysis:'verbo · '+headword+' · '+reading
    }))
  });
  const a=makeRecord('test-verb-short',short,[
    ['ducam','1.ª persona · singular · futuro · indicativo · voz activa'],
    ['duco','1.ª persona · singular · presente · indicativo · voz activa'],
    ['ducis','2.ª persona · singular · presente · indicativo · voz activa'],
    ['ducit','3.ª persona · singular · presente · indicativo · voz activa'],
    ['ducimus','1.ª persona · plural · presente · indicativo · voz activa'],
    ['ducitis','2.ª persona · plural · presente · indicativo · voz activa']
  ]);
  const b=makeRecord('test-verb-full',full,[
    ['ducam','1.ª persona · singular · presente · subjuntivo · voz activa'],
    ['ducas','2.ª persona · singular · presente · subjuntivo · voz activa'],
    ['ducat','3.ª persona · singular · presente · subjuntivo · voz activa'],
    ['ducamus','1.ª persona · plural · presente · subjuntivo · voz activa'],
    ['ducatis','2.ª persona · plural · presente · subjuntivo · voz activa'],
    ['ducant','3.ª persona · plural · presente · subjuntivo · voz activa']
  ]);
  const qs=makeQuestions({...bank,records:[a,b]},{
    ...base,activity:'analysis',rng:seedRng(4)
  });
  const ducam=qs.filter(q=>q.form==='ducam');
  assert.equal(ducam.length,1,'La misma forma no puede repetirse por variantes del enunciado');
  assert.equal(readings(ducam[0].correct).length,2);
  assert.match(ducam[0].correct,/futuro · indicativo/);
  assert.match(ducam[0].correct,/presente · subjuntivo/);
  assert.ok(!ducam[0].correct.includes(full),
    'La pantalla no debe mezclar los dos enunciados del mismo verbo');
  assert.ok(readings(ducam[0].correct).every(x=>x.includes(short)));
  const correct=new Set(readings(ducam[0].correct));
  assert.ok(ducam[0].options.filter(x=>x!==ducam[0].correct)
    .every(x=>readings(x).every(reading=>!correct.has(reading))));
});

test('Un homógrafo sustantivo y adjetivo no se fusiona como si fuera un lema',()=>{
  const candidates=latin2.filter(r=>r.headword?.startsWith('liber,')&&
    ['sustantivo','adjetivo'].includes(r.kind));
  assert.equal(candidates.length,2);
  const qs=makeQuestions({...bank,records:candidates},{
    ...base,activity:'analysis',rng:seedRng(9)
  }).filter(q=>q.form==='liber');
  assert.equal(qs.length,2,'liber sustantivo y liber adjetivo son lexemas diferentes');
  assert.deepEqual(new Set(qs.map(q=>q.kind)),new Set(['adjetivo','sustantivo']));
  assert.ok(qs.every(q=>readings(q.correct).every(a=>
    a.startsWith(q.kind+' · '))));
});
