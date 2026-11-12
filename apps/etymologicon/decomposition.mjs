import {greekKey,latinKey,latinToGreekPreview} from './quiz.mjs';

const HAS_GREEK=/[\u0370-\u03ff\u1f00-\u1fff]/u;
const GREEK_INPUT=/^[\p{Script=Greek}\p{M}\s-]+$/u;
const LATIN_INPUT=/^[a-zA-ZÀ-ÿ\s-]+$/u;

/**
 * Corrector estrictamente determinista para descomposiciones del piloto.
 * Se comparan étimos subyacentes, no se afirma que el español se forme
 * directamente por yuxtaposición de dos nominativos griegos.
 */
export function createDecompositionBank(data){
  if(data?.schema!=='etymologicon-decomposition-learners/v1'||
     data?.course!=='gr1'||data.status!=='closed_pilot_for_guided_practice_not_exam'||
     data.publicationAllowed!==false||!Array.isArray(data.entries)||data.entries.length!==16)
    throw new Error('Se necesita el banco cerrado y contrastado de descomposición de Griego I.');
  const byId=new Map();
  const indices={greek:new Map(),latin:new Map()};
  const all=new Map();
  for(const item of data.entries){
    if(byId.has(item.id)||item.verificationStatus!=='approved_for_guided_decomposition'||
       item.enabledForExams!==false||item.parts?.length!==2)
      throw new Error('Ficha de descomposición no aprobada: '+item.id);
    byId.set(item.id,item);
    for(const part of item.parts){
      const old=all.get(part.etymonId);
      if(old&&old.greek!==part.greek)throw new Error('Mismo étimo con grafías contradictorias');
      all.set(part.etymonId,part);
    }
  }
  function add(index,key,id){
    if(!key)return;
    if(!index.has(key))index.set(key,new Set());
    index.get(key).add(id);
  }
  for(const [id,part] of all){
    add(indices.greek,greekKey(part.greek),id);
    for(const value of part.latinAccepted)
      add(indices.latin,latinKey(value),id);
  }
  function read(value){
    const raw=String(value??'').trim();
    if(!raw)return {status:'blank',matches:[],greek:'',raw};
    const greek=HAS_GREEK.test(raw);
    if(greek&&!GREEK_INPUT.test(raw)||!greek&&!LATIN_INPUT.test(raw))
      return {status:'not_catalogued',matches:[],greek:'',raw};
    const ids=greek?indices.greek.get(greekKey(raw)):
      indices.latin.get(latinKey(raw));
    const matches=ids?[...ids]:[];
    const canonical=matches.length===1?all.get(matches[0]).greek:
      greek?raw:latinToGreekPreview(raw);
    return {status:matches.length===1?'recognized':matches.length>1?'ambiguous':'not_catalogued',
      matches,greek:canonical,raw};
  }
  function grade(exerciseId,answers){
    const exercise=byId.get(exerciseId);
    if(!exercise)throw new Error('Palabra de descomposición no autorizada.');
    if(!Array.isArray(answers)||answers.length!==2||
       answers.some(x=>typeof x!=='string'))
      throw new TypeError('Se requieren exactamente dos componentes escritos.');
    const graded=exercise.parts.map((part,i)=>{
      const found=read(answers[i]);
      const correct=found.status==='recognized'&&found.matches[0]===part.etymonId;
      return {
        submitted:answers[i],points:correct?1:0,
        status:correct?'correct':found.status==='blank'?'blank':
          found.status==='ambiguous'?'ambiguous':
          found.status==='recognized'?'another_etymon':'not_catalogued',
        correctGreek:part.greek,combiningForm:part.combiningForm,
        gloss:part.gloss,etymonId:part.etymonId
      };
    });
    return {exerciseId,total:graded.reduce((s,a)=>s+a.points,0),
      maximum:2,answers:graded,status:'graded'};
  }
  function available({mode='general',unit='all',pool=[]}={}){
    const ids=new Set(pool.map(e=>e.id));
    if(mode==='unit'){
      const n=Number(String(unit).replace('UD',''));
      if(!/^UD\d+$/.test(unit)||!Number.isSafeInteger(n))return [];
      return [...byId.values()].filter(x=>n>=Number(x.introducedAtUnit.slice(2)));
    }
    if(mode==='errors'){
      return [...byId.values()].filter(x=>x.parts.some(p=>ids.has(p.etymonId)));
    }
    return [...byId.values()];
  }
  function select(list,{previousId=null,random=Math.random}={}){
    if(!list.length)return null;
    const eligible=list.length>1?list.filter(x=>x.id!==previousId):list;
    const n=random();
    if(!Number.isFinite(n)||n<0||n>=1)throw new Error('Aleatoriedad inválida.');
    return eligible[Math.floor(n*eligible.length)];
  }
  return Object.freeze({get:id=>byId.get(id)||null,read,grade,available,select,
    size:byId.size});
}
