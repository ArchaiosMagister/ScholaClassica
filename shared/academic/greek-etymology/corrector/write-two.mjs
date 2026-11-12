/**
 * Etymologicon: corrector autónomo para el ejercicio «escribe dos derivados».
 * No consulta servicios externos ni modifica bancos o datos del usuario.
 * Los candidatos sin aprobación editorial NUNCA sirven para puntuar.
 */
const EXACT=1, TYPO=0.5, ZERO=0;
const SPANISH=/^[\p{L}\p{M}\s\u200B-\u200D\uFEFF-]+$/u;
const BASE=s=>s.normalize('NFD').replace(/\p{M}/gu,'');
const clean=s=>s.normalize('NFC').toLocaleLowerCase('es')
  .replace(/[\s\u200B-\u200D\uFEFF]/gu,'');
const graphemes=s=>Array.from(s);
const isVowel=c=>/^[aeiou]$/u.test(BASE(c||''));
const isConsonant=c=>/^[bcdfghjklmnñpqrstvwxyz]$/u.test(BASE(c||''));
const confusables=new Set(['bv','vb','cs','sc','cz','zc','sz','zs','gj','jg','iy','yi','ck','kc','kq','qk']);

/** Distancia OSA (Damerau restringida): tiene en cuenta una transposición adyacente. */
function distance(left,right){
  const a=graphemes(left),b=graphemes(right),rows=a.length+1,cols=b.length+1;
  const dp=Array.from({length:rows},()=>Array(cols).fill(0));
  for(let i=0;i<rows;i++)dp[i][0]=i;
  for(let j=0;j<cols;j++)dp[0][j]=j;
  for(let i=1;i<rows;i++)for(let j=1;j<cols;j++){
    const cost=a[i-1]===b[j-1]?0:1;
    dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+cost);
    if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])
      dp[i][j]=Math.min(dp[i][j],dp[i-2][j-2]+1);
  }
  return dp[a.length][b.length];
}
function typoLimit(length){
  if(length<5)return 0;
  if(length>=12)return 3;
  if(length>=8)return 2;
  return 1;
}
function grammaticalEndingChanged(input,model){
  const a=BASE(input),b=BASE(model);
  if((a===b+'s'||b===a+'s'||a===b+'es'||b===a+'es'))return true;
  if(a.length===b.length&&a.slice(0,-1)===b.slice(0,-1)&&
     /[ao]$/.test(a)&&/[ao]$/.test(b)&&a.at(-1)!==b.at(-1))return true;
  return false;
}
/**
 * Reconocimiento conservador de erratas, NO aprobación por semejanza:
 * diacríticos, transposición, duplicación, omisión consonántica interior,
 * confusiones gráficas habituales y alguna vocal omitida lejos del sufijo.
 * Los plurales/flexiones y cambios de terminación no se interpretan como faltas.
 */
