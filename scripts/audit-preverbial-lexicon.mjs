#!/usr/bin/env node
// Auditoría asistida del inventario preverbial. Una coincidencia en UniMorph
// acredita una forma, no su etimología, significado ni preverbio.
import {createReadStream} from 'node:fs';
import {createInterface} from 'node:readline';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';
import {families,rounds} from '../public/apps/modificacion-preverbial/banco.mjs';
import {teacherInventory} from '../public/apps/modificacion-preverbial/cobertura-docente.mjs';
import {correctRound} from '../public/apps/modificacion-preverbial/corrector.mjs';
import {parseUniMorphRow} from './lexicografia-latin2.mjs';

export const normalize = s => s.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replaceAll('æ','ae').replaceAll('œ','oe').replaceAll('v','u').replaceAll('j','i').trim();
const enc = encodeURIComponent;
const validClasses = new Set(['verbo','sustantivo','adjetivo']);
export function targetsFor(bank=families) {
  return Object.entries(bank).flatMap(([id,f])=>[
    {family:id,kind:'simple',lemma:f.lemma??id,infinitive:f.entry.split(',')[1].trim()},
    ...f.compounds.map(([lemma,infinitive,prefix,gloss])=>({family:id,kind:'compuesto',lemma,infinitive,prefix,gloss}))
  ]);
}
export function makeMatcher(targets) {
  const index=new Map(), hits=targets.map(()=>({lemmaSeen:false,exact:[],alternative:[]}));
  targets.forEach((t,i)=>{
    for(const k of new Set([normalize(t.lemma),normalize(t.infinitive)])){
      if(!index.has(k)) index.set(k,[]);
      index.get(k).push(i);
    }
  });
  return {
    ingest(row){
      const lemma=normalize(row.lemma), form=normalize(row.form);
      for(const i of new Set([...(index.get(lemma)??[]),...(index.get(form)??[])])){
        const t=targets[i],hit=hits[i],keys=[normalize(t.lemma),normalize(t.infinitive)];
        const related=keys.includes(lemma);
        if(related)hit.lemmaSeen=true;
        if(form!==normalize(t.infinitive)||!row.features.some(x=>x==='V'||x.startsWith('V.')))continue;
        const bucket=related?hit.exact:hit.alternative;
        if(bucket.length<8&&!bucket.some(x=>x.lemma===row.lemma&&x.features===row.rawFeatures))bucket.push({lemma:row.lemma,form:row.form,features:row.rawFeatures});
      }
    },
    report(){return targets.map((t,i)=>({...t,...hits[i],status:hits[i].exact.length?'coincidencia-lema-forma':hits[i].alternative.length?'forma-otro-lema':hits[i].lemmaSeen?'lema-sin-forma':'sin-evidencia'}));}
  };
}
export function derivativeQueue(bank=families) {
  return Object.entries(bank).flatMap(([family,f])=>f.derivatives.flatMap(([origin,category,es,val])=>{
    assert.ok(validClasses.has(category),category);
    return [{family,origin,category,language:'es',word:es,lookup:'https://dle.rae.es/'+enc(es),status:'pendiente-cotejo-individual'},
      ...(val?[{family,origin,category,language:'val',word:val,lookup:'https://www.avl.gva.es/lexicval/',status:'pendiente-cotejo-individual'}]:[])];
  }));
}
export async function runAudit(path=resolve('.sources/unimorph-latin/lat'),out=resolve('build/academic-audits/preverbial')){
  const targets=targetsFor(),matcher=makeMatcher(targets);
  let rows=0;
  const input=createReadStream(path,{encoding:'utf8'});
  const lines=createInterface({input,crlfDelay:Infinity});
  for await(const line of lines){const row=parseUniMorphRow(line);if(row){rows++;matcher.ingest(row);}}
  assert.ok(rows>=900000,'Corpus UniMorph incompleto');
  const latin=matcher.report(),romance=derivativeQueue();
  const reserved=Object.entries(families).flatMap(([family,f])=>(f.reservedCompounds??[]).map(([lemma,note])=>({family,lemma,note})));
  assert.equal(targets.length,987);
  assert.equal(reserved.length,15);
  assert.equal(Object.values(teacherInventory).flat().length,882);
  for(const r of rounds)assert.equal(correctRound(r,r.prompts.map(p=>p.model),r.words).points,10,r.label);
  const byStatus={};for(const r of latin)byStatus[r.status]=(byStatus[r.status]??0)+1;
  const summary={source:'UniMorph Latin',revision:'050924c9f013e6aba4d7c87be243a1d79b6c5b10',sourceRows:rows,families:Object.keys(families).length,latinTargets:latin.length,byStatus,reserved:reserved.length,derivativeRecords:Object.values(families).reduce((n,f)=>n+f.derivatives.length,0),spanish:romance.filter(r=>r.language==='es').length,valencian:romance.filter(r=>r.language==='val').length,rounds:rounds.length,verifiedRomanceByThisScript:0};
  await mkdir(out,{recursive:true});
  await Promise.all([['resumen',summary],['infinitivos',latin],['reservas',reserved],['derivados-pendientes',romance]].map(([name,data])=>writeFile(join(out,name+'.json'),JSON.stringify(data,null,2)+'\n')));
  console.log('AUDITORÍA PREVERBIAL '+JSON.stringify(summary));
  console.log('Incidencias (no equivalen a errores): '+JSON.stringify(latin.filter(r=>r.status!=='coincidencia-lema-forma').slice(0,35).map(({family,lemma,infinitive,status})=>({family,lemma,infinitive,status}))));
  return summary;
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(import.meta.filename))await runAudit();
