import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {auditLatin2Verbal,assertLatin2VerbalAuditPasses}
  from '../scripts/audit-morphology-latin2-verbal.mjs';
import {makeQuestions,evaluate}
  from '../public/morfologia/engine.mjs';

const root=resolve(import.meta.dirname,'..');
const read=path=>JSON.parse(readFileSync(join(root,path),'utf8'));
const bank=read('dist/apps/morfologia/data/paradigmas.json');
const saved=read('dist/apps/morfologia/data/latin2-filologia-verbal.json');
const record=id=>bank.records.find(r=>r.id===id);
const forms=(r,form)=>r.forms.filter(f=>f.form===form);

test('La auditoría verbal reproduce el informe del build sin certificar cada forma',()=>{
  const report=auditLatin2Verbal(bank);
  assert.deepEqual(report,saved);
  assertLatin2VerbalAuditPasses(report);
  assert.equal(report.completeIndividualVerification,false);
  assert.ok(report.summary.checkedCells>10000);
  assert.ok(report.summary.records>150);
  assert.ok(report.summary.imperativeModels>=20);
  assert.ok(report.summary.canonicalReadings>=18);
  assert.equal(report.blockingIssues.length,0);
});

test('Las cinco conjugaciones tienen imperativos y se respetan dic duc fac',()=>{
  for(const [id,sg,pl] of [
    ['amo','ama','amate'],['habeo','habe','habete'],
    ['moneo','mone','monete'],['dico','dic','dicite'],
    ['duco','duc','ducite'],['facio','fac','facite'],
    ['capio','cape','capite'],['audio','audi','audite']
  ]){
    const r=record('latin2-pau-regular-verb-'+id);
    assert.ok(r,id);
    for(const [form,number] of [[sg,'singular'],[pl,'plural']]){
      assert.ok(forms(r,form).some(f=>f.mood==='imperativo'&&
        f.person==='2.ª '+number&&f.voice==='activa'),id+' '+form);
    }
  }
  for(const [lemma,wrong] of [['dico','dice'],['duco','duce'],['facio','face']]){
    const r=record('latin2-pau-regular-verb-'+lemma);
    assert.equal(forms(r,wrong).some(f=>f.mood==='imperativo'),false);
  }
});

test('El imperativo deponente mantiene persona, desinencia pasiva y valor activo',()=>{
  for(const [id,sg,pl] of [
    ['moror','morare','moramini'],['populor','populare','populamini'],
    ['polliceor','pollicere','pollicemini'],
    ['proficiscor','proficiscere','proficiscimini'],
    ['sequor','sequere','sequimini'],
    ['patior','patere','patimini'],['adorior','adorire','adorimini']
  ]){
    const r=record('latin2-pau-regular-verb-'+id);
    assert.ok(r,id);
    for(const [form,number] of [[sg,'singular'],[pl,'plural']]){
      const hit=forms(r,form).find(f=>f.mood==='imperativo'&&f.number===number);
      assert.ok(hit,id+' '+form);
      assert.match(hit.analysis,/voz pasiva \(deponente, sentido activo\)$/);
    }
  }
});

test('Fero, eo y sum: imperativo documentado y sin perder lecturas homógrafas',()=>{
  const cases=[
    ['latin2-cuaderno-irregular-fero','fer','ferte','activa'],
    ['latin2-cuaderno-irregular-fero','ferre','ferimini','pasiva'],
    ['latin2-cuaderno-irregular-eo','i','ite','activa'],
    ['latin2-pau-irregular-sum','es','este','activa'],
    ['latin2-cuaderno-irregular-confero','confer','conferte','activa'],
    ['latin2-cuaderno-irregular-refero','refer','referte','activa'],
    ['latin2-cuaderno-irregular-differo','differ','differte','activa']
  ];
  for(const [id,sg,pl,voice] of cases){
    const r=record(id);assert.ok(r,id);
    for(const [form,number] of [[sg,'singular'],[pl,'plural']])
      assert.ok(forms(r,form).some(f=>f.mood==='imperativo'&&
        f.number===number&&f.voice===voice),id+' '+form);
  }
  const sum=record('latin2-pau-irregular-sum');
  assert.ok(forms(sum,'es').some(f=>f.mood==='indicativo'));
  assert.ok(forms(sum,'es').some(f=>f.mood==='imperativo'));
});

