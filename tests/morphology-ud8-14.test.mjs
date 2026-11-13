import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {compileMorphologyUd8to14} from '../scripts/morphology-ud8-14.mjs';
import {availableRecords,makeQuestions,evaluate,validateBank} from '../public/morfologia/engine.mjs';
import {makeWrittenQuestions,correctWritten,makeTableExercises,evaluateTable} from '../public/morfologia/written.mjs';

const root=resolve(import.meta.dirname,'..');
const curriculum=JSON.parse(readFileSync(join(root,'.sources/appendix/assets/curriculum.json'),'utf8'));
const bank=JSON.parse(readFileSync(join(root,'dist/apps/morfologia/data/paradigmas.json'),'utf8'));
const added=compileMorphologyUd8to14(curriculum);
const find=id=>bank.records.find(r=>r.id===id);
const rng=()=>.47;

test('Cobertura total de Latín I UD1–10 y Griego I UD1–14, recompilada por fuente SHA',()=>{
  validateBank(bank);
  assert.equal(added.length,52);
  assert.deepEqual(bank.records.slice(84,136),added);
  assert.equal(bank.records.length,144);
  assert.equal(new Set(bank.records.map(r=>r.id)).size,144);
  assert.deepEqual(bank.coverage.latin,Array.from({length:10},(_,i)=>i+1));
  assert.deepEqual(bank.coverage.griego,Array.from({length:14},(_,i)=>i+1));
  const byLanguageUnit=(language,unit)=>added.filter(r=>r.language===language&&r.unit===unit);
  for(const unit of [8,9,10])assert.ok(byLanguageUnit('latin',unit).length>0);
  for(const unit of [8,9,10,11,12,13,14])assert.ok(byLanguageUnit('griego',unit).length>0);
  assert.ok(added.every(r=>r.evidence.source==='Appendix grammaticae'&&
    r.evidence.caption&&r.evidence.topic&&r.evidence.file==='assets/curriculum.json'));
  assert.ok(added.every(r=>r.forms.every(f=>!f.form.includes('<')&&!f.form.includes('['))));
  assert.throws(()=>availableRecords(bank,{language:'latin',unit:11}),/todavía no disponible/);
  assert.throws(()=>availableRecords(bank,{language:'griego',unit:15}),/todavía no disponible/);
});
test('Latín I UD8: idem e ipse sin vocativo; infinitivos solo de las celdas expresas',()=>{
  const idem=find('latin-ud8-idem'),ipse=find('latin-ud8-ipse');
  assert.equal(idem.forms.length,30);assert.equal(ipse.forms.length,30);
  assert.equal(idem.forms.find(f=>f.analysis==='acusativo masculino singular').form,'eundem');
  assert.equal(ipse.forms.find(f=>f.analysis==='nominativo masculino singular').form,'ipse');
  assert.ok([idem,ipse].every(r=>r.forms.every(f=>f.case!=='vocativo')));
  const infinitives=find('latin-ud8-infinitivos');
  assert.equal(infinitives.forms.length,14);
  assert.ok(infinitives.forms.some(f=>f.form==='amare'));
  assert.ok(infinitives.forms.some(f=>f.form==='amatum esse'));
  assert.ok(infinitives.forms.some(f=>f.form==='amatum iri'));
  assert.ok(!availableRecords(bank,{language:'latin',unit:7}).some(r=>r.id==='latin-ud8-idem'));
});
test('Latín I UD9: comparativo y primeras personas expresas de perfecto pasivo',()=>{
  const comp=find('latin-ud9-comparativo');
  assert.equal(comp.forms.find(f=>f.analysis==='nominativo neutro plural').form,'altiora');
  const passive=find('latin-ud9-compuestos-pasivos');
  assert.equal(passive.forms.length,8);
  assert.ok(passive.forms.some(f=>f.form==='amatus sum'));
  assert.ok(passive.forms.some(f=>f.form==='amatæ sumus'));
  assert.ok(passive.forms.every(f=>f.person.startsWith('1.ª')));
  assert.ok(!availableRecords(bank,{language:'latin',unit:8}).some(r=>r.id===passive.id));
});
test('Latín I UD10: participio presente completo y perfecto únicamente singular',()=>{
  const present=find('latin-ud10-participio-presente');
  assert.equal(present.forms.find(f=>f.analysis==='genitivo neutro plural').form,'amantium');
  const perfect=find('latin-ud10-participio-perfecto');
  assert.equal(perfect.forms.length,18);
  assert.ok(perfect.forms.every(f=>f.number==='singular'));
  assert.equal(perfect.forms.find(f=>f.analysis==='acusativo femenino singular').form,'amatam');
  assert.ok(!makeTableExercises({...bank,records:[perfect]},
    {language:'latin',unit:10,limit:10,rng}).length,
    'No deben inventarse tablas de singular+plural del participio perfecto');
});
test('Griego I UD8: interrogativos, indefinidos y 16 paradigmas de tercera declinación',()=>{
  const nouns=added.filter(x=>x.id.startsWith('griego-ud8-noun-'));
  assert.equal(nouns.length,16);
  assert.ok(nouns.every(r=>r.forms.length>=10));
  assert.ok(nouns.every(r=>r.forms.every(f=>f.case&&f.number)));
  assert.equal(find('griego-ud8-noun-114-0-0').gender,'neutro');
  assert.equal(find('griego-ud8-noun-114-0-0').forms.find(f=>
    f.analysis==='nominativo plural').form,'τραύματα');
  const indefinite=find('griego-ud8-tis-indefinido');
  const neuter=indefinite.forms.filter(f=>f.analysis==='nominativo neutro plural').map(f=>f.form);
  assert.ok(neuter.includes('ἄττα'));
  assert.ok(neuter.includes('τινά'));
  const questions=makeWrittenQuestions({...bank,records:[indefinite]},
    {language:'griego',unit:8,limit:30,rng});
  const indefiniteCase=questions.find(q=>q.prompt.includes('nominativo neutro plural'));
  assert.ok(indefiniteCase?.acceptedForms.includes('ἄττα'));
  assert.equal(correctWritten(indefiniteCase,'ἄττα').correct,true);
  assert.ok(!availableRecords(bank,{language:'griego',unit:7}).some(r=>r.id===indefinite.id));
});
test('Griego I UD9–10: relativo y participios con caso, género, número y acentos',()=>{
  const rel=find('griego-ud9-relativo');
  assert.equal(rel.forms.length,24);
  assert.equal(rel.forms.find(f=>f.analysis==='genitivo masculino singular').form,'οὗ');
  const active=find('griego-ud10-on'),middle=find('griego-ud10-menos');
  assert.equal(active.forms.length,24);assert.equal(middle.forms.length,24);
  assert.equal(active.forms.find(f=>f.analysis==='nominativo masculino singular').form,'ὤν');
  assert.equal(middle.forms.find(f=>f.analysis==='nominativo masculino singular').form,'–μένος');
  assert.equal(middle.kind,'desinencia');
  assert.equal(correctWritten({activity:'written',kind:'desinencia',language:'griego',
    acceptedForms:['–μένος']},'μένος').correct,true);
  assert.ok(!availableRecords(bank,{language:'griego',unit:9}).some(r=>r.id===active.id));
});
test('Griego I UD11–13: futuros, imperfectos, aoristos, perfectos, pluscuamperfecto',()=>{
  for(const unit of [11,12,13]){
    const records=added.filter(r=>r.language==='griego'&&r.unit===unit);
    assert.ok(records.every(r=>r.kind==='verbo'));
    assert.ok(records.length>=2);
  }
  assert.equal(find('griego-ud11-futuro-lyo').forms[0].form,'λύσω');
  assert.ok(find('griego-ud11-futuro-lyo').forms.some(f=>f.form==='λύσουσι'));
  assert.equal(find('griego-ud12-sigmatico-medio').forms.find(f=>
    f.person==='2.ª singular').form,'ἐλύσω');
  assert.equal(find('griego-ud13-perfecto-lyo').forms[0].form,'λέλυκα');
  assert.ok(!availableRecords(bank,{language:'griego',unit:10}).some(r=>r.unit>=11));
});
test('Griego I UD14: contractos y temas en silbante, con erratas cotejadas en cuarentena editorial',()=>{
  const contracts=added.filter(r=>r.id.startsWith('griego-ud14-contract-'));
  assert.equal(contracts.length,12);
  assert.ok(contracts.every(r=>r.forms.length>=6));
  assert.equal(find('griego-ud14-contract-128-1').forms.find(f=>
    f.person==='2.ª plural').form,'ἐποιεῖτε');
  assert.equal(find('griego-ud14-contract-129-0').forms.find(f=>
    f.person==='2.ª singular').form,'ἐτιμῶ');
  for(const id of ['griego-ud14-contract-128-1','griego-ud14-contract-129-0']){
    assert.ok(find(id).evidence.correction?.url.includes('contract-verbs'));
  }
  assert.equal(added.filter(r=>r.id.startsWith('griego-ud14-sibilant-')).length,3);
  assert.equal(find('griego-ud14-sibilant-131').gender,'neutro');
  assert.equal(find('griego-ud14-sibilant-133').forms.find(f=>
    f.analysis==='nominativo plural').form,'κρέα');
  assert.ok(find('griego-ud14-sibilant-133').forms.every(f=>!f.form.includes('[')));
});
test('Desde cualquier UD nueva hay preguntas de reconocimiento, análisis y escritura',()=>{
  for(const [language,units] of [['latin',[8,9,10]],['griego',[8,9,10,11,12,13,14]]]){
    for(const unit of units){
      const available=availableRecords(bank,{language,unit});
      assert.ok(available.some(r=>r.unit===unit),'No hay material nuevo de '+language+' UD'+unit);
      for(const activity of ['form','analysis']){
        const questions=makeQuestions(bank,{language,unit,activity,limit:10,rng});
        assert.ok(questions.length>0,language+' UD'+unit+' '+activity);
        for(const q of questions){
          assert.equal(evaluate(q,q.correct).correct,true);
          assert.ok(q.evidence?.caption);
        }
      }
      const written=makeWrittenQuestions(bank,{language,unit,limit:10,rng});
      assert.ok(written.length>0,language+' UD'+unit+' escrita');
      assert.ok(written.every(q=>correctWritten(q,q.acceptedForms[0]).correct));
    }
  }
});
test('La compilación impide aceptar silenciosamente una tabla cambiada',()=>{
  const altered=structuredClone(curriculum);
  altered.griego.units.find(x=>x.number===14).topics.find(x=>x.title==='Verbos contractos').html=
    altered.griego.units.find(x=>x.number===14).topics.find(x=>x.title==='Verbos contractos').html
      .replace('<caption>Griego I · tabla 128</caption>',
        '<caption>Griego I · tabla sin verificar</caption>');
  assert.throws(()=>compileMorphologyUd8to14(altered),/tabla 128/);
  const alteredLatin=structuredClone(curriculum);
  alteredLatin.latin.units.find(x=>x.number===8).topics.find(x=>x.title==='Identidad y énfasis').html=
    alteredLatin.latin.units.find(x=>x.number===8).topics.find(x=>x.title==='Identidad y énfasis').html
      .replace('<caption><i lang="la">ipse</i>',
        '<caption><i lang="la">ipse SIN EVIDENCIA</i>');
  assert.throws(()=>compileMorphologyUd8to14(alteredLatin),/ipse, ipsa, ipsum/);
});
