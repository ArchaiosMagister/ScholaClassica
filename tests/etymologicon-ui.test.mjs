import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compileTeacherAudit} from '../scripts/compile-etymologicon-gr1.mjs';
import {createLearnerCatalog} from '../scripts/build-etymologicon.mjs';
import {createWriteTwoCorrector} from '../shared/academic/greek-etymology/corrector/write-two.mjs';

test('el catálogo distribuible solo expone los campos imprescindibles del ejercicio',()=>{
  const original=compileTeacherAudit(),learner=createLearnerCatalog(original);
  assert.equal(learner.schema,'etymologicon-audited-catalog/v1');
  assert.equal(learner.course,'gr1');
  assert.equal(learner.etymons.length,111);
  assert.equal(learner.derivatives.length,201);
  assert.equal(learner.relations.length,217);
  assert.equal(learner.excluded.length,1);
  assert.deepEqual(Object.keys(learner).sort(),
    ['course','derivatives','etymons','excluded','relations','schema'].sort());
  assert.deepEqual(Object.keys(learner.etymons[0]).sort(),
    ['editorialStatus','id','lemma','meaning','teacherApprovedDerivatives','units'].sort());
  assert.deepEqual(Object.keys(learner.derivatives[0]).sort(),
    ['editorialStatus','form','id','officialOrthographicVariants'].sort());
  assert.deepEqual(Object.keys(learner.relations[0]).sort(),
    ['derivativeId','editorialStatus','eligibleFor','etymonId','id'].sort());
  assert.ok(!JSON.stringify(learner).includes('c2f16a97c305120be771e6aff71bf1649ffeee1171669e64660d25481e16adaf'));
  assert.ok(!JSON.stringify(learner).includes('teacher_audit_original'));
  assert.ok(!JSON.stringify(learner).includes('lexicalReview'));
  assert.ok(!JSON.stringify(learner).includes('reviewedBy'));
  assert.ok(!JSON.stringify(learner).includes('editorialDecisions'));
});

test('el motor de navegador puntúa exactamente como la versión de pruebas Node',()=>{
  const catalog=createLearnerCatalog(compileTeacherAudit());
  const corrector=createWriteTwoCorrector(catalog);
  assert.equal(catalog.etymons.filter(e=>corrector.isEligible(e.id)).length,108);
  const r=corrector.grade('grc:προσ',['proselito','prosodia']);
  assert.equal(r.total,1.5);
  assert.deepEqual(r.answers.map(a=>a.points),[0.5,1]);
  assert.equal(r.answers[0].correctForm,'prosélito');
  const bad=corrector.grade('grc:προσ',['heliópolis','ginecólogo']);
  assert.deepEqual(bad.answers.map(a=>a.points),[0,0]);
});

test('el primer módulo de Etymologicon utiliza imports relativos compatibles con su carpeta',()=>{
  const html=readFileSync(new URL('../apps/etymologicon/index.html',import.meta.url),'utf8');
  const ui=readFileSync(new URL('../apps/etymologicon/app.mjs',import.meta.url),'utf8');
  assert.match(html,/type="module" src="\.\/app\.mjs"/);
  assert.match(html,/id="answer-1"/);
  assert.match(html,/id="answer-2"/);
  assert.match(html,/id="result-items"/);
  assert.match(html,/Griego II · próximamente/);
  assert.match(ui,/from '\.\/corrector\/write-two\.mjs'/);
  assert.match(ui,/fetch\('\.\/data\/gr1\.json'\)/);
  assert.match(ui,/engine\.grade\(item\.id,\[ui\.first\.value,ui\.second\.value\]\)/);
});

test('el módulo de progreso tiene conexión con la interfaz y se precarga como PWA',()=>{
  const html=readFileSync(new URL('../apps/etymologicon/index.html',import.meta.url),'utf8');
  const app=readFileSync(new URL('../apps/etymologicon/app.mjs',import.meta.url),'utf8');
  for(const id of ['practice-mode','stats-exercises','stats-average','stats-pending',
    'export-progress','import-file','import-preview','confirm-import','reset-progress','stats-units'])
    assert.ok(html.includes('id="'+id+'"'),id);
  assert.match(app,/from '\.\/progress\.mjs'/);
  assert.match(app,/recordExercise\(progress,eligible,result\)/);
  assert.match(app,/saveProgress\(storage,progress,eligible\)/);
  assert.match(app,/filteredEtyma\(eligible,progress/);
  assert.match(app,/chooseAdaptive\(pool,progress/);
  assert.match(app,/importProgress\(await file\.text\(\),eligible\)/);
  assert.match(app,/exportProgress\(progress,eligible\)/);
  assert.match(app,/window\.confirm\(/);
});