test('Eo: variantes clásicas con -v-, pasiva impersonal y participios propios',()=>{
  const eo=record('latin2-cuaderno-irregular-eo');assert.ok(eo);
  for(const [form,tense,mood] of [
    ['ivi','perfecto','indicativo'],['ierunt','perfecto','indicativo'],
    ['iverunt','perfecto','indicativo'],['iveram','pluscuamperfecto','indicativo'],
    ['iveris','futuro perfecto','indicativo'],
    ['ivissem','pluscuamperfecto','subjuntivo']]){
    assert.ok(forms(eo,form).some(x=>x.tense===tense&&x.mood===mood),
      form+' sin lectura '+tense+' '+mood);
  }
  for(const form of ['ivi','iveram','iveris','ivissem'])
    assert.ok(forms(eo,form).every(f=>/poco frecuente/i.test(f.usage||'')),form);
  const pass=eo.forms.filter(f=>f.voice==='pasiva');
  assert.equal(pass.length,10);
  assert.ok(pass.every(f=>f.person==='3.ª singular'&&
    f.construction==='impersonal'));
  for(const form of ['itur','ibatur','ibitur','eatur','iretur',
    'itum est','itum erat','itum erit','itum sit','itum esset'])
    assert.ok(pass.some(f=>f.form===form),form);
  const participio=record('latin2-audit-irregular-participle-eo');
  assert.ok(participio&&participio.forms.length===72);
  for(const form of ['iens','euntis','euntium','euntia','iturus','ituram','ituras'])
    assert.ok(participio.forms.some(f=>f.form===form),form);
  assert.ok(!participio.forms.some(f=>f.form==='itus'));
  const inf=record('latin2-cuaderno-irregular-infinitivo-eo');
  for(const form of ['ire','isse','ivisse','iturum esse','ituram esse',
    'ituros esse','ituras esse','itura esse'])
    assert.ok(inf.forms.some(f=>f.form===form));
});

test('Refero incorpora el sistema de rettuli además de retuli',()=>{
  const finite=record('latin2-cuaderno-irregular-refero');
  const inf=record('latin2-cuaderno-irregular-refero-infinitivo');
  assert.ok(finite&&inf);
  for(const [form,tense,mood] of [
    ['rettuli','perfecto','indicativo'],
    ['retuli','perfecto','indicativo'],
    ['rettuleram','pluscuamperfecto','indicativo'],
    ['rettulerim','perfecto','subjuntivo'],
    ['rettulissem','pluscuamperfecto','subjuntivo']
  ])assert.ok(forms(finite,form).some(f=>f.tense===tense&&f.mood===mood),form);
  assert.ok(inf.forms.some(f=>f.form==='rettulisse'));
  assert.ok(inf.forms.some(f=>f.form==='retulisse'));
  assert.ok(forms(finite,'retuli').some(f=>f.usage));
});

test('Ferre reúne infinitivo, indicativo pasivo e imperativo pasivo en un análisis',()=>{
  const verb=record('latin2-cuaderno-irregular-fero');
  const inf=record('latin2-cuaderno-irregular-infinitivo-fero');
  assert.ok(verb&&inf);
  const source={
    ...bank,records:[
      {...verb,forms:verb.forms.filter(f=>
        ['ferre','feror','fertur','ferris','ferreris','ferimini','fert','feram'].includes(f.form))},
      {...inf,forms:inf.forms}
    ]
  };
  const questions=makeQuestions(source,{language:'latin2',unit:0,
    kind:'todos',activity:'analysis',limit:30,rng:()=>.3});
  const ferre=questions.filter(q=>q.form==='ferre');
  assert.equal(ferre.length,1,'La misma pregunta no debe aparecer duplicada');
  const answer=ferre[0].correct;
  assert.match(answer,/infinitivo · fero,/);
  assert.match(answer,/presente · indicativo · voz pasiva/);
  assert.match(answer,/presente · imperativo · voz pasiva/);
  assert.equal(evaluate(ferre[0],answer).correct,true);
  for(const option of ferre[0].options)
    if(option!==answer)assert.ok(!answer.split(' / ').includes(option),
      'Una lectura verdadera no debe figurar como distractor falso');
});

test('Una alteración de un deponente se detecta y bloquea la compilación',()=>{
  const original=record('latin2-pau-regular-verb-sequor');
  assert.ok(original);
  const damaged={...original,forms:original.forms.map(f=>
    f.form==='sequere'&&f.mood==='imperativo'?
      {...f,form:'seque'}:f)};
  const modified={...bank,records:bank.records.map(r=>
    r.id===original.id?damaged:r)};
  const report=auditLatin2Verbal(modified);
  assert.ok(report.blockingIssues.some(i=>
    i.code==='IMPERATIVE_MISSING'&&i.id===original.id));
  assert.throws(()=>assertLatin2VerbalAuditPasses(report),/errores verbales bloqueantes/i);
});
