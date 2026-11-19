// Importador conservador del banco canónico de GeneradorExamenes.
// Las fichas que no puedan segmentarse inequívocamente NO entran en el sorteo.
import { chars } from '../src/engine.mjs';
import { latinU, latinKey, normalizeLatinLemmaMentions } from '../src/latin.mjs';
export const SOURCE_ID='ArchaiosMagister/GeneradorExamenes:data/fonetica/banco_examenes.json';
export const CODE_RULES=Object.freeze({
 N01:'ABER',N02:'AFER',N03:'APOC',N04:'ASMIL',N05:'ASPIR',N06:'CONS',N07:'DIPT',N08:'DISIMIL',N09:'EPENT',N10:'GRIE',N11:'METAT',N12:'MONOP',N13:'PALAT',N14:'PROT',N15:'SIMPL',N16:'SINC',N17:'SONOR',N18:'VOC',N19:'MIN_MBR',N20:'CUL'
});
export function key(text){return String(text??'').toLocaleLowerCase('es').replace(/æ/g,'ae').replace(/œ/g,'oe').normalize('NFD').replace(/[\u0300-\u036f]/gu,'').replace(/[^\p{L}\p{N}]/gu,'');}
const flat=t=>String(t??'').normalize('NFD').replace(/[\u0300-\u036f]/gu,'').toLowerCase();
const vowel=t=>/^[aeiouæœ]$/u.test(flat(t));
const seq=(letters,start,length)=>flat(letters.slice(start,start+length).join(''));
const strip=word=>flat(word).replace(/æ/g,'ae').replace(/œ/g,'oe');
const op=(start,end,result,rule,note,subtype)=>({start,end,result,rule,note,...(subtype?{subtype}:{})});
function options(item){
 const l=chars(item.latin),codes=new Set(item.normas),out=[];
 // Anotaciones de salida obligatorias por criterio aprobado del profesor.
 if(l.at(-1)?.toLowerCase()==='m')out.push({...op(l.length-1,l.length,'','FIX_M','Se pierde la -m final del acusativo (norma fija).'),required:true});
 if(flat(l.slice(-2).join(''))==='um')out.push({...op(l.length-2,l.length-1,'o','ABER','Abertura de la u de -um a o, independiente de la pérdida de -m.'),required:true});
 const add=(s,e,text,rule,note,subtype)=>out.push(op(s,e,text,rule,note,subtype));
 if(codes.has('N10')){
  for(let i=0;i<l.length;i++){
   if(seq(l,i,2)==='ph'){add(i,i+2,'f','GRIE','Adaptación gráfica culta ph → f.');i++;continue;}
   if(seq(l,i,2)==='th'){add(i,i+2,'t','GRIE','Adaptación gráfica culta th → t.');i++;continue;}
   if(seq(l,i,2)==='ch'){add(i,i+2,'c','GRIE','Adaptación gráfica culta ch → c.');add(i,i+2,'qu','GRIE','Adaptación gráfica culta ch → qu.');i++;continue;}
   if(seq(l,i,1)==='y')add(i,i+1,'i','GRIE','Adaptación gráfica culta y → i.');
  }
 }
 if(codes.has('N12')){
  for(let i=0;i<l.length;i++){
   const v=seq(l,i,1),dg=seq(l,i,2);
   if(v==='æ'||v==='œ')add(i,i+1,'e','MONOP','Monoptongación de ae/oe → e.');
   else if(dg==='ae'||dg==='oe')add(i,i+2,'e','MONOP','Monoptongación del diptongo → e.');
   else if(dg==='au')add(i,i+2,'o','MONOP','Monoptongación au → o.');
  }
 }
 if(codes.has('N01')){
  for(let i=0;i<l.length;i++){
   if(i===l.length-2&&seq(l,i,2)==='um')continue;
   const v=seq(l,i,1);
   if(v==='i'||v==='u')add(i,i+1,v==='i'?'e':'o','ABER',`Abertura de ${v} a ${v==='i'?'e':'o'}.`);
  }
 }
 if(codes.has('N07'))for(let i=0;i<l.length;i++){
  const v=seq(l,i,1);
  if(v==='e'||v==='o')add(i,i+1,v==='e'?'ie':'ue','DIPT',`Diptongación ${v} → ${v==='e'?'ie':'ue'}.`);
 }
 if(codes.has('N17'))for(let i=1;i<l.length-1;i++){
  const v=seq(l,i,1),before=seq(l,i-1,1),after=seq(l,i+1,1);
  if(vowel(before)&&vowel(after)&&['p','t','c'].includes(v))add(i,i+1,({p:'b',t:'d',c:'g'})[v],'SONOR',`Sonorización de la consonante sorda intervocálica ${v}.`);
 }
 if(codes.has('N15'))for(let i=0;i<l.length-1;i++){
  const group=seq(l,i,2);const changed={bb:'b',cc:'c',dd:'d',ff:'f',ll:'l',mm:'m',nn:'n',pp:'p',rr:'r',ss:'s',tt:'t',ns:'s',mb:'m',pt:'t'}[group];
  if(changed)add(i,i+2,changed,'SIMPL',`Simplificación del grupo ${group} → ${changed}.`);
 }
 if(codes.has('N14')&&seq(l,0,1)==='s'&&l.length>1&&['p','t','c','ph'].some(g=>seq(l,1,g.length)===g))out.push({...op(0,0,'e','PROT','Prótesis de e- ante s + consonante.'),anchor:0});
 if(codes.has('N03')||codes.has('N10')||codes.has('N17')||codes.has('N01')||codes.has('N07')||codes.has('N13')||codes.has('N12')||codes.has('N15')){
  // Apócope de e no debe confundirse con la -m fija.
  const end=l.at(-1)?.toLowerCase();
  const ix=end==='m'?l.length-2:l.length-1;
  if(seq(l,ix,1)==='e')add(ix,ix+1,'','APOC','Apócope de -e final tras la caída de -m cuando corresponde.');
 }
 if(codes.has('N13'))for(let i=0;i<l.length-1;i++){
  const group=seq(l,i,2);
  const outputs={ct:['ch'],gn:['ñ'],mn:['ñ'],nn:['ñ'],ni:['ñ'],di:['y'],li:['j'],pl:['ll'],cl:['ll'],fl:['ll'],ll:['ll'],x:['j']}[group];
  if(outputs)for(const result of outputs)add(i,i+2,result,'PALAT',`Palatalización de ${group} → ${result}.`);
 }
 if(codes.has('N16')){
  // Solo se automatiza síncopa explícita de vocal breve escrita con diacrítico,
  // y de g intervocálica, nunca se generaliza una supresión por semejanza.
  for(let i=1;i<l.length-1;i++){
   const original=l[i].toLowerCase();
   if(['ĭ','ŭ','ĕ'].includes(original))add(i,i+1,'','SINC',`Síncopa de ${original} interior.`);
   else if(seq(l,i,1)==='g'&&vowel(l[i-1])&&vowel(l[i+1]))add(i,i+1,'','SINC','Pérdida interior de g intervocálica.');
  }
 }
 return out;
}
function createOutput(item,ops){
 const word=chars(item.latin),byStart=new Map(),insertions=new Map();
 for(const o of ops){if(o.anchor!==undefined){const list=insertions.get(o.anchor)||[];list.push(o);insertions.set(o.anchor,list);}else byStart.set(o.start,o);}
 let result='';
 for(let i=0;i<=word.length;){
  for(const a of insertions.get(i)||[])result+=a.result;
  if(i===word.length)break;
  const match=byStart.get(i);
  if(match){result+=match.result;i=match.end;}
  else{result+=word[i];i++;}
 }
 return result;
}
export function annotateDirect(item,{maxCombinations=4096}={}){
 if(item?.estado!=='APTO_PROPUESTO'||!item?.id||!item?.latin||!item?.castellano||!Array.isArray(item?.normas)||!item.normas.length)return {status:'invalid_source'};
 const codes=new Set(item.normas),official=new Set(Object.keys(CODE_RULES));
 if([...codes].some(c=>!official.has(c)))return {status:'unknown_rule'};
 const raw=options(item);const required=raw.filter(o=>o.required),optional=raw.filter(o=>!o.required);
 // Solo se pueden automatizar códigos que tienen un patrón POSICIONAL explícito.
 const unsupported=[...codes].filter(id=>!new Set(['N01','N03','N07','N10','N12','N13','N14','N15','N16','N17']).has(id));
 if(unsupported.length)return {status:'requires_editorial_review',reason:`Normas sin plantilla fiable: ${unsupported.join(', ')}`};
 const selections=[],counts={total:0},goal=strip(item.castellano);
 function visit(idx,chosen,occupied){
  if(counts.total>maxCombinations)return;
  if(idx>=optional.length){
   counts.total++;
   const active=[...required,...chosen],present=new Set(active.map(o=>o.rule));
   if([...codes].some(k=>!present.has(CODE_RULES[k])))return;
   if(strip(createOutput(item,active))===goal)selections.push(active);
   return;
  }
  const edit=optional[idx];visit(idx+1,chosen,occupied);
  const indices=edit.anchor!==undefined?[]:Array.from({length:edit.end-edit.start},(_,i)=>edit.start+i);
  if(indices.some(i=>occupied.has(i))|| (edit.anchor!==undefined&&chosen.some(o=>o.anchor===edit.anchor)))return;
  visit(idx+1,[...chosen,edit],new Set([...occupied,...indices]));
 }
 const occupied=new Set(required.flatMap(o=>Array.from({length:o.end-o.start},(_,i)=>o.start+i)));
 visit(0,[],occupied);
 if(counts.total>maxCombinations)return {status:'requires_editorial_review',reason:'Demasiadas alternativas de segmentación'};
 if(selections.length===0)return {status:'requires_editorial_review',reason:'No coincide la transformación completa sin introducir cambios no anotados'};
 if(selections.length>1)return {status:'ambiguous',reason:`${selections.length} segmentaciones válidas`};
 const selected=selections[0].sort((a,b)=>a.start-b.start || (a.rule==='FIX_M'?1:0));
 if(!selected.some(o=>o.rule!=='FIX_M'))return {status:'requires_editorial_review',reason:'Sin fenómeno examinable'};
 const changes=selected.map((o,i)=>({id:`t${i+1}`,rule:o.rule,spans:o.anchor!==undefined?[]:[[o.start,o.end]],...(o.anchor!==undefined?{anchor:o.anchor}:{}),output:o.result||'∅',note:o.note,...(o.subtype?{subtype:o.subtype}:{})}));
 const record={id:`ge-${item.id}`,latin:latinU(item.latin),answers:[item.castellano],source:{file:SOURCE_ID,row:item.fila_origen||1,lot:item.lote||'Generador',generatorId:item.id,transmission:item.tipoTransmision||'NO_INDICADA',sourceStatus:item.estado,originalRules:item.normas,sourceNotes:item.observacion||'',sourceUrl:item.fuente||''},status:'reviewed-pilot',changes,explanation:normalizeLatinLemmaMentions(`${item.latin} → ${item.castellano}. Etiquetas originales: ${item.normas.join(', ')}. ${item.observacion||''} (Importación automática con correspondencia ortográfica comprobada; no constituye certificación filológica adicional.)`,item.latin)};
 return {status:'auto_aligned',word:record};
}
export function auditImport(source,existing){
 if(source?.esquema!=='evoluciones-latin-castellano/v1'||!Array.isArray(source.items))throw Error('Banco fuente incompatible');
 // Las fuentes externas conservan v; el banco didáctico utiliza u. Ambos
 // sistemas de escritura designan el mismo lema para evitar duplicados.
 const map=new Map(existing.words.map(w=>[latinKey(w.latin),w]));
 const accepted=[],pending=[],overlap=[],conflicts=[];
 for(const item of source.items){
  const old=map.get(latinKey(item.latin));
  if(old){
   overlap.push({sourceId:item.id,wordId:old.id,latin:item.latin,castellano:item.castellano});
   if(!old.answers.some(answer=>key(answer)===key(item.castellano)))conflicts.push({type:'meaning',item,wordId:old.id});
   else if(item.normas.some(n=>!old.changes.some(c=>c.rule===CODE_RULES[n])))conflicts.push({type:'classification',item,wordId:old.id,currentRules:[...new Set(old.changes.map(c=>c.rule))]});
  }else{
   const result=annotateDirect(item);
   if(result.status==='auto_aligned')accepted.push(result.word);
   else pending.push({sourceId:item.id,latin:item.latin,castellano:item.castellano,normas:item.normas,transmission:item.tipoTransmision||null,status:result.status,reason:result.reason||''});
  }
 }
 return {accepted,pending,overlap,conflicts};
}

