// Cuatro enmiendas documentadas de enunciado en la copia integrada de Vocabula.
// No modifica ni el origen fijado, ni las unidades ni las respuestas.
import assert from 'node:assert/strict';

export const LATIN4_LEXICAL_CORRECTIONS=Object.freeze([
  {id:'c36d9d6c0039c6b9',old:'spēs, ei',form:'spēs, speī'},
  {id:'30dbe8f7328e6f7f',old:'tēmpŭs, - ŏris (n.)',
   form:'tēmpŭs, –ŏris (n.)'},
  // Lewis & Short: pollĭcĕor, pollicērī, pollĭcĭtus sum: 2.ª deponente.
  // Conserva el banco original, el bloque opcional UD10 y ambos IDs históricos.
  {id:'6c627fb664674b71',mode:'general',old:'pollĭcĕor, pollĭcĭtus sum (3ª)',
   form:'pollĭcĕor, pollĭcĭtus sum (2ª)',units:['UD 10']},
  {id:'ccb8e344f436ae4b',mode:'examen',old:'pollĭcĕor, pollĭcĭtus sum (3ª)',
   form:'pollĭcĕor, pollĭcĭtus sum (2ª)',units:['UD 10']}
]);
export function correctLatin4Vocabula(entries){
  assert.ok(Array.isArray(entries)&&entries.length>1000,'Banco de Vocabula vacío');
  const expected=new Map(LATIN4_LEXICAL_CORRECTIONS.map(x=>[x.id,x]));
  const found=new Set();
  const output=entries.map(entry=>{
    const correction=expected.get(entry.id);
    if(!correction)return entry;
    assert.ok(!found.has(entry.id),'Registro duplicado '+entry.id);
    assert.equal(entry.subject,'lat4');
    assert.equal(entry.mode,correction.mode||'examen');
    assert.deepEqual(entry.units,correction.units||['UD 8–9']);
    assert.equal(entry.form,correction.old,
      'Cambió el enunciado original: requiere nueva verificación');
    assert.ok(entry.originals?.some(x=>x.startsWith(correction.old+':')),
      'No se conserva la transcripción fuente '+entry.id);
    found.add(entry.id);
    return {...entry,form:correction.form};
  });
  assert.equal(found.size,expected.size,'Falta un registro lexical corregible');
  return output;
}
