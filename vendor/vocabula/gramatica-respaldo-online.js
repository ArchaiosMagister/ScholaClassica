/* Consultation on demand of documented Latin inflection tables.
   Latin Dictionary API: https://latindictionary.co/docs/api (CORS; attribution).
   Output uses the SAME question schema as GrammarImported. It is optional,
   rate-limited by the upstream service and never replaces local paradigms.
 */
'use strict';
window.GrammarOnlineBackup=(()=>{
 const BASE='https://latindictionary.co/api/v1/entry/';
 const norm=s=>String(s||'').toLowerCase().normalize('NFD')
  .replace(/\p{M}/gu,'').replace(/æ/g,'ae').replace(/œ/g,'oe').trim();
 const key=s=>norm(String(s||'').split(/[,+(]/)[0].trim());
 const parts=s=>String(s||'').split(',').map(x=>x.trim().replace(/\s*\([^)]*\)\s*$/,''));
 const conjugation=s=>String(s||'').match(/\((1ª|2ª|3ª|4ª|mx\.)\)/)?.[1]||null;
 const personNames=['1.ª persona del singular','2.ª persona del singular','3.ª persona del singular',
  '1.ª persona del plural','2.ª persona del plural','3.ª persona del plural'];
 const personIds=['1.sg','2.sg','3.sg','1.pl','2.pl','3.pl'];
 const personPatterns=[/^1st sg\.?$/i,/^2nd sg\.?$/i,/^3rd sg\.?$/i,
  /^1st pl\.?$/i,/^2nd pl\.?$/i,/^3rd pl\.?$/i];
 const topics={
  lat1:{
   'active indicative':{
    present:[1,'El presente de indicativo y el infinitivo','presente de indicativo activo'],
    imperfect:[2,'El imperfecto de indicativo','imperfecto de indicativo activo'],
    perfect:[4,'El perfecto y el pluscuamperfecto de indicativo','perfecto de indicativo activo'],
    pluperfect:[4,'El perfecto y el pluscuamperfecto de indicativo','pluscuamperfecto de indicativo activo'],
    future:[7,'El futuro','futuro de indicativo activo']
   },
   'passive indicative':{
    present:[3,'Voz pasiva','presente de indicativo pasivo']
   }
  },
  lat4:{
   'active indicative':{
    present:[2,'Presente','presente de indicativo activo'],
    imperfect:[4,'El imperfecto','imperfecto de indicativo activo'],
    perfect:[6,'El perfecto','perfecto de indicativo activo'],
    pluperfect:[7,'Pluscuamperfecto','pluscuamperfecto de indicativo activo']
   },
   'passive indicative':{
    present:[6,'Voz pasiva','presente de indicativo pasivo']
   }
  }
 };

 const nominalTopics={
  lat1:{
   first:[1,'Primera y segunda declinación'],
   second:[1,'Primera y segunda declinación'],
   third:[4,'Tercera declinación'],
   fourth:[7,'Cuarta y quinta declinación'],
   fifth:[7,'Cuarta y quinta declinación'],
   adjective:[2,'Los adjetivos']
  },
  lat4:{
   first:[1,'Primera declinación'],
   second:[2,'Segunda declinación'],
   third:[5,'La tercera declinación'],
   fourth:[8,'Cuarta y quinta declinación'],
   fifth:[8,'Cuarta y quinta declinación'],
   adjective:[3,'Adjetivos']
  }
 };
 const caseNames={nominative:'nominativo',genitive:'genitivo',dative:'dativo',
  accusative:'acusativo',vocative:'vocativo',ablative:'ablativo'};
 const genderNames={masculine:'masculino',feminine:'femenino',neuter:'neutro'};
 const cleanEnding=s=>norm(String(s||'').replace(/^[\s\-–—−]+/,''));
 const usableSurface=s=>typeof s==='string'&&s.length<=60&&/^[a-zāăēĕīĭōŏūŭȳÿæœ]+$/iu.test(s);
 function nominalType(teacher){
  if(!teacher||conjugation(teacher))return null;
  const words=parts(teacher);
  if(words.length===3)return 'adjective';
  if(words.length!==2)return null;
  const ending=cleanEnding(words[1]);
  if(ending.endsWith('ae'))return 'first';
  if(ending.endsWith('ei'))return 'fifth';
  if(ending.endsWith('is'))return 'third';
  if(ending.endsWith('us'))return 'fourth';
  if(ending.endsWith('i'))return 'second';
  return null;
 }
 const requests=new Map();
 const firstUnit=entry=>{
  const units=(entry.units||[]).flatMap(unit=>{
   const match=String(unit).match(/UD\s*(\d+)(?:\s*[–—-]\s*(\d+))?/);
   return match?[Number(match[2]||match[1])]:[];
  });
  return units.length?Math.min(...units):null;
 };
 function lexicon(subject){
  const found=new Map();
  for(const entry of window.VOCAB||[]){
   if(entry.subject!==subject)continue;
   const lemma=key(entry.form),when=firstUnit(entry);
   if(!lemma||when===null||when===0)continue;
   if(!found.has(lemma)||found.get(lemma).when>when)found.set(lemma,{lemma,when,entry:entry.form});
  }
  return found;
 }
 function candidates(subject,selectedUnits){
  if(!topics[subject])return [];
  const units=new Set(selectedUnits);
  return [...lexicon(subject).values()].filter(v=>{
   const full=window.GrammarEnunciation?.display(subject,v.lemma,true);
   const nominal=window.GrammarEnunciation?.display(subject,v.lemma,false);
   const isVerb=!!(full&&window.GrammarEnunciation?.latinFull(full));
   const nounClass=nominalType(nominal);
   if(!isVerb&&!nounClass)return false;
   const intros=isVerb?
    Object.values(topics[subject]).flatMap(group=>Object.values(group).map(rule=>rule[0])):
    [nominalTopics[subject][nounClass][0]];
   return intros.some(intro=>units.has('UD '+Math.max(v.when,intro)));
  }).sort((a,b)=>a.when-b.when||a.lemma.localeCompare(b.lemma));
 }
 async function fetchEntry(lemma){
  const name=key(lemma);
  if(!/^[a-zæœ]+$/i.test(name))throw Error('Lema latino no admitido');
  if(!requests.has(name)){
   const promise=(async()=>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
    try{
     const response=await fetch(BASE+encodeURIComponent(name),{signal:controller.signal,cache:'force-cache'});
     if(!response.ok)throw Error('El diccionario respondió HTTP '+response.status);
     const value=await response.json();
     if(!value||!Array.isArray(value.lemmas)||!value.lemmas.length)
      throw Error('El diccionario no devolvió una entrada estructurada');
     return value;
    }finally{clearTimeout(timer)}
   })().catch(error=>{requests.delete(name);throw error});
   requests.set(name,promise);
  }
  return requests.get(name);
 }
 function matchingLemma(subject,lemma,data){
  const teacher=window.GrammarEnunciation?.display(subject,lemma,true);
  if(!teacher||!window.GrammarEnunciation?.latinFull(teacher))return null;
  const expected=parts(teacher).slice(0,3).map(norm);
  const conj=conjugation(teacher);
  const found=(data.lemmas||[]).find(x=>{
   if(x.part_of_speech!=='verb'||x.paradigm?.kind!=='verb')return false;
   const principal=x.principal_parts;
   if(!Array.isArray(principal)||principal.length<4)return false;
   if(norm(principal[0])!==expected[0]||norm(principal[2])!==expected[1]||norm(principal[3])!==expected[2])return false;
   if(conj==='mx.')return /conjugation-3(?:io|-io)$/i.test(x.inflection||'');
   if(!conj||!String(x.inflection).includes('conjugation-'+conj[0]))return false;
   return true;
  });
  return found?{teacher,lexeme:found}:null;
 }
 function asVerbalQuestions(subject,lemma,data){
  if(!topics[subject])return [];
  const match=matchingLemma(subject,lemma,data);
  if(!match)return [];
  const entry=lexicon(subject).get(key(lemma));
  if(!entry)return [];
  const readings=new Map(),groups=[];
  const limits={lat1:10,lat4:8};
  for(const table of match.lexeme.paradigm.tables||[]){
   const setting=topics[subject][table.title];
   if(!setting||!Array.isArray(table.columns)||!Array.isArray(table.rows))continue;
   for(const [column,values] of Object.entries(setting)){
    const columnIndex=table.columns.indexOf(column);
    if(columnIndex<0)continue;
    const [introduced,topicLabel,description]=values;
    const assigned=Math.max(entry.when,introduced);
    if(assigned>limits[subject])continue;
    const unit='UD '+assigned,topic=assigned===introduced?topicLabel:'Repaso morfológico acumulativo';
    const forms=new Map();
    for(const row of table.rows){
     const i=personPatterns.findIndex(pattern=>pattern.test(String(row.label||'')));
     if(i<0||!Array.isArray(row.cells)||!Array.isArray(row.cells[columnIndex]))continue;
     const surfaces=[...new Map(row.cells[columnIndex]
      .filter(v=>typeof v==='string'&&v.length<=60&&/^[a-zāăēĕīĭōŏūŭȳÿæœ]+$/iu.test(v))
      .map(v=>[norm(v),v])).values()];
     if(surfaces.length)forms.set(personIds[i],surfaces);
    }
    if(forms.size<4)continue;
    for(const [feature,surfaces]of forms){
     for(const surface of surfaces){
      const k=norm(surface);
      if(!readings.has(k))readings.set(k,new Set());
      readings.get(k).add(table.title+'|'+column+'|'+feature);
     }
    }
    groups.push({unit,topic,description,forms,table:table.title,column});
   }
  }
  const items=[];
  for(const group of groups){
   for(const [feature,surfaces]of group.forms){
    const number=personIds.indexOf(feature),name=personNames[number];
    const instruction=name+' del '+group.description;
    const base='online|latin-dictionary|'+subject+'|'+group.unit+'|'+key(lemma)+'|'+group.table+'|'+group.column+'|'+feature;
    const accepted=[...new Set(surfaces.map(norm))];
    const explanation='Latin Dictionary (respaldo online): '+match.teacher+' · '+instruction+'.';
    items.push({
     id:base+'|write',subject,unit:group.unit,topic:group.topic,
     category:'Morfología verbal',mode:'write',lemma:key(lemma),
     prompt:'Escribe '+instruction+' de '+match.teacher+'.',
     answer:surfaces[0],accepted,explanation,language:'lat',
     source:'Latin Dictionary API'
    });
    const safe=surfaces.every(surface=>readings.get(norm(surface)).size===1);
    if(!safe)continue;
    const alternatives=[...group.forms.keys()].filter(x=>x!==feature).map(f=>personNames[personIds.indexOf(f)]);
    if(alternatives.length<2)continue;
    for(const surface of surfaces)items.push({
     id:base+'|choice|'+norm(surface),subject,unit:group.unit,topic:group.topic,
     category:'Morfología verbal',mode:'choice',lemma:key(lemma),
     prompt:'¿Qué análisis corresponde a «'+surface+'» de '+match.teacher+'?',
     answer:name,options:[name,...alternatives.slice(0,3)],explanation,language:'lat',
     source:'Latin Dictionary API'
    });
   }
  }
  return items;
 }
 function asNominalQuestions(subject,lemma,data){
  if(!nominalTopics[subject])return [];
  const teacher=window.GrammarEnunciation?.display(subject,lemma,false);
  const type=nominalType(teacher);
  if(!type)return [];
  const entry=lexicon(subject).get(key(lemma));
  if(!entry)return [];
  const kind=type==='adjective'?'adj':'noun';
  const expected=parts(teacher).map(norm);
  const chosen=(data.lemmas||[]).find(x=>{
   if(x.part_of_speech!==(kind==='adj'?'adjective':'noun')&&
      !(kind==='adj'&&x.part_of_speech==='adj'))return false;
   if(x.paradigm?.kind!==kind||!Array.isArray(x.principal_parts))return false;
   if(expected.length!==x.principal_parts.length)return false;
   if(!expected.every((val,i)=>norm(x.principal_parts[i]).endsWith(cleanEnding(val))))return false;
   const gender=String(teacher).match(/\(([mfn])\.\)/i)?.[1];
   if(gender&&x.gender&&{m:'masculine',f:'feminine',n:'neuter'}[gender]!==x.gender)return false;
   return true;
  });
  if(!chosen)return [];
  const [intro,heading]=nominalTopics[subject][type];
  const assigned=Math.max(intro,entry.when);
  if(assigned>(subject==='lat1'?10:8))return [];
  const unit='UD '+assigned,topic=assigned===intro?heading:'Repaso morfológico acumulativo';
  const forms=new Map();
  for(const table of chosen.paradigm.tables||[]){
   if(!Array.isArray(table.columns)||!Array.isArray(table.rows))continue;
   for(const row of table.rows){
    const cas=caseNames[String(row.label||'').toLowerCase()];
    if(!cas||!Array.isArray(row.cells))continue;
    for(let ci=0;ci<table.columns.length;ci++){
     const col=String(table.columns[ci]).toLowerCase();
     const num=kind==='noun'?(col==='singular'?'singular':col==='plural'?'plural':null):
      table.title==='singular'?'singular':table.title==='plural'?'plural':null;
     const gender=kind==='adj'?genderNames[col]:null;
     if(!num||(kind==='adj'&&!gender)||!Array.isArray(row.cells[ci]))continue;
     if(/^[A-ZÀ-Ü]/.test(entry.entry)&&num==='plural')continue;
     // Only the primary listed form: dictionary tables may mix derived or
     // alternative lexemes in later cells (e.g. puella / puellula).
     const surface=row.cells[ci].find(usableSurface);
     if(!surface)continue;
     const feature=cas+'|'+(gender||'')+'|'+num;
     if(!forms.has(feature))forms.set(feature,{cas,gender,num,surface});
    }
   }
  }
  if(forms.size<(kind==='adj'?18:8))return [];
  const readings=new Map();
  for(const [feature,row]of forms){
   const form=norm(row.surface);
   if(!readings.has(form))readings.set(form,new Set());
   readings.get(form).add(feature);
  }
  const items=[];
  for(const [feature,row]of forms){
   const label=row.cas+(row.gender?' '+row.gender:'')+' '+row.num;
   const base='online|latin-dictionary|'+subject+'|'+unit+'|'+key(lemma)+'|'+feature;
   const explanation='Latin Dictionary (respaldo online): '+teacher+' · '+label+'.';
   items.push({
    id:base+'|write',subject,unit,topic,category:'Morfología nominal',mode:'write',
    lemma:key(lemma),prompt:'Escribe '+label+' de '+teacher+'.',
    answer:row.surface,accepted:[norm(row.surface)],explanation,language:'lat',
    source:'Latin Dictionary API'
   });
   if(readings.get(norm(row.surface)).size!==1)continue;
   const other=[...forms].filter(([k])=>k!==feature).map(([,r])=>
    r.cas+(r.gender?' '+r.gender:'')+' '+r.num);
   if(other.length<2)continue;
   items.push({
    id:base+'|choice',subject,unit,topic,category:'Morfología nominal',mode:'choice',
    lemma:key(lemma),
    prompt:'¿Qué análisis corresponde a «'+row.surface+'» de '+teacher+'?',
    answer:label,options:[label,...[...new Set(other)].slice(0,3)],
    explanation,language:'lat',source:'Latin Dictionary API'
   });
  }
  return items;
 }
 function asQuestions(subject,lemma,data){
  return [...asVerbalQuestions(subject,lemma,data),...asNominalQuestions(subject,lemma,data)];
 }
 async function load(subject,lemma){
  if(!topics[subject])return {items:[],supported:false,reason:'La fuente API validada es solo latina.'};
  const inVocab=lexicon(subject).has(key(lemma));
  if(!inVocab)return {items:[],supported:true,reason:'El lema no pertenece al vocabulario seleccionado.'};
  const response=await fetchEntry(lemma);
  return {items:asQuestions(subject,lemma,response),supported:true,
   attribution:response.attribution||'Latin Dictionary (latindictionary.co)',
   url:response.url||'https://latindictionary.co/',source:BASE};
 }
 return {load,candidates,asQuestions,source:BASE};
})();
