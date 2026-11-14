// Derivación de la gramática de consulta de Latín I de ScholaClassica.
// Solo se escriben currículos ADICIONALES en dist. Appendix original y los
// currículos de Griego I, Latín II y Latín 4.º permanecen sin modificar.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';

const UNIT_TOPICS=Object.freeze({
 es:[
  {unit:3,topic:1,title:'Adjetivos sustantivados',source:'adjetivos.html'},
  {unit:4,topic:0,title:'Tercera declinación',source:'sustantivos.html'},
  {unit:4,topic:1,title:'Perfecto y pluscuamperfecto activos',source:'indicativo.html'},
  {unit:5,topic:0,title:'Adjetivos de la tercera declinación',source:'adjetivos.html'}
 ],
 val:[
  {unit:3,topic:1,title:'Adjectius substantivats'},
  {unit:4,topic:0,title:'Tercera declinació'},
  {unit:4,topic:1,title:'Perfet i plusquamperfet actius'},
  {unit:5,topic:0,title:'Adjectius de la tercera declinació'}
 ]
});

function oncePart(html,from,to,label){
 assert.equal(html.split(from).length,2,'Falta o se repite inicio de '+label);
 const after=html.split(from)[1];
 assert.equal(after.split(to).length,2,'Falta o se repite final de '+label);
 return from+after.slice(0,after.indexOf(to));
}
function chapterThird(nouns){
 return oncePart(nouns,'<h2 id="tercera-declinacion">',
  '<h2 id="cuarta-declinacion">','tercera declinación');
}
function chapterSubstantivized(adjectives){
 const s=oncePart(adjectives,'<h2 id="adjetivos-sustantivados">',
  '</section></article>','sustantivación');
 assert.equal((s.match(/<table\b/gu)||[]).length,0);
 return s;
}
function chapterThirdAdjectives(adjectives){
 const from='<article><p>';
 assert.equal(adjectives.split(from).length,2,'Inicio de capítulo adjetivos');
 const article=oncePart(adjectives,from,
  '<div class="related">','tercera clase de adjetivos').slice('<article>'.length);
 assert.equal((article.match(/<table\b/gu)||[]).length,5,
  'Los cinco modelos adjetivales se conservan en paralelo con valenciano');
 assert.ok(article.includes('brevis')&&article.includes('vetus'));
 return article;
}
export function latin1ActivePerfects(indicative,locale){
 assert.ok(locale==='es'||locale==='val');
 let part=oncePart(indicative,'<h2 id="perfecto-de-indicativo">',
  '<h2 id="futuro-perfecto">','perfecto y pluscuamperfecto '+locale);
 assert.equal((part.match(/<section class="time-paradigms">/gu)||[]).length,2);
 assert.equal((part.match(/<\/section>/gu)||[]).length,2);
 // Se retiran EXCLUSIVAMENTE las dos frases explicativas de la pasiva
 // compuesta (UD9), preservando las explicaciones y traducciones activas.
 const anchor=locale==='es'?' La voz pasiva se forma':' La veu passiva es forma';
 let removedNotes=0;
 part=part.replace(/<p>([\s\S]*?)<\/p>/gu,(full,body)=>{
  const cut=body.indexOf(anchor);
  if(cut<0)return full;
  removedNotes++;
  assert.ok(body.slice(cut).includes('amatus'),
    'No se ha localizado la explicación de la pasiva compuesta');
  return '<p>'+body.slice(0,cut)+'</p>';
 });
 assert.equal(removedNotes,2,'Deben retirarse las dos referencias a pasiva');
 // En cada paradigma la tabla pasiva se encuentra entre su subtítulo
 // y el de sum. Se mantienen los dos paradigmas activos y los de sum.
 const passiveHeading='<h3>Paradigma · '+(locale==='es'?'voz pasiva':'veu passiva')+'</h3>';
 const sumHeading='<h3>'+(locale==='es'?'Verbo':'Verb')+' <i lang="la">sum</i></h3>';
 let passiveTables=0;
 while(part.includes(passiveHeading)){
  const start=part.indexOf(passiveHeading);
  const end=part.indexOf(sumHeading,start+passiveHeading.length);
  assert.ok(end>start,'Pasiva no delimitada por el paradigma de sum');
  part=part.slice(0,start)+part.slice(end);
  passiveTables++;
 }
 assert.equal(passiveTables,2,'Deben retirarse las dos tablas pasivas');
 assert.equal((part.match(/<table\b/gu)||[]).length,4,
  'Permanecen dos paradigmas activos y dos de sum');
 assert.equal((part.match(/<section class="time-paradigms">/gu)||[]).length,
  (part.match(/<\/section>/gu)||[]).length,'Secciones HTML equilibradas');
 assert.ok(!/amatus sum|amatus eram|voz pasiva|veu passiva/iu.test(part),
  'La pasiva de perfectum no debe adelantarse a la UD4');
 assert.ok(part.includes('amavi')&&part.includes('amaveram')&&
  part.includes('fui')&&part.includes('fueram'),
  'No pueden perderse las formas activas ni los paradigmas de sum');
 return part;
}

