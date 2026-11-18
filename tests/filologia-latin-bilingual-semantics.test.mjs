import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {THIRD_DECLENSION_CORRECTION,reconcileThirdDeclensionInstructions}
 from '../scripts/latin-third-declension-editorial.mjs';
import {auditLatinBilingualSemantics}
 from '../scripts/audit-latin-bilingual-semantics.mjs';

const root=resolve(import.meta.dirname,'..');
const source=join(root,'vendor/appendix'),out=join(root,'dist/apps/gramatica');
const read=(base,path)=>readFileSync(join(base,path),'utf8');
const curricula=Object.fromEntries(['latin1','latin4'].map(course=>[
 course,{es:JSON.parse(read(out,'assets/curriculum-'+course+'.json')),
  val:JSON.parse(read(out,'val/curriculum-'+course+'.json'))}
]));
const topic=(course,locale,unit,index)=>curricula[course][locale]
 .latin.units[unit-1].topics[index].html;
const count=(html,tag)=>(html.match(new RegExp('<'+tag+'\\b','gu'))||[]).length;

test('Siete temas tienen el mismo núcleo filológico en las dos lenguas',()=>{
 const report=auditLatinBilingualSemantics(curricula);
 assert.equal(report.checkedTopicPairs,7);
 assert.equal(report.objectiveAnchorsPerLanguage,52);
 assert.equal(report.status,'contraste-semantico-selectivo-apto');
 assert.ok(report.results.every(x=>x.structuralSemanticParity));
 assert.ok(report.limitation.includes('No acredita equivalencia'));
});
test('Tercera declinación: conservar formas y sustituir reglas silábicas falsas en ambos cursos',()=>{
 for(const locale of ['es','val']){
  const original=read(source,locale==='es'?'sustantivos.html':'val/sustantivos.html');
  const t=THIRD_DECLENSION_CORRECTION[locale];
  assert.ok(original.includes(t.clueBefore));
  assert.ok(original.includes(t.endingsBefore));
  const amended=reconcileThirdDeclensionInstructions(original,locale);
  assert.ok(amended.includes(t.clueAfter)&&amended.includes(t.endingsAfter));
  assert.ok(!amended.includes(t.clueBefore)&&!amended.includes(t.endingsBefore));
  assert.equal(count(amended,'table'),count(original,'table'));
  assert.equal(count(amended,'td'),count(original,'td'));
  assert.equal(read(source,locale==='es'?'sustantivos.html':'val/sustantivos.html'),original,
   'La auditoría no debe escribir el origen congelado');
  for(const course of ['latin1','latin4']){
   const unit=course==='latin1'?4:5,html=topic(course,locale,unit,0);
   assert.ok(html.includes(t.clueAfter)&&html.includes(t.endingsAfter));
   assert.ok(!html.includes(t.clueBefore)&&!html.includes(t.endingsBefore));
   for(const lemma of ['civis, civis','civium','canis, canis','canum','urbium','artium']){
    assert.ok(html.includes(lemma),course+'/'+locale+'/'+lemma);
   }
   assert.ok(html.includes('cives / civis'),'No se pierden variantes del acusativo plural');
   assert.ok(html.includes('marium')&&html.includes('maria')&&html.includes('mari'));
   assert.equal(count(html,'table'),1);
   assert.ok(!/<(?:input|form|button|script)\b/iu.test(html),
    'La gramática de consulta no debe convertirse en ejercicios');
  }
 }
});
test('La corrección exige la grafía fuente exacta y nunca la reescribe en silencio',()=>{
 const original=read(source,'sustantivos.html');
 assert.throws(()=>reconcileThirdDeclensionInstructions(
  original.replace(THIRD_DECLENSION_CORRECTION.es.clueBefore,'Otra explicación'),'es'),
  /fuente de tercera declinación cambió/);
 assert.throws(()=>reconcileThirdDeclensionInstructions(original,'gr'),
  /Lengua no admitida/);
 assert.throws(()=>reconcileThirdDeclensionInstructions('texto corto','es'),
  /capítulo completo/);
});
test('Una contradicción curricular ES/VAL no pasa la auditoría selectiva',()=>{
 const changed=structuredClone(curricula);
 changed.latin4.val.latin.units[4].topics[0].html=
   changed.latin4.val.latin.units[4].topics[0].html.replace('canum','civium');
 assert.throws(()=>auditLatinBilingualSemantics(changed),
  /Contenido curricular divergente/);
 const next=structuredClone(curricula);
 next.latin1.es.latin.units[3].topics[1].html+='amatus sum';
 assert.throws(()=>auditLatinBilingualSemantics(next),
  /Tiempo verbal no estudiado adelantado/);
});
