import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compileTeacherAudit} from '../scripts/compile-etymologicon-gr1.mjs';
import {createLearnerCatalog} from '../scripts/build-etymologicon.mjs';
import {expandGreekI,readExpansion} from '../scripts/expand-etymologicon-gr1.mjs';
import {createStudyCatalog,readStudyGlosses} from '../scripts/compile-etymologicon-study.mjs';
import {createWriteTwoCorrector} from '../shared/academic/greek-etymology/corrector/write-two.mjs';

const base=compileTeacherAudit();
const learner=createLearnerCatalog(base);
const extended=expandGreekI(learner);
const lexicon=readStudyGlosses();
const study=createStudyCatalog(base,extended,lexicon);
const lookup=name=>study.words.find(w=>w.form===name);

test('cobertura completa: las 487 entradas tienen definición propia sin alterar las 201 aprobadas',()=>{
  assert.equal(study.etymons.length,111);
  assert.equal(study.words.length,487);
  assert.equal(study.audit.covered,487);
  assert.equal(study.audit.allHaveDidacticDefinition,true);
  assert.equal(extended.derivatives.length,487);
  assert.equal(learner.derivatives.length,201);
  assert.equal(Object.keys(lexicon.definitions).length,302);
  assert.ok(study.words.every(w=>w.definition.length>=18&&w.connection.length>20));
  const old=new Map(base.derivatives.map(d=>[d.id,d.definitions?.[0]?.text]));
  for(const w of study.words)if(old.has(w.id))assert.equal(w.definition,old.get(w.id),w.form);
  const source=readExpansion();
  for(const g of source.groups)for(const term of g.forms)
    assert.ok(lexicon.definitions[term],'Sin glosa en la ampliación: '+term);
});
test('filología y filosofía muestran dos bases griegas y sus acepciones correctas',()=>{
  for(const [word,parts] of [['filología',['φίλος','λόγος']],
    ['filosofía',['φίλος','σοφία']]]){
    const row=lookup(word);
    assert.ok(row&&row.explicitMultiple);
    assert.deepEqual(row.components.map(x=>x.greek),parts);
    assert.ok(row.components.every(x=>x.gloss&&x.id));
    assert.equal(row.lexicographicStatus,'dle_consultado_individualmente');
  }
  assert.ok(lookup('filosofía').connection.includes('sabiduría'));
  assert.ok(lookup('filología').connection.includes('palabras'));
});
test('antropocentrismo, misoginia y misantropía explican ambos elementos sin generar nuevos étimos de examen',()=>{
  for(const word of ['antropocentrismo','misoginia','misantropía']){
    const row=lookup(word);
    assert.equal(row.components.length,2,word);
    assert.equal(row.lexicographicStatus,'dle_consultado_individualmente');
  }
  assert.ok(lookup('antropocentrismo').components.some(x=>x.external&&x.greek==='κέντρον'));
  assert.deepEqual(lookup('misoginia').components.map(x=>x.greek),['μισέω','γυνή']);
  assert.deepEqual(lookup('misantropía').components.map(x=>x.greek),['μισέω','ἄνθρωπος']);
  assert.equal(study.etymons.length,111);
});
test('no confundir una URL del diccionario con una comprobación individual',()=>{
  assert.ok(study.audit.individualDleChecks>0);
  assert.ok(study.audit.remainingDleChecks>0);
  for(const w of study.words){
    assert.ok(w.dleUrl.startsWith('https://dle.rae.es/'));
    assert.ok(['dle_consultado_individualmente','glosa_docente_no_cotejada_individualmente_dle']
      .includes(w.lexicographicStatus));
    assert.ok(w.components.every(x=>!x.external||x.gloss));
  }
  assert.equal(lookup('autoevaluación').lexicographicStatus,'dle_consultado_individualmente');
  assert.equal(lookup('microchip').components[1].language,'en');
});
test('relaciones múltiples solo afectan al glosario; corrector y progreso siguen iguales',()=>{
  const corrector=createWriteTwoCorrector(extended);
  assert.equal(corrector.grade('grc:μισεω',['misoginia','misantropía']).total,2);
  assert.equal(corrector.grade('grc:ανθρωποσ',['antropocentrismo','antropología']).total,2);
  assert.equal(study.etymons.filter(e=>e.eligible).length,108);
  assert.equal(study.etymons.filter(e=>!e.eligible).length,3);
  assert.ok(!('editorialDecisions' in study));
  assert.ok(!('originalWorkbook' in study));
  assert.ok(!('definitions' in extended.derivatives[0]));
});
