#!/usr/bin/env node
// LEMLAT3: conversión fiel de XML/EAGLES a evidencias, sin certificar formas.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {makeTargets,latinKey} from './lexicografia-latin2.mjs';
import {parsePauExamQuestions} from './morphology-pau-latin2.mjs';
import {parseCuadernoQuestions} from './morphology-cuaderno.mjs';

export const LEMLAT3_REVISION='e8328948fb4b9b73b625aeda3639137c5e49a1ff';
const POS={N:'N',V:'V',A:'ADJ',P:'PRO',R:'ADV',S:'ADP',C:'CONJ',I:'INTJ'};
const CASE={n:'NOM',g:'GEN',d:'DAT',a:'ACC',v:'VOC',b:'ABL'};
const GENDER={m:['MASC'],f:['FEM'],n:['NEUT'],1:['MASC','NEUT'],2:['MASC','FEM'],3:['NEUT','FEM']};
const NUMBER={s:'SG',p:'PL'};
const MOOD={a:'IND',b:'IND',c:'SBJV',d:'SBJV',e:'IMP',f:'IMP'};
const TENSE={'1':['PRS'],'2':['PST','IPFV'],'3':['FUT'],'4':['PST','PFV']};
const ACTIVE=new Set(['a','c','e','g','j','m','p']);
const PASSIVE=new Set(['b','d','f','h','k','q','r']);

