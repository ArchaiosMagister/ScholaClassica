import assert from 'node:assert/strict';

// ScholaClassica adapta el artefacto de Repaso; la fuente histórica de Vocabula
// permanece inmutable y conserva el índice de las 84 preguntas originales.
const MARKER='window.GRAMMAR_CONTENT=';
const ALLOWED=Object.freeze({lat1:10,lat4:8,gr1:14});
const FIELDS=['s','u','t','c','p','a','w','x'];
const EXTRA_TOPICS=[
 {subject:'lat1',unit:'UD 4',topic:'Aposición y dativo de aproximación'},
 {subject:'lat1',unit:'UD 7',topic:'Dativo posesivo'}
];

export function extendGrammarReview(source,approval){
 assert.equal(typeof source,'string');
 const parts=source.split(MARKER);
 assert.equal(parts.length,2,'Banco histórico de gramática: formato inesperado');
 assert.match(parts[1],/;\s*$/,'Banco histórico: falta cierre');
 const base=JSON.parse(parts[1].replace(/;\s*$/,''));
 assert.equal(base.questions.length,84,'Hay cambios en la numeración original; suspender publicación');
 assert.deepEqual(Object.keys(base.syllabi).sort(),['gr1','lat1','lat4']);
 assert.equal(approval?.schema,'schola-sintaxis-aprobada/v1');
 assert.equal(approval.originalQuestionCount,84);
 assert.equal(approval.approvedQuestionCount,36);
 assert.deepEqual(approval.extraTopics,EXTRA_TOPICS,
  'Revisar los nuevos temas: solo están aprobados los dos de Latín I');
 assert.equal(approval.questions?.length,36);
 const original=JSON.stringify(base.questions);
 for(const {subject,unit,topic} of EXTRA_TOPICS){
  const syllabus=base.syllabi[subject].find(([name])=>name===unit);
  assert.ok(syllabus,'Falta la unidad aprobada '+unit+' de '+subject);
  assert.ok(!syllabus[1].includes(topic),'El tema ya existe; revisar duplicidad');
  syllabus[1].push(topic);
 }
 const seen=new Set(),existing=new Set(base.questions.map(q=>q.s+'\0'+q.u+'\0'+q.p));
 const tally={gr1:0,lat1:0,lat4:0};
 for(const input of approval.questions){
  const {candidateId,...q}=input;
  assert.match(candidateId,/^SIN-(LAT4|LAT1|GR1)-\d{2}-\d{3}$/);
  assert.ok(!seen.has(candidateId),'Identificador de candidatura duplicado '+candidateId);
  seen.add(candidateId);
  assert.deepEqual(Object.keys(q).sort(),[...FIELDS].sort(),'Campos inesperados en '+candidateId);
  assert.ok(Object.hasOwn(ALLOWED,q.s),'Curso sin aprobar '+candidateId);
  const unitNumber=Number(q.u?.match(/^UD (\d+)$/)?.[1]);
  assert.ok(Number.isInteger(unitNumber)&&unitNumber>=1&&unitNumber<=ALLOWED[q.s],
   'Unidad fuera del currículo '+candidateId);
  assert.equal(q.c,'Sintaxis');
  assert.ok(typeof q.p==='string'&&q.p.length>15&&typeof q.a==='string'&&q.a.length>1);
  assert.ok(typeof q.x==='string'&&q.x.length>20);
  assert.ok(Array.isArray(q.w)&&q.w.length===3);
  assert.equal(new Set([q.a,...q.w]).size,4,'Opciones duplicadas '+candidateId);
  const syllabus=base.syllabi[q.s].find(([name])=>name===q.u);
  assert.ok(syllabus?.[1].includes(q.t),'Tema fuera del temario '+candidateId);
  const questionKey=q.s+'\0'+q.u+'\0'+q.p;
  assert.ok(!existing.has(questionKey),'Pregunta duplicada '+candidateId);
  existing.add(questionKey);
  base.questions.push(q);
  tally[q.s]++;
 }
 assert.deepEqual(tally,{gr1:10,lat1:10,lat4:16},'Cantidad aprobada por curso distinta');
 assert.equal(base.questions.length,120);
 assert.equal(JSON.stringify(base.questions.slice(0,84)),original,
  'Las preguntas antiguas deben mantener contenido, orden e índices concept-i');
 assert.equal(base.questions.filter(q=>q.c==='Sintaxis').length,63);
 assert.equal(base.questions.filter(q=>q.u==='UD 0').length,6);
 return parts[0]+MARKER+JSON.stringify(base)+';\n';
}
