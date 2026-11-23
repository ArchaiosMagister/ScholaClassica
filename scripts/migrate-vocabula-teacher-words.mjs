import assert from 'node:assert/strict';

// Dos aportaciones activas verificadas en Supabase el 23/11/2026.
// La fuente original de Vocabula (2055 fichas) NO se modifica.
// Conservar exactamente el ID que usaba el cliente en progreso local
// (custom-{uuid}-general), asignatura, modalidad y clasificación.
export const APPROVED_TEACHER_WORDS=Object.freeze([
 Object.freeze({
  id:'custom-40ff5289-0eb9-437f-a4a3-02720151a43a-general',
  subject:'lat1',mode:'general',form:'Ephesius, –a, –um',
  meaning:'de Éfeso, efesio',answers:['de Éfeso','efesio'],
  units:['UD 10'],originals:['Ephesius, –a, –um: de Éfeso, efesio']
 }),
 Object.freeze({
  id:'custom-6af9e423-2641-4633-ad7c-cdf7cc2aa6a8-general',
  subject:'lat2',mode:'general',form:'Ephesius, –a, –um',
  meaning:'de Éfeso, efesio',answers:['de Éfeso','efesio'],
  units:['Adjetivos'],originals:['Ephesius, –a, –um: de Éfeso, efesio']
 })
]);
const normalize=s=>String(s).normalize('NFC').toLocaleLowerCase('es').trim();
const key=w=>[w.subject,w.mode,normalize(w.form)].join('|');

export function integrateReviewedTeacherWords(original){
 assert.ok(Array.isArray(original)&&original.length===2055,
  'El banco de origen no coincide con las 2055 fichas auditadas');
 const ids=new Set(original.map(w=>w.id));
 assert.equal(ids.size,original.length,'IDs originales duplicados');
 const forms=new Set(original.map(key));
 for(const entry of APPROVED_TEACHER_WORDS){
  assert.ok(!ids.has(entry.id),'La ficha docente ya existe con ese ID');
  assert.ok(!forms.has(key(entry)),
   'Existe una ficha académica para '+entry.subject+'/'+entry.form+'; cotejar antes de incorporar');
  assert.equal(entry.mode,'general','No añadir por error al corpus Examen');
  assert.ok(entry.units.length===1&&entry.answers.length===2,'Aportación incompleta');
  ids.add(entry.id);forms.add(key(entry));
 }
 // No fusionar materias, no redefinir IDs históricos y no tocar Examen.
 return [...original,...APPROVED_TEACHER_WORDS.map(w=>({
  ...w,answers:[...w.answers],units:[...w.units],originals:[...w.originals]
 }))];
}
