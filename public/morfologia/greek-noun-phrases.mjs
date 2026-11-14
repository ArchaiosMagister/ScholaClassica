// Concordancia íntegra y documentada: artículo (Appendix UD3) + sustantivo
// individual (Vocabula/UniMorph) + adjetivo (Appendix UD5).
// Se admiten las DOS posiciones atributivas clásicas; nunca la secuencia
// artículo + sustantivo + adjetivo sin segundo artículo como atributiva.
import {availableRecords} from './engine.mjs';
import {selectReviewCandidates} from './review.mjs';
const CASES=['nominativo','acusativo','genitivo','dativo'];
const NUMBERS=['singular','plural'];
// πολύς expresa cantidad y puede imponer restricciones semánticas según
// el sustantivo contable y el número; se mantiene en los ejercicios anteriores.
const ADJECTIVE_IDS=['griego-adj-agathos','griego-adj-barbaros','griego-adj-megas'];
const unique=a=>[...new Set(a)];
function shape(r,kind){
  if(!r||r.language!=='griego'||r.kind!==kind||
    r.evidence?.status!=='paradigma-documentado')
    throw Error('La concordancia exige tres paradigmas documentados');
  return r;
}
function nounForm(r,cas,number,gender){
  const matches=r.forms.filter(f=>f.case===cas&&f.number===number&&
    (!f.gender||f.gender===gender));
  return unique(matches.map(f=>f.form.normalize('NFC')));
}
export function graveInContext(word){
  const letters=Array.from(word.normalize('NFD'));
  const vowels=/[αεηιουωΑΕΗΙΟΥΩ]/u;
  let idx=-1;
  for(let i=0;i<letters.length;i++)if(vowels.test(letters[i]))idx=i;
  if(idx<0)return word.normalize('NFC');
  // Agudo en la última vocal de palabra oxítona -> grave delante de otra
  // palabra no enclítica. Los circunflejos y acentos anteriores no se alteran.
  for(let i=idx+1;i<letters.length&&/[\u0300-\u036f]/u.test(letters[i]);i++){
    if(letters[i]==='\u0301')letters[i]='\u0300';
  }
  return letters.join('').normalize('NFC');
}
export function greekNounPhrasePairs(bank,{language,unit}){
  if(language!=='griego'||unit<5)
    throw Error('Los sintagmas nominales griegos solo se habilitan en Griego I desde UD5');
  const records=availableRecords(bank,{language,unit});
  const article=shape(records.find(r=>r.id==='griego-articulo'),'artículo');
  const nouns=records.filter(r=>r.kind==='sustantivo'&&
    r.id.startsWith('griego-sustantivo-')&&
    r.evidence?.review?.includes('conciliación interfuentes')&&
    // ἄνθρωπος es de género común (ὁ/ἡ): se practica individualmente,
    // pero no se fuerza a una única concordancia con el adjetivo.
    r.gender!=='común');
  const adjectives=ADJECTIVE_IDS.map(id=>shape(records.find(r=>r.id===id),'adjetivo'));
  return nouns.flatMap(noun=>{
    shape(noun,'sustantivo');
    if(!['masculino','femenino','neutro'].includes(noun.gender))
      throw Error('Sustantivo sin género único: '+noun.paradigm);
    for(const cas of CASES)for(const number of NUMBERS)
      if(nounForm(noun,cas,number,noun.gender).length!==1)
        throw Error('Sustantivo sin casilla única documentada: '+noun.paradigm);
    return adjectives.map(adjective=>({
      article,noun,adjective,language:'griego',gender:noun.gender,
      id:'griego:nominal:'+noun.id+':'+adjective.id,
      paradigm:'Artículo + sustantivo + adjetivo · '+noun.paradigm+' + '+adjective.paradigm,
      provenance:[article.evidence,noun.evidence,adjective.evidence]
    }));
  });
}
function cells(pair){
  const output=[];
  for(const cas of CASES)for(const number of NUMBERS){
    const article=nounForm(pair.article,cas,number,pair.gender);
    const noun=nounForm(pair.noun,cas,number,pair.gender);
    const adj=nounForm(pair.adjective,cas,number,pair.gender);
    if(article.length!==1||noun.length!==1||adj.length!==1)
      throw Error('No hay tres casillas completas y concordantes: '+pair.id);
    const [a]=article,[n]=noun,[j]=adj;
    // Primera posición atributiva: ὁ ἀγαθὸς ἵππος.
    const first=a+' '+graveInContext(j)+' '+n;
    // Segunda posición atributiva: ὁ ἵππος ὁ ἀγαθός.
    const second=a+' '+graveInContext(n)+' '+a+' '+j;
    output.push({id:cas+':'+number,case:cas,number,
      acceptedForms:unique([first,second])});
  }
  return output;
}
function options(bank,{language,unit,limit=10,rng=Math.random,
  reviewMode='all',reviewState,now=Date.now()}={}){
  const pairs=greekNounPhrasePairs(bank,{language,unit});
  return {pairs,limit,rng,reviewMode,reviewState,now};
}
export function makeGreekNounPhraseQuestions(bank,input={}){
  const {pairs,limit,rng,reviewMode,reviewState,now}=options(bank,input);
  const questions=pairs.flatMap(pair=>cells(pair).map(cell=>({
    id:pair.id+':'+cell.id,activity:'written',kind:'sintagma',language:'griego',
    paradigm:pair.paradigm,evidence:pair.adjective.evidence,sources:pair.provenance,
    acceptedForms:cell.acceptedForms,correct:cell.acceptedForms[0],
    prompt:'Escribe el sintagma en '+cell.case+' '+pair.gender+' '+cell.number+
      '. Puedes utilizar la primera o la segunda posición atributiva.'
  })));
  return selectReviewCandidates(questions,{mode:reviewMode,state:reviewState,limit,rng,now});
}
export function makeGreekNounPhraseTables(bank,input={}){
  const {pairs,limit,rng,reviewMode,reviewState,now}=options(bank,input);
  const questions=pairs.map(pair=>({
    id:pair.id+':table',activity:'table',kind:'sintagma',language:'griego',
    paradigm:pair.paradigm,evidence:pair.adjective.evidence,sources:pair.provenance,
    gender:pair.gender,cells:cells(pair),
    prompt:'Declina artículo + sustantivo + adjetivo en '+pair.gender+
      '. Se aceptan las dos posiciones atributivas.'
  }));
  return selectReviewCandidates(questions,{mode:reviewMode,state:reviewState,limit,rng,now});
}