function orthographicallyRecognizable(input,model){
  if(input===model)return false;
  if(BASE(input)===BASE(model))return true;
  if(grammaticalEndingChanged(input,model))return false;
  const a=graphemes(input),b=graphemes(model);
  const limit=typoLimit(Math.min(a.length,b.length));
  if(!limit||distance(input,model)>limit)return false;
  const memo=new Map();
  function walk(i,j,k){
    const id=i+':'+j+':'+k;
    if(memo.has(id))return memo.get(id);
    let answer=false;
    if(i===a.length&&j===b.length)answer=k>0;
    else if(i<a.length&&j<b.length&&a[i]===b[j])answer=walk(i+1,j+1,k);
    else if(k<limit){
      if(i<a.length&&j<b.length&&BASE(a[i])===BASE(b[j]))
        answer=walk(i+1,j+1,k+1);
      if(!answer&&i+1<a.length&&j+1<b.length&&
         a[i]===b[j+1]&&a[i+1]===b[j]&&a[i]!==a[i+1])
        answer=walk(i+2,j+2,k+1);
      if(!answer&&i<a.length&&j<b.length&&
         confusables.has(BASE(a[i])+BASE(b[j])))
        answer=walk(i+1,j+1,k+1);
      // Error de repetición: "prosélitto" por "prosélito".
      if(!answer&&i<a.length&&
         ((i>0&&a[i]===a[i-1])||(i+1<a.length&&a[i]===a[i+1])))
        answer=walk(i+1,j,k+1);
      if(!answer&&j<b.length&&
         ((j>0&&b[j]===b[j-1])||(j+1<b.length&&b[j]===b[j+1])))
        answer=walk(i,j+1,k+1);
      // Una consonante interior omitida o añadida.
      if(!answer&&i>1&&i<a.length-2&&isConsonant(a[i]))
        answer=walk(i+1,j,k+1);
      if(!answer&&j>1&&j<b.length-2&&isConsonant(b[j]))
        answer=walk(i,j+1,k+1);
      // Las vocales interiores solo si están alejadas de la flexión final.
      if(!answer&&i>2&&i<a.length-3&&isVowel(a[i]))
        answer=walk(i+1,j,k+1);
      if(!answer&&j>2&&j<b.length-3&&isVowel(b[j]))
        answer=walk(i,j+1,k+1);
    }
    memo.set(id,answer);
    return answer;
  }
  return walk(0,0,0);
}
function visibleDiff(submitted,correctForm){
  const a=graphemes(clean(submitted)),b=graphemes(clean(correctForm));
  let before=0,after=0;
  while(before<a.length&&before<b.length&&a[before]===b[before])before++;
  while(after<a.length-before&&after<b.length-before&&
    a[a.length-1-after]===b[b.length-1-after])after++;
  return {
    before:a.slice(0,before).join(''),
    submittedError:a.slice(before,a.length-after).join(''),
    correctSpelling:b.slice(before,b.length-after).join(''),
    after:b.slice(b.length-after).join('')
  };
}
function badAnswer(submitted,status,message){
  return {submitted,points:ZERO,status,matchedDerivativeId:null,correctForm:null,highlight:null,message};
}
const messages={
  blank:'No se ha escrito ningún derivado.',
  unlisted:'La respuesta no figura en el repertorio cerrado. Esto no demuestra que sea etimológicamente incorrecta.',
  ambiguous:'La grafía se aproxima a varias respuestas o no permite reconocer con seguridad un único derivado; no se asigna puntuación.',
  excluded:'El derivado está excluido de los ejercicios por decisión docente.',
  other_etymon:'El derivado está catalogado, pero no está autorizado para este étimo.',
  duplicate:'Ya se ha puntuado este mismo derivado, aunque esté escrito con otra variante o con erratas.',
  not_eligible:'Este étimo está reservado para consulta y no permite el ejercicio de dos derivados.'
};

