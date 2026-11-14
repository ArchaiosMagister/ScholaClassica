import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {parseCuadernoQuestions,auditCuaderno,canonicalCuadernoForm}
  from '../scripts/morphology-cuaderno.mjs';
import {compileCuadernoIrregulars} from '../scripts/morphology-cuaderno-irregulars.mjs';
import {makeQuestions,evaluate} from '../public/morfologia/engine.mjs';
const root=resolve(import.meta.dirname,'..');
const source=readFileSync(join(root,'shared/academic/latin2/cuaderno-2026-27-morfologia.tsv'),'utf8');
const questions=parseCuadernoQuestions(source);
const rawBank=JSON.parse(readFileSync(join(root,'dist/apps/morfologia/data/paradigmas.json'),'utf8'));
const audit=JSON.parse(readFileSync(join(root,'dist/apps/morfologia/data/cuaderno-latin2-audit.json'),'utf8'));
const latin2=rawBank.records.filter(x=>x.language==='latin2');
const formEntries=(record,form)=>record.forms.filter(f=>canonicalCuadernoForm(f.form)===canonicalCuadernoForm(form));
const find=id=>latin2.find(x=>x.id==='latin2-cuaderno-irregular-'+id);
test('La fuente del cuaderno conserva las 119 marcas y los 120 ejercicios',()=>{
  assert.equal(questions.length,41);
  assert.equal(questions.filter(q=>q.activity==='texto').reduce((n,q)=>n+q.forms.length,0),119);
  assert.equal(questions.filter(q=>q.activity!=='texto').reduce((n,q)=>n+q.forms.length,0),120);
  assert.equal(questions.reduce((n,q)=>n+q.forms.length,0),239);
  assert.deepEqual(questions.find(q=>q.page===20).forms,[]);
  assert.equal(questions.find(q=>q.page===24).forms.length,3);
  assert.deepEqual(questions.find(q=>q.page===29).forms.filter(x=>x.includes(' ')),['collata erant']);
  assert.deepEqual(questions.find(q=>q.page===47).forms.filter(x=>x.includes(' ')),['victi sunt']);
  assert.equal(canonicalCuadernoForm('comsumpserat'),'consumpserat');
  assert.equal(canonicalCuadernoForm('sensitur'),'sentitur');
  assert.equal(canonicalCuadernoForm('captæ sumus'),'captae sumus');
  assert.equal(canonicalCuadernoForm('ipsōrum'),'ipsorum');
});
test('Integridad de los cuatro irregulares de páginas 77–78 y sus homografías',()=>{
  const records=compileCuadernoIrregulars();
  assert.ok(records.length>=9);
  assert.equal(records.filter(x=>x.kind==='verbo').length,4);
  for(const id of ['fero','eo','fio','volo']){
    const r=find(id);
    assert.ok(r,'No se incorporó '+id);
    assert.ok(r.forms.length>=60,'Paradigma no completo '+id);
    for(const t of ['presente','imperfecto','futuro','perfecto','pluscuamperfecto']){
      assert.ok(r.forms.some(x=>x.tense===t),id+' '+t);
    }
  }
  const fero=find('fero');
  assert.ok(formEntries(fero,'tulerint').some(x=>x.tense==='futuro perfecto'));
  assert.equal(formEntries(fero,'tulerunt').filter(x=>x.tense==='futuro perfecto').length,0);
  assert.ok(formEntries(fero,'tulisses').some(x=>x.mood==='subjuntivo'));
  assert.ok(formEntries(fero,'feram').some(x=>x.mood==='indicativo'));
  assert.ok(formEntries(fero,'feram').some(x=>x.mood==='subjuntivo'));
  assert.ok(formEntries(fero,'feror').some(x=>x.voice==='pasiva'));
  assert.ok(formEntries(fero,'lata erant').some(x=>x.voice==='pasiva'));
  const eo=find('eo');
  assert.ok(formEntries(eo,'ierunt').some(x=>x.tense==='perfecto'));
  assert.ok(formEntries(eo,'iverunt').some(x=>x.tense==='perfecto'));
  assert.ok(formEntries(eo,'ierim').some(x=>x.mood==='subjuntivo'));
  const fio=find('fio');
  assert.ok(formEntries(fio,'fierent').some(x=>x.mood==='subjuntivo'));
  assert.ok(formEntries(fio,'factus est').some(x=>x.tense==='perfecto'));
  assert.ok(formEntries(fio,'facta sim').some(x=>x.mood==='subjuntivo'));
  assert.equal(formEntries(fio,'fecit').length,0);
  const volo=find('volo');
  assert.ok(formEntries(volo,'voluit').some(x=>x.tense==='perfecto'));
  assert.equal(formEntries(volo,'volit').length,0);
  assert.ok(formEntries(volo,'vellem').some(x=>x.mood==='subjuntivo'));
  assert.ok(formEntries(volo,'volent').some(x=>x.tense==='futuro'));
});
test('Infinitivos y participios irregulares con enunciado y sin falsos verbos sueltos',()=>{
  for(const [id,form] of [
    ['fero','ferre'],['eo','ire'],['fio','fieri'],['volo','velle']
  ]){
    const r=latin2.find(x=>x.id==='latin2-cuaderno-irregular-infinitivo-'+id);
    assert.ok(r&&r.kind==='infinitivo');
    assert.ok(formEntries(r,form).length);
    assert.ok(r.forms.every(f=>f.analysis.startsWith('infinitivo · ')));
  }
  const r=latin2.find(x=>x.id==='latin2-cuaderno-irregular-participio-fero');
  assert.ok(r&&r.forms.length>=100);
  assert.ok(formEntries(r,'ferentia').some(f=>f.tense===undefined&&
    f.analysis.includes('presente')));
  assert.ok(formEntries(r,'lata').some(f=>f.analysis.includes('perfecto')));
  assert.ok(formEntries(r,'laturus').some(f=>f.analysis.includes('futuro')));
});
test('Las formas de examen se cotejan con el banco, sin dar por verificadas formas reconstruidas',()=>{
  const expected=auditCuaderno(rawBank,questions);
  assert.deepEqual(audit.missingForms,expected.missingForms);
  assert.equal(audit.distinctForms,expected.distinctForms);
  assert.equal(audit.occurrences,239);
  assert.equal(audit.coveredForms+audit.missingForms.length,audit.distinctForms);
  assert.equal(rawBank.records.slice(0,296).filter(x=>x.id.startsWith('latin2-cuaderno-')).length,0);
  assert.deepEqual(rawBank.coverage.latin2,[0]);
});
test('El corrector acepta toda la forma verbal compuesta de fio',()=>{
  const r=find('fio');
  const sample=formEntries(r,'factus sum');
  assert.ok(sample.length===1);
  assert.ok(sample[0].analysis.startsWith('verbo · fio, fieri, factus sum'));
  const options=makeQuestions({...rawBank,records:[r]},{
    language:'latin2',unit:0,activity:'analysis',limit:30,rng:()=>.47});
  assert.ok(options.length>10);
  assert.ok(options.every(q=>evaluate(q,q.correct).correct));
});
