#!/usr/bin/env node
// Cotejo estructural de perífrasis con evidencias independientes de sus
// componentes: sólo informes docentes, nunca prueba de textos o sorteo.
import {createReadStream} from 'node:fs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join,relative,sep} from 'node:path';
import {createInterface} from 'node:readline';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {analyseCompound,createCompoundWitnessCollector,summarizeCompounds}
  from './latin2-compounds.mjs';
import {parseUniMorphRow,parseExternalEvidenceRow,UNIMORPH_LATIN_REVISION}
  from './lexicografia-latin2.mjs';

const root=resolve(import.meta.dirname,'..');
const defaults={
  entries:join(root,'build/academic-audits/latin2-lexicon/evidencias.ndjson'),
  unimorph:join(root,'.sources/unimorph-latin/lat'),
  out:join(root,'build/academic-audits/latin2-lexicon')
};
function options(argv){
  const paths={...defaults},allowed=new Set(['entries','unimorph','independent','out']);
  for(let i=0;i<argv.length;i+=2){
    assert.ok(/^--/.test(argv[i])&&allowed.has(argv[i].slice(2))&&argv[i+1],
      'Argumento no válido: '+argv[i]);
    paths[argv[i].slice(2)]=resolve(argv[i+1]);
  }
  return paths;
}
async function* lines(path){
  const input=createReadStream(path,{encoding:'utf8'});
  const rl=createInterface({input,crlfDelay:Infinity});
  try{for await(const raw of rl)yield raw;}
  finally{rl.close();input.destroy();}
}
const safe=s=>String(s??'').replace(/[\r\n\t]/g,' ');
export async function runCompoundAudit(params={}){
  const p={...defaults,...params},rel=relative(root,p.out);
  assert.ok(rel.startsWith('build'+sep)&&!rel.startsWith('..'),
    'Informes de compuestos solo en build/; nunca Pages');
  const compound=[];
  for await(const raw of lines(p.entries)){
    if(!raw.trim())continue;
    const entry=JSON.parse(raw);
    if(entry.type!=='compuesto')continue;
    const outcome=analyseCompound(entry);
    assert.ok(outcome);
    compound.push(outcome);
  }
  assert.ok(compound.length>0,'Banco sin expresiones compuestas: revisar origen de datos');
  const collector=createCompoundWitnessCollector(compound);
  let primaryRows=0,secondaryRows=0;
  for await(const raw of lines(p.unimorph)){
    if(!raw.trim())continue;
    const row=parseUniMorphRow(raw);
    if(!row)continue;
    primaryRows++;
    collector.ingest(row,'UniMorph Latin',UNIMORPH_LATIN_REVISION);
  }
  if(p.independent){
    for await(const raw of lines(p.independent)){
      if(!raw.trim())continue;
      const row=parseExternalEvidenceRow(raw);
      secondaryRows++;
      collector.ingest(row,row.source,row.revision);
    }
  }
  collector.complete(compound);
  const summary={...summarizeCompounds(compound),primarySourceRows:primaryRows,
    secondarySourceRows:secondaryRows,
    independentSourceCount:p.independent?2:1};
  const reserved=compound.filter(x=>x.status==='reserva-de-analisis');
  const cols=['priority','status','recordId','lemma','form','analysis','issues'];
  const tsv=cols.join('\t')+'\n'+reserved.map(x=>
    cols.map(k=>safe(k==='issues'?x.issues.join(' | '):x[k]))
      .join('\t')).join('\n')+'\n';
  await mkdir(p.out,{recursive:true});
  await Promise.all([
    writeFile(join(p.out,'compuestos-resumen.json'),JSON.stringify(summary,null,2)+'\n'),
    writeFile(join(p.out,'compuestos-evidencias.ndjson'),
      compound.map(x=>JSON.stringify(x)).join('\n')+'\n'),
    writeFile(join(p.out,'compuestos-reservas.tsv'),tsv)
  ]);
  console.log('Latín II, perífrasis: '+JSON.stringify(summary));
  console.log('Primeras reservas de compuestos: '+
    JSON.stringify(reserved.slice(0,15).map(x=>({
      form:x.form,lemma:x.lemma,issues:x.issues}))));
  return {summary,compound,reserved};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
  runCompoundAudit(options(process.argv.slice(2))).catch(e=>{
    console.error(e.stack||String(e));process.exitCode=1;
  });
}
