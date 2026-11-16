// Auditoría individual, solo lectura, de las fichas General de Griego I sin UD.
// Coincidencia entre lemas/fuentes != autorización para exigir vocabulario.
// No escribe ni altera datos académicos, progreso, IDs o ficheros originales.
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseVocabularySource} from './audit-morphology-vocabulary.mjs';

const GR_UNASSIGNED='Sin unidad acreditada';
export const LEDGER_SCHEMA='scholaclassica-gr1-unassigned-individual/v1';
export function headword(value){
  return String(value||'').split(',')[0].trim().normalize('NFC');
}
function foldSearch(value){
  // ÚNICAMENTE recupera candidatos, no identifica glosas ni garantiza
  // identidad léxica: los diacríticos pueden distinguir palabras griegas.
  return String(value||'').normalize('NFD').replace(/\p{M}/gu,'')
    .replace(/ς/gu,'σ').toLowerCase();
}
export function lemmaKey(value){
  return foldSearch(headword(value)).replace(/[^\p{L}]/gu,'');
}
function htmlText(value){
  return String(value).replace(/<[^>]*>/gu,' ')
    .replace(/&(?:nbsp|lt|gt|amp);/gu,' ');
}
function topicHits(curriculum,rawHeadword){
  const key=lemmaKey(rawHeadword);
  if([...key].length<4)return []; // Evitar falsos positivos en palabras breves.
  const matcher=new RegExp('(^|[^\\p{L}])'+key+'(?=$|[^\\p{L}])','u');
  const out=[];
  for(const lesson of curriculum.griego.units){
    for(const topic of lesson.topics){
      const visible=foldSearch(htmlText(topic.html||''));
      if(matcher.test(visible))out.push({unit:lesson.number,title:topic.title});
    }
  }
  return out;
}
function units(hits){
  return [...new Set(hits.map(h=>h.unit))].sort((a,b)=>a-b);
}
export function auditGreekUnassigned({source,integrated,curriculumEs,curriculumVal,bank}){
  assert.equal(source.length,2055,'Vocabula fuente: número histórico inesperado');
  assert.equal(integrated.length,2055,'Vocabula integrado: número histórico inesperado');
  assert.deepEqual(integrated.map(x=>x.id),source.map(x=>x.id),
    'No se conservan los 2055 IDs o su secuencia en la integración');
  for(const curriculum of [curriculumEs,curriculumVal]){
    assert.deepEqual(curriculum.griego.units.map(x=>x.number),
      Array.from({length:14},(_,i)=>i+1),
      'La secuencia de 14 unidades de Griego I ha cambiado');
  }
  const all=source.filter(e=>e.subject==='gr1');
  const copyById=new Map(integrated.map(e=>[e.id,e]));
  const unassigned=all.filter(e=>e.mode==='general'&&
    e.units?.includes(GR_UNASSIGNED));
  assert.equal(unassigned.length,184,
    'Cambió el listado de 184 fichas: revisar antes de reetiquetar');
  assert.equal(all.filter(e=>e.mode==='examen'&&
    e.units?.includes(GR_UNASSIGNED)).length,0,
    'Una ficha sin unidad aparece en Examen');
  const known=all.filter(e=>!e.units?.includes(GR_UNASSIGNED));
  const morph=bank.records.filter(e=>e.language==='griego');
  assert.equal(morph.length,94,'Modelos griegos alterados: revisión necesaria');
  const ledger=unassigned.map(entry=>{
    const inCopy=copyById.get(entry.id);
    for(const field of ['id','subject','mode','form','meaning','units','answers']){
      assert.deepEqual(inCopy?.[field],entry[field],
        'Cambio sin autorización en ficha griega '+entry.id+' · '+field);
    }
    const lemma=headword(entry.form),key=lemmaKey(entry.form);
    const vocabPeers=known.filter(other=>lemmaKey(other.form)===key)
      .map(other=>({
        id:other.id,mode:other.mode,form:other.form,
        meaning:other.meaning,units:[...other.units],
        sameMeaning:other.meaning===entry.meaning
      }));
    const es=topicHits(curriculumEs,lemma);
    const val=topicHits(curriculumVal,lemma);
    const citedEs=units(es),citedVal=units(val);
    assert.deepEqual(citedEs,citedVal,
      'La presencia de lema en ES y VAL difiere: '+entry.id+' '+lemma);
    const morphology=morph.filter(r=>
      [r.enunciation,r.headword,r.paradigm].some(s=>s&&lemmaKey(s)===key))
      .map(r=>({id:r.id,unit:r.unit,kind:r.kind,
        paradigm:r.paradigm,source:r.evidence?.source||null}));
    const examSameGloss=vocabPeers.filter(p=>
      p.mode==='examen'&&p.sameMeaning);
    const category=examSameGloss.length?'coincide-con-examen-de-otra-ficha':
      citedEs.length?'ejemplo-documentado-en-gramatica-bilingue':
        morphology.length?'candidato-paradigma-de-morfologia':
          'sin-evidencia-curricular-directa';
    return {
      id:entry.id,form:entry.form,meaning:entry.meaning,
      originals:entry.originals||[],sourceMode:entry.mode,
      sourceUnits:[...entry.units],
      headword:lemma,category,
      evidence:{
        unitTaggedVocabularyPeers:vocabPeers,
        grammarSpanish:es,grammarValencian:val,
        grammarCommonUnits:citedEs,
        morphologyParadigms:morphology
      },
      decision:'Pendiente de criterio docente; conservar Sin unidad acreditada',
      assignUnit:null,
      examPromotion:false
    };
  });
  assert.equal(new Set(ledger.map(x=>x.id)).size,184,
    'Revisión individual: ID repetido');
  const counts={};
  for(const e of ledger)counts[e.category]=(counts[e.category]||0)+1;
  const withExam=ledger.filter(x=>x.evidence.unitTaggedVocabularyPeers
    .some(p=>p.mode==='examen'&&p.sameMeaning));
  const mentioned=ledger.filter(x=>x.evidence.grammarCommonUnits.length);
  const withMorph=ledger.filter(x=>x.evidence.morphologyParadigms.length);
  return {
    schema:LEDGER_SCHEMA,
    basis:{
      totalSourceEntries:source.length,
      greekEntries:all.length,
      greekMorphologyModels:morph.length,
      greekUnassignedGeneral:unassigned.length,
      greekUnassignedExam:0,
      spanishAndValencianUnits:14
    },
    summary:{
      classified:counts,
      matchingExamLemmaAndGloss:withExam.length,
      mentionedInBothGrammars:mentioned.length,
      morphologyHeadwordCandidates:withMorph.length,
      withAtLeastOneDirectCandidate:ledger.filter(e=>
        e.evidence.unitTaggedVocabularyPeers.length||
        e.evidence.grammarCommonUnits.length||
        e.evidence.morphologyParadigms.length).length,
      withNoDirectCandidate:ledger.filter(e=>
        !e.evidence.unitTaggedVocabularyPeers.length&&
        !e.evidence.grammarCommonUnits.length&&
        !e.evidence.morphologyParadigms.length).length
    },
    methodologicalLimitations:[
      'La coincidencia de un lema y su glosa con Examen no autoriza a cambiar las unidades del corpus General.',
      'La aparición como ejemplo en un tema de gramática no demuestra que el lema sea vocabulario de examen.',
      'Las claves de búsqueda sin diacríticos griegos son candidatas de cotejo, nunca equivalencias filológicas automáticas.',
      'La coincidencia con un paradigma de morfología no acredita una unidad exigible para vocabulario.',
      'No se asigna unidad a ninguna ficha ni se modifica el progreso.'
    ],
    decisions:ledger
  };
}
export function loadGreekUnassigned(root){
  const appendix=join(root,'.sources/appendix');
  return {
    source:parseVocabularySource(readFileSync(join(root,'.sources/vocabula/data.js'),'utf8')),
    integrated:parseVocabularySource(readFileSync(join(root,'dist/apps/vocabulario/data.js'),'utf8')),
    curriculumEs:JSON.parse(readFileSync(join(appendix,'assets/curriculum.json'),'utf8')),
    curriculumVal:JSON.parse(readFileSync(join(appendix,'val/curriculum.json'),'utf8')),
    bank:JSON.parse(readFileSync(join(root,'dist/apps/morfologia/data/paradigmas.json'),'utf8'))
  };
}
const main=process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]);
if(main){
  const root=resolve(import.meta.dirname,'..'),report=auditGreekUnassigned(loadGreekUnassigned(root));
  const dir=join(root,'build/academic-audits/greek-unassigned');
  mkdirSync(dir,{recursive:true});
  writeFileSync(join(dir,'griego1-184-fichas-individuales.json'),
    JSON.stringify(report,null,2)+'\n');
  const review=report.decisions.filter(x=>
    x.category!=='sin-evidencia-curricular-directa');
  writeFileSync(join(dir,'griego1-candidatas-revision-docente.json'),
    JSON.stringify({schema:report.schema,summary:report.summary,records:review},null,2)+'\n');
  console.log('AUDITORIA_GRIEGO_184',JSON.stringify({
    basis:report.basis,summary:report.summary,
    candidates:review.map(x=>({id:x.id,form:x.form,category:x.category,
      grammarUnits:x.evidence.grammarCommonUnits,
      morphologyUnits:x.evidence.morphologyParadigms.map(r=>r.unit),
      peers:x.evidence.unitTaggedVocabularyPeers.map(p=>p.units)}))
  }));
}