/**
 * Aplica únicamente decisiones docentes expresamente autorizadas y todavía
 * concordantes con las firmas de ambas fuentes. Nunca edita una ficha.
 * Si el origen o la ficha local cambian, el conflicto vuelve a revisión.
 */
export function reconcileDecisions(audit, registry) {
 const records=registry?.decisiones??[];
 if(!Array.isArray(records))throw new TypeError('Registro de decisiones docentes inválido');
 const byLatin=new Map();
 for(const item of records) {
   if(!item?.latin||byLatin.has(latinKey(item.latin)))throw new Error('Decisión duplicada o sin étimo');
   byLatin.set(latinKey(item.latin),item);
 }
 const conflicts=[],resolvedConflicts=[];
 for(const conflict of audit.conflicts) {
   const item=byLatin.get(latinKey(conflict.item.latin));
   const aligned=item?.decision==='conservar'
     && item.sourceId===conflict.item.id
     && item.existingId===conflict.wordId
     && JSON.stringify(item.expectedSourceRules)===JSON.stringify(conflict.item.normas)
     && JSON.stringify(item.expectedCurrentRules)===JSON.stringify(conflict.currentRules);
   if(!aligned){conflicts.push(conflict);continue;}
   resolvedConflicts.push({
     sourceId:conflict.item.id,latin:conflict.item.latin,castellano:conflict.item.castellano,
     type:conflict.type,existingId:conflict.wordId,sourceRules:conflict.item.normas,
     existingRules:conflict.currentRules,decision:'conservar',
     decisionDate:registry.fecha,criterio:item.criterio
   });
 }
 return {...audit,conflicts,resolvedConflicts};
}
