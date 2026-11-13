import test from 'node:test';
import assert from 'node:assert/strict';
import {compileTeacherAudit} from '../scripts/compile-etymologicon-gr1.mjs';
import {createLearnerCatalog} from '../scripts/build-etymologicon.mjs';
import {expandGreekI,readExpansion} from '../scripts/expand-etymologicon-gr1.mjs';
import {createWriteTwoCorrector} from '../shared/academic/greek-etymology/corrector/write-two.mjs';
import {createQuizBank} from '../apps/etymologicon/quiz.mjs';
import {createStudyBank} from '../apps/etymologicon/study.mjs';
import {createDecompositionCatalog} from '../scripts/compile-etymologicon-decomposition.mjs';

const base=createLearnerCatalog(compileTeacherAudit());
const expansion=readExpansion();
const extended=expandGreekI(base,expansion);
const correction=createWriteTwoCorrector(extended);

test('los originales siguen idénticos y el nuevo banco no añade étimos ni cambia el curso',()=>{
  assert.equal(base.etymons.length,111);
  assert.equal(base.derivatives.length,201);
  assert.equal(base.relations.length,217);
  assert.equal(extended.etymons.length,111);
  assert.equal(extended.etymons.filter(e=>e.editorialStatus==='approved_for_documented_derivatives').length,108);
  assert.equal(extended.etymons.filter(e=>e.editorialStatus==='reference_only').length,3);
  assert.deepEqual(extended.etymons.map(x=>[x.id,x.lemma,x.units]),
    base.etymons.map(x=>[x.id,x.lemma,x.units]));
  assert.deepEqual(extended.derivatives.slice(0,201),base.derivatives);
  assert.deepEqual(extended.relations.slice(0,217),base.relations);
  assert.equal(extended.extension.newDerivatives,extended.derivatives.length-201);
  assert.equal(extended.extension.newRelations,extended.relations.length-217);
  assert.ok(extended.extension.newDerivatives>=100);
  assert.ok(extended.extension.newRelations>=150);
  assert.deepEqual(expansion.sourceDocuments.map(s=>s.id).slice(0,3),['largo','breve','gr2']);
});

test('ἄνθρωπος: antropocentrismo es correcto y no sustituye al banco anterior',()=>{
  const result=correction.grade('grc:ανθρωποσ',['antropocentrismo','antropología']);
  assert.equal(result.total,2);
  assert.deepEqual(result.answers.map(x=>x.status),['exact','exact']);
  assert.equal(correction.grade('grc:ανθρωποσ',['antropocentrismo','antropocentrismo']).total,1);
});
test('μισέω: misoginia y misantropía son dos derivados aceptados distintos',()=>{
  const result=correction.grade('grc:μισεω',['misoginia','misantropía']);
  assert.equal(result.total,2);
  assert.deepEqual(result.answers.map(x=>x.status),['exact','exact']);
  const misspelled=correction.grade('grc:μισεω',['misoginia','misantropia']);
  assert.equal(misspelled.total,1.5);
  assert.equal(misspelled.answers[1].status,'orthographic_error');
  assert.equal(misspelled.answers[1].correctForm,'misantropía');
});
test('las relaciones añadidas se someten al corrector cerrado y no se aceptan palabras arbitrarias',()=>{
  const etyma=new Set(extended.etymons.map(e=>e.id));
  const derivativeById=new Map(extended.derivatives.map(x=>[x.id,x]));
  const allowed=new Map(extended.etymons.map(e=>[e.id,new Set(e.teacherApprovedDerivatives)]));
  for(const row of expansion.groups){
    assert.ok(etyma.has(row.etymonId));
    for(const term of row.forms){
      const key=term.normalize('NFC').toLocaleLowerCase('es').replace(/\s/gu,'');
      const derivative=extended.derivatives.find(d=>
        [d.form,...d.officialOrthographicVariants].some(f=>
          f.normalize('NFC').toLocaleLowerCase('es').replace(/\s/gu,'')===key));
      assert.ok(derivative,'Derivado ausente: '+term);
      assert.ok(allowed.get(row.etymonId).has(derivative.id),term);
      const checked=correction.grade(row.etymonId,[term,'']);
      assert.equal(checked.answers[0].points,1,'Debe aceptar '+term+' para '+row.etymonId);
      assert.ok(derivativeById.has(derivative.id));
    }
  }
  assert.equal(correction.grade('grc:ανθρωποσ',['salchichón','astronauta']).total,0);
  for(const id of ['grc:δωρον','grc:δικη','grc:παιδιον'])
    assert.equal(correction.grade(id,['misoginia','antropocentrismo']).status,'not_eligible');
});
test('las demás actividades consumen el banco aumentado sin desactivar Griego II ni inventar composiciones',()=>{
  const study=createStudyBank(extended);
  const quiz=createQuizBank(extended);
  assert.equal(study.eligibleIds.length,108);
  assert.ok(study.getCard('grc:μισεω').derivatives.some(d=>d.form==='misoginia'));
  assert.ok(quiz.mcq('grc:ανθρωποσ',{random:()=>0.27}));
  assert.deepEqual(quiz.gradeInverse(quiz.inverse('grc:ανθρωποσ',{random:()=>0.29}),
    'ἄνθρωπος').correct,true);
  const decompositions=createDecompositionCatalog(base);
  assert.equal(decompositions.entries.length,16);
  assert.equal(decompositions.audit.derivativesReviewedForEligibility,201);
});
