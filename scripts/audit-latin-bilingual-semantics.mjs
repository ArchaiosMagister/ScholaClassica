// Control de equivalencia del CONTENIDO CURRICULAR cotejable entre ES/VAL.
// Verifica afirmaciones filológicas concretas, no pretende homologar toda
// la traducción de cada párrafo ni reescribe los currículos.
import assert from 'node:assert/strict';
const CHECKS=Object.freeze([
 {course:'latin1',unit:4,topic:0,name:'Tercera declinación: clasificación',
  forms:['ducum','civium','fluminum','marium','maria','mari',
   'civis, civis','canis, canis','canum','urbs, urbis','urbium','ars, artis','artium']},
 {course:'latin4',unit:5,topic:0,name:'Tercera declinación: clasificación',
  forms:['ducum','civium','fluminum','marium','maria','mari',
   'civis, civis','canis, canis','canum','urbs, urbis','urbium','ars, artis','artium']},
 {course:'latin1',unit:4,topic:1,name:'Perfecto y pluscuamperfecto activos',
  forms:['amavi','duxi','cepi','fui','amaveram','duxeram','fueram'],
  forbid:['amatus sum','amatus eram']},
 {course:'latin4',unit:6,topic:0,name:'Perfecto activo',
  forms:['amavi','duxi','cepi','fui'],forbid:['amatus sum','amatus eram']},
 {course:'latin4',unit:7,topic:1,name:'Pluscuamperfecto activo',
  forms:['amaveram','duxeram','fueram'],forbid:['amatus sum','amatus eram']},
 {course:'latin1',unit:3,topic:2,name:'Presente e imperfecto pasivos',
  forms:['amor','amaris','amatur','amabar','amabaris','amabatur']},
 {course:'latin4',unit:6,topic:1,name:'Presente e imperfecto pasivos',
  forms:['amor','amaris','amatur','amabar','amabaris','amabatur']}
]);
const ERRONEOUS_SYLLABLE_FORMULATIONS=[
 'Las palabras de tema en consonante son aquellas de distinto número de sílabas',
 'las palabras cuyo nominativo acaba en',
 'Les paraules de tema en consonant solen tindre un nombre diferent',
 'les paraules el nominatiu de les quals acaba en'
];
const PARITY_FORMULATIONS={
 es:['puede servir de pista, pero no determina por sí solo el tema',
  'La terminación del nominativo no permite establecer por sí sola el tema'],
 val:['pot servir de pista, però no determina per si sol el tema',
  'La terminació del nominatiu no permet establir per si sola el tema']
};
export function auditLatinBilingualSemantics(curricula){
 const checked=[];
 for(const check of CHECKS){
  const documents=curricula[check.course];
  assert.ok(documents,'Falta currículo '+check.course);
  const texts={};
  for(const locale of ['es','val']){
   const html=documents[locale]?.latin?.units[check.unit-1]?.topics[check.topic]?.html;
   assert.ok(html,'Falta tema '+check.name+' '+locale);
   for(const form of check.forms){
    assert.ok(html.includes(form),'Contenido curricular divergente o ausente: '+
      check.course+' UD'+check.unit+' '+locale+' '+form);
   }
   for(const forbidden of check.forbid||[]){
    assert.ok(!html.includes(forbidden),'Tiempo verbal no estudiado adelantado: '+
      check.course+' UD'+check.unit+' '+locale+' '+forbidden);
   }
   if(check.name.startsWith('Tercera')){
    assert.ok(PARITY_FORMULATIONS[locale].every(clue=>html.includes(clue)),
      'No está acreditada la misma cautela filológica en '+locale);
    assert.ok(!ERRONEOUS_SYLLABLE_FORMULATIONS.some(clue=>html.includes(clue)),
      'Regla silábica falsa reintroducida en '+locale);
   }
   texts[locale]={present:check.forms.length,forbidden:(check.forbid||[]).length};
  }
  assert.deepEqual(texts.es,texts.val,'Asimetría semántica '+check.name);
  checked.push({course:check.course,unit:check.unit,topic:check.name,
    objectiveSemanticAnchors:check.forms.length,
    safeguardedExclusions:(check.forbid||[]).length,
    structuralSemanticParity:true});
 }
 assert.equal(checked.length,7);
 return {schema:'schola-latin-semantic-pair-review/v1',
  checkedTopicPairs:7,
  objectiveAnchorsPerLanguage:checked.reduce((n,c)=>n+c.objectiveSemanticAnchors,0),
  status:'contraste-semantico-selectivo-apto',
  limitation:'No acredita equivalencia de todas las oraciones; solo siete temas de riesgo y las afirmaciones señaladas.',
  results:checked};
}
