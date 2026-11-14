#!/usr/bin/env node
// CLI offline: compara Latín II contra UniMorph Latin congelado y, si existe,
// contra un JSONL exportado explícitamente de un analizador independiente.
// El resultado se conserva SOLO como artefacto docente (build/), nunca PWA.
import {createReadStream} from 'node:fs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join,relative,sep} from 'node:path';
import {createInterface} from 'node:readline';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {parsePauExamQuestions} from './morphology-pau-latin2.mjs';
import {parseCuadernoQuestions} from './morphology-cuaderno.mjs';
import {makeTargets,createMatcher,finalizeAudit,parseUniMorphRow,
  parseExternalEvidenceRow,UNIMORPH_LATIN_REVISION}
  from './lexicografia-latin2.mjs';
const root=resolve(import.meta.dirname,'..');
const defaults={
  bank:join(root,'dist/apps/morfologia/data/paradigmas.json'),
  unimorph:join(root,'.sources/unimorph-latin/lat'),
  pau:join(root,'shared/academic/latin2/pau-cv-2006-2026.tsv'),
  cuaderno:join(root,'shared/academic/latin2/cuaderno-2026-27-morfologia.tsv'),
  out:join(root,'build/academic-audits/latin2-lexicon')
};
function argsToOptions(argv){
  const options={...defaults};
  const names=new Set(['bank','unimorph','pau','cuaderno','out','independent']);
  for(let i=0;i<argv.length;i++){
    const name=argv[i];
    assert.ok(name.startsWith('--')&&names.has(name.slice(2)),
      'Argumento desconocido: '+name);
    assert.ok(argv[i+1]&&!argv[i+1].startsWith('--'),
      'Falta ruta después de '+name);
    options[name.slice(2)]=resolve(argv[++i]);
  }
  return options;
}
function toTsv(rows){
  const cols=['priority','status','recordId','kind','lemma','displayForm',
    'analysis','evidence'];
  const safe=x=>String(x??'').replace(/[\r\n\t]/g,' ');
  return cols.join('\t')+'\n'+rows.map(item=>
    cols.map(key=>safe(key==='evidence'?
      item.evidence.map(e=>e.source+':'+e.features).join(' | '):
      item[key])).join('\t')).join('\n')+'\n';
}
async function* streamLines(path){
  const input=createReadStream(path,{encoding:'utf8'});
  const lines=createInterface({input,crlfDelay:Infinity});
  try {for await(const line of lines)yield line;}
  finally {lines.close();input.destroy();}
}
export async function runLexicographyAudit(options,{minPrimaryRows=900000}={}){
  const files={...defaults,...options};
  const rel=relative(root,files.out);
  assert.ok(rel.startsWith('build'+sep)&&!rel.startsWith('..'),
    'Los informes privados deben escribirse dentro de build/, no en dist/ ni public/');
  const bank=JSON.parse(await readFile(files.bank,'utf8'));
  const exams=parsePauExamQuestions(await readFile(files.pau,'utf8'));
  const workbook=parseCuadernoQuestions(await readFile(files.cuaderno,'utf8'));
  const targets=makeTargets(bank,{
    pau:exams.flatMap(q=>q.forms),
    cuaderno:workbook.flatMap(q=>q.forms)
  });
  const matcher=createMatcher(targets);
  let line=0;
  for await(const raw of streamLines(files.unimorph)){
    line++;
    const row=parseUniMorphRow(raw);
    if(!row){matcher.stats.malformedRows++;continue;}
    matcher.ingest(row,{source:'UniMorph Latin',
      revision:UNIMORPH_LATIN_REVISION,line});
  }
  assert.ok(matcher.stats.totalRows>=minPrimaryRows,
    'UniMorph incompleto: solo '+matcher.stats.totalRows+
      ' filas; se exige el corpus completo, no la muestra de Vocabula');
  assert.ok(matcher.stats.matchedLemmaFormRows>0,
    'Ninguna forma del banco coincide con UniMorph: comprobar datos');
  const sources=[{id:'UniMorph Latin',revision:UNIMORPH_LATIN_REVISION,
    lineage:'Wiktionary',licence:'CC BY-SA 3.0',
    uri:'https://github.com/unimorph/lat'}];
  if(files.independent){
    let sourceName=null,revision=null,number=0;
    for await(const raw of streamLines(files.independent)){
      if(!raw.trim())continue;
      number++;
      const row=parseExternalEvidenceRow(raw);
      if(!sourceName){sourceName=row.source;revision=row.revision;}
      assert.equal(row.source,sourceName,'No mezclar analizadores independientes en un mismo JSONL');
      assert.equal(row.revision,revision,'No mezclar revisiones en un mismo JSONL');
      matcher.ingest(row,{source:row.source,revision:row.revision,line:number});
    }
    assert.ok(number>0,'Fuente secundaria vacía: no atribuir consenso falso');
    sources.push({id:sourceName,revision,
      lineage:'análisis externo; verificar licencia y origen',
      licence:'según manifiesto del proveedor',
      uri:'archivo local de evidencia independiente'});
  }
  const {summary,entries,findings}=finalizeAudit(matcher,{sources});
  summary.malformedRows=matcher.stats.malformedRows;
  summary.pauDistinctForms=new Set(exams.flatMap(x=>x.forms)).size;
  summary.cuadernoQuestionGroups=workbook.length;
  await mkdir(files.out,{recursive:true});
  await Promise.all([
    writeFile(join(files.out,'resumen.json'),JSON.stringify(summary,null,2)+'\n'),
    writeFile(join(files.out,'evidencias.ndjson'),
      entries.map(x=>JSON.stringify(x)).join('\n')+'\n'),
    writeFile(join(files.out,'revision-prioritaria.tsv'),toTsv(findings))
  ]);
  console.log('Verificación lexicográfica asistida Latín II: '+
    summary.entries+' análisis; '+summary.sourceRows+' filas de fuente; '+
    summary.matchedLemmaFormRows+' coincidencias de lema+forma');
  console.log('Fuentes independientes: '+summary.independentSourceCount+
    '; estatus: '+JSON.stringify(summary.byStatus));
  console.log('Distribución por prioridad: '+JSON.stringify(summary.byPriority)+
    '; filas de entrada descartadas: '+summary.malformedRows);
  console.log('Primeras incidencias P0/P1 para revisión docente: '+
    JSON.stringify(findings.filter(f=>f.priority!=='P2').slice(0,12)
      .map(f=>({form:f.displayForm,lemma:f.lemma,analysis:f.analysis,
        status:f.status,evidence:f.evidence.map(x=>x.features).slice(0,2)}))));
  console.log('Informes exclusivamente docentes: '+relative(root,files.out));
  return {summary,entries,findings};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
  runLexicographyAudit(argsToOptions(process.argv.slice(2))).catch(error=>{
    console.error(error.stack||String(error));
    process.exitCode=1;
  });
}
