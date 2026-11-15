// Auditoría semántica ES/VAL ampliada; pasajes de riesgo no incluidos
// en el primer bloque de siete parejas. Comprueba evidencias concretas,
// traducción valenciana equivalente y secuenciación curricular.
import assert from 'node:assert/strict';
const PIECES=Object.freeze([
 {course:'latin1',unit:7,topic:0,name:'Cuarta/quinta declinación',forms:[
  'exercitus','exercitūs','exercituum','cornū','cornua','cornuum',
  'res','rei','rerum','rebus','dies','eodem die','ad certam diem'],
  es:['en masculino suele significar',"'fecha'",'orientativa'],
  val:['en masculí sol significar',"'data'",'orientativa'],tables:2},
 {course:'latin4',unit:8,topic:0,name:'Cuarta/quinta declinación',forms:[
  'exercitus','exercitūs','exercituum','cornū','cornua','cornuum',
  'res','rei','rerum','rebus','dies','eodem die','ad certam diem'],
  es:['en masculino suele significar',"'fecha'",'orientativa'],
  val:['en masculí sol significar',"'data'",'orientativa'],tables:2},
 {course:'latin1',unit:7,topic:1,name:'Deponentes',forms:[
  'hortor','hortaris','hortari','vereor','vereris','vereri',
  'sequor','sequeris','sequi','patior','pateris','pati',
  'orior','oriris','oriri'],
  es:['paradigma morfológico pasivo','traducción activos',
   'sin introducir todavía los participios'],
  val:['paradigma morfològic passiu','traducció actius',
   'sense introduir encara els participis'],tables:0},
 {course:'latin1',unit:7,topic:2,name:'Futuro imperfecto',forms:[
  'amabo','habebo','ducam','audiam','capiam',
  'amabor','habebor','ducar','audiar','capiar','ero'],
  es:['La 1.ª y 2.ª conjugaciones','La 3.ª, 4.ª y mixta',
   'No debe confundirse este futuro con el presente de subjuntivo'],
  val:['La 1a i 2a conjugacions','La 3a, 4a i mixta',
   "No s'ha de confondre este futur amb el present de subjuntiu"],tables:3},
 {course:'latin1',unit:2,topic:2,name:'Imperfecto activo',forms:[
  'amabam','habebam','ducebam','audiebam','capiebam','eram'],
  es:['morfema -ba-','vocal de enlace','habitual o en desarrollo'],
  val:['morfema -ba-',"vocal d'enllaç",'habitual o en desenvolupament'],tables:1},
 {course:'latin4',unit:4,topic:0,name:'Imperfecto activo',forms:[
  'amabam','habebam','ducebam','audiebam','capiebam','eram'],
  es:['morfema -ba-','vocal de enlace','habitual o en desarrollo'],
  val:['morfema -ba-',"vocal d'enllaç",'habitual o en desenvolupament'],tables:1},
 {course:'latin1',unit:3,topic:0,name:'Pronombres personales',forms:[
  'ego','tu','nos','vos','me','mihi','nobis'],
  es:['personas del discurso','formas oblicuas'],
  val:['persones del discurs','formes obliqües'],tables:1},
 {course:'latin4',unit:8,topic:1,name:'Pronombres personales',forms:[
  'ego','tu','nos','vos','me','mihi','nobis'],
  es:['personas del discurso','formas oblicuas'],
  val:['persones del discurs','formes obliqües'],tables:1},
 {course:'latin1',unit:5,topic:1,name:'Reflexivo y fórico',forms:[
  'is, ea, id','domus eius','se, sui, sibi, se',
  'Hostes se receperunt','Hostis se recepit','is','sibi'],
  es:['no tiene nominativo','mismas formas en singular y plural'],
  val:['no té nominatiu','mateixes formes en singular i plural'],tables:2}
]);
export const LATIN_EXTRA_SEMANTIC_CASES=PIECES;
export function auditLatinAdditionalBilingualSemantics(curricula){
 const results=[];
 for(const item of PIECES){
  const metrics={};
  for(const loc of ['es','val']){
   const html=curricula[item.course]?.[loc]?.latin?.units[item.unit-1]?.topics[item.topic]?.html;
   assert.ok(typeof html==='string','Falta tema de '+item.name+' '+item.course+' '+loc);
   const sourceCount=(html.match(/<table\b/gu)||[]).length;
   assert.equal(sourceCount,item.tables,'Número de tablas inesperado '+item.name+' '+loc);
   for(const form of item.forms)
    assert.ok(html.includes(form),'Falta forma latina en '+item.name+' '+loc+': '+form);
   const plain=html.replace(/<[^>]*>/gu,'').replace(/\s+/gu,' ');
   for(const phrase of item[loc])
    assert.ok(plain.includes(phrase),
      'Sentido docente divergente en '+item.name+' '+loc+': '+phrase);
   metrics[loc]={forms:item.forms.length,claims:item[loc].length,tables:sourceCount};
  }
  assert.deepEqual(metrics.es,metrics.val,
    'No existe correspondencia semántica verificable '+item.course+' '+item.name);
  results.push({course:item.course,unit:item.unit,topic:item.name,
   LatinFormsChecked:item.forms.length,contrastClaims:item.es.length,
   tableCount:item.tables,status:'equivalencia-selectiva-acreditada'});
 }
 assert.equal(results.length,9);
 return {schema:'schola-latin-bilingual-extra/v1',
  topicPairs:results.length,
  LatinFormsPerLanguage:results.reduce((n,r)=>n+r.LatinFormsChecked,0),
  teachingClaimsPerLanguage:results.reduce((n,r)=>n+r.contrastClaims,0),
  status:'contraste-acotado-de-contenidos',results,
  limits:'No equivale a corrección lingüística integral ni autoriza nuevas formas.'};
}