export function createWriteTwoCorrector(catalog){
  if(catalog?.schema!=='etymologicon-audited-catalog/v1'||catalog.course!=='gr1')
    throw new Error('Se necesita el catálogo auditado y cerrado de Griego I (no candidatos ni Griego II).');
  if(!Array.isArray(catalog.etymons)||!Array.isArray(catalog.derivatives)||
     !Array.isArray(catalog.relations)||!Array.isArray(catalog.excluded))
    throw new Error('Catálogo académico incompleto.');
  const etyma=new Map(catalog.etymons.map(e=>[e.id,e]));
  const dictionary=new Map(catalog.derivatives.map(d=>[d.id,d]));
  const allowed=new Map();
  for(const e of catalog.etymons){
    if(allowed.has(e.id))throw new Error('Étimo repetido: '+e.id);
    allowed.set(e.id,new Set());
  }
  const observedRelations=new Set();
  for(const rel of catalog.relations){
    if(rel.editorialStatus!=='teacher_audit_approved'||!rel.eligibleFor?.includes('write_two'))continue;
    if(observedRelations.has(rel.id))throw new Error('Relación repetida: '+rel.id);
    observedRelations.add(rel.id);
    const e=etyma.get(rel.etymonId),d=dictionary.get(rel.derivativeId);
    if(!e||!d||e.editorialStatus!=='approved_for_documented_derivatives'||
       d.editorialStatus!=='teacher_audit_approved')
      throw new Error('Relación sin aprobación editorial: '+rel.id);
    allowed.get(e.id).add(d.id);
  }
  for(const e of catalog.etymons){
    if(e.editorialStatus==='approved_for_documented_derivatives'){
      if(allowed.get(e.id).size<2)throw new Error('Faltan dos derivados autorizados: '+e.id);
      const teacher=new Set(e.teacherApprovedDerivatives);
      if(teacher.size!==allowed.get(e.id).size||
         [...teacher].some(id=>!allowed.get(e.id).has(id)))
        throw new Error('Discrepancia con el Excel auditado: '+e.id);
    }else if(e.editorialStatus!=='reference_only'||allowed.get(e.id).size)
      throw new Error('Estado o exclusión incoherente del étimo: '+e.id);
  }
  const exact=new Map(),forms=[];
  for(const d of catalog.derivatives){
    if(d.editorialStatus!=='teacher_audit_approved')continue;
    for(const form of [d.form,...d.officialOrthographicVariants]){
      if(typeof form!=='string'||!form.trim())throw new Error('Grafía vacía para '+d.id);
      const key=clean(form);
      if(exact.has(key)&&exact.get(key).derivativeId!==d.id)
        throw new Error('Grafía ambigua entre derivados aprobados: '+form);
      exact.set(key,{derivativeId:d.id,form});
      forms.push({key,derivativeId:d.id});
    }
  }
  const excluded=new Set(catalog.excluded.map(item=>clean(item.form)));
  for(const x of excluded){
    if(exact.has(x))throw new Error('Un derivado excluido figura también como apto: '+x);
    // Una errata próxima a una palabra excluida no puede atribuirse
    // automáticamente a otro derivado aprobado.
    forms.push({key:x,derivativeId:'excluded:'+x});
  }

  function recognize(etymonId,submitted){
    const input=clean(submitted);
    if(!input)return badAnswer(submitted,'blank',messages.blank);
    if(excluded.has(input))return badAnswer(submitted,'excluded',messages.excluded);
    const hit=exact.get(input);
    if(hit){
      if(!allowed.get(etymonId).has(hit.derivativeId))
        return badAnswer(submitted,'other_etymon',messages.other_etymon);
      return {submitted,points:EXACT,status:'exact',matchedDerivativeId:hit.derivativeId,
        correctForm:dictionary.get(hit.derivativeId).form,highlight:null,
        message:'Derivado admitido, escrito correctamente (o con una variante autorizada).'};
    }
    if(!SPANISH.test(submitted))
      return badAnswer(submitted,'unlisted',messages.unlisted);
    const all=[];
    let nearest=Infinity;
    for(const f of forms){
      const d=distance(input,f.key);
      if(d<nearest){nearest=d;all.length=0;}
      if(d===nearest)all.push(f);
    }
    const plausible=all.filter(f=>orthographicallyRecognizable(input,f.key));
    const derivativeIds=new Set(all.map(f=>f.derivativeId));
    if(plausible.length===0)return badAnswer(submitted,'unlisted',messages.unlisted);
    // Aunque una de las formas parezca más plausible, una distancia idéntica
    // a otro derivado convierte la inferencia en ambigua.
    if(derivativeIds.size!==1)return badAnswer(submitted,'ambiguous',messages.ambiguous);
    const id=all[0].derivativeId;
    if(!allowed.get(etymonId).has(id))
      return badAnswer(submitted,'unlisted',messages.unlisted);
    const corrected=dictionary.get(id).form;
    return {submitted,points:TYPO,status:'orthographic_error',
      matchedDerivativeId:id,correctForm:corrected,
      highlight:visibleDiff(submitted,corrected),
      message:'El derivado autorizado se reconoce por una errata inequívoca. Grafía correcta: '+corrected+'.'};
  }

  function grade(etymonId,responses){
    if(typeof etymonId!=='string'||!etyma.has(etymonId))throw new Error('Étimo desconocido: '+etymonId);
    if(!Array.isArray(responses)||responses.length!==2||responses.some(v=>typeof v!=='string'))
      throw new TypeError('Se exigen exactamente dos respuestas de texto.');
    const etymon=etyma.get(etymonId);
    if(etymon.editorialStatus!=='approved_for_documented_derivatives')
      return {etymonId,status:'not_eligible',answers:responses.map(s=>badAnswer(s,'not_eligible',messages.not_eligible)),
        total:ZERO,maximum:2};
    const answers=responses.map(s=>recognize(etymonId,s));
    // Las dos casillas no pueden puntuar el mismo lema con grafías diferentes.
    // Se conserva la puntuación más alta (1 punto antes que 0,5).
    const winners=new Map();
    for(let i=0;i<answers.length;i++){
      const a=answers[i];
      if(a.points===ZERO)continue;
      const old=winners.get(a.matchedDerivativeId);
      if(old===undefined||a.points>answers[old].points)winners.set(a.matchedDerivativeId,i);
    }
    for(let i=0;i<answers.length;i++){
      const a=answers[i];
      if(a.points>ZERO&&winners.get(a.matchedDerivativeId)!==i){
        answers[i]={...a,points:ZERO,status:'duplicate',highlight:null,message:messages.duplicate};
      }
    }
    return {etymonId,status:'evaluated',answers,total:answers.reduce((sum,a)=>sum+a.points,0),maximum:2};
  }
  return Object.freeze({grade,isEligible:id=>etyma.get(id)?.editorialStatus==='approved_for_documented_derivatives'});
}
