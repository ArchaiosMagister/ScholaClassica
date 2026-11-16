// Auditoría de las fronteras curriculares: no modifica bancos ni unidades.
// Distingue Examen, General, grupos complementarios y ausencia de UD.
// No convierte automáticamente General en Examen ni infiere un temario nuevo.
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {classifyVocabularyUnit,parseVocabularySource} from './audit-morphology-vocabulary.mjs';
import {scholaVocabularyVisibleUnits} from './vocabula-all-model.mjs';
import {GREEK1_KINDYNOS_GENERAL_ID,GREEK1_KINDYNOS_EXAM_ID} from './greek1-kindynos-ud5-decision.mjs';

export const COURSE_SCOPES=Object.freeze([
  {id:'latin1',subject:'lat1',language:'latin',grammar:'latin',maxUnit:10},
  {id:'latin4',subject:'lat4',language:'latin4',grammar:'latin',maxUnit:8},
  {id:'griego1',subject:'gr1',language:'griego',grammar:'griego',maxUnit:14}
]);
const byMode=(items)=>({
  general:items.filter(e=>e.mode==='general').length,
  examen:items.filter(e=>e.mode==='examen').length
});
const tags=entry=>(entry.units||[]).map(classifyVocabularyUnit);
const numeric=unit=>unit.start!==null;

function auditSubject({spec,source,integrated,bank,curricula}){
  const {id,subject,language,grammar,maxUnit}=spec;
  const es=curricula[id].es[grammar].units;
  const val=curricula[id].val[grammar].units;
  assert.deepEqual(es.map(x=>x.number),
    Array.from({length:maxUnit},(_,i)=>i+1),'Unidades ES alteradas: '+id);
  assert.deepEqual(val.map(x=>x.number),es.map(x=>x.number),
    'Unidades VAL alteradas: '+id);
  assert.deepEqual(val.map(x=>x.topics.length),es.map(x=>x.topics.length),
    'Epígrafes ES/VAL alterados: '+id);
  const morph=bank.records.filter(r=>r.language===language);
  assert.ok(morph.length>0,'No hay morfología para '+id);
  assert.ok(morph.every(r=>Number.isInteger(r.unit)&&r.unit>=1&&
    r.unit<=maxUnit),'Morfología fuera de las unidades impartidas: '+id);
  const original=source.filter(x=>x.subject===subject);
  const copy=integrated.filter(x=>x.subject===subject);
  assert.equal(original.length,copy.length,'La copia ha perdido fichas de '+id);
  const records=original.map(e=>({e,groups:tags(e)}));
  const onlyBeyond=records.filter(({groups})=>{
    const u=groups.filter(numeric);
    return u.length>0&&u.every(x=>x.start>maxUnit);
  });
  const sharedBeyond=records.filter(({groups})=>
    groups.some(x=>numeric(x)&&x.start>maxUnit)&&
    groups.some(x=>numeric(x)&&x.end<=maxUnit));
  const crossing=records.filter(({groups})=>
    groups.some(x=>numeric(x)&&x.start<=maxUnit&&x.end>maxUnit));
  const withoutUnit=records.filter(({groups})=>
    groups.some(x=>x.type==='unaccredited'));
  const transversal=records.filter(({groups})=>
    groups.some(x=>x.type==='transversal'));
  const exam=original.filter(x=>x.mode==='examen');
  const examNumeric=exam.flatMap(e=>tags(e).filter(numeric));
  const labels=[...new Set(copy.flatMap(x=>x.units||[]))]
    .sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));
  const beyondLabels=[...new Set(original.flatMap(x=>x.units||[]))]
    .filter(s=>{const u=classifyVocabularyUnit(s);return numeric(u)&&u.start>maxUnit;})
    .sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));
  const lateExam=exam.filter(e=>tags(e).some(u=>
    numeric(u)&&u.start>maxUnit));
  return {
    curriculumUnits:maxUnit,
    esTopics:es.map(x=>x.topics.length),
    valTopics:val.map(x=>x.topics.length),
    morphologyCards:morph.length,
    sourceVocabulary:byMode(original),
    integratedVocabulary:byMode(copy),
    historicalGroups:{
      onlyBeyond:byMode(onlyBeyond.map(x=>x.e)),
      sharedBeyond:byMode(sharedBeyond.map(x=>x.e)),
      crossingBoundary:byMode(crossing.map(x=>x.e)),
      withoutAccreditedUnit:byMode(withoutUnit.map(x=>x.e)),
      otherNonNumericGroups:byMode(transversal.map(x=>x.e))
    },
    beyondLabels,
    firstAndLastExamUnit:examNumeric.length?
      [Math.min(...examNumeric.map(x=>x.start)),Math.max(...examNumeric.map(x=>x.end))]:null,
    lateExamEntries:lateExam.map(e=>({
      id:e.id,form:e.form,units:e.units
    })),
    originalBoundaryEntries:crossing.map(x=>({
      id:x.e.id,form:x.e.form,units:x.e.units
    })),
    integratedVisibleUnitLabels:scholaVocabularyVisibleUnits(subject,labels,false),
    integratedOptionalUnitLabels:scholaVocabularyVisibleUnits(subject,labels,true)
  };
}