export function mapEagles(lemmaCode,formCode){
  assert.match(lemmaCode,/^[A-Za-z0-9*\-]{3}$/,'LEMLAT codmorf inválido');
  assert.match(formCode,/^[A-Za-z0-9*\-]{7}$/,'LEMLAT morphological_feats inválido');
  const [pos]=lemmaCode;
  const [mood,tense,cas,gen,num,person]=formCode;
  const out=[];
  if(POS[pos])out.push(POS[pos]);
  if(pos==='V'&&['j','k'].includes(mood))out.push('V.PTCP');
  if(pos==='V'&&['g','h'].includes(mood))out.push('NFIN');
  if(pos==='V'&&MOOD[mood])out.push(MOOD[mood]);
  if(pos==='V'&&ACTIVE.has(mood))out.push('ACT');
  if(pos==='V'&&PASSIVE.has(mood))out.push('PASS');
  if(pos==='V'&&TENSE[tense])out.push(...TENSE[tense]);
  if(CASE[cas])out.push(CASE[cas]);
  if(GENDER[gen])out.push(...GENDER[gen]);
  if(NUMBER[num])out.push(NUMBER[num]);
  if(pos==='V'&&['1','2','3'].includes(person))out.push(person);
  return [...new Set(out)];
}
const entity=s=>s.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi,(raw,code)=>{
  if(code.startsWith('#x'))return String.fromCodePoint(parseInt(code.slice(2),16));
  if(code.startsWith('#'))return String.fromCodePoint(parseInt(code.slice(1),10));
  return {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[code.toLowerCase()]||raw;
});
function attrs(markup){
  const r={};
  for(const m of markup.matchAll(/([a-z_]+)="([^"]*)"/g))r[m[1]]=entity(m[2]);
  return r;
}
function value(xml,tag){
  const m=xml.match(new RegExp('<'+tag+'>([\\s\\S]*?)<\\/'+tag+'>'));
  return m?entity(m[1].trim()):null;
}
function* blocks(xml,tag){
  const rx=new RegExp('<'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+tag+'>','g');
  for(const m of xml.matchAll(rx))yield m[1];
}
export function parseLemlatXml(xml,{allowedWords,revision=LEMLAT3_REVISION}={}){
  assert.match(xml,/^\s*<\?xml\b[\s\S]*?<LEMLAT>/i,'XML de LEMLAT sin cabecera válida');
  assert.ok(xml.includes('</LEMLAT>'),'XML de LEMLAT incompleto');
  const evidence=[],seenInputs=new Set(),seenIDs=new Set(),unrecognized=[];
  const allowed=allowedWords?new Set(allowedWords.map(latinKey)):null;
  let analysesCount=0,invalidCodes=0;
  for(const wordBlock of blocks(xml,'Analyses')){
    const raw=value(wordBlock,'input_worform');
    assert.ok(raw,'LEMLAT: falta input_worform');
    const form=latinKey(raw);
    if(allowed)assert.ok(allowed.has(form),'LEMLAT devolvió una forma ajena al lote: '+raw);
    seenInputs.add(form);
    let analysisIndex=0;
    for(const body of blocks(wordBlock,'Analysis')){
      analysisIndex++;analysesCount++;
      const rawFeats=[...blocks(body,'morphological_feats')].map(s=>s.trim());
      const lemmas=value(body,'Lemmas')||'';
      // Las bases dentro de Rule no son lemas de la forma sometida a análisis.
      const principals=lemmas.replace(/<Rule\b[^>]*>[\s\S]*?<\/Rule>/g,'');
      for(const match of principals.matchAll(/<Lemma\b([^>]*)\/?\s*>/g)){
        const a=attrs(match[1]);
        if(a.type==='fictional'||!a.lemma||!a.n_id||!a.codmorf)continue;
        for(let j=0;j<rawFeats.length;j++){
          const f=rawFeats[j];
          if(!/^[A-Za-z0-9*\-]{7}$/.test(f)||!/^[A-Za-z0-9*\-]{3}$/.test(a.codmorf)){
            invalidCodes++;continue;
          }
          const dedup=JSON.stringify([form,a.lemma,a.codmorf,f,a.n_id]);
          if(seenIDs.has(dedup))continue;
          seenIDs.add(dedup);
          evidence.push({source:'LEMLAT3',revision,tagset:'UniMorph',
            reference:'LEMLAT3:'+a.n_id+':A'+analysisIndex+':F'+(j+1),
            nativeFeatures:'codmorf='+a.codmorf+';morphological_feats='+f+
              ';codlem='+(a.codlem||'')+';lemma_type='+(a.type||'normal'),
            lemma:a.lemma,form:raw,features:mapEagles(a.codmorf,f)});
        }
      }
    }
    if(!analysisIndex)unrecognized.push(raw);
  }
  assert.ok(seenInputs.size>0,'LEMLAT: XML sin palabras procesadas');
  return {evidence,report:{revision,recognizedInputs:seenInputs.size,
    analysedWords:seenInputs.size-unrecognized.length,analysesCount,
    evidenceRows:evidence.length,invalidCodes,unrecognized,
    notReturned:allowed?[...allowed].filter(x=>!seenInputs.has(x)):[]}};
}
function options(argv){
  const command=argv[0];
  assert.ok(['prepare','convert'].includes(command),'Uso: prepare | convert');
  const args={};
  for(let i=1;i<argv.length;i+=2){
    assert.ok(/^--[a-z-]+$/.test(argv[i])&&argv[i+1],'Opción inválida: '+argv[i]);
    args[argv[i].slice(2)]=resolve(argv[i+1]);
  }
  return {command,args};
}
async function save(path,body){
  await mkdir(dirname(path),{recursive:true});
  await writeFile(path,body);
}
export async function prepare({bank,pau,cuaderno,input,manifest}){
  const [data,exams,workbook]=await Promise.all([
    readFile(bank,'utf8'),readFile(pau,'utf8'),readFile(cuaderno,'utf8')]);
  const targets=makeTargets(JSON.parse(data),{
    pau:parsePauExamQuestions(exams).flatMap(x=>x.forms),
    cuaderno:parseCuadernoQuestions(workbook).flatMap(x=>x.forms)});
  const prioritized=targets.filter(x=>x.priority!=='P2');
  const simple=prioritized.filter(x=>x.type==='simple');
  const priorityWords=[...new Set(simple.map(x=>x.form))].sort();
  const compounds=targets.filter(x=>x.type==='compuesto');
  const auxiliaries=new Set(['sum','es','est','sumus','estis','sunt',
    'eram','eras','erat','eramus','eratis','erant',
    'ero','eris','erit','erimus','eritis','erunt',
    'sim','sis','sit','simus','sitis','sint',
    'essem','esses','esset','essemus','essetis','essent']);
  const componentWords=[...new Set(compounds.map(x=>{
    const [a,b]=x.form.split(' ');
    return auxiliaries.has(a)?b:a;
  }))].sort();
  const words=[...new Set([...priorityWords,...componentWords,
    'sum','es','est','sumus','estis','sunt','esse','iri',
    'eram','eras','erat','eramus','eratis','erant',
    'ero','eris','erit','erimus','eritis','erunt',
    'sim','sis','sit','simus','sitis','sint',
    'essem','esses','esset','essemus','essetis','essent'])].sort();
  assert.ok(prioritized.length&&words.length&&compounds.length,
    'Sin formas priorizadas o compuestos para LEMLAT3');
  const payload={schema:'schola-lemlat3-batch/v2',revision:LEMLAT3_REVISION,
    priorityAnalyses:prioritized.length,compoundAnalyses:prioritized.length-simple.length,
    distinctSimpleWords:priorityWords.length,allCompounds:compounds.length,
    compoundComponentWords:componentWords.length,totalQueryWords:words.length,words};
  await save(input,words.join('\n')+'\n');
  await save(manifest,JSON.stringify(payload,null,2)+'\n');
  return payload;
}
export async function convert({xml,manifest,out,report}){
  const metadata=JSON.parse(await readFile(manifest,'utf8'));
  assert.equal(metadata.revision,LEMLAT3_REVISION,'Fuente LEMLAT no congelada');
  assert.ok(Array.isArray(metadata.words)&&metadata.words.length>0);
  const original=await readFile(xml);
  // LEMLAT anuncia ISO-8859-1 en sus XML.
  const source=new TextDecoder('iso-8859-1',{fatal:true}).decode(original);
  const result=parseLemlatXml(source,{allowedWords:metadata.words});
  assert.equal(result.report.invalidCodes,0,'LEMLAT: códigos morfológicos inesperados');
  await save(out,result.evidence.map(x=>JSON.stringify(x)).join('\n')+'\n');
  await save(report,JSON.stringify({...result.report,
    priorityAnalyses:metadata.priorityAnalyses,
    inputWords:metadata.words.length,
    compoundAnalyses:metadata.compoundAnalyses},null,2)+'\n');
  return result;
}
const defaults={
  bank:resolve('dist/apps/morfologia/data/paradigmas.json'),
  pau:resolve('shared/academic/latin2/pau-cv-2006-2026.tsv'),
  cuaderno:resolve('shared/academic/latin2/cuaderno-2026-27-morfologia.tsv'),
  input:resolve('build/academic-audits/latin2-lexicon/lemlat-input.txt'),
  manifest:resolve('build/academic-audits/latin2-lexicon/lemlat-manifest.json'),
  xml:resolve('build/academic-audits/latin2-lexicon/lemlat-result.xml'),
  out:resolve('build/academic-audits/latin2-lexicon/lemlat-evidencias.jsonl'),
  report:resolve('build/academic-audits/latin2-lexicon/lemlat-resumen.json')
};
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
  try{
    const {command,args}=options(process.argv.slice(2));
    const paths={...defaults,...args};
    for(const key of ['input','manifest','xml','out','report']){
      if(!paths[key].startsWith(resolve('build')+'/'))throw Error('Ruta no privada: '+key);
    }
    const result=await (command==='prepare'?prepare(paths):convert(paths));
    console.log('LEMLAT3 '+command+': '+JSON.stringify(command==='prepare'?
      {priorityAnalyses:result.priorityAnalyses,
        distinctSimpleWords:result.distinctSimpleWords,
        compoundAnalyses:result.compoundAnalyses}:result.report));
  }catch(error){console.error(error.stack||String(error));process.exitCode=1;}
}
