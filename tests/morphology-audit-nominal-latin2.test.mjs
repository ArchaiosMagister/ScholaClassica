import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {auditLatin2Nominal,assertLatin2NominalAuditPasses}
  from '../scripts/audit-morphology-latin2-nominal.mjs';
import {compileCuadernoNominalReference}
  from '../scripts/morphology-cuaderno-nominal.mjs';
import {compileCuadernoComparativeReference}
  from '../scripts/morphology-cuaderno-comparison.mjs';
import {makeQuestions,evaluate} from '../public/morfologia/engine.mjs';
const root=resolve(import.meta.dirname,'..');
const read=p=>JSON.parse(readFileSync(join(root,p),'utf8'));
const bank=read('dist/apps/morfologia/data/paradigmas.json');
const report=read('dist/apps/morfologia/data/latin2-filologia-nominal.json');
const records=bank.records.filter(r=>r.language==='latin2');
const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase();
const find=(head,kind)=>records.find(r=>r.kind===kind&&
  fold(r.headword.split(',')[0])===head);
const findForm=(r,form,cas,number,gender)=>r.forms.filter(f=>
  fold(f.form)===form&&f.case===cas&&f.number===number&&
  (!gender||f.gender===gender));
test('Auditoría nominal reproducible con más de cuarenta controles de flexión',()=>{
  const live=auditLatin2Nominal(bank);
  assert.deepEqual(live,report);
  assertLatin2NominalAuditPasses(live);
  assert.equal(live.completeIndividualVerification,false);
  assert.ok(live.summary.records>70);
  assert.ok(live.summary.exactChecks>=40);
  assert.equal(live.blockingIssues.length,0);
  assert.ok(live.reviewIssues.length>=1);
});
test('Tercera declinación: brevis y audax son en -i, vetus es consonántico',()=>{
  for(const [head,expected,wrong,gender,number,cas] of [
    ['brevis','brevium','brevum','masculino','plural','genitivo'],
    ['brevis','brevi','breve','masculino','singular','ablativo'],
    ['audax','audacium','audacum','femenino','plural','genitivo'],
    ['vetus','veterum','veterium','masculino','plural','genitivo'],
    ['vetus','vetere','veteri','masculino','singular','ablativo']
  ]){
    const r=find(head,'adjetivo');
    assert.ok(r,head);
    assert.ok(findForm(r,expected,cas,number,gender).length,head+' sin '+expected);
    assert.equal(findForm(r,wrong,cas,number,gender).length,0,
      head+' admite indebido '+wrong);
  }
  const acer=find('acer','adjetivo');
  assert.ok(findForm(acer,'acri','ablativo','singular','masculino').length);
  const mare=find('mare','sustantivo');
  for(const [form,cas,num] of [
    ['mari','ablativo','singular'],['marium','genitivo','plural'],
    ['maria','acusativo','plural']
  ])assert.ok(findForm(mare,form,cas,num,'neutro').length);
});
test('Cuarta declinación neutra: dativo genu y cornu; no genui',()=>{
  const genu=find('genu','sustantivo');
  const cornu=find('cornu','sustantivo');
  assert.ok(genu&&cornu);
  for(const r of [genu,cornu]){
    const lemma=fold(r.headword.split(',')[0]);
    assert.ok(findForm(r,lemma,'dativo','singular','neutro').length);
    assert.equal(findForm(r,lemma+'i','dativo','singular','neutro').length,0);
    assert.ok(findForm(r,lemma+'a','nominativo','plural','neutro').length);
  }
  assert.ok(findForm(genu,'genuum','genitivo','plural','neutro').length);
});
test('Supplex y adulescens distinguen la forma regular y la variante histórica',()=>{
  const supplex=find('supplex','adjetivo');
  assert.ok(supplex);
  assert.ok(findForm(supplex,'supplicum','genitivo','plural','neutro').length);
  assert.ok(findForm(supplex,'supplice','ablativo','singular','masculino').length);
  const rare=findForm(supplex,'supplicium','genitivo','plural','masculino');
  assert.ok(rare.length&&rare.every(f=>f.usage==='variante rara'));
  const adulescens=find('adulescens','sustantivo');
  assert.ok(adulescens);
  assert.ok(findForm(adulescens,'adulescentium','genitivo','plural','masculino').length);
  const less=findForm(adulescens,'adulescentum','genitivo','plural','masculino');
  assert.ok(less.length&&less.every(f=>/menos frecuente/.test(f.usage)));
});
test('Alter, alius, duo y unus: no se aceptan las erratas del cuaderno',()=>{
  const alter=find('alter','pronombre');
  assert.ok(alter);
  assert.ok(findForm(alter,'alteras','acusativo','plural','femenino').length);
  assert.equal(findForm(alter,'alterae','acusativo','plural','femenino').length,0);
  const alius=find('alius','pronombre');
  assert.ok(findForm(alius,'alias','acusativo','plural','femenino').length);
  assert.equal(findForm(alius,'aliae','acusativo','plural','femenino').length,0);
  const gen=findForm(alius,'alius','genitivo','singular','femenino');
  assert.ok(gen.length&&gen.every(f=>f.usage));
  const duo=find('duo','adjetivo');
  assert.ok(duo);
  assert.ok(findForm(duo,'duae','nominativo','plural','femenino').length);
  assert.equal(findForm(duo,'dua','nominativo','plural','femenino').length,0);
  const unus=find('unus','adjetivo');
  assert.ok(unus.forms.every(f=>f.number==='singular'));
  assert.equal(unus.forms.some(f=>f.case==='vocativo'),false);
  assert.equal(alter.forms.some(f=>f.case==='vocativo'),false);
});
test('Comparación irregular: grado y paradigmas independientes, plures solo plural',()=>{
  for(const [head,form] of [
    ['melior','melius'],['peior','peius'],['maior','maius'],
    ['minor','minus'],['propior','propius'],
    ['optimus','optimarum'],['pessimus','pessima'],
    ['maximus','maximos'],['minimus','minimis'],
    ['veterrimus','veterrimo']
  ]){
    const r=find(head,'adjetivo');
    assert.ok(r,'Falta '+head);
    assert.ok(r.forms.some(f=>fold(f.form)===form),head+' '+form);
  }
  const plures=find('plures','adjetivo');
  assert.ok(plures&&plures.forms.every(f=>f.number==='plural'));
  assert.ok(plures.forms.some(f=>f.form==='plurium'));
});
test('Una regresión nominal introducida deliberadamente detiene la compilación',()=>{
  const original=find('genu','sustantivo');
  assert.ok(original);
  const mutated={...original,forms:original.forms.map(f=>
    f.case==='dativo'&&f.number==='singular'?
      {...f,form:'genui'}:f)};
  const corrupted={...bank,records:bank.records.map(r=>
    r.id===original.id?mutated:r)};
  const bad=auditLatin2Nominal(corrupted);
  assert.ok(bad.blockingIssues.some(x=>
    x.code==='EXPECTED_FORM_MISSING'&&x.record==='genu'));
  assert.ok(bad.blockingIssues.some(x=>
    x.code==='INCORRECT_FORM_ACCEPTED'&&x.form==='genui'));
  assert.throws(()=>assertLatin2NominalAuditPasses(bad),/errores nominales bloqueantes/i);
});
test('Las tablas nominales y adjetivales nuevas se limitan a los modelos declarados',()=>{
  const reference=compileCuadernoNominalReference();
  assert.equal(reference.length,2);
  assert.deepEqual(reference.map(r=>r.forms.length),[30,15]);
  const additions=compileCuadernoComparativeReference(records);
  assert.ok(additions.every(r=>r.forms.length===36||r.forms.length===18));
  const qs=makeQuestions(bank,{language:'latin2',unit:0,activity:'analysis',
    kind:'pronombre',limit:30,rng:()=>.25});
  assert.ok(qs.length>5);
  assert.ok(qs.every(q=>evaluate(q,q.correct).correct));
});

