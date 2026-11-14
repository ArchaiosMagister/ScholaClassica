// Paradigmas irregulares de las formas verbales preguntadas por PAU.
import assert from 'node:assert/strict';
import {latinFold} from './morphology-pau-latin2.mjs';
const PERSONS=[['1.ª','singular'],['2.ª','singular'],['3.ª','singular'],
  ['1.ª','plural'],['2.ª','plural'],['3.ª','plural']];
function join(person,number,tense,mode,voice,lemma){
  return 'verbo · '+lemma+' · '+person+' persona · '+number+
    ' · '+tense+' · '+mode+' · voz '+voice;
}
function register(data,name,forms,tense,mood='indicativo',voice='activa'){
  assert.equal(forms.length,6,'Paradigma incompleto '+name+' '+tense);
  forms.forEach((form,i)=>{
    const [person,number]=PERSONS[i];
    data.push({form,person:person+' '+number,tense,mood,voice,
      analysis:join(person,number,tense,mood,voice,name)});
  });
}
const endingSets={
  perfect:['i','isti','it','imus','istis','erunt'],
  pluperfect:['eram','eras','erat','eramus','eratis','erant'],
  futurePerfect:['ero','eris','erit','erimus','eritis','erint'],
  subjPerfect:['erim','eris','erit','erimus','eritis','erint'],
  subjPluperfect:['issem','isses','isset','issemus','issetis','issent']
};
function perfectSystem(records,headword,stem){
  for(const [name,ending] of Object.entries(endingSets)){
    const mood=name.startsWith('subj')?'subjuntivo':'indicativo';
    const tense={perfect:'perfecto',pluperfect:'pluscuamperfecto',
      futurePerfect:'futuro perfecto',subjPerfect:'perfecto',
      subjPluperfect:'pluscuamperfecto'}[name];
    register(records,headword,ending.map(x=>stem+x),tense,mood);
  }
}
function forms(id,name,blueprints,perfectStem){
  const data=[];
  for(const [tense,mood,values] of blueprints)
    register(data,name,values,tense,mood||'indicativo');
  if(perfectStem)perfectSystem(data,name,perfectStem);
  return {id:'latin2-pau-irregular-'+id,language:'latin2',unit:0,
    kind:'verbo',headword:name,paradigm:name,forms:data,
    evidence:{source:'Paradigmas tradicionales de verbos irregulares',
      file:'shared/academic/latin2/pau-cv-2006-2026.tsv',
      unit:0,status:'paradigma-documentado',topic:'Flexión verbal irregular PAU',
      caption:id,verification:'modelo escolar con flexión individualmente contrastable',
      notes:'Se distinguen todas las lecturas de tiempo y modo de una grafía sin contexto.'}};
}
function sum(){
  const head='sum, esse, fui (irregular)';
  const r=forms('sum',head,[
    ['presente',null,['sum','es','est','sumus','estis','sunt']],
    ['imperfecto',null,['eram','eras','erat','eramus','eratis','erant']],
    ['futuro',null,['ero','eris','erit','erimus','eritis','erunt']],
    ['presente','subjuntivo',['sim','sis','sit','simus','sitis','sint']],
    ['imperfecto','subjuntivo',['essem','esses','esset','essemus','essetis','essent']]
  ],'fu');
  for(const [form,number] of [['es','singular'],['este','plural']]){
    r.forms.push({form,person:'2.ª '+number,number,tense:'presente',
      mood:'imperativo',voice:'activa',
      analysis:'verbo · '+head+' · 2.ª persona · '+number+
        ' · presente · imperativo · voz activa'});
  }
  return r;
}
function possum(){
  const head='possum, posse, potui (irregular)';
  return forms('possum',head,[
    ['presente',null,['possum','potes','potest','possumus','potestis','possunt']],
    ['imperfecto',null,['poteram','poteras','poterat','poteramus','poteratis','poterant']],
    ['futuro',null,['potero','poteris','poterit','poterimus','poteritis','poterunt']],
    ['presente','subjuntivo',['possim','possis','possit','possimus','possitis','possint']],
    ['imperfecto','subjuntivo',['possem','posses','posset','possemus','possetis','possent']]
  ],'potu');
}
function absum(){
  const head='absum, abesse, afui (irregular)';
  return forms('absum',head,[
    ['presente',null,['absum','abes','abest','absumus','abestis','absunt']],
    ['imperfecto',null,['aberam','aberas','aberat','aberamus','aberatis','aberant']],
    ['futuro',null,['abero','aberis','aberit','aberimus','aberitis','aberunt']],
    ['presente','subjuntivo',['absim','absis','absit','absimus','absitis','absint']],
    ['imperfecto','subjuntivo',['abessem','abesses','abesset','abessemus','abessetis','abessent']]
  ],'afu');
}
function intersum(){
  const head='intersum, interesse, interfui (irregular)';
  return forms('intersum',head,[
    ['presente',null,['intersum','interes','interest','intersumus','interestis','intersunt']],
    ['imperfecto',null,['intereram','intereras','intererat','intereramus','intereratis','intererant']],
    ['futuro',null,['interero','intereris','intererit','intererimus','intereritis','intererunt']],
    ['presente','subjuntivo',['intersim','intersis','intersit','intersimus','intersitis','intersint']],
    ['imperfecto','subjuntivo',['interessem','interesses','interesset','interessemus','interessetis','interessent']]
  ],'interfu');
}
function redeo(){
  const head='redeo, redire, redii, reditum (irregular)';
  const r=forms('redeo',head,[
    ['presente',null,['redeo','redis','redit','redimus','reditis','redeunt']],
    ['imperfecto',null,['redibam','redibas','redibat','redibamus','redibatis','redibant']],
    ['futuro',null,['redibo','redibis','redibit','redibimus','redibitis','redibunt']],
    ['perfecto',null,['redii','redisti','rediit','rediimus','redistis','redierunt']],
    ['pluscuamperfecto',null,['redieram','redieras','redierat','redieramus','redieratis','redierant']],
    ['futuro perfecto',null,['rediero','redieris','redierit','redierimus','redieritis','redierint']],
    ['presente','subjuntivo',['redeam','redeas','redeat','redeamus','redeatis','redeant']],
    ['imperfecto','subjuntivo',['redirem','redires','rediret','rediremus','rediretis','redirent']],
    ['perfecto','subjuntivo',['redierim','redieris','redierit','redierimus','redieritis','redierint']]
  ],null);
  return r;
}
function ferro(prefix=''){
  const head=prefix?'confero, conferre, contuli, collatum (irregular)':
    'fero, ferre, tuli, latum (irregular)';
  const prs=['fero','fers','fert','ferimus','fertis','ferunt'];
  const imp=['ferebam','ferebas','ferebat','ferebamus','ferebatis','ferebant'];
  const fut=['feram','feres','feret','feremus','feretis','ferent'];
  const sub=['feram','feras','ferat','feramus','feratis','ferant'];
  const simp=['ferrem','ferres','ferret','ferremus','ferretis','ferrent'];
  const r=forms(prefix?'confero':'fero',head,[
    ['presente',null,prs.map(x=>prefix+x)],
    ['imperfecto',null,imp.map(x=>prefix+x)],
    ['futuro',null,fut.map(x=>prefix+x)],
    ['presente','subjuntivo',sub.map(x=>prefix+x)],
    ['imperfecto','subjuntivo',simp.map(x=>prefix+x)]
  ],prefix?'contul':'tul');
  return r;
}
export function compilePauIrregularVerbs(exams){
  const requested=new Set(exams.flatMap(q=>q.forms.map(latinFold)));
  const c=[sum(),possum(),absum(),intersum(),redeo(),ferro(),ferro('con')];
  assert.ok(c.every(x=>x.forms.length>=30));
  return c.filter(x=>x.forms.some(f=>requested.has(latinFold(f.form))));
}
