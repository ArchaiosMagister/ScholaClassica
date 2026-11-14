import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {auditLatin2Morphology,assertLatin2AuditPasses}
  from '../scripts/audit-morphology-latin2.mjs';
import {compilePauRegularVerbs}
  from '../scripts/morphology-pau-regular-verbs.mjs';
import {makeQuestions,evaluate} from '../public/morfologia/engine.mjs';

const root=resolve(import.meta.dirname,'..');
const bank=JSON.parse(readFileSync(
  join(root,'dist/apps/morfologia/data/paradigmas.json'),'utf8'));
const publishedAudit=JSON.parse(readFileSync(
  join(root,'dist/apps/morfologia/data/latin2-filologia-fase1.json'),'utf8'));
const record=id=>bank.records.find(r=>r.id===id);
const normalized=form=>form.toLowerCase().replace(/æ/g,'ae');
const hits=(r,form)=>r.forms.filter(x=>normalized(x.form)===normalized(form));

test('Auditoría reproducible: filología de Latín II, no simple recuento de formas',()=>{
  const report=auditLatin2Morphology(bank);
  assert.deepEqual(report,publishedAudit);
  assertLatin2AuditPasses(report);
  assert.equal(report.completeIndividualVerification,false);
  assert.ok(report.summary.records>=300);
  assert.ok(report.summary.forms>5000);
  assert.ok(report.summary.byCategory.verbo>30);
  assert.ok(report.summary.byEvidenceLevel[
    'paradigma-derivado-no-cotejado-individualmente']>0);
  assert.equal(report.blockingIssues.length,0);
  assert.deepEqual(report.reviewIssues.map(x=>x.form).sort(),['fimus','fitis']);
});
test('El imperativo de 1.ª conjugación distingue activo de deponente',()=>{
  const specimens=[
    ['moror','morare','moramini',['mora','morate']],
    ['populor','populare','populamini',['popula','populate']]
  ];
  for(const [lemma,singular,plural,invalid] of specimens){
    const r=record('latin2-pau-regular-verb-'+lemma);
    assert.ok(r,'Falta el modelo de '+lemma);
    for(const [form,number] of [[singular,'singular'],[plural,'plural']]){
      const morph=hits(r,form).find(f=>f.mood==='imperativo'&&f.number===number);
      assert.ok(morph,lemma+' no tiene imperativo '+form);
      assert.match(morph.analysis,/voz pasiva \(deponente, sentido activo\)$/);
      assert.equal(morph.person,'2.ª '+number);
    }
    for(const wrong of invalid){
      assert.equal(hits(r,wrong).some(f=>f.mood==='imperativo'),false,
        'Forma de imperativo activo falsa admitida por '+lemma);
    }
  }
  const amo=record('latin2-pau-regular-verb-amo');
  for(const form of ['ama','amate'])
    assert.ok(hits(amo,form).some(f=>f.mood==='imperativo'&&
      f.analysis.endsWith('voz activa')));
});
test('Un error en imperativo deponente dispara error bloqueante antes de publicar',()=>{
  const pristine=record('latin2-pau-regular-verb-moror');
  const degraded={...pristine,
    forms:pristine.forms.map(f=>f.form==='morare'&&f.mood==='imperativo'?
      {...f,form:'mora'}:f)};
  const broken={...bank,records:bank.records.map(r=>r.id===pristine.id?degraded:r)};
  const report=auditLatin2Morphology(broken);
  assert.ok(report.blockingIssues.some(x=>x.code==='DEPONENT_IMPERATIVE_MISSING'));
  assert.ok(report.blockingIssues.some(x=>x.code==='DEPONENT_FALSE_ACTIVE_IMPERATIVE'));
  assert.throws(()=>assertLatin2AuditPasses(report),/errores morfológicos bloqueantes/);
});
test('No se pierde la lectura doble de venit, instituit, feram, fiam ni mitteris',()=>{
  const requirements=[
    ['latin2-pau-venio-indicativo-subjuntivo','venit',
      ['presente','perfecto']],
    ['latin2-pau-regular-verb-instituo','instituit',
      ['presente','perfecto']],
    ['latin2-cuaderno-irregular-fero','feram',
      ['futuro','presente']],
    ['latin2-cuaderno-irregular-fio','fiam',
      ['futuro','presente']],
    ['latin2-pau-regular-verb-mitto','mitteris',
      ['presente','futuro']]
  ];
  for(const [id,form,tenses] of requirements){
    const rows=hits(record(id),form);
    assert.ok(rows.length>=2,id+' · '+form);
    for(const tense of tenses)assert.ok(rows.some(x=>x.tense===tense));
  }
});
test('Las expresiones compuestas no se fragmentan ni se atribuyen a sum',()=>{
  const requirements=[
    ['profectus est','proficiscor','perfecto'],
    ['erant polliciti','polliceor','pluscuamperfecto'],
    ['collata erant','confero','pluscuamperfecto'],
    ['missi sunt','mitto','perfecto'],
    ['captae sumus','capio','perfecto']
  ];
  for(const [form,lemma,tense] of requirements){
    const matches=bank.records.filter(r=>r.language==='latin2'&&r.kind==='verbo'&&
      r.headword.includes(lemma)&&hits(r,form).some(f=>f.tense===tense));
    assert.ok(matches.length,form+' no figura en el paradigma de '+lemma);
    for(const r of matches){
      const f=hits(r,form).find(f=>f.tense===tense);
      assert.match(f.analysis,/^verbo · /);
      assert.ok(f.analysis.includes(' · '+tense+' · '));
      assert.equal(f.analysis.includes('verbo · sum,'),false);
    }
  }
});
test('La ambigüedad de un perfecto no equivale a dos soluciones excluyentes',()=>{
  const r=record('latin2-pau-venio-indicativo-subjuntivo');
  const qs=makeQuestions({...bank,records:[r]},{
    language:'latin2',unit:0,activity:'analysis',limit:30,rng:()=>.33});
  const venit=qs.find(q=>q.form==='venit');
  assert.ok(venit);
  assert.ok(venit.correct.includes('presente')&&venit.correct.includes('perfecto'));
  assert.equal(evaluate(venit,venit.correct).correct,true);
});
test('Una forma poco frecuente se etiqueta para revisión, no como errata segura',()=>{
  const report=auditLatin2Morphology(bank);
  assert.ok(report.reviewIssues.every(i=>i.priority==='review'));
  assert.ok(report.reviewIssues.every(i=>i.code==='FIO_RARE_FORM'));
  const fio=record('latin2-cuaderno-irregular-fio');
  assert.ok(fio.forms.some(x=>x.form==='fimus'));
  assert.ok(fio.forms.some(x=>x.form==='fitis'));
});
