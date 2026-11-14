// Auditoría docente: Vocabula (SHA fijado) vs gramática y práctica real.
// NO reasigna unidades, no altera bancos y NO forma parte de la PWA pública.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {availableRecords,makeQuestions,validateBank} from '../public/morfologia/engine.mjs';
import {makeWrittenQuestions,makeTableExercises} from '../public/morfologia/written.mjs';

export const COURSES=[
  {vocabulary:'lat1',morphology:'latin',maxUnit:10},
  {vocabulary:'gr1',morphology:'griego',maxUnit:14}
];
const unitPattern=/^UD\s*(\d+)(?:\s*[–—-]\s*(\d+))?$/u;
export function classifyVocabularyUnit(group){
  const s=String(group??'').trim();
  const m=s.match(unitPattern);
  if(!m)return {group:s,type:s==='Sin unidad acreditada'?'unaccredited':'transversal',
    start:null,end:null};
  const start=Number(m[1]),end=m[2]?Number(m[2]):start;
  assert.ok(start>=1&&end>=start&&end<=20,'Etiqueta curricular malformada: '+s);
  return {group:s,type:start===end?'unit':'block',start,end};
}
export function parseVocabularySource(source){
  const m=String(source).match(/^window\.VOCAB=(\[[\s\S]*\]);?\s*$/u);
  assert.ok(m,'La fuente Vocabula cambió de formato');
  const items=JSON.parse(m[1]);
  assert.ok(Array.isArray(items)&&items.length>=2000,'Vocabula incompleta o cambiada');
  assert.ok(items.every(x=>typeof x.id==='string'&&x.form&&
    ['general','examen'].includes(x.mode)));
  return items;
}
function normalizeValue(text,language){
  let s=String(text??'').normalize('NFD');
  // Cantidad vocálica no exigida ni en Vocabula ni en el corrector.
  s=s.replace(/[\u0304\u0306]/gu,'');
  if(language==='latin')s=s.replace(/æ/giu,'ae').replace(/œ/giu,'oe')
    .replace(/[\u0300\u0301]/gu,'').toLowerCase();
  // En griego NO se eliminan acentos/espíritus: τίς y τις se distinguen.
  return s.normalize('NFC');
}
function lexicalHeadword(record){
  const h=String(record.headword||record.paradigm.split(' · ')[0]).split(',')[0].trim();
  if(!h||/^\d/u.test(h)||/^(?:Artículo|Desinencias|Reflexivo|Imperativo)/iu.test(h))
    return null;
  return h;
}
export function vocabularyLemma(entry){
  // La primera parte del enunciado contiene el lema; los rasgos posteriores
  // no se confunden con lemas ni las preposiciones con sustantivos.
  const raw=String(entry.form).split(',')[0].trim();
  const head=raw.replace(/\s+\((?:conj\.|part\.|adv\.|prep\.|irr\.).*$/iu,'');
  return head||null;
}
function fixedGroup(entry,course){
  const tags=(entry.units||[]).map(classifyVocabularyUnit);
  const unitGroups=tags.filter(x=>x.start!==null);
  // Las unidades del vocabulario exigible son explícitas o bloques; si una
  // palabra tiene varios grupos, no se inventa un número de introducción.
  const inScope=unitGroups.filter(x=>x.end<=course.maxUnit);
  return {
    groups:tags,credited:inScope.map(x=>x.group),
    firstGuaranteed:inScope.length?Math.min(...inScope.map(x=>x.end)):null,
    outsideCurriculum:unitGroups.filter(x=>x.start>course.maxUnit).map(x=>x.group)
  };
}
export function reconcileVocabulary(bank,vocabulary,lockedSha){
  validateBank(bank);
  assert.ok(/^[a-f\d]{40}$/iu.test(lockedSha),'Fuente Vocabula no fijada');
  const result={schema:'schola-curriculum-vocabulary-audit/v1',
    vocabulaSha:lockedSha,courses:{},assignments:[],
    unaccredited:[],outsideCurriculum:[],transversal:[]};
  for(const course of COURSES){
    const entries=vocabulary.filter(x=>x.subject===course.vocabulary);
    const exam=entries.filter(x=>x.mode==='examen');
    const records=bank.records.filter(x=>x.language===course.morphology);
    const index=new Map();
    for(const record of records){
      const head=lexicalHeadword(record);
      if(!head)continue;
      const key=normalizeValue(head,course.morphology);
      if(!index.has(key))index.set(key,[]);
      index.get(key).push(record);
    }
    const matched=[],unmatched=[];
    for(const entry of exam){
      const tagged=fixedGroup(entry,course);
      const lemma=vocabularyLemma(entry);
      const aligned=index.get(normalizeValue(lemma,course.morphology))||[];
      const explicitlyBound=records.filter(r=>r.evidence?.vocabulaEntry===entry.id);
      const found=[...new Map([...aligned,...explicitlyBound].map(r=>[r.id,r])).values()];
      const match={vocabId:entry.id,lemma,entry:entry.form,
        groups:entry.units||[],credited:tagged.credited,
        firstGuaranteed:tagged.firstGuaranteed,
        status:found.length?'model-present':'no-lexical-model',
        recordIds:found.map(r=>r.id),
        unlockedUnits:[...new Set(found.map(r=>r.unit))].sort((a,b)=>a-b),
        earlyGrammarExample:found.some(r=>tagged.firstGuaranteed!==null&&
          r.unit<tagged.firstGuaranteed&&r.evidence?.file==='data/unimorph-syllabus/grc/part-*.json')};
      (found.length?matched:unmatched).push(match);
      result.assignments.push({...match,course:course.morphology});
      if(tagged.firstGuaranteed===null)
        result.transversal.push({...match,course:course.morphology});
    }
    // El vocabulario general NO es automáticamente exigible.
    const general=entries.filter(x=>x.mode==='general');
    for(const entry of general){
      const tagged=fixedGroup(entry,course);
      if(tagged.groups.some(x=>x.type==='unaccredited'))
        result.unaccredited.push({course:course.morphology,id:entry.id,
          entry:entry.form,groups:entry.units});
      if(tagged.outsideCurriculum.length)
        result.outsideCurriculum.push({course:course.morphology,id:entry.id,
          entry:entry.form,groups:tagged.outsideCurriculum});
    }
    result.courses[course.morphology]={
      records:records.length,vocabularyTotal:entries.length,
      examTotal:exam.length,generalTotal:general.length,
      matched:matched.length,unmatched:unmatched.length,
      groupedExam:exam.filter(x=>(x.units||[])
        .some(t=>classifyVocabularyUnit(t).start!==null)).length,
      byGroup:Object.fromEntries([...new Set(entries.flatMap(x=>x.units||[]))]
        .sort().map(tag=>[tag,{
          exam:exam.filter(x=>(x.units||[]).includes(tag)).length,
          general:general.filter(x=>(x.units||[]).includes(tag)).length
        }])),
      earliestEntries:matched.filter(x=>x.earlyGrammarExample).map(x=>({
        lemma:x.lemma,firstGuaranteed:x.firstGuaranteed,
        unlockedUnits:x.unlockedUnits}))
    };
  }
  return result;
}
export function auditPracticeCoverage(bank){
  const result={};
  for(const course of COURSES){
    const records=bank.records.filter(r=>r.language===course.morphology);
    const items=records.map(r=>{
      const single={...bank,records:[r]};
      const base={language:course.morphology,unit:r.unit,kind:r.kind,
        limit:30,rng:()=>.41};
      const form=makeQuestions(single,{...base,activity:'form'}).length;
      const analysis=makeQuestions(single,{...base,activity:'analysis'}).length;
      const written=makeWrittenQuestions(single,base).length;
      const table=makeTableExercises(single,base).length;
      return {id:r.id,unit:r.unit,kind:r.kind,form,analysis,written,table};
    });
    result[course.morphology]={
      available:records.length,
      byUnit:Array.from({length:course.maxUnit},(_,i)=>{
        const unit=i+1,added=items.filter(x=>x.unit===unit);
        const cumulative=items.filter(x=>x.unit<=unit);
        return {unit,added:added.length,cumulative:cumulative.length,
          categories:[...new Set(cumulative.map(x=>x.kind))].sort(),
          form:added.filter(x=>x.form>0).length,
          analysis:added.filter(x=>x.analysis>0).length,
          written:added.filter(x=>x.written>0).length,
          table:added.filter(x=>x.table>0).length};
      }),
      noForm:items.filter(x=>x.form===0).map(x=>({id:x.id,unit:x.unit,kind:x.kind})),
      noAnalysis:items.filter(x=>x.analysis===0).map(x=>({id:x.id,unit:x.unit,kind:x.kind})),
      noWritten:items.filter(x=>x.written===0).map(x=>({id:x.id,unit:x.unit,kind:x.kind})),
      noTable:items.filter(x=>x.table===0).map(x=>({id:x.id,unit:x.unit,kind:x.kind}))
    };
  }
  return result;
}
export function createTeacherAudit(bank,vocabulary,lockedSha){
  return {concordance:reconcileVocabulary(bank,vocabulary,lockedSha),
    practice:auditPracticeCoverage(bank)};
}
const main=process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]);
if(main){
  const root=resolve(import.meta.dirname,'..');
  const bank=JSON.parse(readFileSync(join(root,
    'dist/apps/morfologia/data/paradigmas.json'),'utf8'));
  const lex=parseVocabularySource(readFileSync(join(root,
    '.sources/vocabula/data.js'),'utf8'));
  const lock=JSON.parse(readFileSync(join(root,'config/sources.lock.json'),'utf8'));
  process.stdout.write(JSON.stringify(createTeacherAudit(bank,lex,
    lock.sources.vocabula.sha),null,2)+'\n');
}
