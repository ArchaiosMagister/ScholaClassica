// Deriva gramática de consulta de 4.º de ESO del Appendix original fijado.
// Los contenidos de ambos idiomas se generan sin ejercicios ni cambios a fuentes.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const MAP=[
  ['intro','cases','first'],
  ['second','present'],
  ['adj1','prepositions'],
  ['imperfect'],
  ['third'],
  ['perfect','passive'],
  ['adj3','pluperfect'],
  ['fourth','personal']
];
const META={
  intro:[1,0],cases:[1,3],first:[1,0],second:[1,0],present:[1,1],
  adj1:[2,0],prepositions:[2,1],imperfect:[2,2],third:[4,0],
  perfect:[4,1],passive:[3,2],adj3:[5,0],pluperfect:[4,1],
  fourth:[7,0],personal:[3,0]
};
const TITLES={
 es:{
  intro:'Lengua flexiva y conceptos fundamentales',cases:'Funciones de los casos',
  first:'Primera declinación',second:'Segunda declinación',
  present:'Conjugaciones y presente de indicativo',
  adj1:'Adjetivos de primera clase y concordancia',prepositions:'Preposiciones y casos',
  imperfect:'Imperfecto de indicativo activo',third:'Tercera declinación',
  perfect:'Perfecto de indicativo activo',passive:'Voz pasiva: presente e imperfecto',
  adj3:'Adjetivos de la tercera declinación',
  pluperfect:'Pluscuamperfecto de indicativo activo',
  fourth:'Cuarta y quinta declinación',personal:'Pronombres personales'
 },
 val:{
  intro:'Llengua flexiva i conceptes fonamentals',cases:'Funcions dels casos',
  first:'Primera declinació',second:'Segona declinació',
  present:"Conjugacions i present d'indicatiu",
  adj1:'Adjectius de primera classe i concordança',prepositions:'Preposicions i casos',
  imperfect:"Imperfet d'indicatiu actiu",third:'Tercera declinació',
  perfect:"Perfet d'indicatiu actiu",passive:'Veu passiva: present i imperfet',
  adj3:'Adjectius de la tercera declinació',
  pluperfect:"Plusquamperfet d'indicatiu actiu",
  fourth:'Quarta i quinta declinació',personal:'Pronoms personals'
 }
};
function afterHeading(html,heading){
  const s='<h3>'+heading+'</h3>',at=html.indexOf(s);
  assert.ok(at>=0,'Falta epígrafe '+heading);
  return at;
}
function declensions(t,locale){
 const i=afterHeading(t,locale==='es'?'Primera declinación':'Primera declinació');
 const j=afterHeading(t,locale==='es'?'Segunda declinación':'Segona declinació');
 assert.ok(j>i+300);
 const parts=[t.slice(0,i),t.slice(i,j),t.slice(j)];
 assert.ok(parts[0].includes('flexiv')&&parts[1].includes('rosa')&&
  parts[2].includes('dominus')&&parts[2].includes('ager'));
 return parts;
}
function thirdNouns(html){
 const start='<h2 id="tercera-declinacion">',i=html.indexOf(start);
 assert.ok(i>0);
 const tail=html.slice(i+start.length),next=tail.search(/<h2\b|<\/article>/u);
 assert.ok(next>500);
 const result=tail.slice(0,next);
 assert.ok(result.includes('<table')&&result.includes('civ'));
 return result;
}
function thirdAdjectives(html){
 const a=html.indexOf('<article>'),b=html.indexOf('<div class="related"',a);
 assert.ok(a>0&&b>a);
 const body=html.slice(a+9,b),firstTable=body.indexOf('<div class="table-wrap"');
 assert.ok(firstTable>100);
 const p=[...body.slice(0,firstTable).matchAll(/<p>[\s\S]*?<\/p>/gu)].map(x=>x[0]);
 const remainder=body.slice(firstTable);
 const tables=[...remainder.matchAll(/<div class="table-wrap"[\s\S]*?<\/div>/gu)]
  .map(x=>({html:x[0],start:x.index}));
 assert.ok(p.length>=6&&tables.length===5,'Cambió la tabla de adjetivos');
 for(const [i,form] of ['bonus','brevis','acer','audax','vetus'].entries())
  assert.ok(tables[i].html.includes(form),'Falta '+form);
 // Se excluyen la explicación y la tabla de bonus (4.º UD3).
 const between=remainder.slice(tables[0].start+tables[0].html.length,tables[1].start);
 return p.slice(2).join('\n')+between+tables.slice(1).map(x=>x.html).join('\n');
}
function activeTense(html,kind,locale){
 const id=kind==='perfect'?'perfecto':'pluscuamperfecto';
 const mark='<h2 id="'+id+'-de-indicativo">',pos=html.indexOf(mark);
 assert.ok(pos>0,'Falta tiempo verbal: '+kind);
 const tail=html.slice(pos+mark.length),end=tail.search(/<h2\b/u);
 assert.ok(end>2500);
 const section=tail.slice(0,end);
 const intro=section.split('<section class="time-paradigms">')[0];
 const paragraphs=[...intro.matchAll(/<p>[\s\S]*?<\/p>/gu)].map(x=>x[0]);
 assert.equal(paragraphs.length,2);
 const sentence=locale==='es'?'La voz pasiva se forma':'La veu passiva es forma';
 assert.ok(paragraphs[0].includes(sentence));
 paragraphs[0]=paragraphs[0].slice(0,paragraphs[0].indexOf(sentence))+'</p>';
 const active=section.match(/<h3>Paradigma · (?:voz|veu) activa<\/h3>\s*(<div class="table-wrap verb-table"[\s\S]*?<\/div>)/u);
 const sum=section.match(/<h3>(?:Verbo|Verb) <i lang="la">sum<\/i><\/h3>\s*(<div class="table-wrap verb-table"[\s\S]*?<\/div>)/u);
 assert.ok(active&&sum,'Faltan paradigmas activos: '+kind);
 assert.ok(active[1].includes('amo, amavi, amatum')&&sum[1].includes('fui'));
 assert.ok(!active[1].includes('gender-form')&&!sum[1].includes('gender-form'));
 const caption=locale==='es'?'Paradigma · voz activa':'Paradigma · veu activa';
 const verb=locale==='es'?'Verbo':'Verb';
 const note=kind==='perfect'?(locale==='es'?
  '<p><strong>Enunciado:</strong> <i lang="la">amo, amavi, amatum</i>. El tema de perfecto permite formar el perfecto y el pluscuamperfecto activos.</p>':
  '<p><strong>Enunciat:</strong> <i lang="la">amo, amavi, amatum</i>. El tema de perfet permet formar el perfet i el plusquamperfet actius.</p>'):'';
 return note+paragraphs.join('\n')+'<h3>'+caption+'</h3>'+active[1]+
  '<h3>'+verb+' <i lang="la">sum</i></h3>'+sum[1];
}
export function makeLatin4Curriculum({curriculum,indicative,nouns,adjectives,locale}){
 assert.ok(locale==='es'||locale==='val');
 const units=curriculum?.latin?.units;
 assert.ok(Array.isArray(units)&&units.length===10);
 assert.deepEqual(units.map(u=>u.number),[1,2,3,4,5,6,7,8,9,10]);
 const get=(u,i)=>{
  const t=units[u-1].topics[i];
  assert.ok(t?.html,'Falta tema de Latín I: '+u+'/'+i);
  return t.html;
 };
 const [intro,first,second]=declensions(get(1,0),locale);
 const src={
  intro,cases:get(1,3),first,second,present:get(1,1).replace(/<p>[\s\S]*?<\/p>/u,''),
  adj1:get(2,0),prepositions:get(2,1),imperfect:get(2,2),
  third:thirdNouns(nouns),perfect:activeTense(indicative,'perfect',locale),
  passive:get(3,2),adj3:thirdAdjectives(adjectives),
  pluperfect:activeTense(indicative,'pluperfect',locale),
  fourth:get(7,0),personal:get(3,0)
 };

 // Enmiendas editoriales solo en la copia de 4.º, con comprobación de origen.
 const once=(text,from,to)=>{
  assert.equal(text.split(from).length-1,1,'Cambió el texto importado: '+from);
  return text.replace(from,to);
 };
 const secondTitle=locale==='es'?'Segunda declinación · puer y ager':
  'Segona declinació · puer i ager';
 const secondCorrected=locale==='es'?
  'Segunda declinación · <i lang="la">puer</i> y <i lang="la">ager</i>':
  'Segona declinació · <i lang="la">puer</i> i <i lang="la">ager</i>';
 src.second=once(src.second,'<caption>'+secondTitle+'</caption>',
  '<caption>'+secondCorrected+'</caption>');
 for(const term of ['puer','ager'])for(const number of ['singular','plural']){
  src.second=once(src.second,'<th scope="col">'+term+' · '+number+'</th>',
   '<th scope="col"><i lang="la">'+term+'</i> · '+number+'</th>');
 }
 if(locale==='val'){
  src.third=once(src.third,'<th scope="col" rowspan="2">Caso</th>',
   '<th scope="col" rowspan="2">Cas</th>');
  src.third=once(src.third,'· M/F, consonante','· M/F, consonant');
  src.third=once(src.third,'· neutro, consonante','· neutre, consonant');
  src.third=once(src.third,'· neutro, en','· neutre, en');
 }else{
  src.adj3=once(src.adj3,'pauper, pauperis',
   '<i lang="la">pauper, pauperis</i>');
  src.adj3=once(src.adj3,'dives, divitis',
   '<i lang="la">dives, divitis</i>');
 }
 const derived=MAP.map((topicNames,i)=>({
  number:i+1,
  topics:topicNames.map(id=>{
   // Correcciones ortotipográficas valencianas únicamente en la copia derivada:
   // los archivos originales continúan intocados y cotejables por SHA.
   const html=locale==='val'?src[id]
    .replaceAll('una terminación','una terminació')
    .replaceAll('tema consonántico','tema consonàntic')
    .replaceAll('Neutro sing.','Neutre sing.')
    .replaceAll('Neutro pl.','Neutre pl.'):src[id];
   assert.ok(typeof html==='string'&&html.length>140,'Tema vacío: '+id);
   assert.ok(!/<(?:button|form|script|input)\b/iu.test(html),'Actividad no permitida: '+id);
   const [sourceUnit,sourceTopic]=META[id];
   return {title:TITLES[locale][id],group:id==='cases'?
    (locale==='es'?'Sintaxis':'Sintaxi'):(locale==='es'?'Morfología':'Morfologia'),
    html,sourceUnit,sourceTopic};
  })
 }));
 assert.deepEqual(derived.map(u=>u.topics.length),[3,2,2,1,1,2,2,2]);
 assert.equal(new Set(derived.flatMap(u=>u.topics.map(t=>t.title))).size,15);
 assert.ok(!derived[0].topics.some(t=>t.html.includes('Segunda declinación · dominus')));
 return {schema:1,latin:{name:locale==='es'?'Latín · 4.º de ESO':"Llatí · 4t d'ESO",units:derived}};
}
export async function adaptAppendixLatin4({destination,source,vocabulaSource}){
 const syllabus=await readFile(join(vocabulaSource,'gramatica-contenidos.js'),'utf8');
 const m=syllabus.match(/window\.GRAMMAR_CONTENT\s*=\s*(\{[\s\S]*\});?\s*$/u);
 assert.ok(m,'Sin temario docente de 4.º');
 const data=JSON.parse(m[1]);
 assert.deepEqual(data.syllabi.lat4,[
  ['UD 1',['Introducción al latín','Primera declinación']],
  ['UD 2',['Segunda declinación','Presente']],
  ['UD 3',['Adjetivos','Preposiciones']],['UD 4',['El imperfecto']],
  ['UD 5',['La tercera declinación']],['UD 6',['El perfecto','Voz pasiva']],
  ['UD 7',['Adjetivos de la 3ª declinación','Pluscuamperfecto']],
  ['UD 8',['Cuarta y quinta declinación','Pronombres personales']]
 ]);
 for(const [locale,folder] of [['es',''],['val','val']]){
  const base=join(source,folder),target=join(destination,folder);
  const get=async file=>readFile(join(base,file),'utf8');
  const result=makeLatin4Curriculum({
   curriculum:JSON.parse(await get(locale==='es'?'assets/curriculum.json':'curriculum.json')),
   indicative:await get('indicativo.html'),
   nouns:await get('sustantivos.html'),
   adjectives:await get('adjetivos.html'),locale
  });
  await writeFile(join(target,locale==='es'?'assets/curriculum-latin4.json':
   'curriculum-latin4.json'),JSON.stringify(result));
 }
 console.log('Appendix: Latín 4.º organizado en 8 unidades, castellano y valenciano.');
}
