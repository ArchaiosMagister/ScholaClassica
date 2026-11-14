// Conciliación individual del bloque «Examen UD 8–9» de Latín 4.º.
// Se contrastan IDs del banco «General UD8» fijado con cada entrada de
// «Examen UD 8–9»: misma forma lematizada y misma glosa docente.
// Solo cambia la unidad operativa en la COPIA de ScholaClassica; los
// originales, IDs y respuestas permanecen sin modificar.
import assert from 'node:assert/strict';

export const LATIN4_UD8_EXAM_REVIEW=Object.freeze([
 {examId:'8655195958db1804',generalId:'ed2a05a5d7fae7d9',lemma:'adventus',category:'cuarta declinación'},
 {examId:'c6c19ae8fc537db0',generalId:'4717c340e2c45e77',lemma:'audax',category:'adjetivo de tercera declinación'},
 {examId:'59390ec41e4dfb80',generalId:'ded2e5a70c73dbfd',lemma:'dies',category:'quinta declinación'},
 {examId:'5c3849eebef807e6',generalId:'7bc85211cf6eed68',lemma:'dives',category:'adjetivo de tercera declinación'},
 {examId:'0155fe3c0cb8364b',generalId:'148a074bd34f2e9e',lemma:'epistula',category:'primera declinación'},
 {examId:'35b933a0793b8d02',generalId:'7b6bb3e148515c62',lemma:'equitatus',category:'cuarta declinación'},
 {examId:'675fee0ae62dc865',generalId:'c3ca3fd4447c1abb',lemma:'exercitus',category:'cuarta declinación'},
 {examId:'11cda6b2d4d10f23',generalId:'bc5c8f66c70a4b3c',lemma:'impetus',category:'cuarta declinación'},
 {examId:'2b40e83cb37588b1',generalId:'e5112a9d263ba1d0',lemma:'iubeo',category:'verbo de segunda conjugación'},
 {examId:'d1d5e6225c13d9a6',generalId:'0e77c4a3bd3fb4f6',lemma:'iussus',category:'cuarta declinación'},
 {examId:'6b78a4a6c976f63f',generalId:'a3afbc666cc31557',lemma:'latus',category:'tercera declinación'},
 {examId:'8bf771c3b4956b1f',generalId:'fe33758e10892549',lemma:'mercator',category:'tercera declinación'},
 {examId:'3d7015ab1679d446',generalId:'13d51bb64877ea5e',lemma:'nomen',category:'tercera declinación'},
 {examId:'0550b20869f9142d',generalId:'432b2f186c48047f',lemma:'prudens',category:'adjetivo de tercera declinación'},
 {examId:'af6a73c79d622525',generalId:'7851974ab7020695',lemma:'res',category:'quinta declinación'},
 {examId:'c36d9d6c0039c6b9',generalId:'f92433b6694801a5',lemma:'spes',category:'quinta declinación'},
 {examId:'30dbe8f7328e6f7f',generalId:'727e1c56d80b7b4d',lemma:'tempus',category:'tercera declinación'}
]);
const heading=form=>String(form).split(',')[0].normalize('NFD')
 .replace(/\p{M}/gu,'').replace(/æ/gi,'ae')
 .replace(/[^a-z]/gi,'').toLowerCase();
const allReviewed=LATIN4_UD8_EXAM_REVIEW.length;
assert.equal(allReviewed,17,'El bloque docente debe cotejarse íntegramente');
assert.equal(new Set(LATIN4_UD8_EXAM_REVIEW.map(x=>x.examId)).size,allReviewed);
assert.equal(new Set(LATIN4_UD8_EXAM_REVIEW.map(x=>x.generalId)).size,allReviewed);

/**
 * Ejecutar después de las dos correcciones ortográficas de la copia.
 * No infiere unidades por semejanza: requiere IDs docentes explícitos,
 * lema, acepción y adscripción exacta en el vocabulario General de UD8.
 */
export function reconcileLatin4ExamUd8(entries){
 assert.ok(Array.isArray(entries)&&entries.length>1000,'Banco de Vocabula vacío');
 const byId=new Map(entries.map(x=>[x.id,x]));
 assert.equal(byId.size,entries.length,'Fichas con ID repetido');
 const historical=entries.filter(e=>e.subject==='lat4'&&e.mode==='examen'&&
   e.units.length===1&&e.units[0]==='UD 8–9');
 assert.equal(historical.length,allReviewed,
   'Cambió el bloque UD 8–9: nueva auditoría curricular obligatoria');
 const specified=new Map(LATIN4_UD8_EXAM_REVIEW.map(x=>[x.examId,x]));
 assert.ok(historical.every(e=>specified.has(e.id)),
   'Existe una entrada UD 8–9 sin cotejo individual');
 const decisions=new Map();
 for(const row of LATIN4_UD8_EXAM_REVIEW){
   const exam=byId.get(row.examId),general=byId.get(row.generalId);
   assert.ok(exam&&general,'Falta pareja documental de '+row.lemma);
   assert.equal(exam.subject,'lat4');assert.equal(exam.mode,'examen');
   assert.deepEqual(exam.units,['UD 8–9']);
   assert.equal(general.subject,'lat4');assert.equal(general.mode,'general');
   assert.ok(general.units.includes('UD 8'),
     'No está acreditado en General UD8: '+row.lemma);
   assert.equal(heading(exam.form),row.lemma,'Enunciado ambiguo en examen');
   assert.equal(heading(general.form),row.lemma,'Enunciado ambiguo en general');
   assert.equal(exam.meaning,general.meaning,
     'Difieren las glosas: requiere revisión docente '+row.lemma);
   assert.ok(Array.isArray(exam.originals)&&exam.originals.length>0,
     'No se conserva la lectura original '+row.lemma);
   decisions.set(row.examId,{
     originalUnits:[...exam.units],
     generalEntryId:general.id,
     generalUnits:[...general.units],
     source:'Vocabula Latina Graecaque · General UD 8',
     decision:'UD 8 acreditada por lema y glosa docente',
     grammaticalCategory:row.category
   });
 }
 return entries.map(e=>decisions.has(e.id)?
   {...e,units:['UD 8'],curricularProvenance:decisions.get(e.id)}:e);
}
