// Auditoría filológica de solo lectura: tres cursos, tres productos y dos lenguas.
// No escribe bancos ni artefactos públicos; imprime resultados condensados.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {correctLatin4Vocabula} from './latin4-lexical-editorial.mjs';
import {reconcileLatin4ExamUd8} from './latin4-ud8-reconciliation.mjs';

const root=resolve(import.meta.dirname,'..');
const load=relative=>JSON.parse(readFileSync(join(root,relative),'utf8'));
const source=relative=>readFileSync(join(root,relative),'utf8');
const parseAssigned=(raw,prefix)=>{
 // Fuente fijada: se admiten comentarios antes de la asignación, pero no
 // expresiones ejecutables ni prefijos nuevos. Se extrae solo JSON equilibrado.
 const text=String(raw),at=text.indexOf(prefix);
 assert.ok(at>=0&&text.indexOf(prefix,at+prefix.length)<0,
   'Asignación desconocida o repetida: '+prefix);
 let start=at+prefix.length;
 while(/\s/u.test(text[start]||''))start++;
 const open=text[start],close=open==='['?']':open==='{'?'}':null;
 assert.ok(close,'La asignación no contiene JSON: '+prefix);
 let depth=0,quoted=false,escaped=false;
 for(let end=start;end<text.length;end++){
   const c=text[end];
   if(quoted){
     if(escaped){escaped=false;continue}
     if(c==='\\'){escaped=true;continue}
     if(c==='"')quoted=false;
     continue;
   }
   if(c==='"'){quoted=true;continue}
   if(c===open)depth++;
   if(c===close){
     depth--;
     if(depth===0)return JSON.parse(text.slice(start,end+1));
   }
 }
 throw Error('Asignación JSON sin cierre: '+prefix);
};
const CONFIG=Object.freeze([
 {key:'latin1',vocabulary:'lat1',morphology:'latin',grammar:'latin',max:10,
  es:'assets/curriculum-latin1.json',val:'val/curriculum-latin1.json'},
 {key:'latin4',vocabulary:'lat4',morphology:'latin4',grammar:'latin',max:8,
  es:'assets/curriculum-latin4.json',val:'val/curriculum-latin4.json'},
 {key:'griego1',vocabulary:'gr1',morphology:'griego',grammar:'griego',max:14,
  es:'assets/curriculum-griego1.json',val:'val/curriculum-griego1.json'}
]);
function foldLatin(s){
 return String(s??'').normalize('NFD').replace(/\p{M}/gu,'')
   .replace(/æ/giu,'ae').replace(/œ/giu,'oe').toLowerCase().trim();
}
function foldGreek(s){
 return String(s??'').normalize('NFD').replace(/[\u0304\u0306]/gu,'')
   .normalize('NFC').trim();
}
const fold=(s,language)=>language==='griego'?foldGreek(s):foldLatin(s);
const head=s=>String(s??'').split(' · ')[0].split(',')[0].trim();
const group=s=>{
 const match=String(s).match(/^UD\s*(\d+)(?:\s*[–-]\s*(\d+))?$/u);
 return match?{start:Number(match[1]),end:Number(match[2]||match[1])}:null;
};
function filterUnit(code,unit){return (code.units||[]).some(t=>group(t)?.start<=unit&&group(t)?.end>=unit)}
function rowsHtml(html,tag){return [...html.matchAll(new RegExp('<'+tag+'\\b','gu'))].length}
function checkGrammars(config){
 const es=load('dist/apps/gramatica/'+config.es);
 const val=load('dist/apps/gramatica/'+config.val);
 const left=es[config.grammar]?.units,right=val[config.grammar]?.units;
 assert.equal(left?.length,config.max,'Unidades en castellano: '+config.key);
 assert.equal(right?.length,config.max,'Unidades en valenciano: '+config.key);
 const differences=[];
 const counts={topics:0,tables:0,contents:0};
 for(let i=0;i<config.max;i++){
   const e=left[i],v=right[i];
   assert.equal(e.number,i+1);assert.equal(v.number,i+1);
   if(e.topics.length!==v.topics.length)differences.push({unit:i+1,type:'topics'});
   counts.topics+=e.topics.length;
   for(let j=0;j<e.topics.length;j++){
     const a=e.topics[j],b=v.topics[j];
     if(!b){differences.push({unit:i+1,topic:j,type:'missing'});continue}
     const en=rowsHtml(a.html,'table'),vn=rowsHtml(b.html,'table');
     counts.tables+=en;
     if(en!==vn)differences.push({unit:i+1,topic:j,type:'tables',es:en,val:vn});
     if(a.html.length<60||b.html.length<60)differences.push({unit:i+1,topic:j,type:'empty'});
     counts.contents++;
   }
 }
 return {differences,counts};
}
function latin4TeacherCross(bank,lock){
 const teacher=parseAssigned(source('.sources/vocabula/gramatica-paradigmas.js'),
   'window.GRAMMAR_PARADIGMS=');
 const imperfect=parseAssigned(source('.sources/vocabula/gramatica-latin-imperfectos.js'),
   'window.GRAMMAR_PARADIGMS.push(...');
 const selected=[...teacher,...imperfect].filter(x=>x.units?.lat4);
 const originals=bank.records.filter(x=>x.language==='latin');
 const latin4=bank.records.filter(x=>x.language==='latin4');
 const byId=new Map(bank.records.map(r=>[r.id,r]));
 const exact=[],differences=[];
 for(const t of selected){
   const actual=byId.get('latin4-docente-'+t.id);
   if(!actual){differences.push({id:t.id,type:'missing-teacher-model'});continue}
   const forms=Object.values(t.forms).flatMap(v=>String(v).split(/\s+\/\s+/u))
      .map(x=>foldLatin(x)).sort();
   const observed=actual.forms.map(x=>foldLatin(x.form)).sort();
   if(JSON.stringify(forms)!==JSON.stringify(observed)){
     differences.push({id:t.id,type:'forms-differ',source:forms,model:observed});
   }else exact.push(actual.id);
   const unit=Number(t.units.lat4.split(' ')[1]);
   if(actual.unit!==unit)differences.push({id:t.id,type:'unit-differ',
    expected:unit,observed:actual.unit});
   if(actual.evidence.vocabulaSha!==lock.sources.vocabula.sha)
     differences.push({id:t.id,type:'revision-differ'});
 }
 const copies=latin4.filter(x=>x.id.startsWith('latin4-appendix-')&&
   x.id!=='latin4-appendix-bonus');
 for(const row of copies){
   const original=byId.get(row.id.slice('latin4-appendix-'.length));
   if(!original){differences.push({id:row.id,type:'missing-latin1-model'});continue}
   if(JSON.stringify(row.forms)!==JSON.stringify(original.forms))
     differences.push({id:row.id,type:'copied-forms-differ'});
   if(row.evidence.sourceUnit!==original.unit)
     differences.push({id:row.id,type:'bridge-source-unit'});
 }
 return {teacher:selected.length,teacherExact:exact.length,
   appendixBridges:copies.length,differences};
}
function compareGreekEvidence(bank,words){
 const index=new Map(words.map(x=>[x.id,x]));
 const tied=bank.records.filter(r=>r.language==='griego'&&r.evidence?.vocabulaEntry);
 const problems=[];
 for(const row of tied){
   const item=index.get(row.evidence.vocabulaEntry);
   if(!item){problems.push({record:row.id,type:'unresolvable-vocabula-id'});continue}
   if(item.subject!=='gr1'||item.mode!=='examen')
     problems.push({record:row.id,type:'source-not-exam'});
   if(row.evidence.vocabulaSha&&row.evidence.vocabulaSha!==bank.vocabulaSha)
     problems.push({record:row.id,type:'unlocked-source'});
   const credited=(item.units||[]).map(group).filter(Boolean).map(x=>x.end);
   if(credited.length&&row.unit<Math.min(...credited)&&
      row.id!=='griego-sustantivo-anthropos')
     problems.push({record:row.id,type:'premature-curricular-release',
       actual:row.unit,minimum:Math.min(...credited)});
   if(row.kind==='sustantivo'&&(!row.forms?.length||row.forms.length<10))
     problems.push({record:row.id,type:'incomplete-credited-noun'});
 }
 return {verifiedSourceReferences:tied.length,problems};
}
// Comparación nominal solo cuando el vocabulario y la práctica declaran
// expresamente género y, en su caso, genitivo COMPLETO. Las terminaciones
// abreviadas (-is, –ου) nunca se expanden por analogía.
function explicitGender(form,language){
 const text=String(form||'');
 if(language==='griego'){
   if(/\(ὁ\s*\/\s*ἡ\)/u.test(text))return 'común';
   if(/\(ὁ\)/u.test(text))return 'masculino';
   if(/\(ἡ\)/u.test(text))return 'femenino';
   if(/\((?:τὸ|τό)\)/u.test(text))return 'neutro';
   return null;
 }
 const m=text.match(/\((m|f|n)\.\)/iu);
 return m?{m:'masculino',f:'femenino',n:'neutro'}[m[1].toLowerCase()]:null;
}
function fullGenitive(form,language){
 const part=String(form||'').split(',')[1]?.trim();
 if(!part||/^[–—-]/u.test(part)||part.includes('/')||part.includes('+'))return null;
 const cleaned=part.replace(/\s+\([^()]*\)\s*$/u,'').trim();
 if(language==='griego'?!/^[\p{Script=Greek}]/u.test(cleaned):
   !/^[a-zæœ]/iu.test(foldLatin(cleaned)))return null;
 return cleaned.length<=35?cleaned:null;
}
function auditNominalAttributes(records,entries,language){
 const nouns=records.filter(r=>r.kind==='sustantivo'&&r.gender);
 const byLemma=new Map();
 for(const r of nouns){
   const lemma=head(r.enunciation||r.headword||r.paradigm);
   const key=fold(lemma,language);
   if(!byLemma.has(key))byLemma.set(key,[]);
   byLemma.get(key).push(r);
 }
 let genderComparisons=0,genitiveComparisons=0;
 const review=[];
 for(const e of entries.filter(x=>x.mode==='examen')){
   const matches=byLemma.get(fold(head(e.form),language))||[];
   const gender=explicitGender(e.form,language);
   if(!matches.length)continue;
   if(gender){
     genderComparisons++;
     if(!matches.some(r=>r.gender===gender)){
       review.push({type:'gender-conflict',vocabId:e.id,form:e.form,
         expected:gender,models:matches.map(r=>({id:r.id,gender:r.gender}))});
     }
   }
   const genitive=fullGenitive(e.form,language);
   if(!genitive)continue;
   const modelForms=matches.flatMap(r=>r.forms.filter(f=>
     f.case==='genitivo'&&f.number==='singular').map(f=>f.form));
   if(!modelForms.length)continue;
   genitiveComparisons++;
   if(!modelForms.some(x=>fold(x,language)===fold(genitive,language)))
     review.push({type:'full-genitive-conflict',vocabId:e.id,form:e.form,
       expected:genitive,models:matches.map(r=>r.id),
       candidates:modelForms.slice(0,8)});
 }
 return {genderComparisons,genitiveComparisons,review};
}
function nominalCollisions(records,language){
 const index=new Map();
 for(const record of records.filter(r=>['sustantivo','adjetivo'].includes(r.kind))){
   const lemma=head(record.enunciation||record.headword||record.paradigm);
   if(!lemma||lemma.length>35||/^(?:segunda|primera|tercera|neutro|modelo|formas)/iu.test(lemma))continue;
   const key=fold(lemma,language);
   for(const f of record.forms){
     if(!f.case||!f.number)continue;
     const slot=f.case+'/'+f.number+'/'+(f.gender||record.gender||'');
     const label=key+'|'+slot;
     if(!index.has(label))index.set(label,[]);
     index.get(label).push({id:record.id,form:f.form});
   }
 }
 const contradictions=[];
 for(const [label,entries] of index){
   if(new Set(entries.map(x=>x.id)).size<2)continue;
   const unique=[...new Set(entries.map(x=>fold(x.form,language)))];
   if(unique.length>1)contradictions.push({label,
      examples:entries.slice(0,7),differentForms:unique});
 }
 return contradictions;
}
export function auditTransversal({bank,vocabulary,originalVocabulary,curricula,lock}){
 assert.ok(bank&&Array.isArray(bank.records));
 assert.equal(bank.appendixSha,lock.sources.appendix.sha);
 assert.equal(bank.vocabulaSha,lock.sources.vocabula.sha);
 assert.equal(originalVocabulary.length,2055);
 assert.equal(vocabulary.length,originalVocabulary.length);
 assert.deepEqual(vocabulary.map(x=>x.id),originalVocabulary.map(x=>x.id),
   'Los identificadores léxicos no pueden cambiar');
 const expected=reconcileLatin4ExamUd8(correctLatin4Vocabula(originalVocabulary));
 assert.deepEqual(vocabulary,expected,'La copia léxica ha cambiado fuera de enmiendas autorizadas');
 const duplicateIds=bank.records.length-new Set(bank.records.map(x=>x.id)).size;
 assert.equal(duplicateIds,0,'Identificador morfológico repetido');
 const courses={};
 for(const c of CONFIG){
   const grammar=curricula[c.key];
   const records=bank.records.filter(r=>r.language===c.morphology);
   const entries=vocabulary.filter(v=>v.subject===c.vocabulary);
   const general=entries.filter(v=>v.mode==='general');
   const exam=entries.filter(v=>v.mode==='examen');
   const index=new Map();
   for(const r of records){
     const h=head(r.enunciation||r.headword||r.paradigm);
     if(!h||h.length>70)continue;
     const key=fold(h,c.morphology);
     if(!index.has(key))index.set(key,[]);
     index.get(key).push(r);
   }
   const matched=exam.filter(v=>index.has(fold(head(v.form),c.morphology)));
   const missing=exam.filter(v=>!index.has(fold(head(v.form),c.morphology)));
   const outOfScope=entries.filter(v=>v.units.some(u=>group(u)?.start>c.max));
   const grouped=Object.fromEntries([...new Set(entries.flatMap(x=>x.units))].sort()
     .map(unit=>[unit,{general:general.filter(x=>x.units.includes(unit)).length,
       exam:exam.filter(x=>x.units.includes(unit)).length}]));
   const unitViolations=records.filter(r=>r.unit<1||r.unit>c.max)
     .map(r=>({record:r.id,unit:r.unit}));
   const collisions=nominalCollisions(records,c.morphology);
   const nominalAttributes=auditNominalAttributes(records,entries,c.morphology);
   courses[c.key]={
     grammar:grammar.counts,grammaticalDifferences:grammar.differences,
     records:records.length,recordsPerUnit:Array.from({length:c.max},(_,i)=>
        records.filter(r=>r.unit===i+1).length),
     vocabulary:{total:entries.length,general:general.length,exam:exam.length,
       examWithMorphologicalLemma:matched.length,examWithoutMorphologicalLemma:missing.length,
       byGroup:grouped,outOfScope:outOfScope.length,
       outOfScopeExam:outOfScope.filter(x=>x.mode==='examen').length,
       outOfScopeExamEntries:outOfScope.filter(x=>x.mode==='examen')
         .map(x=>({id:x.id,form:x.form,units:[...x.units]}))},
     unitViolations,nominalCollisions:collisions,nominalAttributes,
     lexicalMatchingExamples:matched.slice(0,12).map(v=>head(v.form)),
     unmatchedExamExamples:missing.slice(0,15).map(v=>({id:v.id,form:v.form,units:v.units}))
   };
 }
 return {schema:'schola-transversal-philology/v1',
   sources:{appendix:lock.sources.appendix.sha,vocabula:lock.sources.vocabula.sha},
   totalMorphology:bank.records.length,lexicalIdentitiesPreserved:true,
   greekEvidence:compareGreekEvidence(bank,vocabulary),
   latin4Sources:latin4TeacherCross(bank,lock),
   courses};
}
export function readTransversalAudit(){
 const bank=load('dist/apps/morfologia/data/paradigmas.json');
 const words=parseAssigned(source('dist/apps/vocabulario/data.js'),'window.VOCAB=');
 const original=parseAssigned(source('.sources/vocabula/data.js'),'window.VOCAB=');
 const lock=load('config/sources.lock.json');
 const curricula=Object.fromEntries(CONFIG.map(x=>[x.key,checkGrammars(x)]));
 return auditTransversal({bank,vocabulary:words,originalVocabulary:original,
   curricula,lock});
}
const main=process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]);
if(main){
 const audit=readTransversalAudit();
 const print={schema:audit.schema,totalMorphology:audit.totalMorphology,
  sources:audit.sources,latin4Sources:audit.latin4Sources,
  greekEvidence:audit.greekEvidence,
  courses:Object.fromEntries(Object.entries(audit.courses).map(([key,v])=>[key,
    {grammar:v.grammar,grammaticalDifferences:v.grammaticalDifferences,
     morphologyRecords:v.records,recordsPerUnit:v.recordsPerUnit,
     vocabulary:v.vocabulary,unitViolations:v.unitViolations,
     nominalCollisionCount:v.nominalCollisions.length,
     nominalCollisionExamples:v.nominalCollisions.slice(0,12),
     nominalAttributes:v.nominalAttributes,
     unmatchedExamExamples:v.unmatchedExamExamples.slice(0,6)}]))};
 process.stdout.write(JSON.stringify(print,null,2)+'\n');
}
