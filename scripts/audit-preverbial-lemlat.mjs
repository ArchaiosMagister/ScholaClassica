#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {targetsFor,normalize} from './audit-preverbial-lexicon.mjs';
import {parseLemlatXml,LEMLAT3_REVISION} from './lemlat3-latin2.mjs';
import {latinKey} from './lexicografia-latin2.mjs';

const dir=resolve('build/academic-audits/preverbial-lemlat');
export function queryWords(targets) {
  return [...new Set(targets.map(t=>latinKey(t.infinitive)))].sort();
}
export function matchLemlat(targets,evidence) {
  const byForm=new Map();
  for(const row of evidence) {
    // Solo infinitivos morfológicamente identificados; no cualquier análisis verbal.
    if(!row.features.includes('V')||!row.features.includes('NFIN')||!row.features.includes('PRS'))continue;
    const key=normalize(row.form);
    if(!byForm.has(key))byForm.set(key,[]);
    byForm.get(key).push(row);
  }
  return targets.map(t=>{
    const all=byForm.get(normalize(t.infinitive))??[];
    const exact=all.filter(r=>[normalize(t.lemma),normalize(t.infinitive)].includes(normalize(r.lemma)));
    const other=all.filter(r=>!exact.includes(r));
    return {...t,status:exact.length?'lema-infinitivo-presente':other.length?'infinitivo-otro-lema':'sin-evidencia',evidence:exact,alternative:other};
  });
}
async function prepare(){
  await mkdir(dir,{recursive:true});
  const words=queryWords(targetsFor());
  await writeFile(join(dir,'input.txt'),words.join('\n')+'\n');
  await writeFile(join(dir,'manifest.json'),JSON.stringify({revision:LEMLAT3_REVISION,words},null,2)+'\n');
}
async function report(){
  const manifest=JSON.parse(await readFile(join(dir,'manifest.json'),'utf8'));
  assert.equal(manifest.revision,LEMLAT3_REVISION);
  const xml=new TextDecoder('iso-8859-1').decode(await readFile(join(dir,'result.xml')));
  const parsed=parseLemlatXml(xml,{allowedWords:manifest.words});
  assert.equal(parsed.report.invalidCodes,0,'Códigos morfológicos inesperados');
  const targets=targetsFor();
  const results=matchLemlat(targets,parsed.evidence);
  assert.equal(results.length,987);
  const byStatus={};for(const row of results)byStatus[row.status]=(byStatus[row.status]??0)+1;
  const summary={revision:LEMLAT3_REVISION,targets:targets.length,queryWords:manifest.words.length,byStatus,parser:parsed.report,individuallyVerified:false};
  await writeFile(join(dir,'resumen.json'),JSON.stringify(summary,null,2)+'\n');
  await writeFile(join(dir,'infinitivos.json'),JSON.stringify(results,null,2)+'\n');
  await writeFile(join(dir,'pendientes.tsv'),'familia\tlema\tinfinitivo\testado\n'+results.filter(r=>r.status!=='lema-infinitivo-presente').map(r=>[r.family,r.lemma,r.infinitive,r.status].join('\t')).join('\n')+'\n');
  console.log('PREVERBIAL LEMLAT3 '+JSON.stringify({targets:summary.targets,queryWords:summary.queryWords,byStatus,evidenceRows:parsed.report.evidenceRows,notReturned:parsed.report.notReturned.length}));
  console.log('Primeras reservas '+JSON.stringify(results.filter(r=>r.status!=='lema-infinitivo-presente').slice(0,40).map(({family,lemma,infinitive,status})=>({family,lemma,infinitive,status}))));
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(import.meta.filename)){
  assert.ok(['prepare','report'].includes(process.argv[2]));
  await (process.argv[2]==='prepare'?prepare():report());
}
