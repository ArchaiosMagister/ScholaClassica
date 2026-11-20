// Auditoría no destructiva de cobertura de sintaxis: no cambia fichas ni currículos.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';

const ROOT=resolve(import.meta.dirname,'..');
const read=async p=>readFile(join(ROOT,p),'utf8');
const parse=code=>{
 const pieces=code.split('window.GRAMMAR_CONTENT=');
 assert.equal(pieces.length,2,'Fuente de repaso no reconocida');
 return JSON.parse(pieces[1].trim().replace(/;\s*$/,''));
};
export async function auditSyntaxReview(){
 const [legacy,active,approved,approvedTwo]=await Promise.all([
  read('vendor/vocabula/gramatica-contenidos.js'),
  read('dist/apps/repaso-gramatica/gramatica-contenidos.js'),
  read('data/repaso-sintaxis-aprobadas.json'),
  read('data/repaso-sintaxis-lote2-aprobadas.json')
 ]);
 const source=parse(legacy),compiled=parse(active),selection=JSON.parse(approved),second=JSON.parse(approvedTwo);
 assert.equal(source.questions.length,84);
 assert.equal(compiled.questions.length,144);
 assert.deepEqual(compiled.questions.slice(0,84),source.questions,'IDs del legado protegidos');
 assert.deepEqual(compiled.questions.slice(84,120),selection.questions.map(({candidateId,...q})=>q));
 assert.deepEqual(compiled.questions.slice(120),second.questions.map(({candidateId,...q})=>q));
 assert.equal(compiled.questions.filter(q=>q.c==='Sintaxis').length,87);
 const courses={};
 const subjects=[['lat4',8],['lat1',10],['gr1',14]];
 for(const [subject,maxUnit] of subjects){
  const units=[];
  for(let unitNumber=1;unitNumber<=maxUnit;unitNumber++){
   const name='UD '+unitNumber;
   const q=compiled.questions.filter(x=>x.s===subject&&x.u===name&&x.c==='Sintaxis');
   const themes=compiled.syllabi[subject].find(x=>x[0]===name)?.[1];
   assert.ok(themes,'Temario sin unidad: '+subject+' '+name);
   const byTopic={};
   for(const question of q)byTopic[question.t]=(byTopic[question.t]??0)+1;
   assert.ok(Object.keys(byTopic).every(x=>themes.includes(x)));
   const contextExamples=q.filter(x=>/^En\s+«/u.test(x.p));
   units.push({
    unit:name,total:q.length,
    contextualExamples:contextExamples.length,
    otherPrompts:q.length-contextExamples.length,
    topics:themes,
    topicsWithSyntax:byTopic,
    requiresCurricularReview:q.length<=1&&!(subject==='gr1'&&unitNumber>=11)
   });
  }
  courses[subject]={
   syntaxQuestions:units.reduce((n,u)=>n+u.total,0),
   contextualExamples:units.reduce((n,u)=>n+u.contextualExamples,0),
   lowCoverageUnits:units.filter(u=>u.requiresCurricularReview).map(u=>u.unit),
   units
  };
 }
 assert.deepEqual(Object.fromEntries(Object.entries(courses).map(([s,c])=>[s,c.syntaxQuestions])),
  {lat4:22,lat1:32,gr1:33});
 const report={
  schema:'schola-syntax-curricular-coverage/v1',
  source:'ScholaClassica dist/apps/repaso-gramatica, con origen Vocabula vendorizado inmóvil',
  totals:{historicalQuestions:84,firstApprovedAdditions:36,secondApprovedAdditions:24,allQuestions:144,syntaxQuestions:87},
  method:'«En «…»» se usa solo como indicador aproximado de pregunta contextualizada, no como revisión filológica individual.',
  reviewPolicy:'La ampliación docente aprobada se audita por unidad y se preservan los 120 índices anteriores; no se reclasifican temas.',
  courses,
  priorities:[
   'Latín I: el segundo lote refuerza UD1, UD4, UD7 y UD9; medir variedad semántica y evitar duplicados.',
   'Griego I: UD3 incorpora dos prácticas acumulativas; evaluar la diversidad sin introducir nueva sintaxis.',
   'Latín 4.º: todas las UD1–8 tienen como mínimo dos preguntas; priorizar variedad de estructuras en futuras revisiones.',
   'Griego I: UD11–14 carecen de epígrafes nuevos de sintaxis, por lo que no deben marcarse como error ni completarse con temas inventados.',
   'Evaluar la diversidad de contextos, distractores y funciones, no solo el número bruto de preguntas.'
  ]
 };
 await mkdir(join(ROOT,'build/academic-audits/sintaxis'),{recursive:true});
 await writeFile(join(ROOT,'build/academic-audits/sintaxis/cobertura-repaso-v1.json'),
  JSON.stringify(report,null,2)+'\n');
 console.log('Auditoría sintáctica: 87 preguntas,',Object.keys(courses).map(s=>s+' '+courses[s].syntaxQuestions).join(', '),
  '; informe build/academic-audits/sintaxis/cobertura-repaso-v1.json');
 return report;
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname))
 await auditSyntaxReview();