/** Reproduce los temas sin cambios de orden, excepciones fuera de Latín I
 * ni llamadas online a capítulos al abrir una unidad curricular.
 */
export function makeLatin1Curriculum({curriculum,nouns,adjectives,indicative,locale}){
 assert.ok(locale==='es'||locale==='val');
 assert.equal(curriculum.latin.units.length,10);
 assert.equal(curriculum.griego.units.length,14);
 const output=structuredClone(curriculum);
 for(const entry of UNIT_TOPICS[locale]){
  const topic=output.latin.units[entry.unit-1].topics[entry.topic];
  assert.equal(topic.title,entry.title,'Cambió la distribución de Latín I');
  if(locale==='es'){
   assert.equal(topic.source?.page,entry.source,'Cambió el enlace fuente');
   assert.match(topic.html,/Contenido actualizado en/);
  }else assert.equal('source' in topic,false,'Fuente valenciana inesperada');
 }
 const byId=(unit,topic)=>output.latin.units[unit-1].topics[topic];
 if(locale==='es'){
  byId(3,1).html=chapterSubstantivized(adjectives);
  byId(4,0).html=chapterThird(nouns);
  byId(5,0).html=chapterThirdAdjectives(adjectives);
  for(const {unit,topic} of UNIT_TOPICS.es)delete byId(unit,topic).source;
 }else{
  // Las tres lecciones valencianas ya están desarrolladas: conservarlas.
  assert.ok(adjectives.includes(byId(3,1).html));
  assert.ok(adjectives.includes(byId(5,0).html));
  assert.ok(nouns.includes(byId(4,0).html.slice(0,100)),
    'Cambió la procedencia del paradigma valenciano');
 }
 const active=latin1ActivePerfects(indicative,locale);
 if(locale==='val')assert.equal(byId(4,1).html,
  oncePart(indicative,'<h2 id="perfecto-de-indicativo">',
   '<h2 id="futuro-perfecto">','UD4 valenciana original'));
 byId(4,1).html=active;
 const expectTables=[[3,1,0],[4,0,1],[4,1,4],[5,0,5]];
 for(const [unit,topic,count] of expectTables){
  const html=byId(unit,topic).html;
  assert.equal((html.match(/<table\b/gu)||[]).length,count,
   'Número de tablas tras adaptación de '+locale+' UD'+unit);
  assert.ok(!html.includes('Contenido actualizado en'),
   'Enlaces de sustitución antiguos en la UD'+unit);
  assert.equal('source' in byId(unit,topic),false,
   'No descargar capítulos para esta unidad');
 }
 assert.deepEqual(output.griego,curriculum.griego,'Griego I intacto');
 return output;
}
export async function adaptAppendixLatin1({destination,source}){
 for(const [locale,folder,sourceCurriculum,targetCurriculum] of [
  ['es','','assets/curriculum.json','assets/curriculum-latin1.json'],
  ['val','val','curriculum.json','curriculum-latin1.json']
 ]){
  const from=join(source,folder),to=join(destination,folder);
  const original=JSON.parse(await readFile(join(from,sourceCurriculum),'utf8'));
  const [nouns,adjectives,indicative]=await Promise.all(
   ['sustantivos.html','adjetivos.html','indicativo.html']
    .map(name=>readFile(join(from,name),'utf8')));
  const adapted=makeLatin1Curriculum({curriculum:original,nouns,adjectives,
   indicative,locale});
  await writeFile(join(to,targetCurriculum),JSON.stringify(adapted));
 }
 console.log('Appendix: Latín I por unidades, 4 temas completos ES/VAL y voz activa UD4.');
}