test('Las variantes poco frecuentes se aceptan, pero no se sortean como palabras aisladas',()=>{
  const cases=[
    ['supplex','adjetivo',['supplicium'],['supplici']],
    ['adulescens','sustantivo',['adulescentum'],[]]
  ];
  for(const [head,kind,excluded,common] of cases){
    const r=find(head,kind);
    assert.ok(r);
    for(const activity of ['form','analysis']){
      const qs=makeQuestions({...bank,records:[r]},{
        language:'latin2',unit:0,activity,limit:30,rng:()=>.21});
      assert.ok(qs.length>3);
      for(const q of qs){
        if(activity==='analysis')assert.ok(!excluded.includes(q.form),
          head+' no debe sortear la variante infrecuente '+q.form);
        else assert.ok(!excluded.includes(q.form),
          head+' no debe proponer la variante infrecuente '+q.form);
        assert.equal(evaluate(q,q.correct).correct,true);
      }
    }
    assert.ok(common.every(form=>r.forms.some(x=>x.form===form)));
  }
  const alius=find('alius','pronombre');
  const questions=makeQuestions({...bank,records:[alius]},{
    language:'latin2',unit:0,activity:'analysis',limit:30,rng:()=>.29});
  const surface=questions.find(q=>q.form==='alius');
  // El nominativo habitual y el genitivo raro pueden coincidir en grafía.
  assert.ok(surface);
  assert.match(surface.correct,/nominativo/);
  assert.match(surface.correct,/genitivo/);
  assert.ok(alius.forms.some(f=>f.form==='alterius'&&f.case==='genitivo'));
});
