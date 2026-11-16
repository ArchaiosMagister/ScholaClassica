import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {analyzeTransversal,loadTransversal,parseVocabulaData,
  explicitNounGender,lexicalKey,TRANSVERSAL_COURSES}
  from '../scripts/audit-filologia-transversal.mjs';

const root=resolve(import.meta.dirname,'..');
const all=loadTransversal(root);
const report=analyzeTransversal(all);

test('Auditoría filológica completa: tres currículos ES/VAL, cobertura y origen inmutable',()=>{
  assert.deepEqual(TRANSVERSAL_COURSES.map(x=>x.units),[10,8,14]);
  assert.equal(report.schema,'scholaclassica-filologia-transversal/v1');
  assert.equal(report.sourcePreserved.sourceCards,2055);
  assert.equal(report.sourcePreserved.integratedCards,2055);
  assert.equal(report.sourcePreserved.intentionalLatin4ExamUd8,17);
  assert.equal(report.sourcePreserved.intentionalLatin4Spelling,4);
  assert.equal(report.subjects.latin1.morphologyCards,92);
  assert.equal(report.subjects.latin4.morphologyCards,76);
  assert.equal(report.subjects.griego1.morphologyCards,94);
  assert.deepEqual(Object.values(report.subjects).map(x=>x.grammarUnits),[10,8,14]);
  assert.ok(Object.values(report.subjects).every(x=>x.structuralParity===true));
  assert.ok(report.reviews.every(x=>x.entryId&&x.paradigmId&&x.form));
  assert.deepEqual(report.noteMarkers,[],
    'Un asterisco o signo de nota aparece en una respuesta de morfología');
  assert.equal(report.greekIndividualReview.totalParadigms,7);
  assert.equal(report.greekIndividualReview.totalSlotsChecked,110);
  assert.equal(report.greekIndividualReview.totalReadingsChecked,116);
  assert.equal(report.latinAdjectiveReview.checkedModels,10);
  assert.equal(report.latinAdjectiveReview.checkedSlots,360);
  assert.deepEqual(report.latinNominalVerbalReview.counts,{
    nouns:{models:10,slots:120,readings:122},
    verbs:{models:68,slots:408,readings:408},
    teacher:{models:5,slots:30,readings:30}
  });
  assert.equal(report.latinBilingualMeaningReview.checkedTopicPairs,7);
  assert.equal(report.latinBilingualMeaningReview.objectiveAnchorsPerLanguage,52);
  assert.equal(report.latinRemainingReview.readingsChecked,262);
  assert.deepEqual(report.latinRemainingReview.slots,{
    nominal:96,futures:66,deponents:30,imperatives:10,teacherImperfect:60
  });
  assert.equal(report.latinBilingualAdditionalReview.topicPairs,9);
  assert.equal(report.latinBilingualAdditionalReview.LatinFormsPerLanguage,85);
  assert.equal(report.latinBilingualAdditionalReview.teachingClaimsPerLanguage,24);
});
test('Las listas de Examen no se confunden con la práctica ni el General',()=>{
  const {latin1,latin4,griego1}=report.subjects;
  assert.equal(latin1.vocabulary.examen,115);
  assert.equal(latin4.vocabulary.examen,127);
  assert.equal(griego1.vocabulary.examen,171);
  assert.equal(latin1.examGroupCounts['UD 7'],15);
  assert.equal(griego1.examGroupCounts['UD 10'],10);
  assert.equal(latin4.examGroupCounts['UD 8'],17);
  assert.ok(!Object.keys(latin4.examGroupCounts).includes('UD 8–9'),
    'La conciliación filológica individual de 17 fichas debe mantenerse');
  assert.ok(!Object.keys(latin1.examGroupCounts).some(k=>/^UD (8|9|10)$/u.test(k)));
  assert.ok(!Object.keys(griego1.examGroupCounts).some(k=>/^UD (11|12|13|14)$/u.test(k)));
  assert.equal(latin1.vocabulary.general,741);
  assert.equal(latin4.vocabulary.general,379);
  assert.equal(griego1.vocabulary.general,332);
});
test('El cotejo de géneros distingue sustantivos comunes y diferencias de grafía',()=>{
  assert.equal(explicitNounGender('φύλαξ, –ακος (ὁ, ἡ)','griego'),'fm');
  assert.equal(explicitNounGender('φύλαξ, –ακος (ὁ o ἡ)','griego'),'fm');
  assert.equal(explicitNounGender('ἀρχή, –ῆς (ἡ)','griego'),'f');
  assert.equal(explicitNounGender('δῶρον, –ου (τό)','griego'),'n');
  assert.equal(explicitNounGender('rex, regis (m.)','latin'),'m');
  assert.equal(explicitNounGender('mare, maris (n.)','latin'),'n');
  assert.equal(explicitNounGender('dies, diei (m. y f.)','latin'),'fm');
  assert.equal(explicitNounGender('bonus, –a, –um','latin'),null);
  assert.equal(lexicalKey('φύλαξ, φύλακος'),lexicalKey('φύλαξ, –ακος'));
  assert.equal(lexicalKey('Cæsar, –aris'),lexicalKey('Caesar, Caesaris'));
  assert.throws(()=>parseVocabulaData('window.VOCAB={};'),/Formato/);
});
test('Las formas corregidas en Appendix se leen realmente en morfología integrada',()=>{
  for(const language of ['latin','latin4']){
    const model=all.bank.records.find(x=>x.language===language&&
      lexicalKey(x.paradigm)==='acer'&&x.kind==='adjetivo');
    assert.ok(model,'Falta el adjetivo acer en '+language);
    const voc=model.forms.find(x=>x.case==='vocativo'&&
      x.number==='singular'&&x.gender==='masculino');
    assert.equal(voc?.form,'acer','El vocativo masculino no es acre');
  }
  const elpis=all.bank.records.find(x=>x.language==='griego'&&
    lexicalKey(x.paradigm)===lexicalKey('ἐλπίς')&&x.kind==='sustantivo');
  assert.ok(elpis,'Falta el paradigma de ἐλπίς');
  const voc=elpis.forms.find(x=>x.case==='vocativo'&&x.number==='singular');
  assert.equal(voc?.form.normalize('NFC'),'ἐλπί'.normalize('NFC'));
  const hegemon=all.bank.records.find(x=>x.language==='griego'&&
    lexicalKey(x.paradigm)===lexicalKey('ἡγεμών'));
  assert.ok(hegemon);
  assert.equal(hegemon.forms.find(x=>x.case==='vocativo'&&
    x.number==='singular')?.form,'ἡγεμών');
  const megas=all.bank.records.find(x=>x.id==='griego-adj-megas');
  assert.ok(megas);
  assert.deepEqual(megas.forms.filter(x=>x.case==='vocativo'&&
    x.gender==='masculino'&&x.number==='singular').map(x=>x.form),
    ['μεγάλε','μέγας']);
  const ouranos=all.bank.records.find(x=>x.language==='griego'&&
    lexicalKey(x.paradigm)===lexicalKey('οὐρανός'));
  assert.ok(ouranos,'Conservar el registro de οὐρανός');
  assert.equal(ouranos.forms.filter(x=>x.number==='plural').length,5,
    'Los plurales quedan documentados aunque se excluyan del sorteo');
});
