// Numerales frecuentes en PAU: paradigmas plurales completos, no
// desinencias aisladas ni un supuesto singular de duo/tres/ducenti.
import assert from 'node:assert/strict';
import {latinFold} from './morphology-pau-latin2.mjs';
const CASES=['nominativo','vocativo','acusativo','genitivo','dativo','ablativo'];
const DATA=[
  ['duo','duo, duae, duo',[
    ['duo','duo','duos','duorum','duobus','duobus'],
    ['duae','duae','duas','duarum','duabus','duabus'],
    ['duo','duo','duo','duorum','duobus','duobus']
  ]],
  ['tres','tres, tria',[
    ['tres','tres','tres','trium','tribus','tribus'],
    ['tres','tres','tres','trium','tribus','tribus'],
    ['tria','tria','tria','trium','tribus','tribus']
  ]],
  ['ducenti','ducenti, ducentae, ducenta',[
    ['ducenti','ducenti','ducentos','ducentorum','ducentis','ducentis'],
    ['ducentae','ducentae','ducentas','ducentarum','ducentis','ducentis'],
    ['ducenta','ducenta','ducenta','ducentorum','ducentis','ducentis']
  ]]
];
export function compilePauNumerals(exams){
  const targets=new Set(exams.flatMap(x=>x.forms.map(latinFold)));
  const results=[];
  for(const [id,headword,grid] of DATA){
    const forms=[];
    for(const [i,gender] of ['masculino','femenino','neutro'].entries()){
      assert.equal(grid[i].length,6);
      for(const [j,cas] of CASES.entries()){
        const form=grid[i][j],number='plural';
        forms.push({form,case:cas,gender,number,analysis:
          'adjetivo · grado no aplicable (numeral cardinal) · '+headword+
          ' · '+cas+' · '+gender+' · '+number+' · tipo numeral'});
      }
    }
    if(!forms.some(f=>targets.has(latinFold(f.form))))continue;
    results.push({id:'latin2-pau-numeral-'+id,language:'latin2',unit:0,
      kind:'adjetivo',headword,paradigm:headword,forms,
      evidence:{source:'Paradigma de numerales latinos',
        file:'shared/academic/latin2/pau-cv-2006-2026.tsv',
        topic:'Numerales de PAU',caption:id,unit:0,status:'paradigma-documentado',
        notes:'Solo flexión plural pertinente a numerales cardinales. No inventar singular.'}});
  }
  return results;
}
