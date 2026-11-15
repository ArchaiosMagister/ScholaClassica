// Primera matriz filológica transversal (solo lectura) de las tres materias.
// Cruza los currículos ES/VAL, la práctica compilada y la COPIA de Vocabula.
// Un posible desacuerdo se presenta para revisión, NUNCA enmienda una fuente.
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {auditGreekRiskParadigms} from './audit-greek-high-risk.mjs';
import {auditLatinAdjectiveRisk} from './audit-latin-adjectives.mjs';
import {auditLatinNounsAndVerbs} from './audit-latin-third-verbs.mjs';
import {LATIN4_LEXICAL_CORRECTIONS} from './latin4-lexical-editorial.mjs';
import {LATIN4_UD8_EXAM_REVIEW} from './latin4-ud8-reconciliation.mjs';

export const TRANSVERSAL_COURSES=Object.freeze([
  {key:'latin1',subject:'lat1',language:'latin',grammar:'latin',
   units:10,grammarFile:'curriculum-latin1.json'},
  {key:'latin4',subject:'lat4',language:'latin4',grammar:'latin',
   units:8,grammarFile:'curriculum-latin4.json'},
  {key:'griego1',subject:'gr1',language:'griego',grammar:'griego',
   units:14,grammarFile:'curriculum-griego1.json'}
]);
const readJson=file=>JSON.parse(readFileSync(file,'utf8'));
export function parseVocabulaData(text){
  const m=String(text).match(/^window\.VOCAB=(\[[\s\S]*\]);?\s*$/u);
  assert.ok(m,'Formato de Vocabula desconocido');
  const records=JSON.parse(m[1]);
  assert.ok(Array.isArray(records));
  return records;
}
export function lexicalKey(value){
  // Exclusivamente para BUSCAR candidatas; ignorar espíritus/acentos griegos
  // puede reunir lemas diferentes, y por tanto no acredita ninguna enmienda.
  return String(value||'').split(',')[0].split(' · ')[0]
    .normalize('NFD').replace(/\p{M}/gu,'')
    .replace(/æ/giu,'ae').replace(/œ/giu,'oe')
    .replace(/[^\p{L}]/gu,'').toLowerCase();
}
export function explicitNounGender(form,language){
  const s=String(form);
  if(language==='griego'){
    const match=s.match(/\(([^)]*)\)/gu)||[];
    const genders=match.flatMap(group=>[
      ...group.matchAll(/(?<!\p{L})(ὁ|ἡ|τό)(?!\p{L})/gu)
    ].map(m=>({'ὁ':'m','ἡ':'f','τό':'n'}[m[1]])));
    const distinct=[...new Set(genders)];
    return distinct.length?distinct.sort().join(''):null;
  }
  const group=s.match(/\(([^)]*)\)/gu)||[];
  const vals=group.flatMap(g=>[
    ...g.matchAll(/(?:^|[ (])([mfn])\.(?!\p{L})/gu)
  ].map(m=>m[1]));
  const unique=[...new Set(vals)];
  return unique.length?unique.sort().join(''):null;
}
function morphologicalGender(record){
  return {masculino:'m',femenino:'f',neutro:'n'}[record.gender]||null;
}
function tables(topic){
  return (String(topic.html||'').match(/<table\b/gu)||[]).length;
}
function assertLexicalIntegrity(original,adapted){
  assert.equal(original.length,2055,'El banco fuente de vocabulario cambió');
  assert.equal(adapted.length,original.length,'La integración eliminó fichas');
  const byId=new Map(adapted.map(x=>[x.id,x]));
  assert.equal(byId.size,adapted.length,'IDs duplicados en la integración');
  const editedForms=new Map(LATIN4_LEXICAL_CORRECTIONS.map(x=>[x.id,x.form]));
  const revisedUnits=new Set(LATIN4_UD8_EXAM_REVIEW.map(x=>x.examId));
  const intentional=[];
  for(const source of original){
    const entry=byId.get(source.id);
    assert.ok(entry,'Falta ficha integrada '+source.id);
    for(const field of ['id','subject','mode','meaning','answers','originals']){
      assert.deepEqual(entry[field],source[field],
        'Cambio no autorizado de '+field+' en '+source.id);
    }
    assert.equal(entry.form,editedForms.get(source.id)||source.form,
      'Enunciado alterado sin evidencia '+source.id);
    if(revisedUnits.has(source.id)){
      assert.deepEqual(entry.units,['UD 8'],'Cambio en conciliación de UD8');
      intentional.push(source.id);
    }else{
      assert.deepEqual(entry.units,source.units,
        'Unidad léxica alterada sin autorización '+source.id);
    }
  }
  assert.equal(intentional.length,17);
  return {sourceCards:original.length,integratedCards:adapted.length,
    intentionalLatin4ExamUd8:17,intentionalLatin4Spelling:editedForms.size};
}
export function analyzeTransversal({curricula,bank,sourceVocabulary,
  integratedVocabulary,lock}){
  assert.equal(lock.sources.appendix.integrated,true);
  assert.equal(lock.sources.vocabula.integrated,true);
  const sourcePreserved=assertLexicalIntegrity(sourceVocabulary,integratedVocabulary);
  const greekIndividualReview=auditGreekRiskParadigms(bank);
  const latinAdjectiveReview=auditLatinAdjectiveRisk(bank);
  const latinNominalVerbalReview=auditLatinNounsAndVerbs(bank);
  const allIds=new Set(bank.records.map(x=>x.id));
  assert.equal(allIds.size,bank.records.length,'ID de paradigma repetido');
  const noteMarkers=bank.records.filter(r=>
      ['latin','latin4','griego'].includes(r.language))
    .flatMap(r=>r.forms.filter(f=>/[∗*†※]/u.test(f.form))
      .map(f=>({id:r.id,language:r.language,unit:r.unit,
        form:f.form,analysis:f.analysis})));
  const subjects={};const reviews=[];
  for(const spec of TRANSVERSAL_COURSES){
    const grammar=curricula[spec.key];
    const es=grammar.es[spec.grammar].units;
    const va=grammar.val[spec.grammar].units;
    assert.deepEqual(es.map(u=>u.number),Array.from({length:spec.units},(_,i)=>i+1),
      'Secuencia castellana alterada '+spec.key);
    assert.deepEqual(va.map(u=>u.number),es.map(u=>u.number),
      'Secuencia valenciana alterada '+spec.key);
    const topicCounts=[],tableCounts=[],structureWarnings=[];
    for(let i=0;i<spec.units;i++){
      const se=es[i].topics,sv=va[i].topics;
      topicCounts.push(se.length);
      const esTables=se.map(tables),vaTables=sv.map(tables);
      tableCounts.push(esTables.reduce((a,b)=>a+b,0));
      if(se.length!==sv.length||
         JSON.stringify(esTables)!==JSON.stringify(vaTables)){
        structureWarnings.push({unit:i+1,esTopics:se.length,valTopics:sv.length,
          esTables,valTables});
      }
    }
    assert.equal(structureWarnings.length,0,
      'Estructura de tablas no equivalente ES/VAL '+spec.key);
    const morph=bank.records.filter(x=>x.language===spec.language);
    assert.ok(morph.length>0,'Morfología ausente '+spec.key);
    for(const record of morph){
      assert.ok(Number.isInteger(record.unit)&&record.unit>=1&&
        record.unit<=spec.units,'Modelo fuera del currículo '+record.id);
      assert.ok(record.forms?.length>0&&
        record.forms.every(f=>f.form&&f.analysis),'Paradigma vacío '+record.id);
    }
    const vocab=integratedVocabulary.filter(x=>x.subject===spec.subject);
    const index=new Map();
    for(const record of morph){
      if(!['sustantivo','pronombre','adjetivo','verbo'].includes(record.kind))continue;
      const key=lexicalKey(record.enunciation||record.paradigm);
      if(!key)continue;
      if(!index.has(key))index.set(key,[]);
      index.get(key).push(record);
    }
    const exam=vocab.filter(e=>e.mode==='examen');
    const examGroupCounts=Object.fromEntries(
      [...new Set(exam.flatMap(x=>x.units||[]))].sort()
        .map(g=>[g,exam.filter(x=>x.units?.includes(g)).length]));
    const grouped=Object.fromEntries(['general','examen'].map(mode=>
      [mode,vocab.filter(x=>x.mode===mode).length]));
    const matched=[],unmatched=[],genderCandidates=[];
    const checked=new Set();
    for(const entry of vocab){
      const matches=index.get(lexicalKey(entry.form))||[];
      if(matches.length)matched.push(entry.id);else unmatched.push(entry.id);
      const lexicalGender=explicitNounGender(entry.form,spec.language);
      if(!lexicalGender||!matches.length)continue;
      for(const rec of matches){
        if(rec.kind!=='sustantivo')continue;
        const recordGender=morphologicalGender(rec);
        if(!recordGender||lexicalGender===recordGender)continue;
        const key=entry.id+'|'+rec.id;
        if(checked.has(key))continue;
        checked.add(key);
        const status=lexicalGender.includes(recordGender)?
          'genero-comun-frente-a-modelo-restringido':'genero-explicito-discordante';
        genderCandidates.push({entryId:entry.id,form:entry.form,
          lexGender:lexicalGender,paradigmId:rec.id,
          paradigm:rec.paradigm,morphGender:recordGender,
          unitMorph:rec.unit,mode:entry.mode,unitsVocab:entry.units,status});
      }
    }
    const resolvedCross=genderCandidates.filter(x=>
      x.status==='genero-explicito-discordante');
    reviews.push(...genderCandidates.map(x=>({course:spec.key,...x})));
    subjects[spec.key]={
      grammarUnits:es.length,topicsEs:topicCounts,topicTablesEs:tableCounts,
      topicsVal:va.map(u=>u.topics.length),morphologyCards:morph.length,
      newMorphByUnit:Array.from({length:spec.units},(_,i)=>
        morph.filter(r=>r.unit===i+1).length),
      vocabulary:grouped,examGroupCounts,
      vocabWithHeadwordMatch:matched.length,
      vocabWithoutHeadwordMatch:unmatched.length,
      lexicalGenderCandidates:genderCandidates.length,
      explicitGenderDisagreements:resolvedCross.length,
      structuralParity:true
    };
  }
  const diagnostics={schema:'scholaclassica-filologia-transversal/v1',
    sourceShas:{appendix:lock.sources.appendix.sha,
      vocabula:lock.sources.vocabula.sha},
    sourcePreserved,subjects,reviews,noteMarkers,greekIndividualReview,
    latinAdjectiveReview,latinNominalVerbalReview,
    note:'Los candidatos por género NO constituyen enmiendas aprobadas. '+
      'La coincidencia de lemas sin diacríticos es solo una búsqueda orientativa. '+
      'La paridad de tablas ES/VAL es estructural, no traducción validada frase por frase.'};
  return diagnostics;
}
export function loadTransversal(root){
  const grammar=join(root,'dist/apps/gramatica');
  const curricula=Object.fromEntries(TRANSVERSAL_COURSES.map(spec=>[
    spec.key,{
      es:readJson(join(grammar,'assets',spec.grammarFile)),
      val:readJson(join(grammar,'val',spec.grammarFile))
    }]));
  return {
    curricula,
    bank:readJson(join(root,'dist/apps/morfologia/data/paradigmas.json')),
    sourceVocabulary:parseVocabulaData(readFileSync(join(root,
      '.sources/vocabula/data.js'),'utf8')),
    integratedVocabulary:parseVocabulaData(readFileSync(join(root,
      'dist/apps/vocabulario/data.js'),'utf8')),
    lock:readJson(join(root,'config/sources.lock.json'))
  };
}
const main=process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]);
if(main){
  const root=resolve(import.meta.dirname,'..');
  const report=analyzeTransversal(loadTransversal(root));
  const dest=join(root,'build/academic-audits/transversal');
  mkdirSync(dest,{recursive:true});
  writeFileSync(join(dest,'filologia-transversal-v1.json'),
    JSON.stringify(report,null,2)+'\n');
  console.log('AUDITORIA_TRANSVERSAL',JSON.stringify({
    subjects:report.subjects,reviews:report.reviews,noteMarkers:report.noteMarkers,
    greekIndividualReview:report.greekIndividualReview,
    latinAdjectiveReview:report.latinAdjectiveReview,
    latinNominalVerbalReview:report.latinNominalVerbalReview,
    sourcePreserved:report.sourcePreserved
  }));
}
