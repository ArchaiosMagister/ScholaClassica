// Sintagmas construidos solo a partir de dos paradigmas completos documentados.
// Latín: adjetivo + sustantivo (género fijado y contrastado). Griego: artículo
// + adjetivo sustantivado; nunca se inventa un sustantivo griego.
import {availableRecords} from './engine.mjs';
import {selectReviewCandidates} from './review.mjs';
const LATIN_NOUNS=[
  ['rosa,','femenino','rosa'],
  ['dominus,','masculino','dominus'],
  ['bellum,','neutro','bellum'],
  ['flumen,','neutro','flumen'],
  ['mare,','neutro','mare'],
  ['exercitus,','masculino','exercitus'],
  ['cornū,','neutro','cornū'],
  ['res,','femenino','res']
];
const CASES_LAT=['nominativo','vocativo','acusativo','genitivo','dativo','ablativo'];
const CASES_GR=['nominativo','acusativo','genitivo','dativo'];
const NUMBERS=['singular','plural'];
const GENDERS=['masculino','femenino','neutro'];
const unique=a=>[...new Set(a)];
function assertRecord(r,language,kind){
  if(!r||r.language!==language||r.kind!==kind||
     r.evidence?.status!=='paradigma-documentado')throw Error('Falta evidencia curricular del sintagma');
  return r;
}
function forms(r,cas,number,gender){
  return unique(r.forms.filter(f=>f.case===cas&&f.number===number&&
    (!gender||f.gender===gender)).map(f=>f.form));
}
function nounPairs(records){
  const adjectives=records.filter(r=>r.kind==='adjetivo');
  if(!adjectives.length)return [];
  const pairs=[];
  for(const [prefix,gender,nom] of LATIN_NOUNS){
    const noun=records.find(r=>r.kind==='sustantivo'&&r.paradigm.startsWith(prefix));
    if(!noun)continue;
    assertRecord(noun,'latin','sustantivo');
    if(noun.gender&&noun.gender!==gender)throw Error('Género contradictorio: '+nom);
    if(!forms(noun,'nominativo','singular').includes(nom))
      throw Error('Nominativo incompatible con el género contrastado de '+nom);
    for(const adjective of adjectives){
      assertRecord(adjective,'latin','adjetivo');
      pairs.push({language:'latin',noun,adjective,gender,
        id:'latin:'+noun.id+':'+adjective.id,
        paradigm:adjective.paradigm+' + '+noun.paradigm,
        provenance:[noun.evidence,adjective.evidence],
        note:'Adjetivo y sustantivo latinos: caso, número y género concordantes.'});
    }
  }
  return pairs;
}
function greekPairs(records){
  const article=records.find(r=>r.id==='griego-articulo');
  if(!article)return [];
  assertRecord(article,'griego','artículo');
  return records.filter(r=>r.kind==='adjetivo').map(adjective=>{
    assertRecord(adjective,'griego','adjetivo');
    return {language:'griego',article,adjective,
      id:'griego:articulo:'+adjective.id,
      paradigm:'Artículo + '+adjective.paradigm+' (adjetivo sustantivado)',
      provenance:[article.evidence,adjective.evidence],
      note:'Artículo + adjetivo sustantivado, sin sustantivo independiente.'};
  });
}
function candidates(bank,language,unit){
  if(!['latin','griego'].includes(language)||unit<5)
    throw Error('La práctica de sintagmas solo está disponible desde UD5');
  const records=availableRecords(bank,{language,unit});
  return language==='latin'?nounPairs(records):greekPairs(records);
}
export function phrasePairs(bank,{language,unit}){
  return candidates(bank,language,unit);
}
function makeCell(pair,cas,number,gender){
  const left=pair.language==='latin'?pair.adjective:pair.article;
  const right=pair.language==='latin'?pair.noun:pair.adjective;
  const first=forms(left,cas,number,gender);
  const second=forms(right,cas,number,pair.language==='latin'?null:gender);
  if(first.length===0||second.length===0)return null;
  // Todas las alternativas provienen de dos casillas explícitas ya verificadas.
  const acceptedForms=unique(first.flatMap(f=>second.map(s=>f+' '+s)));
  return {id:cas+':'+number,case:cas,number,acceptedForms};
}
function models(bank,language,unit){
  const pairs=candidates(bank,language,unit);
  const result=[];
  for(const pair of pairs){
    for(const gender of pair.language==='latin'?[pair.gender]:GENDERS){
      const cases=pair.language==='latin'?CASES_LAT:CASES_GR;
      const cells=[];
      for(const cas of cases)for(const number of NUMBERS){
        const cell=makeCell(pair,cas,number,gender);
        if(!cell)throw Error('Sin forma concordante: '+pair.id+' '+gender+' '+cas+' '+number);
        cells.push(cell);
      }
      if(cells.length!==cases.length*2)throw Error('Tabla incompleta');
      result.push({pair,gender,cells,id:'phrase:'+pair.id+':'+gender});
    }
  }
  return result;
}
export function makePhraseQuestions(bank,{language,unit,limit=10,rng=Math.random,
  reviewMode='all',reviewState,now=Date.now()}={}){
  const output=[];
  for(const model of models(bank,language,unit)){
    for(const cell of model.cells){
      output.push({
        id:model.id+':'+cell.id,activity:'written',kind:'sintagma',language,
        paradigm:model.pair.paradigm,evidence:model.pair.adjective.evidence,
        sources:model.pair.provenance,acceptedForms:cell.acceptedForms,
        correct:cell.acceptedForms[0],
        prompt:'Escribe el sintagma en '+cell.case+' '+model.gender+' '+cell.number+
          (language==='griego'?' (adjetivo sustantivado)':'')+'.'
      });
    }
  }
  return selectReviewCandidates(output,{mode:reviewMode,state:reviewState,limit,rng,now});
}
export function makePhraseTables(bank,{language,unit,limit=10,rng=Math.random,
  reviewMode='all',reviewState,now=Date.now()}={}){
  const output=models(bank,language,unit).map(model=>({
    id:model.id+':table',activity:'table',kind:'sintagma',language,gender:model.gender,
    paradigm:model.pair.paradigm,evidence:model.pair.adjective.evidence,
    sources:model.pair.provenance,cells:model.cells,
    prompt:'Declina el sintagma completo en '+model.gender+
      (language==='griego'?' (artículo + adjetivo sustantivado)':' (adjetivo + sustantivo)')+'.'
  }));
  return selectReviewCandidates(output,{mode:reviewMode,state:reviewState,limit,rng,now});
}
