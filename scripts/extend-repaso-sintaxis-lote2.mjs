import assert from 'node:assert/strict';

// Segundo lote, distinto del primero: conservar los 120 índices/IDs ya publicados.
// La propuesta histórica no entra en el compilador; solo las 24 aprobadas.
const MARKER='window.GRAMMAR_CONTENT=';
const FIELDS=['s','u','t','c','p','a','w','x'];
const UNITS=Object.freeze({lat1:10,lat4:8,gr1:10});
const EXPECTED={lat1:12,gr1:8,lat4:4};
const ALTERNATE='Dativo complemento adjetival (también dativo de aproximación)';
const DATIVES=['SIN2-LAT1-04-003','SIN2-LAT1-04-004'];

export function extendGrammarReviewBatchTwo(source,approval){
 assert.equal(typeof source,'string');
 const parts=source.split(MARKER);
 assert.equal(parts.length,2,'Formato de gramática inesperado');
 assert.match(parts[1],/;\s*$/,'Falta cierre de gramática');
 const base=JSON.parse(parts[1].replace(/;\s*$/,''));
 assert.equal(base.questions.length,120,'Índices 0–119 no protegidos; abortar');
 assert.equal(base.questions.filter(q=>q.c==='Sintaxis').length,63);
 assert.equal(base.questions.filter(q=>q.u==='UD 0').length,6);
 assert.equal(approval?.schema,'schola-sintaxis-lote2-aprobada/v1');
 assert.equal(approval.originalQuestionCount,120);
 assert.equal(approval.approvedQuestionCount,24);
 assert.equal(approval.questions?.length,24);
 assert.equal(approval.nomenclature?.primary,'Dativo complemento adjetival');
 assert.equal(approval.nomenclature?.alsoAccepted,'Dativo de aproximación');
 assert.deepEqual(approval.nomenclature?.appliesTo,DATIVES);
 assert.deepEqual(Object.keys(base.syllabi).sort(),['gr1','lat1','lat4']);
 const first120=JSON.stringify(base.questions);
 const previousSyllabi=JSON.stringify(base.syllabi);
 const existing=new Set(base.questions.map(q=>q.s+'\0'+q.u+'\0'+q.p));
 const candidateIds=new Set();
 const count={lat1:0,gr1:0,lat4:0};
 for(const input of approval.questions){
  const {candidateId,...q}=input;
  assert.match(candidateId,/^SIN2-(LAT1|GR1|LAT4)-\d{2}-\d{3}$/);
  assert.ok(!candidateIds.has(candidateId),'ID repetido '+candidateId);
  candidateIds.add(candidateId);
  assert.deepEqual(Object.keys(q).sort(),[...FIELDS].sort(),'Campos nuevos inesperados '+candidateId);
  assert.ok(Object.hasOwn(UNITS,q.s),'Curso no permitido '+candidateId);
  const nr=Number(q.u?.match(/^UD (\d+)$/)?.[1]);
  assert.ok(Number.isInteger(nr)&&nr>=1&&nr<=UNITS[q.s],
   'Unidad fuera del currículo '+candidateId);
  assert.equal(q.c,'Sintaxis');
  assert.ok(typeof q.p==='string'&&q.p.length>25,'Pregunta vacía '+candidateId);
  assert.ok(typeof q.a==='string'&&q.a.length>3,'Respuesta vacía '+candidateId);
  assert.ok(typeof q.x==='string'&&q.x.length>35,'Explicación vacía '+candidateId);
  assert.ok(Array.isArray(q.w)&&q.w.length===3,'Tres distractores '+candidateId);
  assert.equal(new Set([q.a,...q.w]).size,4,'Opciones duplicadas '+candidateId);
  const syllabus=base.syllabi[q.s].find(([name])=>name===q.u);
  assert.ok(syllabus?.[1].includes(q.t),'Epígrafe sin aprobar '+candidateId);
  const key=q.s+'\0'+q.u+'\0'+q.p;
  assert.ok(!existing.has(key),'Pregunta duplicada '+candidateId);
  existing.add(key);
  if(DATIVES.includes(candidateId)){
   assert.equal(q.a,ALTERNATE,'Respetar criterio docente de dativo adjetival '+candidateId);
   assert.match(q.x,/dativo complemento adjetival/i);
   assert.match(q.x,/dativo de aproximación/i);
  }
  count[q.s]++;
  base.questions.push(q);
 }
 assert.deepEqual(count,EXPECTED,'Distribución no autorizada');
 assert.equal(base.questions.length,144);
 assert.equal(base.questions.filter(q=>q.c==='Sintaxis').length,87);
 assert.equal(JSON.stringify(base.questions.slice(0,120)),first120,
  'Se ha alterado un ID previo o su contenido');
 assert.equal(JSON.stringify(base.syllabi),previousSyllabi,
  'La aprobación no modifica los temas ni la secuenciación');
 return parts[0]+MARKER+JSON.stringify(base)+';\n';
}
