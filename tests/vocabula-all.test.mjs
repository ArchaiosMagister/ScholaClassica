import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {scholaVocabularyAll,scholaVocabularyIdentity,
 scholaVocabularyProvenance,scholaVocabularyProgress,
 scholaVocabularyRecordProgress,scholaVocabularyReportContext,
 scholaVocabularyReportMaxLength,scholaVocabularyReportPayload,
 scholaVocabularyScopeDescription,scholaVocabularyVisibleUnits,
 scholaVocabularyEditorialNote} from '../scripts/vocabula-all-model.mjs';
import {adaptVocabulaAllHtml,adaptVocabulaAllApp,adaptVocabulaAllReport}
 from '../scripts/adapt-vocabula-all.mjs';
import {createHash} from 'node:crypto';
import {GREEK1_KINDYNOS_GENERAL_ID} from '../scripts/greek1-kindynos-ud5-decision.mjs';

const root=resolve(import.meta.dirname,'..');
const origin=join(root,'.sources/vocabula');
const integrated=join(root,'dist/apps/vocabulario');
const raw=readFileSync(join(origin,'data.js'),'utf8');
const source=JSON.parse(raw.replace(/^window\.VOCAB\s*=/u,'').replace(/;\s*$/u,''));
const actual=JSON.parse(readFileSync(join(integrated,'data.js'),'utf8')
 .replace(/^window\.VOCAB\s*=/u,'').replace(/;\s*$/u,''));
const sha=s=>createHash('sha256').update(s).digest('hex');
const get=(id)=>actual.find(e=>e.id===id);
const canonical=e=>JSON.stringify(e);

