/**
 * Etymologicon · cuestiones cerradas y ejercicios inversos de práctica.
 * Los distractores y los prompts proceden solo de relaciones expresamente
 * aprobadas. No se escribe ni modifica el indicador editorial inverseReady:
 * el ejercicio inverso es un entrenamiento derivado del inventario docente,
 * no un certificado de verificación filológica independiente.
 */
const LETTERS=/\p{L}/u;
const GREEK=/[\u0370-\u03ff\u1f00-\u1fff]/u;
const ROMAN_MAP={
  α:['a'],β:['b'],γ:['g'],δ:['d'],ε:['e'],ζ:['z'],
  η:['e','i'],θ:['th'],ι:['i'],κ:['k'],λ:['l'],μ:['m'],ν:['n'],
  ξ:['x','ks'],ο:['o'],π:['p'],ρ:['r'],σ:['s'],ς:['s'],τ:['t'],
  υ:['y','u'],φ:['ph','f'],χ:['ch','kh'],ψ:['ps'],ω:['o']
};
const REPLACEMENTS=[
  ['ph','φ'],['th','θ'],['kh','χ'],['ch','χ'],['ps','ψ'],
  ['ks','ξ'],['ou','ου'],['ai','αι'],['ei','ει'],['oi','οι'],['rh','ρ'],
  ['a','α'],['b','β'],['g','γ'],['d','δ'],['e','ε'],['z','ζ'],
  ['i','ι'],['k','κ'],['l','λ'],['m','μ'],['n','ν'],['x','ξ'],
  ['o','ο'],['p','π'],['r','ρ'],['s','σ'],['t','τ'],['y','υ'],
  ['u','υ'],['f','φ'],['v','β'],['h','η'],['w','ω']
];

