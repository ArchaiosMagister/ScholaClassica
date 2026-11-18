// Matriz total de Morfología en castellano, basada en el mismo banco y motores
// que usa el alumnado. NO inventa ejercicios ni aprueba nuevos paradigmas.
// Recorre combinaciones acumulativas de curso, UD, categoría y modalidad.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {validateBank,availableRecords,makeQuestions,evaluate} from '../public/morfologia/engine.mjs';
import {makeWrittenQuestions,makeTableExercises,correctWritten,evaluateTable}
 from '../public/morfologia/written.mjs';
import {makePhraseQuestions,makePhraseTables}
 from '../public/morfologia/sintagmas.mjs';
import {makeGreekNounPhraseQuestions,makeGreekNounPhraseTables}
 from '../public/morfologia/greek-noun-phrases.mjs';

const root=resolve(import.meta.dirname,'..');
const bankPath=join(root,'dist/apps/morfologia/data/paradigmas.json');
const sample=()=>0.3141592653589793;
const langs={latin:'Latín I',latin4:'Latín 4.º',griego:'Griego I',latin2:'Latín II'};
const tableKinds=new Set(['sustantivo','adjetivo','desinencia','artículo','participio','pronombre']);
const categories=activity=>activity==='table'?tableKinds:null;
const modes=(language,unit)=>[
  'form','analysis','written','table',
  ...(language==='griego'&&unit>=5?['agreement']:[]),
  ...(language!=='latin2'&&unit>=(language==='latin4'?3:5)?['phrase-written','phrase-table']:[]),
  ...(language==='griego'&&unit>=5?['noun-phrase-written','noun-phrase-table']:[])
];
const isPhrase=activity=>activity.startsWith('phrase-')||activity.startsWith('noun-phrase-');
function generator(bank,language,unit,activity,kind){
 const args={language,unit,activity,kind,limit:10,rng:sample,reviewMode:'all'};
 if(activity==='noun-phrase-written')return makeGreekNounPhraseQuestions(bank,args);
 if(activity==='noun-phrase-table')return makeGreekNounPhraseTables(bank,args);
 if(activity==='phrase-written')return makePhraseQuestions(bank,args);
 if(activity==='phrase-table')return makePhraseTables(bank,args);
 if(activity==='written')return makeWrittenQuestions(bank,args);
 if(activity==='table')return makeTableExercises(bank,args);
 return makeQuestions(bank,args);
}
function checkCorrect(q){
 if(['form','analysis','agreement'].includes(q.activity)){
  assert.ok(q.options?.length>=3,'Opciones de respuesta insuficientes: '+q.id);
  assert.ok(q.options.includes(q.correct),'No aparece respuesta exacta: '+q.id);
  assert.equal(evaluate(q,q.correct).correct,true,'Se rechaza la opción correcta: '+q.id);
  return 'choice';
 }
 if(q.activity==='written'){
  assert.ok(q.acceptedForms?.includes(q.correct),'Solución no admitida: '+q.id);
  assert.equal(correctWritten(q,q.correct).correct,true,
   'El corrector rechaza la forma de origen: '+q.id);
  return 'written';
 }
 if(q.activity==='table'){
  assert.ok(q.cells?.length>=4,'Tabla sin suficientes celdas: '+q.id);
  const answers=Object.fromEntries(q.cells.map(cell=>[cell.id,cell.acceptedForms[0]]));
  const result=evaluateTable(q,answers);
  assert.equal(result.complete,true,'Tabla correctamente completada rechazada: '+q.id);
  assert.equal(result.correct,result.total,'La tabla no cuenta todas las formas: '+q.id);
  return 'table';
 }
 throw Error('Actividad no documentada: '+q.activity);
}
export function auditMorphologyFunctionalMatrix(bank){
 validateBank(bank);
 const matrix=[],nonProducing=[],exceptions=[],perCourse={};
 for(const [language,course] of Object.entries(langs)){
  const covered=bank.coverage[language];
  assert.ok(Array.isArray(covered)&&covered.length>0,course+': sin UD');
  const rows=[];
  for(const unit of covered){
   const records=availableRecords(bank,{language,unit});
   assert.ok(records.length>0,course+'/UD'+unit+': sin paradigmas acumulados');
   for(const activity of modes(language,unit)){
    const availableKinds=isPhrase(activity)?['sintagma']:
      activity==='agreement'?['adjetivo']:
      ['todos',...new Set(records.filter(x=>!categories(activity)||categories(activity).has(x.kind))
        .map(r=>r.kind))];
    assert.ok(availableKinds.length>0,course+'/UD'+unit+'/'+activity+': selector vacío');
    for(const kind of availableKinds){
     const selection={language,course,unit,activity,kind,
       recordsAvailable:records.filter(r=>kind==='todos'||kind==='sintagma'||r.kind===kind).length};
     try{
      const questions=generator(bank,language,unit,activity,kind);
      selection.questions=questions.length;
      selection.status=questions.length?'generated':'empty';
      if(questions.length){
       const verified=checkCorrect(questions[0]);
       selection.corrector=verified;
       assert.ok(questions.every(q=>q.language===language),
        course+'/UD'+unit+'/'+activity+'/'+kind+': otro idioma');
       assert.ok(questions.every(q=>q.kind===kind||kind==='todos'),
        course+'/UD'+unit+'/'+activity+'/'+kind+': categoría inesperada');
       assert.ok(questions.every(q=>q.evidence),
        course+'/UD'+unit+'/'+activity+'/'+kind+': pregunta sin procedencia');
      }else{
       nonProducing.push({...selection,problem:'filtro_visible_sin_ejercicios'});
      }
     }catch(error){
      selection.status='error';
      selection.error=error.message;
      exceptions.push({...selection,problem:'error_mecanismo'});
     }
     rows.push(selection);matrix.push(selection);
    }
   }
  }
  perCourse[language]={label:course,units:covered.length,minimum:covered[0],
    maximum:covered.at(-1),records:bank.records.filter(r=>r.language===language).length,
    combinations:rows.length,generated:rows.filter(x=>x.status==='generated').length,
    empty:rows.filter(x=>x.status==='empty').length,errors:rows.filter(x=>x.status==='error').length};
 }
 const report={
  schema:'schola-morphology-spanish-functional-matrix/v1',
  source:'dist/apps/morfologia/data/paradigmas.json (source Appendix + expansion verified)',
  language:'es',modes:'exactamente las opciones visibles por curso y UD',
  totals:{combinations:matrix.length,generated:matrix.filter(x=>x.status==='generated').length,
   empty:nonProducing.length,exceptions:exceptions.length,
   correctedSamples:matrix.filter(x=>x.corrector).length},
  perCourse,nonProducing,exceptions,matrix
 };
 return report;
}
export async function saveMorphologyFunctionalAudit(){
 const bank=JSON.parse(await readFile(bankPath,'utf8'));
 const report=auditMorphologyFunctionalMatrix(bank);
 const file=join(root,'build/academic-audits/castellano/morfologia-matriz-funcional.json');
 await mkdir(resolve(file,'..'),{recursive:true});
 await writeFile(file,JSON.stringify(report,null,2)+'\n');
 console.log('Morfología castellana: '+JSON.stringify({totals:report.totals,
  courses:report.perCourse,emptySamples:report.nonProducing.slice(0,16),
  errors:report.exceptions.slice(0,10)}));
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const report=await saveMorphologyFunctionalAudit();
 if(report.totals.exceptions)process.exitCode=1;
 // Las combinaciones vacías son hallazgos de producto (no fallos del motor).
 // Se documentan antes de decidir qué bloqueos de UI se deben corregir.
}
