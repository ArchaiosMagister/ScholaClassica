/* Imported UniMorph paradigms for teacher's vocabulary. Never infer unattested forms. */
'use strict';
window.GrammarImported=(()=>{
 const BASE='data/unimorph-syllabus/';
 const norm=s=>String(s||'').toLowerCase().normalize('NFD')
  .replace(/\u0345/g,'ι').replace(/\p{M}/gu,'').replace(/æ/g,'ae').replace(/œ/g,'oe')
  .replace(/ς/g,'σ').trim();
 // Los acentos y espíritus distinguen lemas en ático: νόμος/νομός,
 // βίος/βιός y δῆμος/δημός no deben heredar formas uno del otro.
 const atticHeadKey=s=>String(s||'').trim().toLowerCase().normalize('NFD')
  .replace(/[\u0304\u0306]/g,'').replace(/\u0300/g,'\u0301')
  .normalize('NFC');
 const atticHeadMatches=(sourceHead,teacherForm)=>{
  const head=String(teacherForm||'').split(/[,+(]/)[0].trim().split('/')[0].trim();
  return atticHeadKey(sourceHead)===atticHeadKey(head);
 };
 const CASES={NOM:'nominativo',GEN:'genitivo',DAT:'dativo',ACC:'acusativo',VOC:'vocativo',ABL:'ablativo'};
 const GENDER={MASC:'masculino',FEM:'femenino',NEUT:'neutro'};
 const NUMBER={SG:'singular',PL:'plural'};
 const PERSON={'1':'1.ª','2':'2.ª','3':'3.ª'};
 const BAD=new Set(['SBJV','OPT','DU','COND','POT','NEC','FREQ','CAUS','LGSPEC1']);
 let manifestPromise=null;
 const partPromises=new Map();
 function part(key,count){let hash=2166136261;for(const ch of key)hash=Math.imul(hash^ch.codePointAt(0),16777619)>>>0;return hash%count}
 function lemma(form){
  const s=String(form||'').split(/[,+(]/)[0].trim();
  return s&&!/\s/u.test(s)?norm(s.split('/')[0]):null;
 }
 function acquire(entry){
  let values=[];
  for(const u of entry.units||[]){
   const m=String(u).match(/UD\s*(\d+)(?:\s*[–—-]\s*(\d+))?/i);
   if(m)values.push(Number(m[2]||m[1]));
  }
  return values.length?Math.min(...values):null;
 }
 function vocab(subject){
  const map=new Map();
  for(const e of window.VOCAB||[]){
   if(e.subject!==subject)continue;
   const k=lemma(e.form),when=acquire(e);
   if(!k||when===null)continue;
   const existing=map.get(k);
   if(!existing||existing.when>when)map.set(k,{when,form:e.form,meaning:e.meaning||'',key:k});
  }
  return map;
 }
 function decline(lang,form){
  const head=String(form).split(',')[0].trim();
  const parts=String(form).split(',');
  const suffix=parts.length>1?norm(parts[1].split(/[+(]/)[0].replace(/[–—−-]/g,'')):'';
  if(!suffix)return null;
  if(lang==='lat'){
   if(suffix==='ae'||suffix.endsWith('ae')&&norm(head).endsWith('a'))return 'first';
   if(suffix==='i'||suffix==='ii'||suffix.endsWith('i')&&norm(head).endsWith('us'))return 'second';
   if(suffix==='us'||suffix==='u')return 'fourth';
   if(suffix==='ei')return 'fifth';
   if(suffix==='is'||suffix.endsWith('is'))return 'third';
  }else{
   if(suffix==='ου'||suffix.endsWith('ου')&&norm(head).endsWith(('οσ')))return 'second';
   if(suffix==='ασ'||suffix==='ησ'||suffix.endsWith('ασ')||suffix.endsWith('ησ'))return 'first';
   if(suffix==='εωσ'||suffix.endsWith('εωσ')||suffix.endsWith('οντοσ')||suffix.endsWith('ματοσ')||suffix.endsWith('ιδοσ')||suffix.endsWith('ικοσ')||suffix.endsWith('τοσ')||suffix.endsWith('εοσ')||suffix.endsWith('ουσ'))return 'third';
  }
  return null;
 }
 function isProper(name){const c=String(name).trim()[0];return !!c&&c.toUpperCase()===c&&c.toLowerCase()!==c}
/* UniMorph sometimes records multiple parts of speech for the same spelling.
   Accept only the lexical category attested by the teacher's dictionary. */
function lexicalKind(entry,subject){
 const raw=String(entry.form),parts=raw.split(',').map(x=>x.trim());
 const head=norm(parts[0]),next=norm(parts[1]||'');
 const translation=String(entry.meaning||'');
 if(/\((adv\.?|conj\.?|prep\.?|num\.?|part\.?|indecl\.?)\)/i.test(raw))return 'OTHER';
 if(subject==='gr1'){
  if(head.endsWith('ω')||head.endsWith('ομαι')||head.endsWith('μαι')||head==='ειμι')return 'V';
  if(parts.length>=3||next.endsWith('ον')&&/^[–—−-]/.test(parts[1]||''))return 'ADJ';
  return 'N';
 }
 if(/\((?:1ª|2ª|3ª|4ª|mx\.?|irr\.?|defect?\.?)\)/i.test(raw)||
    parts.length>=3&&head.endsWith('o')&&/i$/.test(norm(parts[1]))&&!/^[–—−-]/.test(parts[1]))return 'V';
 if(parts.length>=3)return 'ADJ';
 if(next==='e'||next==='ntis'||next==='antis'||(next.endsWith('is')&&/\/a\b/.test(translation)))return 'ADJ';
 if(parts.length===2&&/\/a\b/.test(translation)&&next.endsWith('is'))return 'ADJ';
 return 'N';
}
 function nominalTopic(subject,entry,pos,feat){
  if(pos==='PRO')return null; // pronominal ambiguity: curated paradigms already cover these.
  if(isProper(entry.form))return null; // avoid unlicensed name plurals.
  const parts=String(entry.form).split(',');
  if(pos==='ADJ'){
   const cmpr=feat.includes('CMPR'),superl=feat.includes('SPRL');
   if(subject==='lat1'&&(cmpr||superl))return ['UD 9','Los adjetivos comparativos y superlativos'];
   if(subject==='lat4'&&(cmpr||superl))return null;
   if(subject==='gr1')return ['UD 5','El adjetivo'];
   const third=parts.length===2||/\b-is\s*,\s*[–—−-]e/i.test(entry.form);
   if(third)return subject==='lat1'?['UD 5','Adjetivos de la tercera']:['UD 7','Adjetivos de la 3ª declinación'];
   return subject==='lat1'?['UD 2','Los adjetivos']:['UD 3','Adjetivos'];
  }
  if(pos!=='N')return null;
  const d=decline(subject==='gr1'?'grc':'lat',entry.form);
  if(subject==='lat1')return ({first:['UD 1','Primera y segunda declinación'],second:['UD 1','Primera y segunda declinación'],third:['UD 4','Tercera declinación'],fourth:['UD 7','Cuarta y quinta declinación'],fifth:['UD 7','Cuarta y quinta declinación']})[d]||null;
  if(subject==='lat4')return ({first:['UD 1','Primera declinación'],second:['UD 2','Segunda declinación'],third:['UD 5','La tercera declinación'],fourth:['UD 8','Cuarta y quinta declinación'],fifth:['UD 8','Cuarta y quinta declinación']})[d]||null;
  if(subject==='gr1'){
   if(d==='first')return ['UD 3','Primera declinación'];
   if(d==='second')return norm(entry.form.split(',')[0]).endsWith('ον')?['UD 2','Segunda declinación: neutros']:['UD 1','Segunda declinación'];
   if(d==='third'){
    const key=norm(entry.form.split(',')[0]);
    const suffix=norm((entry.form.split(',')[1]||'').replace(/[–—−-]/g,''));
    if(key.endsWith('οσ')&&(suffix.endsWith('εοσ')||suffix.endsWith('ουσ')))return ['UD 14','Temas en silbante'];
    return ['UD 8','Tercera declinación'];
   }
  }
  return null;
 }
 function verbalTopic(subject,feat,entry){
  if(subject==='gr1'||!feat.includes('IND')&&!feat.includes('IMP')&&!feat.includes('NFIN')&&!feat.includes('INF'))return null;
  const deponent=norm(entry.form.split(',')[0]).endsWith('or');
  if(deponent)return subject==='lat1'&&feat.includes('IND')&&feat.includes('PRS')?['UD 7','Verbos deponentes']:null;
  if(feat.includes('V.PTCP')||feat.includes('V.MSDR'))return null;
  const indicative=feat.includes('IND'),active=feat.includes('ACT'),passive=feat.includes('PASS');
  if(indicative&&active&&feat.includes('PRS'))return subject==='lat1'?['UD 1','El presente de indicativo y el infinitivo']:['UD 2','Presente'];
  if(indicative&&passive&&feat.includes('PRS'))return subject==='lat1'?['UD 3','Voz pasiva']:['UD 6','Voz pasiva'];
  if(indicative&&active&&feat.includes('PST')&&feat.includes('IPFV'))return subject==='lat1'?['UD 2','El imperfecto de indicativo']:['UD 4','El imperfecto'];
  if(indicative&&active&&feat.includes('PRF')&&!feat.includes('PSTP'))return subject==='lat1'?['UD 4','El perfecto y el pluscuamperfecto de indicativo']:['UD 6','El perfecto'];
  if(indicative&&active&&feat.includes('PSTP'))return subject==='lat1'?['UD 4','El perfecto y el pluscuamperfecto de indicativo']:['UD 7','Pluscuamperfecto'];
  if(indicative&&active&&feat.includes('FUT'))return subject==='lat1'?['UD 7','El futuro']:null;
  if(subject==='lat1'&&feat.includes('IMP')&&active&&feat.includes('PRS'))return ['UD 3','El imperativo'];
  if(subject==='lat1'&&(feat.includes('INF')||feat.includes('NFIN'))&&active&&feat.includes('PRS'))return ['UD 1','El presente de indicativo y el infinitivo'];
  return null;
 }
 function description(feat,pos,deponent=false){
  if(pos==='V'){
   const who=feat.find(x=>x==='1'||x==='2'||x==='3'),number=feat.find(x=>NUMBER[x]);
   if(feat.includes('INF')||feat.includes('NFIN')){
    if(!who&&!number)return 'infinitivo de presente activo';
   }
   if(!who||!number||!feat.includes('IND')&&!feat.includes('IMP'))return null;
   const tense=feat.includes('PRS')?'presente':feat.includes('FUT')?'futuro':feat.includes('PSTP')?'pluscuamperfecto':feat.includes('PRF')?'perfecto':feat.includes('IPFV')?'imperfecto':null;
   if(!tense)return null;
   const voice=deponent?'deponente':feat.includes('PASS')?'pasivo':feat.includes('ACT')?'activo':null;
   if(!voice)return null;
   const mode=feat.includes('IMP')?'imperativo':'indicativo';
   return PERSON[who]+' persona del '+NUMBER[number]+', '+tense+' de '+mode+' '+voice;
  }
  const cas=feat.find(x=>CASES[x]),num=feat.find(x=>NUMBER[x]),gen=feat.find(x=>GENDER[x]);
  if(!cas||!num)return null;
  return CASES[cas]+' '+(gen?GENDER[gen]+' ':'')+NUMBER[num];
 }
 
const SPLIT_FEATURES=new Set(['MASC','FEM','NEUT','NOM','GEN','DAT','ACC','ABL','VOC']);
function splitFeatures(feat){
 let result=[[]];
 for(const tag of feat){
  const values=tag.includes('+')?tag.split('+'):[tag];
  if(values.length>1&&!values.every(v=>SPLIT_FEATURES.has(v)))return [];
  result=result.flatMap(xs=>values.map(v=>xs.concat(v)));
  if(result.length>8)return [];
 }
 return result;
}

function readingKey(feat){return feat.join(';')}
 async function getManifest(){
  if(!manifestPromise)manifestPromise=fetch(BASE+'manifest.json').then(r=>{if(!r.ok)throw Error('Índices todavía no publicados (HTTP '+r.status+')');return r.json()}).catch(e=>{manifestPromise=null;throw e});
  return manifestPromise;
 }
 async function fetchPart(lang,n){
  const name=BASE+lang+'/part-'+String(n).padStart(2,'0')+'.json';
  if(!partPromises.has(name))partPromises.set(name,fetch(name).then(r=>{if(!r.ok)throw Error('Falta índice '+name);return r.json()}).catch(e=>{partPromises.delete(name);throw e}));
  return partPromises.get(name);
 }
 const cache=new Map();
 async function load(subject){
  if(cache.has(subject))return cache.get(subject);
  const promise=(async()=>{
   const meta=await getManifest(),lang=subject==='gr1'?'grc':'lat',info=meta.languages?.[lang];
   if(!info||!info.part_count)throw Error('El manifiesto no incluye '+lang);
   const lex=vocab(subject);if(!lex.size)return {items:[],rows:0,lemmas:0,meta:info};
   const parts=new Set([...lex.keys()].map(k=>part(k,info.part_count)));
   const arrays=await Promise.all([...parts].map(i=>fetchPart(lang,i)));
   const grouped=new Map();
   let rows=0;
   for(const arr of arrays)for(const row of arr){
    if(!Array.isArray(row)||row.length<3)continue;
    const [head,surface,tags]=row,entry=lex.get(norm(head));
    if(!entry)continue;
    // UniMorph no indica dialecto por fila; la equivalencia de lema con
    // acento exacto es condición NECESARIA, no certificación ática completa.
    if(subject==='gr1'&&!atticHeadMatches(head,entry.form))continue;
    rows++;
    const features=splitFeatures(String(tags).split(';'));
    for(const feat of features){
     if(feat.some(t=>BAD.has(t)))continue;
     const pos=feat[0];if(!['N','V','ADJ'].includes(pos))continue;
     if(lexicalKind(entry,subject)!==pos)continue;
     const topic=pos==='V'?verbalTopic(subject,feat,entry):nominalTopic(subject,entry,pos,feat);
     if(!topic)continue;
     const [introducedUnit,introducedTopic]=topic,number=Number((introducedUnit.match(/\d+/)||[])[0]);
     const assigned=Math.max(entry.when,number);
     if(assigned>(subject==='lat1'?10:subject==='lat4'?8:14))continue;
     const unit='UD '+assigned,heading=assigned===number?introducedTopic:'Repaso morfológico acumulativo';
     const label=description(feat,pos,pos==='V'&&norm(entry.form.split(',')[0]).endsWith('or'));if(!label)continue;
     const fullEntry=window.GrammarEnunciation?.display(subject,entry.form,pos==='V');
     if(pos==='V'&&!fullEntry)continue; // Sin enunciado docente completo no se pregunta la flexión verbal.
     const id=unit+'|'+entry.key+'|'+readingKey(feat);
     if(!grouped.has(id))grouped.set(id,{id,subject,unit,topic:heading,category:pos==='V'?'Morfología verbal':'Morfología nominal',lemma:fullEntry||entry.form,language:lang,label,forms:new Set(),key:entry.key,feature:readingKey(feat)});
     grouped.get(id).forms.add(surface);
    }
   }
   const items=[];
   const bySurface=new Map();
   for(const group of grouped.values())for(const form of group.forms){
    const k=group.key+'|'+norm(form);
    if(!bySurface.has(k))bySurface.set(k,new Set());
    bySurface.get(k).add(group.label);
   }
   const featuresByLemma=new Map();
   for(const group of grouped.values()){
    if(!featuresByLemma.has(group.key))featuresByLemma.set(group.key,new Set());
    featuresByLemma.get(group.key).add(group.label);
   }
   for(const group of grouped.values()){
    const surfaces=[...group.forms].sort((a,b)=>a.localeCompare(b));
    if(!surfaces.length)continue;
    const acceptable=[...new Set(surfaces.flatMap(f=>{
     if(f.includes('(ν)'))return [norm(f.replaceAll('(ν)','')),norm(f.replaceAll('(ν)','ν'))];
     return [norm(f)];
    }))];
    const base=subject+'|'+group.id;
    const suffix=' · '+group.label+' · '+group.unit;
    items.push({
     id:'import|'+base+'|write',subject,unit:group.unit,topic:group.topic,category:group.category,mode:'write',lemma:group.key,
     prompt:'Escribe '+group.label+' de '+group.lemma+'.',
     answer:surfaces[0],accepted:acceptable,language:lang,
     explanation:'UniMorph: '+group.lemma+suffix+'. Variantes aceptadas: '+surfaces.join(', ')+'.'
    });
    const other=[...featuresByLemma.get(group.key)].filter(x=>x!==group.label).sort().slice(0,3);
    if(other.length<2)continue;
    for(const surface of surfaces){
     if(bySurface.get(group.key+'|'+norm(surface)).size!==1)continue;
     items.push({
      id:'import|'+base+'|analysis|'+norm(surface),subject,unit:group.unit,topic:group.topic,category:group.category,mode:'choice',lemma:group.key,
      prompt:'¿Qué análisis corresponde a «'+surface+'» de '+group.lemma+'?',
      answer:group.label,options:[group.label,...other],language:lang,
      explanation:'UniMorph: '+surface+' corresponde a '+group.label+'.'
     });
    }
   }
   return {items,rows,lemmas:new Set(items.map(x=>x.id.split('|')[3])).size,meta:info};
  })();
  cache.set(subject,promise);
  try{return await promise}catch(e){cache.delete(subject);throw e}
 }
 return {load,getManifest,norm,part,description,atticHeadKey,atticHeadMatches};
})();