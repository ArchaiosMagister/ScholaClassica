import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {parsePauExamQuestions,latinFold} from '../scripts/morphology-pau-latin2.mjs';
import {compileVenioParadigm,compilePauCompoundVerbs} from '../scripts/morphology-pau-verbs.mjs';
import {makeQuestions,evaluate} from '../public/morfologia/engine.mjs';
const root=resolve(import.meta.dirname,'..');
const read=x=>readFileSync(join(root,x),'utf8');
const exams=parsePauExamQuestions(read('shared/academic/latin2/pau-cv-2006-2026.tsv'));
const bank=JSON.parse(read('dist/apps/morfologia/data/paradigmas.json'));
const report=JSON.parse(read('dist/apps/morfologia/data/pau-latin2-audit.json'));
const latin2=bank.records.filter(r=>r.language==='latin2');
const find=(name,kind='verbo')=>latin2.find(x=>x.kind===kind&&x.headword.startsWith(name));
test('Todas las páginas, modelos y convocatorias PAU: 352 preguntas, 301 formas',()=>{
  assert.equal(exams.length,78);
  assert.equal(exams.reduce((a,x)=>a+x.forms.length,0),352);
  assert.equal(new Set(exams.flatMap(q=>q.forms.map(latinFold))).size,301);
  assert.deepEqual([...new Set(exams.map(x=>x.year))],Array.from({length:21},(_,i)=>2006+i));
  const has=(p,model,form)=>exams.some(x=>x.page===p&&x.model===model&&x.forms.includes(form));
  for(const [p,m,f] of [[1,'B','adgressus est'],[12,'B','profectus est'],
    [25,'A','conspicatus est'],[29,'A/B','ventum est'],[39,'A','confectis'],
    [42,'B','conficior'],[45,'B','administrationem'],
    [54,'B','missi sunt']])assert.ok(has(p,m,f),p+' '+m+' '+f);
  assert.equal(report.occurrences,352);assert.equal(report.distinctForms,301);
  assert.equal(report.models,78);
  assert.equal(report.coveredForms,301,'Alguna forma de examen sigue sin paradigma');
  assert.deepEqual(report.missingForms,[]);
});
test('Los compuestos se analizan enteros y con el verbo léxico, nunca como sum',()=>{
  const expected=[
    ['profectus est','proficiscor, proficisci, profectus sum','3.ª persona · singular · perfecto · indicativo · voz pasiva (deponente, sentido activo)'],
    ['relictus erat','relinquo, relinquere, reliqui, relictum','3.ª persona · singular · pluscuamperfecto'],
    ['adgressus est','aggredior, aggredi, aggressus sum','3.ª persona · singular · perfecto'],
    ['depopulatus erat','depopulor, depopulari, depopulatus sum','3.ª persona · singular · pluscuamperfecto'],
    ['commoratus est','commoror, commorari, commoratus sum','3.ª persona · singular · perfecto'],
    ['constituta sunt','constituo, constituere, constitui, constitutum','3.ª persona · plural · perfecto'],
    ['conspicatus est','conspicor, conspicari, conspicatus sum','3.ª persona · singular · perfecto'],
    ['erant polliciti','polliceor, polliceri, pollicitus sum','3.ª persona · plural · pluscuamperfecto'],
    ['missi sunt','mitto, mittere, misi, missum','3.ª persona · plural · perfecto'],
    ['pugnatum est','pugno, pugnare, pugnavi, pugnatum','3.ª persona · singular · perfecto'],
    ['ventum est','venio, venire, veni, ventum','3.ª persona · singular · perfecto']
  ];
  for(const [form,head,features] of expected){
    const hits=latin2.filter(r=>r.kind==='verbo'&&r.headword.startsWith(head)&&
      r.forms.some(x=>latinFold(x.form)===latinFold(form)));
    assert.ok(hits.length,form+' no se encuentra como verbo íntegro');
    const analysis=hits.flatMap(r=>r.forms.filter(x=>latinFold(x.form)===latinFold(form))
      .map(x=>x.analysis)).join(' / ');
    assert.ok(analysis.includes(head),form+' no cita el enunciado completo');
    assert.ok(analysis.includes(features),form+' análisis equivocado');
    assert.ok(!analysis.startsWith('participio')&&!/verbo · sum, fui/.test(analysis));
  }
});
test('Las formas de proficiscor tienen persona, número y género concordante sin inventar participio separado',()=>{
  const r=latin2.find(x=>x.id==='latin2-pau-compuesto-proficiscor');
  assert.ok(r);
  const target=r.forms.find(f=>f.form==='profectus est');
  assert.ok(target);
  assert.match(target.analysis,/verbo · proficiscor, proficisci, profectus sum \(3\.ª deponente\)/);
  assert.match(target.analysis,/3\.ª persona · singular · perfecto · indicativo/);
  assert.ok(r.forms.some(f=>f.form==='profectae sunt'));
  assert.ok(r.forms.some(f=>f.form==='profecta erant'));
  assert.equal(r.forms.some(f=>f.form==='est'),false);
  const qs=makeQuestions(bank,{language:'latin2',unit:0,kind:'verbo',activity:'analysis',limit:30,rng:()=>.4});
  assert.ok(qs.length&&qs.every(q=>evaluate(q,q.correct).correct));
});
test('Venit y venimus admiten presente y perfecto sin vocales largas como marcas únicas',()=>{
  const r=compileVenioParadigm();
  assert.equal(r.forms.length,60);
  const v=r.forms.filter(x=>x.form==='venit');
  assert.equal(v.length,2);
  assert.deepEqual(v.map(x=>x.tense),['presente','perfecto']);
  assert.ok(v.every(x=>x.analysis.includes('venio, venire, veni, ventum')));
  const q=makeQuestions({...bank,records:[r]},{
    language:'latin2',unit:0,activity:'analysis',limit:30,rng:()=>.33})
    .find(x=>x.form==='venit');
  assert.ok(q);
  assert.match(q.correct,/presente/);
  assert.match(q.correct,/perfecto/);
  assert.equal(evaluate(q,q.correct).correct,true);
});
test('Infinitivo futuro deponente usurum esse figura como infinitivo de utor',()=>{
  const r=latin2.find(x=>x.id==='latin2-pau-infinitivo-utor');
  assert.ok(r);
  assert.ok(r.forms.some(f=>f.form==='usurum esse'&&
    f.analysis.includes('infinitivo · utor, uti, usus sum')));
});
test('Pronombres comunes conservan las tablas completas de Appendix',()=>{
  for(const id of ['ego','tu','sui','is']){
    const r=latin2.find(x=>x.id==='latin2-pau-pronoun-'+id);
    assert.ok(r,'Falta '+id);
    assert.ok(r.forms.every(f=>f.analysis.startsWith('pronombre · ')&&
      f.analysis.includes(' · '+r.headword+' · ')));
  }
  const is=latin2.find(x=>x.id==='latin2-pau-pronoun-is');
  for(const form of ['is','ea','id','eius','eorum','earum','eis','iis'])
    assert.ok(is.forms.some(f=>latinFold(f.form)===form),form);
  const reflexive=latin2.find(x=>x.id==='latin2-pau-pronoun-sui');
  assert.equal(reflexive.forms.some(f=>f.case==='nominativo'),false);
  assert.equal(reflexive.forms.filter(f=>f.form==='se').length,4);
});
test('Las formas importadas del corpus aportan CASOS COMPLETOS, no una única forma aislada',()=>{
  const r=latin2.filter(x=>x.id.startsWith('latin2-pau-unimorph-'));
  assert.ok(r.length>=10,'No se importaron los modelos nominales completos');
  for(const x of r){
    assert.equal(x.evidence.license,'CC BY-SA 3.0');
    assert.equal(x.evidence.status,'paradigma-documentado');
    for(const cas of ['nominativo','vocativo','acusativo','genitivo','dativo','ablativo'])
      assert.ok(x.forms.some(f=>f.case===cas),'Caso ausente '+x.id+' '+cas);
    assert.ok(x.forms.every(f=>f.analysis.includes(x.headword)));
  }
});
test('El registro nuevo no altera las 296 fichas latinas y griegas anteriores',()=>{
  // Las nueve ampliaciones curriculares se agregan al final: las 296
  // fichas previas siguen en sus posiciones y los exámenes PAU no cambian.
  const curriculumAdditions=bank.records.slice(-37,-28);
  assert.equal(curriculumAdditions.length,9);
  assert.ok(curriculumAdditions.every(r=>['latin','griego'].includes(r.language)));
  assert.equal(bank.records.length,296+bank.records.filter(r=>
    r.id.startsWith('latin2-pau-')||r.id.startsWith('latin2-cuaderno-')||
    r.id.startsWith('latin2-audit-')).length+curriculumAdditions.length+19+9);
  assert.equal(bank.records.slice(0,220).filter(x=>x.language==='latin2').length,0);
  assert.equal(bank.records.slice(220,296).filter(x=>x.language==='latin2').length,76);
  assert.deepEqual(bank.coverage.latin2,[0]);
});

