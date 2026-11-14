import test from 'node:test';
import assert from 'node:assert/strict';
import {analyseCompound,createCompoundWitnessCollector,summarizeCompounds}
  from '../scripts/latin2-compounds.mjs';

function target(form,kind,headword,grammar,{person,number}={}){
  return {id:1,recordId:'latin2-fixture',lemma:headword.split(',')[0],
    form,kind,priority:'P1',type:'compuesto',
    analysis:kind+' · '+headword+' · '+grammar,
    expected:{pos:['V'],...(person?{person}:{}),...(number?{number}:{})}};
}
test('El perfecto pasivo coteja participio + persona y número del auxiliar',()=>{
  const a=analyseCompound(target('amatus sum','verbo',
    'amo, amavi, amatum (1.ª)',
    '1.ª persona · singular · perfecto · indicativo · voz pasiva',
    {person:'1',number:'SG'}));
  assert.equal(a.status,'estructura-compatible-con-paradigma');
  assert.equal(a.construction,'participio-perfecto+sum');
  assert.deepEqual(a.participleInterpretations,[{gender:'masculino',number:'SG',case:'NOM'}]);
  assert.deepEqual(a.issues,[]);
});
test('Las perífrasis deponentes admiten orden inverso de sus elementos',()=>{
  const a=analyseCompound(target('sum pollicitus','verbo',
    'polliceor, polliceri, pollicitus sum (2.ª deponente)',
    '1.ª persona · singular · perfecto · indicativo · voz pasiva (deponente, sentido activo)',
    {person:'1',number:'SG'}));
  assert.equal(a.status,'estructura-compatible-con-paradigma');
  assert.equal(a.components[0].form,'pollicitus');
  assert.equal(a.components[1].form,'sum');
});
test('El perfecto y el pluscuamperfecto de subjuntivo no se confunden',()=>{
  const good=analyseCompound(target('profecta sim','verbo',
    'proficiscor, proficisci, profectus sum (3.ª deponente)',
    '1.ª persona · singular · perfecto · subjuntivo · voz pasiva (deponente, sentido activo)',
    {person:'1',number:'SG'}));
  assert.equal(good.status,'estructura-compatible-con-paradigma');
  const bad=analyseCompound(target('profecta sim','verbo',
    'proficiscor, proficisci, profectus sum (3.ª deponente)',
    '1.ª persona · singular · pluscuamperfecto · subjuntivo · voz pasiva (deponente, sentido activo)',
    {person:'1',number:'SG'}));
  assert.ok(bad.issues.includes('tiempo-modo-auxiliar'));
});
test('La concordancia femenina plural no se confunde con femenino singular',()=>{
  const good=analyseCompound(target('relictae erant','verbo',
    'relinquo, reliqui, relictum (3.ª)',
    '3.ª persona · plural · pluscuamperfecto · indicativo · voz pasiva · concordancia femenino',
    {person:'3',number:'PL'}));
  assert.equal(good.status,'estructura-compatible-con-paradigma');
  const bad=analyseCompound(target('relicta erant','verbo',
    'relinquo, reliqui, relictum (3.ª)',
    '3.ª persona · plural · pluscuamperfecto · indicativo · voz pasiva · concordancia femenino',
    {person:'3',number:'PL'}));
  assert.ok(bad.issues.includes('tema-o-concordancia-no-coincidente'));
});
test('Las variantes gráficas no se declaran erratas automáticas',()=>{
  const a=analyseCompound(target('adgressus sum','verbo',
    'aggredior, aggredi, aggressus sum (3.ª deponente)',
    '1.ª persona · singular · perfecto · indicativo · voz pasiva (deponente, sentido activo)',
    {person:'1',number:'SG'}));
  assert.equal(a.status,'estructura-compatible-con-variante-documentada');
  assert.ok(a.checks.includes('variante-ortografica-documentada'));
  assert.equal(a.orthographicVariant.individualVerification,false);
});
test('Infinitivos perfectos y futuros distinguen supino, PPP y futuro activo',()=>{
  const head='amo, amavi, amatum (1.ª)';
  for(const [word,grammar,construction] of [
    ['amatum esse','perfecto · voz pasiva','participio-perfecto-acusativo+esse'],
    ['amaturum esse','futuro · voz activa','participio-futuro-activo+esse'],
    ['amatum iri','futuro · voz pasiva','supino+iri']
  ]){
    const item=analyseCompound(target(word,'infinitivo',head,grammar));
    assert.equal(item.status,'estructura-compatible-con-paradigma',word);
    assert.equal(item.construction,construction);
  }
});
test('Un nominativo del participio futuro no se certifica como ACI acusativo',()=>{
  const head='utor, uti, usus sum (3.ª deponente)';
  const bad=analyseCompound(target('usurus esse','infinitivo',head,'futuro · voz activa'));
  assert.equal(bad.status,'reserva-de-analisis');
  assert.ok(bad.issues.includes('participio-futuro-en-nominativo-no-acusativo'));
  const good=analyseCompound(target('usurum esse','infinitivo',head,'futuro · voz activa'));
  assert.equal(good.status,'estructura-compatible-con-paradigma');
});
test('Los enunciados con paréntesis interiores toman el último tema nominal',()=>{
  const a=analyseCompound(target('relatus est','verbo',
    'refero, referre, retuli (rettuli), relatum (irregular)',
    '3.ª persona · singular · perfecto · indicativo · voz pasiva',
    {person:'3',number:'SG'}));
  assert.equal(a.status,'estructura-compatible-con-paradigma');
});
test('futurum esse de sum se conserva como excepción, no como supino inventado',()=>{
  const a=analyseCompound(target('futurum esse','infinitivo',
    'sum, esse, fui (irregular)','futuro · voz activa'));
  assert.equal(a.status,'estructura-excepcional-sum');
});
test('El cotejo de componentes conserva fuente y no certifica expresiones',()=>{
  const x=analyseCompound(target('amatus sum','verbo',
    'amo, amavi, amatum (1.ª)',
    '1.ª persona · singular · perfecto · indicativo · voz pasiva',
    {person:'1',number:'SG'}));
  const collector=createCompoundWitnessCollector([x]);
  collector.ingest({lemma:'amo',form:'amatus',features:['V','PTCP'],
    rawFeatures:'V;PTCP'},'UniMorph Latin','sha-fijado');
  collector.ingest({lemma:'sum',form:'sum',features:['V','IND','PRS','1','SG'],
    rawFeatures:'V;IND;PRS;1;SG'},'UniMorph Latin','sha-fijado');
  collector.complete([x]);
  assert.equal(x.componentCoverage,2);
  assert.equal(x.evidenceSources.length,1);
  const s=summarizeCompounds([x]);
  assert.equal(s.attestedPhrases,0);
  assert.equal(s.individuallyVerified,false);
});