export function auditCurricularScope({source,integrated,bank,curricula}){
  assert.equal(source.length,2055,'Banco Vocabula fuente cambiado');
  assert.equal(integrated.length,source.length,'Fichas perdidas en integración');
  const ids=source.map(x=>x.id);
  assert.equal(new Set(ids).size,ids.length,'IDs fuente duplicados');
  assert.deepEqual(integrated.map(x=>x.id),ids,
    'Orden o identificadores históricos alterados');
  const summaries={};
  for(const spec of COURSE_SCOPES){
    summaries[spec.id]=auditSubject({spec,source,integrated,bank,curricula});
  }
  const originalEighth=source.filter(e=>
    e.subject==='lat4'&&e.mode==='examen'&&e.units?.length===1&&
    e.units[0]==='UD 8–9');
  const copyById=new Map(integrated.map(x=>[x.id,x]));
  assert.equal(originalEighth.length,17,'Bloque histórico UD8–9 cambiado');
  for(const original of originalEighth){
    const fixed=copyById.get(original.id);
    assert.deepEqual(fixed?.units,['UD 8'],
      'Reclasificación UD8 ya cotejada individualmente: '+original.id);
  }
  const originLate=summaries.latin4.lateExamEntries;
  for(const row of originLate){
    assert.deepEqual(copyById.get(row.id)?.units,row.units,
      'No promover automáticamente una UD10 a UD8: '+row.id);
  }
  const currentLate=summaries.latin4.integratedVisibleUnitLabels;
  assert.ok(!currentLate.includes('UD 9')&&!currentLate.includes('UD 10'),
    'Ampliación de 4.º no debe aparecer por defecto');
  assert.ok(summaries.latin4.integratedOptionalUnitLabels.includes('UD 9')&&
    summaries.latin4.integratedOptionalUnitLabels.includes('UD 10'),
    'Las dos unidades complementarias deben seguir recuperables');
  assert.equal(source.filter(e=>e.subject==='gr1'&&e.mode==='examen'&&
    e.units?.includes('Sin unidad acreditada')).length,0,
    'No trasladar palabras sin UD al vocabulario exigible');
  const originalGreek=source.find(x=>x.id===GREEK1_KINDYNOS_GENERAL_ID);
  const integratedGreek=copyById.get(GREEK1_KINDYNOS_GENERAL_ID);
  const originalExamGreek=source.find(x=>x.id===GREEK1_KINDYNOS_EXAM_ID);
  assert.equal(originalGreek?.subject,'gr1');
  assert.equal(originalGreek?.mode,'general');
  assert.deepEqual(originalGreek?.units,['Sin unidad acreditada']);
  assert.deepEqual(integratedGreek?.units,['UD 5'],
    'No perder la única unidad griega aprobada por el docente');
  assert.deepEqual(copyById.get(GREEK1_KINDYNOS_EXAM_ID),originalExamGreek,
    'El registro de Examen κίνδυνος debe permanecer intacto');
  for(const record of source.filter(x=>x.subject==='gr1'&&
      x.id!==GREEK1_KINDYNOS_GENERAL_ID)){
    assert.deepEqual(copyById.get(record.id),record,
      'No cambiar las demás 502 fichas griegas: '+record.id);
  }
  assert.equal(integrated.filter(x=>x.subject==='gr1'&&x.mode==='general'&&
    x.units?.includes('Sin unidad acreditada')).length,183,
    'Solo una de las 184 fichas General puede adquirir UD5');
  return {
    schema:'scholaclassica-auditoria-alcance-curricular/v1',
    sourceCards:source.length,copyCards:integrated.length,
    courses:summaries,
    reviewedLatin4Ud8Ids:originalEighth.map(e=>e.id),
    approvedGreek1GeneralUd5Id:GREEK1_KINDYNOS_GENERAL_ID,
    remainingGreek1GeneralUnassigned:183,
    policy:'Las cifras son evidencias de alcance, no errores filológicos aprobados. '+
      'Las UD9–10 de 4.º son ampliación, nunca currículo obligatorio; '+
      'una ficha General no se convierte en Examen; solo κίνδυνος General tiene UD5 por decisión docente, sin asignaciones inferidas.'
  };
}
export function loadCurricularScope(root){
  const g=join(root,'dist/apps/gramatica');
  const curricula=Object.fromEntries(COURSE_SCOPES.map(x=>[x.id,{
    es:JSON.parse(readFileSync(join(g,'assets','curriculum-'+x.id+'.json'),'utf8')),
    val:JSON.parse(readFileSync(join(g,'val','curriculum-'+x.id+'.json'),'utf8'))
  }]));
  return {
    source:parseVocabularySource(readFileSync(join(root,'.sources/vocabula/data.js'),'utf8')),
    integrated:parseVocabularySource(readFileSync(join(root,'dist/apps/vocabulario/data.js'),'utf8')),
    bank:JSON.parse(readFileSync(join(root,'dist/apps/morfologia/data/paradigmas.json'),'utf8')),
    curricula
  };
}
const main=process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]);
if(main){
  const root=resolve(import.meta.dirname,'..');
  const result=auditCurricularScope(loadCurricularScope(root));
  const dir=join(root,'build/academic-audits/curricular');
  mkdirSync(dir,{recursive:true});
  writeFileSync(join(dir,'alcance-curricular-v1.json'),JSON.stringify(result,null,2)+'\n');
  const concise=Object.fromEntries(Object.entries(result.courses).map(([id,c])=>[id,{
    curriculumUnits:c.curriculumUnits,morphologyCards:c.morphologyCards,
    sourceVocabulary:c.sourceVocabulary,historicalGroups:c.historicalGroups,
    beyondLabels:c.beyondLabels,lateExamEntries:c.lateExamEntries.length,
    examUnitCoverage:c.firstAndLastExamUnit
  }]));
  console.log('AUDITORIA_ALCANCE_CURRICULAR',JSON.stringify({
    sourceCards:result.sourceCards,copyCards:result.copyCards,
    reviewedLatin4Ud8Ids:result.reviewedLatin4Ud8Ids.length,
    courses:concise
  }));
}
