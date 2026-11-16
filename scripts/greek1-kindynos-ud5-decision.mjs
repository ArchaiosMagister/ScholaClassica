// Decisión docente de 16/11/2026: adscripción de una ficha General a UD5.
// Se aplica exclusivamente a la copia de Vocabula compilada en ScholaClassica.
// No se alteran Vocabula original, Examen, los 183 compañeros históricos ni IDs.
import assert from 'node:assert/strict';

export const GREEK1_KINDYNOS_GENERAL_ID='4e48a20fbf2c03fb';
export const GREEK1_KINDYNOS_EXAM_ID='37057f0eb0d649e7';

export const GREEK1_KINDYNOS_DECISION=Object.freeze({
  generalId:GREEK1_KINDYNOS_GENERAL_ID,
  examId:GREEK1_KINDYNOS_EXAM_ID,
  originalUnits:Object.freeze(['Sin unidad acreditada']),
  integratedUnits:Object.freeze(['UD 5']),
  remainingGreekGeneralUnassigned:183,
  citedGreekGrammarWithoutLexicalUnit:15,
  unassignedWithoutDirectEvidence:168
});

function key(form){
  return String(form).split(',')[0].normalize('NFD')
    .replace(/\p{M}/gu,'').replace(/ς/gu,'σ').toLowerCase();
}
export function applyGreek1KindynosUd5(entries){
  assert.ok(Array.isArray(entries)&&entries.length===2055,
    'Banco de Vocabula inesperado; revisar la decisión de κίνδυνος');
  const byId=new Map(entries.map(e=>[e.id,e]));
  assert.equal(byId.size,entries.length,'IDs de Vocabula duplicados');
  const general=byId.get(GREEK1_KINDYNOS_GENERAL_ID);
  const exam=byId.get(GREEK1_KINDYNOS_EXAM_ID);
  assert.ok(general&&exam,'Falta una ficha histórica de κίνδυνος');
  assert.deepEqual([general.subject,general.mode,general.form,general.meaning],
    ['gr1','general','κίνδυνος, –ου (ὁ)','‘peligro’']);
  assert.deepEqual([exam.subject,exam.mode,exam.form,exam.meaning],
    ['gr1','examen','κίνδυνος, –ου','‘peligro’']);
  assert.equal(key(general.form),key(exam.form),
    'El par General/Examen no corresponde al mismo lema');
  assert.deepEqual(general.answers,exam.answers,
    'Las traducciones del par son diferentes y exigen revisión docente');
  assert.deepEqual(general.units,['Sin unidad acreditada'],
    'La fuente General cambió y requiere otra revisión');
  assert.deepEqual(exam.units,['UD 5'],
    'La evidencia de Examen UD5 cambió');
  assert.equal(entries.filter(e=>e.subject==='gr1'&&
    e.mode==='general'&&e.units?.includes('Sin unidad acreditada')).length,184,
    'Cambió el inventario histórico de Griego I');
  // Nada de mutaciones in situ: retener los demás 2054 objetos sin modificación.
  return entries.map(e=>e.id!==GREEK1_KINDYNOS_GENERAL_ID?e:{
    ...e,units:['UD 5'],
    curricularProvenance:{
      originalUnits:['Sin unidad acreditada'],
      matchedExamId:GREEK1_KINDYNOS_EXAM_ID,
      matchedExamUnits:['UD 5'],
      decision:'Criterio docente 16/11/2026: General κίνδυνος en UD5',
      scope:'Solo copia integrada de ScholaClassica; Examen sin cambios'
    }
  });
}
