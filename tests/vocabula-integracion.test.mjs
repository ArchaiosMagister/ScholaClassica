import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {mergeCatalog,matchCatalog} from '../public/docente/vocabula-catalog.mjs';
import {correctLatin4Vocabula,LATIN4_LEXICAL_CORRECTIONS} from '../scripts/latin4-lexical-editorial.mjs';
import {reconcileLatin4ExamUd8,LATIN4_UD8_EXAM_REVIEW} from '../scripts/latin4-ud8-reconciliation.mjs';
import {applyGreek1KindynosUd5,GREEK1_KINDYNOS_GENERAL_ID,GREEK1_KINDYNOS_EXAM_ID} from '../scripts/greek1-kindynos-ud5-decision.mjs';
import {adaptVocabulaAllHtml,adaptVocabulaAllApp,adaptVocabulaAllReport} from '../scripts/adapt-vocabula-all.mjs';
import {integrateReviewedTeacherWords} from '../scripts/migrate-vocabula-teacher-words.mjs';
import {adaptVocabulaOfflineHtml,adaptVocabulaOfflineTeacher} from '../scripts/adapt-vocabula-offline.mjs';
import {retirePublicVocabulaHtml,retirePublicVocabulaApp} from '../scripts/retire-vocabula-public-remote.mjs';
const root=resolve(import.meta.dirname,'..');
const source=join(root,'vendor/vocabula'),target=join(root,'dist/apps/vocabulario');
const names=['choice.js','config.js','scope.js'];
const digest=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
test('Vocabula conserva el vocabulario estático sin conectar avisos del alumnado',()=>{
  for(const file of names)assert.equal(digest(join(target,file)),digest(join(source,file)),'Se modificó '+file);
  assert.deepEqual(readdirSync(join(target,'icons')).sort(),readdirSync(join(source,'icons')).sort());
  for(const name of readdirSync(join(source,'icons')))assert.equal(digest(join(target,'icons',name)),digest(join(source,'icons',name)));
  const sourceApp=readFileSync(join(source,'app.js'),'utf8');
  const studentApp=readFileSync(join(target,'app.js'),'utf8');
  assert.notEqual(studentApp,sourceApp,'Debe simplificarse solo la copia integrada');
  assert.match(studentApp,/Elige las unidades y los grupos de Griego I/);
  assert.doesNotMatch(studentApp,/Variantes originales|Otras acepciones originales|el resto queda sin unidad acreditada/);
  const config=readFileSync(join(target,'config.js'),'utf8');
  assert.match(config,/\.supabase\.co\/functions\/v1\/vocabulary/);
  assert.ok(!config.includes('service_role'));
});
test('la copia estudiantil adapta la navegación y los textos técnicos sin tocar el original',()=>{
  const from=readFileSync(join(source,'index.html'),'utf8');
  const to=readFileSync(join(target,'index.html'),'utf8');
  const expected=from
    .replace('<option value="dark">Oscuro</option>','<option value="dark">Oscuro</option><option value="oled">OLED</option>')
    .replace('<a class="study-tab" href="gramatica.html">Gramática</a>','<a class="study-tab" href="../gramatica/index.html">Gramática de consulta</a>')
    .replace('<script src="teacher.js?v=20261113-alumnos" defer></script>','<script src="teacher.js?v=20261113-alumnos" defer></script><script src="schola-bridge.js" defer></script>')
    .replace('src="theme.js?v=1"','src="theme.js?v=1-oled1"')
    .replace('href="style.css?v=20261109-tabs1"','href="style.css?v=20261109-tabs1-oled1"')
    .replace('Practica el vocabulario original de Latín y Griego por unidades, con tarjetas, test y traducción.','Practica el vocabulario de Latín y Griego por unidades, con tarjetas, test y traducción.')
    .replace('El botón Todas incluye también los bloques sin unidad acreditada, si los hay.','El botón Todas incluye también los grupos sin unidad específica.')
    .replace('En Griego general, 148 entradas tienen correspondencia con las unidades de examen y 184 quedan sin unidad acreditada. Los grupos de unidades se mantienen unidos; no se asignan unidades por traducción o parecido ortográfico.','En Griego general encontrarás palabras organizadas por unidades y otros grupos para repasar.')
    .replace('<button id="open-teacher" class="primary" type="button">Área de profesor</button>','')
    .replace('<dialog id="teacher-dialog" aria-labelledby="teacher-title"></dialog>','')
    .replace('teacher.js?v=20261113-alumnos','teacher.js?v=20261116-schola1')
    .replace('app.js?v=20261112','app.js?v=20261113-alumnos1');
  assert.notEqual(from,to);
  assert.equal(to,retirePublicVocabulaHtml(adaptVocabulaOfflineHtml(adaptVocabulaAllHtml(expected))));
  assert.ok(!to.includes('id="open-teacher"'));
  assert.ok(!to.includes('id="teacher-dialog"'));
  const nativeTeacher=readFileSync(join(source,'teacher.js'),'utf8');
  assert.ok(!nativeTeacher.includes('Authorization')&&!nativeTeacher.includes('sessionStorage'));
  assert.ok(!from.includes('id="open-teacher"')&&!from.includes('id="teacher-dialog"'));
  const studentJs=readFileSync(join(target,'teacher.js'),'utf8');
  assert.match(studentJs,/scholaMode==='all'/);
  assert.match(studentJs,/scholaVocabularyReportPayload\(reportContext/);
  assert.match(studentJs,/openReport\(selected\(\)\.find/);
  assert.notEqual(studentJs,readFileSync(join(source,'teacher.js'),'utf8'));
  assert.ok(studentJs.includes('function openReport('));
  assert.ok(studentJs.includes("api('report'"));
  assert.ok(studentJs.includes('async function sync()'));
  assert.ok(!studentJs.includes('openTeacher'));
  assert.ok(!studentJs.includes("api('login'"));
  assert.ok(!studentJs.includes('teacher_words'));
  assert.ok(!studentJs.includes('sessionStorage'));
  assert.ok(!studentJs.includes('Authorization'));
  assert.ok(!studentJs.includes('teacher-dialog'));
  assert.equal(readFileSync(join(target,'schola-all.js'),'utf8').includes('function scholaVocabularyAll'),true);
  assert.ok(readFileSync(join(target,'app.js'),'utf8').includes("$('corpus').value==='all'"));
  assert.doesNotMatch(to,/id="open-report"|id="report-dialog"|src="teacher\.js|src="config\.js/);
  assert.doesNotMatch(readFileSync(join(target,'app.js'),'utf8'),/data-report-(?:id|current)/);
  const bridge=readFileSync(join(target,'schola-bridge.js'),'utf8');
  assert.match(bridge,/URLSearchParams/);
  assert.match(bridge,/dispatchEvent/);
});
test('no se publica la morfología anterior ni backend o datos internos',()=>{
  for(const file of ['gramatica.html','morfologia.html','gramatica.js','morfologia.js','gramatica-importada.js','backend','data','scripts','tests','docs'])
    assert.equal(existsSync(join(target,file)),false,'Se copió inesperadamente '+file);
  assert.deepEqual(readdirSync(target).sort(),['index.html','app.js','choice.js','config.js','data.js','scope.js','style.css','teacher.js','theme.js','schola-bridge.js','schola-all.js','schola-offline.js','sw.js','manifest.webmanifest','icons'].sort());
});

test('Cuatro enmiendas de 4.º se corrigen en la copia, preservando el origen completo',()=>{
 const from=JSON.parse(readFileSync(join(source,'data.js'),'utf8')
   .replace(/^window\.VOCAB\s*=\s*/,'').replace(/;\s*$/,''));
 const to=JSON.parse(readFileSync(join(target,'data.js'),'utf8')
   .replace(/^window\.VOCAB\s*=\s*/,'').replace(/;\s*$/,''));
 assert.equal(from.length,2055);
 assert.equal(to.length,from.length+2);
 assert.deepEqual(to,integrateReviewedTeacherWords(applyGreek1KindynosUd5(reconcileLatin4ExamUd8(correctLatin4Vocabula(from)))));
 const changes=to.slice(0,from.length).filter((e,i)=>e.form!==from[i].form);
 const allUnitChanges=to.slice(0,from.length).filter((e,i)=>e.units.join('|')!==from[i].units.join('|'));
 assert.equal(allUnitChanges.length,18,'17 Latín 4.º y una Griego I');
 const curriculumChanges=allUnitChanges.filter(e=>e.subject==='lat4');
 assert.equal(curriculumChanges.length,17);
 const greekChange=allUnitChanges.find(e=>e.subject==='gr1');
 assert.equal(greekChange?.id,GREEK1_KINDYNOS_GENERAL_ID);
 assert.deepEqual(greekChange.units,['UD 5']);
 assert.deepEqual(from.find(x=>x.id===GREEK1_KINDYNOS_GENERAL_ID).units,
   ['Sin unidad acreditada']);
 assert.deepEqual(to.find(x=>x.id===GREEK1_KINDYNOS_EXAM_ID),
   from.find(x=>x.id===GREEK1_KINDYNOS_EXAM_ID));
 assert.deepEqual(curriculumChanges.map(e=>e.id).sort(),
   LATIN4_UD8_EXAM_REVIEW.map(x=>x.examId).sort());
 for(const e of curriculumChanges){
   assert.deepEqual(e.units,['UD 8']);
   assert.deepEqual(e.curricularProvenance?.originalUnits,['UD 8–9']);
   const fromRecord=from.find(x=>x.id===e.id);
   assert.deepEqual(e.originals,fromRecord.originals);
   assert.deepEqual(e.answers,fromRecord.answers);
   assert.equal(e.meaning,fromRecord.meaning);
 }
 const other=to.filter(e=>e.subject==='lat4'&&e.mode==='examen'&&e.units.includes('UD 8–9'));
 assert.equal(other.length,0);
 assert.equal(changes.length,4);
 assert.deepEqual(changes.map(e=>e.id).sort(),
   LATIN4_LEXICAL_CORRECTIONS.map(x=>x.id).sort());
 for(const entry of changes){
   const original=from.find(x=>x.id===entry.id);
   const correction=LATIN4_LEXICAL_CORRECTIONS.find(x=>x.id===entry.id);
   assert.deepEqual(entry.originals,original.originals);
   assert.deepEqual(entry.answers,original.answers);
   assert.equal(entry.meaning,original.meaning);
   assert.equal(entry.mode,correction.mode||'examen');
   if(correction.units){
     assert.deepEqual(entry.units,correction.units);
     assert.deepEqual(entry.units,original.units);
     assert.equal(entry.curricularProvenance,undefined);
   }else{
     assert.deepEqual(entry.units,['UD 8']);
     assert.deepEqual(original.units,['UD 8–9']);
     assert.deepEqual(entry.curricularProvenance.originalUnits,['UD 8–9']);
   }
 }
 for(const id of ['6c627fb664674b71','ccb8e344f436ae4b']){
   const fromRecord=from.find(x=>x.id===id);
   const toRecord=to.find(x=>x.id===id);
   assert.equal(toRecord.form,'pollĭcĕor, pollĭcĭtus sum (2ª)');
   assert.equal(fromRecord.form,'pollĭcĕor, pollĭcĭtus sum (3ª)');
   assert.equal(toRecord.id,fromRecord.id);
   assert.deepEqual(toRecord.units,['UD 10']);
 }
 const teacher=JSON.parse(readFileSync(join(root,'dist/docente/vocabula-catalog.json'),'utf8'));
 assert.equal(teacher.words.length,from.length);
 for(const change of changes)
   assert.equal(teacher.words.find(x=>x.id===change.id)?.form,change.form);
 assert.deepEqual(teacher.words.find(x=>x.id===GREEK1_KINDYNOS_GENERAL_ID)?.units,['UD 5']);
 assert.deepEqual(teacher.words.find(x=>x.id===GREEK1_KINDYNOS_EXAM_ID)?.units,['UD 5']);
 assert.equal(digest(join(source,'data.js'))===digest(join(target,'data.js')),false);
});

test('La búsqueda docente combina las 2055 fichas originales y las aportaciones',()=>{
  const generated=JSON.parse(readFileSync(join(root,'dist/docente/vocabula-catalog.json'),'utf8'));
  const original=JSON.parse(readFileSync(join(source,'data.js'),'utf8')
    .replace(/^window\.VOCAB\s*=\s*/,'').replace(/;\s*$/,''));
  assert.equal(generated.schema,1);
  assert.equal(generated.words.length,original.length);
  assert.ok(generated.words.length>=2000);
  assert.deepEqual(generated.words[0].form,original[0].form);
  assert.ok(!JSON.stringify(generated).includes('teacher_note'));
  const extra={id:'00000000-0000-4000-8000-000000000111',subject:'lat1',
    form:'Ephesius, –a, –um',meaning:'de Éfeso, efesio',
    answers:['efesio'],units:['UD 10'],in_exam:false,active:true};
  const catalog=mergeCatalog(generated.words,[extra]);
  const magnus=matchCatalog(catalog,{subject:'lat1',search:'magnus'});
  assert.equal(magnus.total,1);
  assert.equal(magnus.rows[0].origin,'original');
  assert.equal(magnus.rows[0].in_exam,true);
  const added=matchCatalog(catalog,{subject:'lat1',search:'Ephesius'});
  assert.equal(added.total,1);
  assert.equal(added.rows[0].origin,'docente');
  assert.deepEqual(added.rows[0].units,['UD 10']);
  const lat2=matchCatalog(catalog,{subject:'lat2',search:'bellum'});
  assert.ok(lat2.total>=1);
  assert.ok(lat2.rows.every(row=>row.units.every(unit=>!/^UD\s*\d+/i.test(unit))));
});
