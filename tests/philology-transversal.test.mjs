import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {readTransversalAudit,auditTransversal}
 from '../scripts/audit-transversal-filologica.mjs';

const root=resolve(import.meta.dirname,'..');
const read=relative=>readFileSync(join(root,relative),'utf8');
const report=readTransversalAudit();

test('Auditoría transversal: fuentes fijadas, 2055 identidades y alcance exacto',()=>{
 const lock=JSON.parse(read('config/sources.lock.json'));
 assert.equal(report.schema,'schola-transversal-philology/v1');
 assert.deepEqual(report.sources,{appendix:lock.sources.appendix.sha,vocabula:lock.sources.vocabula.sha});
 assert.equal(report.lexicalIdentitiesPreserved,true);
 assert.ok(report.totalMorphology>230);
 assert.deepEqual(Object.keys(report.courses),['latin1','latin4','griego1']);
});
test('Gramática ES y VAL: contenido y tablas paralelos en los tres itinerarios',()=>{
 for(const [name,expected] of [['latin1',10],['latin4',8],['griego1',14]]){
  const course=report.courses[name];
  assert.deepEqual(course.grammaticalDifferences,[],
    'Tablas o temas ES/VAL incongruentes: '+name);
  assert.ok(course.grammar.topics>=expected);
  assert.ok(course.grammar.tables>=expected);
 }
 assert.equal(report.courses.latin4.grammar.topics,15);
});
test('Morfología curricular: no se habilitan paradigmas fuera de las unidades',()=>{
 for(const [name,count] of [['latin1',89],['latin4',76],['griego1',92]]){
  const course=report.courses[name];
  assert.equal(course.records,count,name);
  assert.equal(course.recordsPerUnit.reduce((x,y)=>x+y,0),count);
  assert.deepEqual(course.unitViolations,[]);
 }
});
test('Latín 4: 26 paradigmas docentes y 49 reutilizados de Appendix sin cambios de casilla',()=>{
 const x=report.latin4Sources;
 assert.equal(x.teacher,26);
 assert.equal(x.teacherExact,26);
 assert.equal(x.appendixBridges,49);
 assert.deepEqual(x.differences,[]);
});
test('Griego I: cada paradigma nominal con vínculo vocabulario usa ID y grupo acreditados',()=>{
 const x=report.greekEvidence;
 assert.ok(x.verifiedSourceReferences>=15);
 assert.deepEqual(x.problems,[]);
});
test('Sin fabricación de listas ni traslado automático de las unidades suplementarias',()=>{
 const l1=report.courses.latin1.vocabulary;
 const l4=report.courses.latin4.vocabulary;
 const g1=report.courses.griego1.vocabulary;
 assert.equal(l1.general,741);
 assert.equal(l1.exam,115);
 assert.equal(l1.byGroup['UD 11–12'].exam,0);
 assert.equal(l1.byGroup['UD 11–12'].general,140);
 assert.equal(l4.general,379);
 assert.equal(l4.exam,127);
 // Hallazgo contrastado: seis deponentes de Examen UD10 permanecen en
 // Vocabula aunque la gramática de 4.º termine en UD8. No ocultarlos sin
 // decisión docente ni etiquetarlos como materia de UD8.
 assert.equal(l4.outOfScopeExam,6);
 assert.equal(l4.byGroup['UD 9'].exam,0);
 assert.equal(l4.byGroup['UD 10'].exam,6);
 assert.equal(l4.byGroup['UD 8–9'],undefined,
   'Las 17 fichas de Examen UD8–9 ya deben estar conciliadas en UD8');
 assert.equal(l4.byGroup['UD 8'].exam,17);
 assert.equal(g1.general,332);
 assert.equal(g1.exam,171);
 assert.equal(g1.byGroup['Sin unidad acreditada'].exam,0);
 assert.equal(g1.byGroup['Sin unidad acreditada'].general,184);
 assert.ok(!['UD 11','UD 12','UD 13','UD 14'].some(u=>g1.byGroup[u]?.exam));
});
test('La auditoría detecta mutaciones de IDs léxicos y nunca las corrige en silencio',()=>{
 const lock=JSON.parse(read('config/sources.lock.json'));
 const source=JSON.parse(read('.sources/vocabula/data.js').replace(/^window\.VOCAB=/u,'').replace(/;\s*$/u,''));
 const student=JSON.parse(read('dist/apps/vocabulario/data.js').replace(/^window\.VOCAB=/u,'').replace(/;\s*$/u,''));
 const bank=JSON.parse(read('dist/apps/morfologia/data/paradigmas.json'));
 const fake=[...student];
 fake[0]={...fake[0],id:'fake-id'};
 const curricula=Object.fromEntries(Object.entries(report.courses).map(([key,course])=>
  [key,{counts:course.grammar,differences:course.grammaticalDifferences}]));
 assert.throws(()=>auditTransversal({bank,vocabulary:fake,originalVocabulary:source,curricula,lock}),
   /identificadores léxicos/);
});

test('La enmienda de polliceor cambia solo la conjugación, sin borrar su lectura docente',()=>{
 const sourceData=JSON.parse(read('.sources/vocabula/data.js')
   .replace(/^window\.VOCAB=/u,'').replace(/;\s*$/u,''));
 const compiled=JSON.parse(read('dist/apps/vocabulario/data.js')
   .replace(/^window\.VOCAB=/u,'').replace(/;\s*$/u,''));
 for(const [id,mode] of [
   ['6c627fb664674b71','general'],
   ['ccb8e344f436ae4b','examen']
 ]){
   const original=sourceData.find(x=>x.id===id);
   const result=compiled.find(x=>x.id===id);
   assert.equal(original.form,'pollĭcĕor, pollĭcĭtus sum (3ª)');
   assert.equal(result.form,'pollĭcĕor, pollĭcĭtus sum (2ª)');
   assert.deepEqual(result.units,['UD 10']);
   assert.equal(result.mode,mode);
   assert.equal(result.subject,'lat4');
   for(const attr of ['meaning','answers','originals'])
     assert.deepEqual(result[attr],original[attr],attr);
   assert.equal(result.curricularProvenance,undefined);
 }
 const others=compiled.filter(e=>e.subject==='lat4'&&e.mode==='examen'&&
   e.units.includes('UD 10'));
 assert.equal(others.length,6);
});
