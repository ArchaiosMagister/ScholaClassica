/**
 * Etymologicon · estudio de tarjetas y emparejamientos.
 * Solo relaciones expresamente autorizadas en el catálogo docente.
 * Las palabras compartidas por varios étimos no se utilizan en relación
 * 1:1 para evitar exigir una correspondencia etimológica única falsa.
 */
function check(condition,message){
  if(!condition)throw new Error('Ejercicio de relaciones: '+message);
}
export function createStudyBank(catalog){
  check(catalog?.schema==='etymologicon-audited-catalog/v1'&&catalog.course==='gr1',
    'se necesita el catálogo auditado de Griego I');
  check(Array.isArray(catalog.etymons)&&Array.isArray(catalog.derivatives)&&
    Array.isArray(catalog.relations),'catálogo incompleto');
  const etyma=new Map(catalog.etymons.map(e=>[e.id,e]));
  const derived=new Map(catalog.derivatives.map(d=>[d.id,d]));
  check(etyma.size===catalog.etymons.length,'étimos duplicados');
  check(derived.size===catalog.derivatives.length,'derivados duplicados');
  const relations=new Map(),owners=new Map();
  for(const e of catalog.etymons){
    if(e.editorialStatus==='approved_for_documented_derivatives'){
      check(e.teacherApprovedDerivatives?.length>=2,'faltan dos derivados para '+e.id);
      relations.set(e.id,new Set());
    }
  }
  for(const rel of catalog.relations){
    if(rel.editorialStatus!=='teacher_audit_approved'||!rel.eligibleFor?.includes('write_two'))continue;
    const e=etyma.get(rel.etymonId),d=derived.get(rel.derivativeId);
    check(e?.editorialStatus==='approved_for_documented_derivatives'&&
      d?.editorialStatus==='teacher_audit_approved','relación no aprobada '+rel.id);
    check(relations.has(e.id),'étimo no elegible '+e.id);
    check(!relations.get(e.id).has(d.id),'relación repetida '+rel.id);
    relations.get(e.id).add(d.id);
    if(!owners.has(d.id))owners.set(d.id,new Set());
    owners.get(d.id).add(e.id);
  }
  for(const e of catalog.etymons.filter(e=>relations.has(e.id))){
    const actual=relations.get(e.id),expected=new Set(e.teacherApprovedDerivatives);
    check(actual.size===expected.size&&[...actual].every(id=>expected.has(id)),
      'diferencia frente al banco aprobado '+e.id);
  }
  const getCard=id=>{
    const e=etyma.get(id);
    if(!e||!relations.has(id))return null;
    return {id:e.id,lemma:e.lemma,meaning:e.meaning,units:[...e.units],
      derivatives:[...relations.get(id)].map(derivativeId=>({
        id:derivativeId,form:derived.get(derivativeId).form
      }))};
  };
  const eligibleIds=[...relations.keys()];
  function matchable(pool){
    check(Array.isArray(pool),'se requiere lista de étimos');
    const unique=new Set(pool.map(x=>x.id));
    const available=[];
    for(const id of unique){
      if(!relations.has(id))continue;
      const possible=[...relations.get(id)].filter(derivativeId=>owners.get(derivativeId).size===1);
      if(possible.length)available.push({etymonId:id,possible});
    }
    return available;
  }
  function createRound(pool,{count=4,random=Math.random,previousIds=[]}={}){
    check(Number.isSafeInteger(count)&&count>=2&&count<=8,'número de parejas no permitido');
    check(typeof random==='function','generador aleatorio inválido');
    const available=matchable(pool);
    if(available.length<2)return null;
    const remaining=[...available];
    const selected=[];
    const draw=n=>{
      const value=random();
      check(typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<1,
        'aleatoriedad fuera de rango');
      return Math.floor(value*n);
    };
    while(remaining.length&&selected.length<Math.min(count,available.length)){
      // Evita repetir la misma ronda exacta cuando sobran opciones.
      const fresh=remaining.filter(x=>!previousIds.includes(x.etymonId));
      const candidates=fresh.length?fresh:remaining;
      const choice=candidates[draw(candidates.length)];
      remaining.splice(remaining.indexOf(choice),1);
      const derivativeId=choice.possible[draw(choice.possible.length)];
      const etymon=etyma.get(choice.etymonId);
      selected.push({etymonId:etymon.id,lemma:etymon.lemma,
        derivativeId,form:derived.get(derivativeId).form});
    }
    // Se mezclan SOLO las opciones, nunca la correspondencia editorial.
    const options=[...selected];
    for(let i=options.length-1;i>0;i--){
      const j=draw(i+1);
      [options[i],options[j]]=[options[j],options[i]];
    }
    return {
      pairs:selected,
      spanishOptions:options.map(x=>({derivativeId:x.derivativeId,form:x.form})),
      maximum:selected.length
    };
  }
  return Object.freeze({getCard,createRound,matchable,eligibleIds});
}