function assert(condition,message){
  if(!condition)throw new Error('Etymologicon (cuestionario): '+message);
}
const headword=value=>String(value??'').split(/[|,]/)[0].replace(/\s*\(.*/, '').trim();
export function greekKey(value){
  return headword(value).normalize('NFD').toLocaleLowerCase('el')
    .replace(/\p{M}/gu,'').replace(/[ς]/g,'σ')
    .replace(/[^α-ω]/gu,'');
}
export function latinKey(value){
  return String(value??'').normalize('NFD').toLocaleLowerCase('es')
    .replace(/\p{M}/gu,'').replace(/[^a-z]/g,'');
}
function latinAlternatives(lemma){
  let variants=[''];
  for(const char of greekKey(lemma)){
    const options=ROMAN_MAP[char];
    if(!options)return [];
    variants=variants.flatMap(start=>options.map(end=>start+end)).slice(0,256);
  }
  return [...new Set(variants)];
}
export function latinToGreekPreview(input){
  const normalized=latinKey(input);
  let result='',i=0;
  while(i<normalized.length){
    const found=REPLACEMENTS.find(([latin])=>normalized.startsWith(latin,i));
    if(!found){i++;continue;}
    result+=found[1];i+=found[0].length;
  }
  // final sigma es ortográfica, pero no se asignan acentos por conjetura
  return result.replace(/σ$/,'ς');
}
function shuffle(list,random){
  const result=[...list];
  for(let i=result.length-1;i>0;i--){
    const value=random();
    assert(Number.isFinite(value)&&value>=0&&value<1,'azar fuera de rango');
    const j=Math.floor(value*(i+1));
    [result[i],result[j]]=[result[j],result[i]];
  }
  return result;
}
function draw(items,random){
  const value=random();
  assert(Number.isFinite(value)&&value>=0&&value<1,'azar fuera de rango');
  return items[Math.floor(value*items.length)];
}
export function createQuizBank(catalog){
  assert(catalog?.schema==='etymologicon-audited-catalog/v1'&&catalog.course==='gr1',
    'se necesita el banco cerrado de Griego I');
  assert(Array.isArray(catalog.etymons)&&Array.isArray(catalog.derivatives)&&
    Array.isArray(catalog.relations),'catálogo incompleto');
  const etyma=new Map(catalog.etymons.map(e=>[e.id,e]));
  const derivatives=new Map(catalog.derivatives.map(d=>[d.id,d]));
  assert(etyma.size===catalog.etymons.length&&derivatives.size===catalog.derivatives.length,
    'identificadores duplicados');
  const byEtymon=new Map();
  for(const e of catalog.etymons){
    if(e.editorialStatus==='approved_for_documented_derivatives')
      byEtymon.set(e.id,new Set());
  }
  const owners=new Map();
  for(const rel of catalog.relations){
    if(rel.editorialStatus!=='teacher_audit_approved'||
       !rel.eligibleFor?.includes('write_two'))continue;
    const e=etyma.get(rel.etymonId),d=derivatives.get(rel.derivativeId);
    assert(e?.editorialStatus==='approved_for_documented_derivatives'&&
      d?.editorialStatus==='teacher_audit_approved',
      'relación no autorizada '+rel.id);
    assert(!byEtymon.get(e.id).has(d.id),'relación repetida '+rel.id);
    byEtymon.get(e.id).add(d.id);
    if(!owners.has(d.id))owners.set(d.id,new Set());
    owners.get(d.id).add(e.id);
  }
  for(const [id,approved] of byEtymon){
    const teacher=new Set(etyma.get(id).teacherApprovedDerivatives);
    assert(teacher.size===approved.size&&[...teacher].every(x=>approved.has(x)),
      'el cuestionario difiere del inventario docente '+id);
  }
  // Las preguntas inversas solo utilizan derivados con un único dueño
  // global, no solamente único dentro de una ronda o unidad.
  const inverseCandidates=new Map();
  for(const [id,ownerIds] of owners){
    if(ownerIds.size!==1)continue;
    const eId=[...ownerIds][0];
    if(!inverseCandidates.has(eId))inverseCandidates.set(eId,[]);
    inverseCandidates.get(eId).push(id);
  }
  // Dos ortografías para una misma palabra griega pueden producir el mismo
  // romanizado. La ambigüedad se resuelve EXPLÍCITAMENTE, nunca por azar.
  const byGreek=new Map(),byLatin=new Map();
  for(const e of byEtymon.keys()){
    const lemma=etyma.get(e).lemma;
    const k=greekKey(lemma);
    if(!byGreek.has(k))byGreek.set(k,new Set());
    byGreek.get(k).add(e);
    for(const translit of latinAlternatives(lemma)){
      if(!byLatin.has(translit))byLatin.set(translit,new Set());
      byLatin.get(translit).add(e);
    }
  }
  const getIds=(map,key)=>[...(map.get(key)||[])];
  function preview(input){
    const value=String(input??'').trim();
    if(!value)return {greek:'',status:'empty',matches:[]};
    if(!/^[\p{L}\p{M}\s-]+$/u.test(value)||
       (GREEK.test(value)&&/[a-z]/i.test(value))){
      return {greek:'',status:'not_catalogued',matches:[]};
    }
    if(GREEK.test(value)){
      const ids=getIds(byGreek,greekKey(value));
      return {greek:ids.length===1?headword(etyma.get(ids[0]).lemma):value,
        status:ids.length===1?'recognized':ids.length>1?'ambiguous':'not_catalogued',
        matches:ids};
    }
    const key=latinKey(value);
    const ids=getIds(byLatin,key);
    const examples={philos:'φίλος',sophia:'σοφία',logos:'λόγος'};
    return {greek:ids.length===1?headword(etyma.get(ids[0]).lemma):
      (examples[key]||latinToGreekPreview(value)),
      status:ids.length===1?'recognized':ids.length>1?'ambiguous':'not_catalogued',
      matches:ids};
  }
  function mcq(targetId,{random=Math.random,optionCount=4}={}){
    assert(Number.isSafeInteger(optionCount)&&optionCount>=3&&optionCount<=5,
      'número de opciones no permitido');
    const e=etyma.get(targetId),approved=byEtymon.get(targetId);
    if(!e||!approved)return null;
    const possible=[...approved].map(id=>derivatives.get(id));
    const answer=draw(possible,random);
    const rejected=[...derivatives.values()].filter(d=>
      d.editorialStatus==='teacher_audit_approved'&&
      !approved.has(d.id)&&
      ![...owners.get(d.id)||[]].includes(targetId)&&
      d.form.toLocaleLowerCase('es')!==answer.form.toLocaleLowerCase('es'));
    // Todo distractor está en el banco, pero NINGUNO es una respuesta
    // aprobada para el étimo. Nunca se selecciona algo no catalogado.
    const distractors=shuffle(rejected,random).slice(0,optionCount-1);
    if(distractors.length<optionCount-1)return null;
    const options=shuffle([answer,...distractors],random).map(d=>({id:d.id,form:d.form}));
    return {etymonId:targetId,lemma:e.lemma,meaning:e.meaning,
      correctId:answer.id,options};
  }
  function inverse(targetId,{random=Math.random}={}){
    const e=etyma.get(targetId),candidateIds=inverseCandidates.get(targetId);
    if(!e||!candidateIds?.length)return null;
    const derivative=derivatives.get(draw(candidateIds,random));
    return {etymonId:targetId,derivativeId:derivative.id,derivative:derivative.form,
      canonicalLemma:headword(e.lemma),source:'approved_direct_relation_unique_owner'};
  }
  function gradeMcq(question,selectedId){
    assert(question&&byEtymon.has(question.etymonId),'pregunta desconocida');
    const selected=question.options.find(o=>o.id===selectedId);
    if(!selected)return {status:'unanswered',correct:false,correctForm:derivatives.get(question.correctId).form};
    return {status:selected.id===question.correctId?'correct':'incorrect',
      correct:selected.id===question.correctId,
      correctForm:derivatives.get(question.correctId).form};
  }
  function gradeInverse(question,input){
    assert(question&&byEtymon.has(question.etymonId),'pregunta inversa desconocida');
    const value=String(input??'').trim();
    if(!value)return {status:'unanswered',correct:false,correctLemma:question.canonicalLemma};
    const p=preview(value);
    if(p.status==='ambiguous')
      return {status:'ambiguous',correct:false,correctLemma:question.canonicalLemma};
    if(p.status!=='recognized')
      return {status:'not_catalogued',correct:false,correctLemma:question.canonicalLemma};
    return {status:p.matches[0]===question.etymonId?'correct':'incorrect',
      correct:p.matches[0]===question.etymonId,correctLemma:question.canonicalLemma};
  }
  return Object.freeze({mcq,inverse,preview,gradeMcq,gradeInverse,
    inverseEligibleIds:[...inverseCandidates.keys()]});
}
