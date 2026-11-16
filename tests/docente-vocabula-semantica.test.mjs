import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {entryKey,mergeCatalog,matchCatalog} from '../public/docente/vocabula-catalog.mjs';

const original=(id,mode,meaning,answers,units,form='silva, –æ')=>
  ({id,subject:'lat1',mode,form,meaning,answers,units});

test('una sola tarjeta conserva acepciones, respuestas y unidades de cada procedencia',()=>{
  const general=original('general-id','general','selva',['selva','bosque'],['UD 3','UD 7']);
  const examen=original('examen-id','examen','bosque',['bosque'],['UD 6']);
  const input=[general,examen],before=JSON.stringify(input);
  const result=mergeCatalog(input,[]);
  assert.equal(result.length,1,'No duplicar la tarjeta de la misma forma');
  const row=result[0];
  assert.equal(row.semanticConflict,true);
  assert.equal(row.variants.length,2);
  assert.deepEqual(row.variants.map(variant=>variant.answers),
    [['selva','bosque'],['bosque']]);
  assert.deepEqual(row.sources.map(source=>[source.id,source.mode,source.units]),
    [['general-id','general',['UD 3','UD 7']],['examen-id','examen',['UD 6']]]);
  assert.deepEqual(row.answers,[],'No atribuir a una procedencia respuestas ajenas');
  assert.equal(matchCatalog(result,{search:'selva'}).total,1);
  assert.equal(matchCatalog(result,{search:'bosque'}).total,1);
  assert.equal(JSON.stringify(input),before,'El banco original es inmutable');
});

test('las variantes griegas normalizadas mantienen los IDs y regímenes distintos',()=>{
  const general={id:'g',subject:'gr1',mode:'general',form:'ἀκούω',
    meaning:'escuchar',answers:['escuchar'],units:['UD 1–4']};
  const examen={...general,id:'e',mode:'examen',form:'ἀκούω',
    meaning:'escuchar (+ gen. CRV)'};
  assert.equal(entryKey(general),entryKey(examen));
  const row=mergeCatalog([general,examen],[])[0];
  assert.equal(row.sources.length,2);
  assert.equal(row.variants.length,2);
  assert.deepEqual(row.sources.map(s=>s.id),['g','e']);
  assert.deepEqual(row.sources.map(s=>s.mode),['general','examen']);
  assert.equal(matchCatalog([row],{search:'CRV'}).total,1);
});

test('glosas idénticas con respuestas diferentes siguen separadas',()=>{
  const general=original('g','general','bueno/a',['bueno/a','bueno'],['UD 1'],'bonus');
  const examen=original('e','examen','bueno/a',['bueno/a'],['UD 1'],'bonus');
  const row=mergeCatalog([general,examen],[])[0];
  assert.equal(row.semanticConflict,true);
  assert.equal(row.variants.length,2);
});

test('se agrupan solo variantes realmente idénticas, conservando cada fuente',()=>{
  const general=original('g','general','casa',['casa'],['UD 2'],'domus');
  const examen=original('e','examen','casa',['casa'],['UD 4'],'domus');
  const row=mergeCatalog([general,examen],[])[0];
  assert.equal(row.semanticConflict,false);
  assert.equal(row.variants.length,1);
  assert.deepEqual(row.variants[0].sources.map(s=>s.units),[['UD 2'],['UD 4']]);
  assert.deepEqual(row.sources.map(s=>s.id),['g','e']);
});

test('la versión docente conserva trazabilidad y la retirada devuelve el banco original',()=>{
  const sources=[
    original('g','general','selva',['selva'],['UD 3']),
    original('e','examen','bosque',['bosque'],['UD 6'])
  ];
  const custom={id:'docente-id',subject:'lat1',form:'silva, –æ',
    meaning:'bosque',answers:['bosque'],units:['UD 6'],in_exam:true,active:true};
  const active=mergeCatalog(sources,[custom]);
  assert.equal(active.length,1);
  assert.equal(active[0].origin,'docente');
  assert.equal(active[0].originalSemanticConflict,true);
  assert.deepEqual(active[0].originalSources.map(s=>s.id),['g','e']);
  const inactive=mergeCatalog(sources,[{...custom,active:false}]);
  assert.equal(inactive.length,2);
  assert.equal(inactive.find(x=>x.origin==='original').sources.length,2);
  assert.equal(inactive.find(x=>x.origin==='docente').id,'docente-id');
});

test('el banco compilado mantiene todas sus 2055 fichas, 9 glosas y 12 diferencias de respuestas',()=>{
  const data=JSON.parse(readFileSync(resolve(import.meta.dirname,
    '../dist/docente/vocabula-catalog.json'),'utf8'));
  assert.equal(data.schema,1);
  assert.equal(data.words.length,2055);
  const originalIds=data.words.map(word=>word.id);
  assert.equal(new Set(originalIds).size,2055);
  const rows=mergeCatalog(data.words,[]);
  assert.equal(rows.length,1684);
  assert.equal(rows.reduce((n,row)=>n+row.sources.length,0),2055);
  assert.deepEqual(new Set(rows.flatMap(row=>row.sources.map(s=>s.id))),new Set(originalIds));
  const byKey=new Map();
  for(const word of data.words){
    const key=entryKey(word),arr=byKey.get(key)||[];
    arr.push(word);byKey.set(key,arr);
  }
  const differingGlossa=[...byKey.values()].filter(items=>
    new Set(items.map(item=>item.meaning)).size>1);
  const differingAnswers=[...byKey.values()].filter(items=>
    new Set(items.map(item=>JSON.stringify(item.answers))).size>1);
  assert.equal(differingGlossa.length,9);
  assert.equal(differingAnswers.length,12);
  assert.equal(rows.filter(row=>row.semanticConflict).length,18);
  for(const row of rows){
    const originals=byKey.get(entryKey(row));
    assert.deepEqual(row.sources.map(s=>s.id),originals.map(s=>s.id));
    assert.deepEqual(row.sources.map(s=>s.mode),originals.map(s=>s.mode));
    assert.deepEqual(row.sources.map(s=>s.units),originals.map(s=>s.units));
    assert.deepEqual(row.sources.map(s=>s.answers),originals.map(s=>s.answers));
    assert.deepEqual(row.sources.map(s=>s.meaning),originals.map(s=>s.meaning));
  }
});
