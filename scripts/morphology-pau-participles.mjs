// Participios completos asociados a lemas de las preguntas de PAU.
import assert from 'node:assert/strict';
import {latinFold} from './morphology-pau-latin2.mjs';
const CASES=['nominativo','vocativo','acusativo','genitivo','dativo','ablativo'];
const GENDERS=['masculino','femenino','neutro'];
const PPP=[
 ['reficio','reficio, reficere, refeci, refectum (3.ª mixta)','refect'],
 ['arrigo','arrigo, arrigere, arrexi, arrectum (3.ª)','arrect'],
 ['dispono','dispono, disponere, disposui, dispositum (3.ª)','disposit'],
 ['exploro','exploro, explorare, exploravi, exploratum (1.ª)','explorat'],
 ['accipio','accipio, accipere, accepi, acceptum (3.ª mixta)','accept'],
 ['dimitto','dimitto, dimittere, dimisi, dimissum (3.ª)','dimiss'],
 ['trado','trado, tradere, tradidi, traditum (3.ª)','tradit'],
 ['conficio','conficio, conficere, confeci, confectum (3.ª mixta)','confect'],
 ['conquiro','conquiro, conquirere, conquisivi, conquisitum (3.ª)','conquisit'],
 ['incendo','incendo, incendere, incendi, incensum (3.ª)','incens'],
 ['do','do, dare, dedi, datum (1.ª)','dat'],
 ['pono','pono, ponere, posui, positum (3.ª)','posit'],
 ['expello','expello, expellere, expuli, expulsum (3.ª)','expuls'],
 ['relinquo','relinquo, relinquere, reliqui, relictum (3.ª)','relict']
];
const PRESENT=[
 ['triumpho','triumpho, triumphare, triumphavi, triumphatum (1.ª)','triumphant','triumphans'],
 ['pugno','pugno, pugnare, pugnavi, pugnatum (1.ª)','pugnant','pugnans']
];
function firstDecl(stem,gender,number){
  const nom=gender==='masculino'?stem+'us':gender==='femenino'?stem+'a':stem+'um';
  if(number==='singular')return gender==='masculino'?
    [nom,stem+'e',stem+'um',stem+'i',stem+'o',stem+'o']:
    gender==='femenino'?
      [nom,nom,stem+'am',stem+'ae',stem+'ae',stem+'a']:
      [nom,nom,nom,stem+'i',stem+'o',stem+'o'];
  return gender==='masculino'?
    [stem+'i',stem+'i',stem+'os',stem+'orum',stem+'is',stem+'is']:
    gender==='femenino'?
      [stem+'ae',stem+'ae',stem+'as',stem+'arum',stem+'is',stem+'is']:
      [stem+'a',stem+'a',stem+'a',stem+'orum',stem+'is',stem+'is'];
}
function presentDecl(stem,nom,gender,number){
  const n=gender==='neutro';
  return number==='singular'?
    [nom,nom,n?nom:stem+'em',stem+'is',stem+'i',stem+'e']:
    [n?stem+'ia':stem+'es',n?stem+'ia':stem+'es',
      n?stem+'ia':stem+'es',stem+'ium',stem+'ibus',stem+'ibus'];
}
function compile(id,headword,tense,voice,decl){
  const forms=[];
  for(const gender of GENDERS)for(const number of ['singular','plural']){
    const cells=decl(gender,number);
    assert.equal(cells.length,6);
    for(const [i,cas] of CASES.entries()){
      const form=cells[i];
      forms.push({form,case:cas,gender,number,
        analysis:'participio · '+headword+' · '+tense+' · voz '+voice+' · '+
          cas+' · '+gender+' · '+number});
    }
  }
  return {id:'latin2-pau-participle-'+id,language:'latin2',unit:0,kind:'participio',
    headword,paradigm:headword,forms,evidence:{
      source:'Modelos escolares de flexión de participios y lemas PAU CV',
      file:'shared/academic/latin2/pau-cv-2006-2026.tsv',
      status:'paradigma-documentado',topic:'Formas participiales de PAU',caption:id,unit:0,
      verification:'generación morfológica; no constituye cotejo independiente de cada forma',
      notes:'Paradigma nominal íntegro con tiempo y voz del verbo; no se separan los compuestos verbales.'}};
}
export function compilePauParticiples(exams){
  const requested=new Set(exams.flatMap(q=>q.forms.map(latinFold)));
  const output=[];
  for(const [id,headword,stem] of PPP){
    const r=compile(id,headword,'perfecto','pasiva',
      (gender,number)=>firstDecl(stem,gender,number));
    if(r.forms.some(f=>requested.has(latinFold(f.form))))output.push(r);
  }
  for(const [id,headword,stem,nom] of PRESENT){
    const r=compile(id,headword,'presente','activa',
      (gender,number)=>presentDecl(stem,nom,gender,number));
    if(r.forms.some(f=>requested.has(latinFold(f.form))))output.push(r);
  }
  return output;
}
