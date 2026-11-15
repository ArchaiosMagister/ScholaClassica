import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {auditLatinAdditionalBilingualSemantics,LATIN_EXTRA_SEMANTIC_CASES}
 from '../scripts/audit-latin-bilingual-extra.mjs';
const root=resolve(import.meta.dirname,'..');
const curricula={};
for(const course of ['latin1','latin4']){
 curricula[course]={};
 for(const [locale,folder] of [['es','assets'],['val','val']])
  curricula[course][locale]=JSON.parse(readFileSync(join(root,
   'dist/apps/gramatica',folder,'curriculum-'+course+'.json'),'utf8'));
}
test('Nueve pares adicionales con 85 referentes latinos y 24 afirmaciones por idioma',()=>{
 const report=auditLatinAdditionalBilingualSemantics(curricula);
 assert.equal(LATIN_EXTRA_SEMANTIC_CASES.length,9);
 assert.equal(report.topicPairs,9);
 assert.equal(report.LatinFormsPerLanguage,85);
 assert.equal(report.teachingClaimsPerLanguage,24);
 assert.ok(report.results.every(r=>r.status==='equivalencia-selectiva-acreditada'));
 assert.equal(report.results.filter(r=>r.topic==='Cuarta/quinta declinación').length,2);
 assert.equal(report.results.filter(r=>r.topic==='Imperfecto activo').length,2);
 assert.equal(report.results.filter(r=>r.topic==='Pronombres personales').length,2);
 assert.equal(report.results.find(r=>r.topic==='Deponentes').tableCount,0);
 assert.equal(report.results.find(r=>r.topic==='Futuro imperfecto').tableCount,3);
});
test('La matriz verifica la diferencia día/fecha y su traducción valenciana',()=>{
 for(const loc of ['es','val']){
  const html=curricula.latin1[loc].latin.units[6].topics[0].html;
  assert.match(html,/eodem die/);
  assert.match(html,/ad certam diem/);
  assert.match(html,loc==='es'?/en femenino, 'fecha'/:/en femení, 'data'/);
  assert.match(html,loc==='es'?/Esta distinción es orientativa/:/Esta distinció és orientativa/);
 }
});
test('No anticipar futuro a 4.º ni cambiar el valor de los deponentes',()=>{
 for(const loc of ['es','val']){
  assert.equal(curricula.latin4[loc].latin.units.length,8);
  const fourth=curricula.latin4[loc].latin.units.flatMap(u=>u.topics)
   .map(t=>t.title).join(' ');
  assert.ok(!/Futur|Futuro imperfecto/.test(fourth));
  const html=curricula.latin1[loc].latin.units[6].topics[1].html;
  assert.ok(!/lavor, lavatus sum/.test(html));
 }
});
test('Contradicciones ES/VAL de significado son detectadas sin mutar datos',()=>{
 const snapshot=JSON.stringify(curricula);
 const bad=structuredClone(curricula);
 bad.latin1.val.latin.units[6].topics[0].html=
  bad.latin1.val.latin.units[6].topics[0].html.replace("'data'","'mes'");
 assert.throws(()=>auditLatinAdditionalBilingualSemantics(bad),
  /Sentido docente divergente/);
 const passive=structuredClone(curricula);
 passive.latin1.val.latin.units[6].topics[1].html=
  passive.latin1.val.latin.units[6].topics[1].html.replace(
    'paradigma morfològic passiu','paradigma morfològic actiu');
 assert.throws(()=>auditLatinAdditionalBilingualSemantics(passive),
  /Sentido docente divergente/);
 const missing=structuredClone(curricula);
 missing.latin1.es.latin.units[6].topics[2].html=
  missing.latin1.es.latin.units[6].topics[2].html.replace('capiam','capebo');
 assert.throws(()=>auditLatinAdditionalBilingualSemantics(missing),
  /Falta forma latina/);
 assert.equal(JSON.stringify(curricula),snapshot);
});