test('Vista Todo solo en el artefacto: conserva las 2055 fichas, los IDs y sus unidades',()=>{
 assert.equal(source.length,2055);
 assert.equal(actual.length,2055);
 assert.deepEqual(actual.map(e=>e.id),source.map(e=>e.id));
 assert.equal(new Set(actual.map(e=>e.id)).size,2055);
 for(let i=0;i<source.length;i++)if(source[i].subject!=='lat4'&&
   source[i].id!==GREEK1_KINDYNOS_GENERAL_ID)
   assert.deepEqual(actual[i],source[i],'Fichas alteradas de '+source[i].subject);
 const shaBefore=sha(raw);
 assert.equal(sha(readFileSync(join(origin,'data.js'),'utf8')),shaBefore);
 const names=['index.html','app.js','teacher.js'];
 const compiled=readFileSync(join(integrated,'schola-all.js'),'utf8');
 assert.ok(compiled.includes('function scholaVocabularyAll('));
 assert.doesNotMatch(compiled,/^export /mu);
 assert.equal(compiled,
   "'use strict';\n"+readFileSync(join(root,'scripts/vocabula-all-model.mjs'),'utf8')
    .replace(/^export /gmu,''));
 const app=readFileSync(join(integrated,'app.js'),'utf8');
 assert.match(app,/scholaVocabularyAll\(VOCAB/);
 assert.match(app,/scholaVocabularyRecordProgress\(progress,e,ok\)/);
 assert.match(app,/scholaVocabularyEditorialNote\(e\)/);
 assert.match(app,/scholaVocabularyVisibleUnits\(/);
 assert.match(app,/schola-lat4-extra-enabled/);
 assert.ok(!app.includes('VOCAB.push('));
 assert.match(readFileSync(join(integrated,'index.html'),'utf8'),
  /<option value="all">Todo el vocabulario<\/option>/u);
 assert.match(readFileSync(join(integrated,'teacher.js'),'utf8'),
  /scholaVocabularyReportContext\(entry/);
 assert.match(readFileSync(join(integrated,'teacher.js'),'utf8'),
  /scholaVocabularyReportPayload\(reportContext/);
 for(const name of names){
  assert.notEqual(sha(readFileSync(join(integrated,name),'utf8')),
   sha(readFileSync(join(origin,name),'utf8')));
 }
});

test('Deduplicación conservadora: todos los cursos, fuentes, acepciones y originalidad',()=>{
 const expectations={lat1:745,gr1:385,lat4:447,lat2:126};
 for(const [subject,expected] of Object.entries(expectations)){
  const cohort=actual.filter(e=>e.subject===subject);
  const initial=JSON.stringify(cohort);
  const combined=scholaVocabularyAll(actual,subject);
  assert.equal(combined.length,expected,'Número inestable de fichas conjuntas: '+subject);
  assert.deepEqual(new Set(combined.map(scholaVocabularyIdentity)).size,combined.length);
  assert.equal(combined.reduce((n,e)=>n+e.scholaSources.length,0),
   cohort.length,'No se puede perder un ID ni una ficha original de '+subject);
  const ids=combined.flatMap(e=>e.scholaSources.map(s=>s.id));
  assert.equal(ids.length,new Set(ids).size);
  assert.deepEqual(ids.sort(),cohort.map(e=>e.id).sort());
  assert.equal(JSON.stringify(cohort),initial,'La vista debe ser pura');
  assert.ok(combined.every(e=>cohort.some(r=>r.id===e.id)));
 }
 const latin=scholaVocabularyAll(actual,'lat1');
 const greek=scholaVocabularyAll(actual,'gr1');
 for(const form of ['ovis, −is (f.)','soror, sororis (f.)']){
  const card=latin.find(e=>e.form===form);
  assert.ok(card,'Examen no puede desaparecer del conjunto: '+form);
  assert.deepEqual(card.scholaSources.map(x=>x.mode),['examen']);
  assert.deepEqual(card.units,['UD 4']);
 }
 for(const form of ['βίος, –ου','θάλαττα, –ης','φόβος, –ου']){
  assert.ok(greek.find(e=>e.form===form&&
   e.scholaSources.some(src=>src.mode==='examen')));
 }
 // Una glosa/regencia distinta nunca se fusiona: es una ficha independiente.
 const silva=latin.filter(e=>e.form==='silva, –æ');
 assert.equal(silva.length,2);
 assert.equal(new Set(silva.map(e=>e.meaning)).size,2);
 const akouo=greek.filter(e=>e.form.normalize('NFC')==='ἀκούω'.normalize('NFC'));
 assert.equal(akouo.length,2);
 assert.equal(new Set(akouo.map(e=>e.meaning)).size,2);
 const oikeo=greek.filter(e=>e.form.normalize('NFC')==='οἰκέω'.normalize('NFC'));
 assert.equal(oikeo.length,2);
 assert.equal(new Set(oikeo.map(e=>e.meaning)).size,2);
});

test('Las cinco discrepancias de Latín I conservan ambos orígenes y sus unidades',()=>{
 const cases=[
  {lemma:'ac (conj.)',general:['UD 7'],exam:['UD 4']},
  {lemma:'atque (conj.)',general:['UD 6'],exam:['UD 4']},
  {lemma:'flumen, fluminis (n.)',general:['UD 5','UD 8'],exam:['UD 4']},
  {lemma:'Cæsar',general:['UD 5','UD 8','UD 9–10','UD 11–12'],exam:['UD 6']},
  {lemma:'eques, equitis (m.)',general:['UD 8','UD 11–12'],exam:['UD 6']}
 ];
 const latin=scholaVocabularyAll(actual,'lat1');
 for(const sample of cases){
  const cards=latin.filter(e=>e.form.startsWith(sample.lemma));
  assert.ok(cards.length,sample.lemma);
  const sources=cards.flatMap(e=>e.scholaSources);
  const gen=sources.filter(x=>x.mode==='general');
  const exam=sources.filter(x=>x.mode==='examen');
  assert.ok(gen.length&&exam.length);
  assert.deepEqual([...new Set(gen.flatMap(x=>x.units))].sort(),sample.general.sort());
  assert.deepEqual([...new Set(exam.flatMap(x=>x.units))].sort(),sample.exam.sort());
  const captions=cards.map(e=>scholaVocabularyProvenance(e));
  assert.ok(captions.some(x=>x.includes('General:')));
  assert.ok(captions.some(x=>x.includes('Examen:')));
  for(const s of sources)
   assert.deepEqual(s.units,get(s.id).units,'No cambiar las unidades de '+s.id);
 }
 const ac=scholaVocabularyAll(actual,'lat1',['UD 4']).find(e=>e.form==='ac (conj.)');
 assert.ok(ac);
 assert.equal(ac.mode,'examen','La UD4 procede únicamente del examen');
 assert.deepEqual(ac.scholaSelectedIds,ac.scholaSources.filter(s=>s.mode==='examen').map(s=>s.id));
 assert.match(scholaVocabularyProvenance(ac),/General: UD 7  \|  Examen: UD 4/u);
 const later=scholaVocabularyAll(actual,'lat1',['UD 7']).find(e=>e.form==='ac (conj.)');
 assert.equal(later.mode,'general');
});

test('La selección de unidad y errores respeta IDs y el progreso existente',()=>{
 const all=scholaVocabularyAll(actual,'lat1');
 const ambulo=all.find(e=>e.form==='ambulo, ambulavi, ambulatum (1ª)');
 assert.ok(ambulo);
 assert.equal(ambulo.scholaSources.length,2);
 const ids=ambulo.scholaSources.map(s=>s.id);
 const previous={
  [ids[0]]:{total:4,right:3,failed:true},
  [ids[1]]:{total:2,right:1,failed:false}
 };
 const snapshot=canonical(previous);
 let found=scholaVocabularyAll(actual,'lat1',['UD 1'],previous);
 assert.ok(found.some(e=>e.form===ambulo.form));
 assert.equal(scholaVocabularyProgress([ambulo],previous).learned,1);
 assert.equal(scholaVocabularyProgress([ambulo],previous).pending,1);
 assert.equal(canonical(previous),snapshot);
 const played=found.find(e=>e.form===ambulo.form);
 assert.deepEqual(new Set(played.scholaSelectedIds),new Set(ids));
 scholaVocabularyRecordProgress(previous,played,true);
 assert.equal(previous[ids[0]].total,5);
 assert.equal(previous[ids[0]].right,4);
 assert.equal(previous[ids[0]].failed,false);
 assert.equal(previous[ids[1]].total,3);
 assert.equal(previous[ids[1]].right,2);
 assert.equal(previous[ids[1]].failed,false);
 assert.equal(scholaVocabularyAll(actual,'lat1',['UD 1'],previous).some(e=>e.form===ambulo.form),false);
 assert.equal(scholaVocabularyProgress([ambulo],previous).learned,1);
 // Una ficha de examen sin unidad compartida solo actualiza su propio ID.
 const ac=scholaVocabularyAll(actual,'lat1',['UD 4']).find(e=>e.form==='ac (conj.)');
 const sourceId=ac.scholaSources.find(x=>x.mode==='general').id;
 const examId=ac.scholaSources.find(x=>x.mode==='examen').id;
 const saved={[sourceId]:{total:3,right:1,failed:true}};
 scholaVocabularyRecordProgress(saved,ac,true);
 assert.deepEqual(saved[sourceId],{total:3,right:1,failed:true});
 assert.deepEqual(saved[examId],{total:1,right:1,failed:false});
 const knownIds=new Set(actual.map(x=>x.id));
 assert.ok(Object.keys(previous).every(id=>knownIds.has(id)));
 assert.ok(Object.keys(saved).every(id=>knownIds.has(id)));
});

test('La combinación funciona también con altas docentes sin editar los datos originales',()=>{
 const added={id:'custom-case-1-general',subject:'gr1',mode:'general',
   form:'ἐξαιρετικός, –ή, –όν',meaning:'‘extraordinario/a’',
   answers:['extraordinario'],units:['UD 10'],
   originals:['ἐξαιρετικός, –ή, –όν: ‘extraordinario/a’']};
 const exam={...added,id:'custom-case-1-examen',mode:'examen'};
 const original=canonical(actual);
 const combined=scholaVocabularyAll([...actual,added,exam],'gr1',['UD 10']);
 const card=combined.find(e=>e.form===added.form);
 assert.ok(card);
 assert.equal(card.scholaSources.length,2);
 assert.deepEqual(card.scholaSelectedIds,[added.id,exam.id]);
 assert.equal(canonical(actual),original);
});


test('Aviso genérico de Todo: conserva el contexto, no transmite modo all ni campos extra',()=>{
 const selected=['UD 4','UD 7'];
 const context=scholaVocabularyReportContext(null,'lat1','all',selected);
 assert.equal(context.mode,'general','Retrocompatibilidad con contrato del backend');
 assert.equal(context.scholaMode,'all');
 assert.deepEqual(context.units,selected);
 assert.equal(context.entry_id,'');
 assert.ok(context.scholaNote.includes('Todo el vocabulario (General y Examen)'));
 const text='Solicito que se revise esta palabra.';
 const report=scholaVocabularyReportPayload(context,'missing',text);
 assert.equal(report.mode,'general');
 assert.equal(report.kind,'missing');
 assert.deepEqual(report.units,selected);
 assert.ok(report.message.startsWith(text+'\n\n['));
 assert.ok(report.message.includes('Unidades marcadas: UD 4 · UD 7'));
 assert.deepEqual(Object.keys(report).sort(),
   ['subject','mode','units','entry_id','entry_form','kind','message'].sort());
 assert.equal(scholaVocabularyReportMaxLength(context)+4+context.scholaNote.length,2000);
 const full=scholaVocabularyReportPayload(context,'missing',
   'a'.repeat(scholaVocabularyReportMaxLength(context)));
 assert.equal(full.message.length,2000);
 assert.throws(()=>scholaVocabularyReportPayload(context,'missing',
   'a'.repeat(scholaVocabularyReportMaxLength(context)+1)),/demasiado largo/);
 // En los otros dos corpus no se añade ni modifica la explicación del docente.
 for(const mode of ['general','examen']){
   const normal=scholaVocabularyReportContext(null,'lat1',mode,selected);
   assert.equal(normal.scholaNote,undefined);
   assert.equal(scholaVocabularyReportMaxLength(normal),2000);
   assert.equal(scholaVocabularyReportPayload(normal,'other',text).message,text);
   assert.equal(normal.mode,mode);
 }
});

test('El aviso de una ficha Todo informa ambas procedencias sin perder los IDs',()=>{
 const examples=[
  ['UD 4','ac (conj.)',['General (UD 7)','Examen (UD 4)']],
  ['UD 4','flumen, fluminis (n.)',['General (UD 5 · UD 8)','Examen (UD 4)']]
 ];
 for(const [unit,form,parts] of examples){
   const card=scholaVocabularyAll(actual,'lat1',[unit]).find(e=>e.form===form);
   assert.ok(card,form);
   const ctx=scholaVocabularyReportContext(card,'lat1','all',[unit]);
   assert.equal(ctx.mode,card.mode,'No cambiar la modalidad del registro representativo');
   assert.equal(ctx.entry_id,card.id);
   assert.deepEqual(ctx.units,card.units);
   const report=scholaVocabularyReportPayload(ctx,'translation','Otra traducción.');
   for(const part of parts)assert.ok(report.message.includes(part),form+' '+part);
   for(const source of card.scholaSources)assert.ok(report.message.includes(source.id));
   assert.equal(Object.keys(report).includes('scholaNote'),false);
 }
 // Los avisos sobre una ficha de un solo corpus siguen señalando la fuente real.
 const only=scholaVocabularyAll(actual,'lat1',['UD 4']).find(e=>
   e.form==='ovis, −is (f.)');
 assert.ok(only&&only.scholaSources.length===1);
 const report=scholaVocabularyReportPayload(
   scholaVocabularyReportContext(only,'lat1','all',['UD 4']),
   'translation','Acepción alternativa.');
 assert.match(report.message,/Todo el vocabulario/);
 assert.ok(report.message.includes(only.scholaSources[0].id));
 assert.equal(report.mode,'examen');
});
test('Exigibilidad de unidades tardías: nunca promover General al corpus Examen',()=>{
 const exam=actual.filter(e=>e.mode==='examen');
 const coverage=[
  ['lat1',[8,9,10],7],
  ['gr1',[11,12,13,14],10]
 ];
 for(const [subject,missing,last] of coverage){
   const course=exam.filter(e=>e.subject===subject);
   assert.ok(course.length>100);
   const labels=[...new Set(course.flatMap(e=>e.units))];
   for(const n of missing){
     assert.ok(!labels.some(label=>new RegExp('(^|[^0-9])'+n+'([^0-9]|$)').test(label)),
       'Hay una lista tardía que requiere revisar el dictamen: '+subject+' UD'+n);
   }
   assert.ok(labels.some(label=>label.includes(''+last)),
     subject+' carece incluso de su última unidad acreditada');
   const display=scholaVocabularyScopeDescription(subject,'examen','');
   assert.ok(display.includes(subject==='lat1'?'8–10':'11–14'));
   const count=course.length;
   assert.equal(actual.filter(e=>e.subject===subject&&e.mode==='examen').length,count);
   assert.ok(scholaVocabularyAll(actual,subject).length>=count);
 }
});