test('Últimas excepciones: paradigmas completos y lecturas de examen',()=>{
  const byId=id=>latin2.find(r=>r.id==='latin2-pau-exception-'+id);
  for(const [id,form,kind] of [
    ['quidam','quidam','pronombre'],['quidam','quadam','pronombre'],
    ['quisque','quisque','pronombre'],['alius','alium','pronombre'],
    ['binominis','binominis','adjetivo'],['complures','complures','adjetivo'],
    ['deliciae','deliciae','sustantivo'],['civis','civium','sustantivo'],
    ['percussor','percussorum','sustantivo']
  ]){
    const r=byId(id);
    assert.ok(r,'Ausencia del paradigma '+id);
    assert.equal(r.kind,kind);
    assert.ok(r.forms.some(f=>latinFold(f.form)===form),id+' no produce '+form);
    assert.ok(r.forms.length>=6);
    assert.ok(r.forms.every(f=>f.analysis.includes(' · '+r.headword+' · ')));
  }
  assert.equal(byId('deliciae').forms.some(f=>f.number==='singular'),false);
  assert.equal(byId('complures').forms.some(f=>f.number==='singular'),false);
  assert.ok(byId('binominis').forms.some(f=>f.form==='binominia'));
});
test('Todos los paradigmas escolares mantienen la forma PAU y los seis casos que les corresponden',()=>{
  const selected=latin2.filter(x=>
    x.id.startsWith('latin2-pau-school-')||
    x.id.startsWith('latin2-pau-exception-'));
  assert.ok(selected.length>=50);
  for(const record of selected){
    assert.equal(record.unit,0);
    assert.equal(record.evidence.status,'paradigma-documentado');
    assert.ok(record.forms.length>=6);
    for(const cas of ['nominativo','vocativo','acusativo','genitivo','dativo','ablativo']){
      if(record.kind==='pronombre'&&cas==='vocativo')continue;
      assert.ok(record.forms.some(f=>f.case===cas),'Caso ausente '+record.id+' '+cas);
    }
  }
});
test('No se confunden verbos deponentes, participios y sujetos de la forma compuesta',()=>{
  const prof=latin2.find(x=>x.id==='latin2-pau-compuesto-proficiscor');
  const moror=latin2.find(x=>x.id==='latin2-pau-regular-verb-moror');
  const imp=moror.forms.find(x=>x.form==='moraretur');
  assert.ok(imp&&/imperfecto · subjuntivo · voz pasiva \(deponente/.test(imp.analysis));
  const personal=latin2.find(x=>x.id==='latin2-pau-regular-verb-proficiscor');
  assert.ok(personal.forms.some(x=>x.form==='proficiscitur'));
  assert.ok(personal.forms.every(x=>!x.analysis.startsWith('participio')));
  assert.ok(prof.forms.some(x=>x.form==='profectus est'));
  assert.ok(!prof.forms.some(x=>x.form==='est'));
  const ven=latin2.find(x=>x.id==='latin2-pau-venio-indicativo-subjuntivo');
  assert.ok(ven.forms.filter(x=>x.form==='venit').length===2);
  const irregular=latin2.find(x=>x.id==='latin2-pau-irregular-sum');
  assert.ok(irregular.forms.some(x=>x.form==='fuisset'&&
    x.analysis.includes('pluscuamperfecto · subjuntivo')));
  const r=latin2.find(x=>x.id==='latin2-pau-regular-verb-pervado');
  assert.ok(r.forms.filter(x=>x.form==='pervaserit').length===2);
  const inf=latin2.find(x=>x.id==='latin2-pau-regular-infinitive-conquiro');
  assert.ok(inf&&inf.forms.some(x=>x.form==='conquiri'));
  assert.ok(inf.forms.every(x=>x.analysis.startsWith('infinitivo')));
});
