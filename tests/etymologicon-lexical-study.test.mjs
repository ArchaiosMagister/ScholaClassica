import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compileTeacherAudit} from '../scripts/compile-etymologicon-gr1.mjs';
import {createLearnerCatalog,createPracticeCatalog} from '../scripts/build-etymologicon.mjs';
import {expandGreekI,readExpansion} from '../scripts/expand-etymologicon-gr1.mjs';
import {createStudyCatalog,readStudyGlosses,readStudyComponents,readSourceConcordance,readLexicographicChecks} from '../scripts/compile-etymologicon-study.mjs';
import {createWriteTwoCorrector} from '../shared/academic/greek-etymology/corrector/write-two.mjs';
import {createStudyBank} from '../apps/etymologicon/study.mjs';

const base=compileTeacherAudit();
const learner=createLearnerCatalog(base);
const extended=expandGreekI(learner);
const lexicon=readStudyGlosses();
const study=createStudyCatalog(base,extended,lexicon);
const practice=createPracticeCatalog(extended,study);
const lookup=name=>study.words.find(w=>w.form===name);

test('cobertura completa: las 487 entradas tienen definición propia sin alterar las 201 aprobadas',()=>{
  assert.equal(study.etymons.length,111);
  assert.equal(study.words.length,487);
  assert.equal(study.audit.covered,487);
  assert.equal(study.audit.allHaveDidacticDefinition,true);
  assert.equal(extended.derivatives.length,487);
  assert.equal(learner.derivatives.length,201);
  assert.equal(Object.keys(lexicon.definitions).length,302);
  assert.ok(study.words.every(w=>w.definition.length>=8&&w.connection.length>20));
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
  assert.ok(study.audit.dleHeadwordChecks>study.audit.individualDleChecks);
  assert.equal(study.audit.pendingLexicalAdmission,0);
  assert.equal(study.audit.pendingDleWithSpecialistEvidence,4);
  for(const w of study.words){
    assert.ok(w.dleUrl.startsWith('https://dle.rae.es/'));
    assert.ok(['dle_consultado_individualmente','glosa_docente_no_cotejada_individualmente_dle']
      .includes(w.lexicographicStatus));
    assert.ok(w.components.every(x=>!x.external||x.gloss));
  }
  assert.equal(lookup('autoevaluación').lexicographicStatus,'dle_consultado_individualmente');
  assert.equal(lookup('microchip').components[1].language,'en');
});
test('componentes dobles y triples también están documentados para materias científicas',()=>{
  const curated=readStudyComponents();
  assert.equal(Object.keys(curated).length,487);
  assert.equal(study.audit.explicitComponentReviews,487);
  assert.equal(study.audit.compounds+study.audit.singleStemOrFamily,487);
  assert.deepEqual(lookup('biología').components.map(c=>c.greek),['βίος','λόγος']);
  assert.doesNotMatch(lookup('biología').connection,/no es necesariamente una traducción literal/i);
  assert.deepEqual(lookup('biblioteca').components.map(c=>c.greek),['βιβλίον','θήκη']);
  assert.equal(lookup('biblioteca').components[1].external,true);
  assert.equal(lookup('otorrinolaringología').components.length,4);
  assert.equal(lookup('calidoscopio').components.length,3);
  assert.equal(lookup('microbiología').components.length,3);
  assert.ok(lookup('anarquía').components.some(c=>c.external));
});
test('revisión exhaustiva: 487 fichas, componentes documentados y distinción entre simple y compuesto',()=>{
  const curated=readStudyComponents();
  assert.equal(Object.keys(curated).length,487);
  assert.equal(study.words.length,487);
  for(const w of study.words){
    assert.ok(curated[w.documentedForm||w.form],'No aparece en el repertorio explícito: '+w.form);
    assert.equal(w.componentReview,'analisis_explicito_del_banco_docente');
    assert.ok(w.components.every(c=>c.greek&&c.gloss));
    assert.ok(['varias_bases','base_o_familia'].includes(w.formation));
  }
  for(const [word,greek] of [
    ['antropomorfismo',['ἄνθρωπος','μορφή']],
    ['telegrama',['τῆλε','γράμμα']],
    ['telégrafo',['τῆλε','γράφω']],
    ['geodesia',['γῆ','δαίω']],
    ['catarata',['κατά','ῥάσσω']],
    ['neumonía',['πνεύμων']],
    ['cromosoma',['χρῶμα','σῶμα']],
    ['sinfonía',['σύν','φωνή']]
  ]){
    const row=lookup(word);
    assert.ok(row,'Falta el derivado: '+word);
    assert.deepEqual(row.components.map(c=>c.greek),greek,word);
  }
  assert.ok(lookup('antropomorfismo').components.some(c=>c.greek==='μορφή'&&c.external));
  assert.ok(lookup('telegrama').components.some(c=>c.greek==='τῆλε'&&c.external));
  assert.ok(lookup('telegrama').componentSources.length>=2);
  assert.equal(lookup('microchip').components[1].language,'en');
  assert.equal(lookup('burocracia').components[0].language,'fr');
  assert.equal(lookup('autoevaluación').components[1].language,'es');
  assert.equal(lookup('efeméride').components.length,2);
  assert.ok(!study.words.some(w=>w.form==='efemérides'),
    'No crear otra ficha para una variante del mismo lexema');
});
test('cotejo por los tres PDF preserva trazabilidad real y no equivale al DLE',()=>{
  const sources=readSourceConcordance();
  const checks=readLexicographicChecks();
  assert.equal(Object.keys(sources.firstPageByTerm).length,487);
  assert.equal(Object.keys(checks.records).length,121);
  assert.equal(study.audit.pdfAttested,475);
  assert.equal(study.audit.pdfNoExactMatch,12);
  assert.equal(study.audit.individuallyCheckedDleThisReview,112);
  assert.equal(study.audit.individuallyCheckedSpecialistThisReview,6);
  assert.equal(study.audit.confirmedNotIndependentDleThisReview,5);
  assert.ok(study.audit.individualDleChecks<487,
    'Una mención en PDF no certifica un artículo del DLE');
  assert.equal(study.words.filter(w=>w.pdfAttestations.length>0).length,475);
  assert.ok(study.words.every(w=>w.pdfAttestations.every(ref=>
    ref.page>0&&sources.sources.some(x=>x.id===ref.sourceId&&ref.page<=x.pages))));
  for(const word of ['geniogloso','genioplastia','proctitis','seudociencia']){
    assert.ok(!lookup(word).pdfAttested,word);
    assert.ok(lookup(word).lexicographicCheck,word);
  }
  assert.equal(lookup('geniogloso').lexicographicCheck.status,
    'dle_no_incluye_entrada_independiente');
  assert.equal(lookup('proctitis').lexicographicCheck.status,
    'fuente_especializada_contrastada');
});
test('las diferencias lexicográficas se explican en las fichas documentales',()=>{
  assert.match(lookup('autarquía').definition,/autosuficiencia/i);
  assert.doesNotMatch(lookup('autarquía').definition,/poder independiente/i);
  assert.match(lookup('autarquía').editorialNote,/autarquía¹/);
  assert.match(lookup('autarquía').editorialNote,/autarquía²/);
  assert.match(lookup('plastilina').editorialNote,/marca registrada/i);
  assert.match(lookup('tanatología').editorialNote,/francés/);
  assert.match(lookup('tomografía').editorialNote,/inglés/);
  assert.equal(lookup('atelectasia').lexicographicStatus,'dle_consultado_individualmente');
  assert.equal(lookup('seudociencia').lexicographicStatus,
    'glosa_docente_no_cotejada_individualmente_dle');
  assert.equal(lookup('microbiología').pdfAttested,true);
  assert.equal(study.words.length,487);
  assert.equal(extended.derivatives.length,487);
});
test('la práctica conserva las aprobaciones aplicables y los 108 IDs de progreso',()=>{
  const corrector=createWriteTwoCorrector(practice);
  assert.equal(corrector.grade('grc:μισεω',['misoginia','misantropía']).total,2);
  assert.equal(corrector.grade('grc:ανθρωποσ',['antropocentrismo','antropología']).total,2);
  assert.equal(study.etymons.filter(e=>e.eligible).length,108);
  assert.equal(study.etymons.filter(e=>!e.eligible).length,3);
  assert.ok(!('editorialDecisions' in study));
  assert.ok(!('originalWorkbook' in study));
  assert.ok(!('definitions' in extended.derivatives[0]));
  assert.deepEqual(practice.etymons.map(e=>e.id),extended.etymons.map(e=>e.id));
  assert.equal(practice.etymons.filter(e=>corrector.isEligible(e.id)).length,107);
  assert.equal(corrector.isEligible('grc:ψευδησ'),false);
  assert.deepEqual(createStudyBank(practice).getCard('grc:ψευδησ').derivatives.map(d=>d.form),['seudónimo']);
});
test('la admisión DLE rige las fichas, las relaciones y la puntuación',()=>{
  const corrector=createWriteTwoCorrector(practice);
  const allowed=new Set(practice.derivatives.map(d=>d.id));
  assert.equal(allowed.size,484);
  for(const etymon of practice.etymons){
    assert.ok(etymon.teacherApprovedDerivatives.every(id=>allowed.has(id)),etymon.id);
    assert.deepEqual(new Set(etymon.teacherApprovedDerivatives),
      new Set(practice.relations.filter(r=>r.etymonId===etymon.id).map(r=>r.derivativeId)));
  }
  for(const word of study.words)
    assert.equal(allowed.has(word.id),word.admission.practiceEligible,word.form);
  for(const form of ['seudociencia','hemofobia','teocentrismo']){
    const word=lookup(form);
    assert.equal(word.admission.status,'solo_consulta',form);
    assert.ok(word.admission.reason&&word.admission.sourceUrl,form);
    assert.ok(extended.derivatives.some(d=>d.id===word.id),form);
  }
  for(const form of ['seudociencia','pseudociencia','hemofobia','teocentrismo'])
    assert.equal(corrector.grade('grc:φοβοσ',[form,'']).answers[0].status,'excluded',form);
  for(const form of ['geniogloso','genioplastia','proctitis','dendrología','atelocardia','hemoterapia']){
    const word=lookup(form);
    assert.equal(word.admission.status,'excepcion_cientifica',form);
    assert.ok(word.lexicographicCheck.scientificSources.length,form);
    assert.ok(practice.relations.filter(r=>r.derivativeId===word.id).every(r=>!r.eligibleFor.includes('exam')),form);
  }
  assert.equal(corrector.grade('grc:γενειον',['geniogloso','genioplastia']).total,2);
  assert.equal(corrector.grade('grc:περι',['periodo','']).total,1);
  const biotopo=lookup('biotopo');
  assert.equal(biotopo.id,'es:biótopo');
  assert.equal(biotopo.documentedForm,'biótopo');
  assert.equal(corrector.grade(biotopo.etymonIds[0],['biotopo','']).total,1);
  assert.equal(corrector.grade(biotopo.etymonIds[0],['biótopo','']).total,0.5);
});
test('πνεύμων se conserva como étimo inmediato y su familia se admite bajo πνεῦμα por decisión docente',()=>{
  assert.deepEqual(lookup('neumología').components.map(c=>c.greek),['πνεύμων','λόγος']);
  for(const form of ['neumología','neumonía']){
    const word=lookup(form);
    assert.equal(word.components[0].external,true);
    assert.deepEqual(word.etymonIds,['grc:πνευμα']);
    assert.equal(word.admission.practiceEligible,true);
    assert.match(word.editorialNote,/decisión docente/);
    assert.ok(extended.etymons.find(e=>e.id==='grc:πνευμα').teacherApprovedDerivatives.includes(word.id));
    assert.ok(study.etymons.find(e=>e.id==='grc:πνευμα').wordIds.includes(word.id));
  }
  assert.ok(practice.etymons.every(e=>!e.lemma.includes('πνεύμων')));
  assert.equal(createWriteTwoCorrector(practice).grade('grc:πνευμα',['neumático','neumotórax']).total,2);
  assert.equal(createWriteTwoCorrector(practice).grade('grc:πνευμα',['neumología','neumonía']).total,2);
});
