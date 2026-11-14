// Enmiendas editoriales controladas para las COPIAS curriculares de ScholaClassica.
// Nunca se escriben cambios en las fuentes bloqueadas de Appendix grammaticæ.
// Cada sustitución exige una única coincidencia: si cambia la fuente, falla el build.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';

function once(text,before,after,reason){
 assert.equal(text.split(before).length,2,
  'No hay una coincidencia única de '+reason);
 return text.replace(before,after);
}
const lat=s=>'<i lang="la">'+s+'</i>';
export function fixLatin1Typography(bank,locale){
 assert.ok(locale==='es'||locale==='val','Idioma no reconocido');
 assert.equal(bank.latin.units.length,10);
 const corrected=structuredClone(bank),topic=(u,t)=>corrected.latin.units[u-1].topics[t];
 const local=locale==='es'?'es':'val';
 // A3: enunciado y encabezados de -er: solo las palabras latinas en cursiva.
 let a=topic(1,0);
 const nounCaption=local==='es'?'Segunda declinación · puer y ager':
  'Segona declinació · puer i ager';
 const nounCaptionTo=local==='es'?
  'Segunda declinación · '+lat('puer')+' y '+lat('ager'):
  'Segona declinació · '+lat('puer')+' i '+lat('ager');
 a.html=once(a.html,'<caption>'+nounCaption+'</caption>',
  '<caption>'+nounCaptionTo+'</caption>','UD1: leyenda puer/ager '+locale);
 for(const lemma of ['puer','ager'])for(const number of ['singular','plural'])
  a.html=once(a.html,
   '<th scope="col">'+lemma+' · '+number+'</th>',
   '<th scope="col">'+lat(lemma)+' · '+number+'</th>',
   'UD1: encabezado '+lemma+' '+number+' '+locale);
 // A4: mismo contenido de persona, número y traducción en ambas tablas.
 const pronouns=[
  ['ego','1.ª sing.','1a sing.','yo','jo'],
  ['tu','2.ª sing.','2a sing.','tú','tu'],
  ['nos','1.ª pl.','1a pl.','nosotros/as','nosaltres'],
  ['vos','2.ª pl.','2a pl.','vosotros/as','vosaltres']
 ];
 a=topic(3,0);
 for(const [lemma,esPerson,valPerson,esTranslation,valTranslation] of pronouns){
  const before=locale==='es'?
   '<th scope="col">'+esPerson+' · '+lemma+' ('+esTranslation+')</th>':
   '<th scope="col">'+lat(lemma)+'</th>';
  const after='<th scope="col">'+(locale==='es'?esPerson:valPerson)+' · '+
   lat(lemma)+' ('+(locale==='es'?esTranslation:valTranslation)+')</th>';
  a.html=once(a.html,before,after,'UD3: persona y pronombre '+lemma+' '+locale);
 }
 // A5: «Relatiu» y marcado latino de quod en el mismo encabezado.
 a=topic(6,0);
 const relativeOriginal='<caption>Relativo · '+lat('qui')+', '+lat('quæ')+
  ', quod</caption>';
 const relativeCorrect='<caption>'+(locale==='es'?'Relativo':'Relatiu')+' · '+
  lat('qui')+', '+lat('quæ')+', '+lat('quod')+'</caption>';
 a.html=once(a.html,relativeOriginal,relativeCorrect,
  'UD6: relativo y cursivas '+locale);
 // A6: en la leyenda del futuro, descriptor romance en redonda.
 a=topic(7,2);
 const future=locale==='es'?'futuro imperfecto':'futur imperfet';
 a.html=once(a.html,'<caption>sum, esse · '+future+'</caption>',
  '<caption>'+lat('sum, esse')+' · '+future+'</caption>',
  'UD7: leyenda del futuro de sum '+locale);
 return corrected;
}

// A7: el encabezado de ἀγαθός de Griego I, no las formas del motor.
export function makeGreek1TypographyCurriculum(curriculum,locale){
 assert.ok(locale==='es'||locale==='val');
 assert.equal(curriculum.griego.units.length,14);
 assert.equal(curriculum.latin.units.length,10);
 const result=structuredClone(curriculum),topic=result.griego.units[4].topics[0];
 assert.equal(topic.title,locale==='es'?'Adjetivos 2–1–2 y 2–2':
  'Adjectius 2–1–2 i 2–2');
 topic.html=once(topic.html,'ἀγαθός, αγαθή, ἀγαθόν',
  'ἀγαθός, ἀγαθή, ἀγαθόν',
  'UD5: espíritu suave del femenino de ἀγαθός '+locale);
 assert.deepEqual(result.latin,curriculum.latin);
 return result;
}

export async function adaptAppendixGreek1({destination,source}){
 for(const [locale,folder,input,output] of [
  ['es','','assets/curriculum.json','assets/curriculum-griego1.json'],
  ['val','val','curriculum.json','curriculum-griego1.json']
 ]){
  const sourceBank=JSON.parse(await readFile(join(source,folder,input),'utf8'));
  const result=makeGreek1TypographyCurriculum(sourceBank,locale);
  await writeFile(join(destination,folder,output),JSON.stringify(result));
 }
 console.log('Appendix: Griego I ES/VAL, espíritu de ἀγαθή corregido en la copia.');
}
