// Contraste SECUNDARIO de candidatos de Wiktionary y decisiones editoriales
// disponibles en GeneradorExamenes. NO convierte propuestas en soluciones.
// No se redistribuyen paradigmas Wiktionary, Eulexis o Perseus en el PWA.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
const key=s=>String(s||'').toLocaleLowerCase('el').normalize('NFD')
  .replace(/\p{M}/gu,'').replace(/ς/g,'σ').trim();

export function crosscheckNounInventory({greekCatalog=[],latinCatalog=[],
  greekCandidates,greekEditorial,sourceSha}){
  assert.match(sourceSha,/^[0-9a-f]{40}$/);
  assert.equal(greekCandidates?.status,'WIKTIONARY_CANDIDATES_NOT_FOR_GRADING');
  assert.equal(greekCandidates?.license,'CC BY-SA 4.0');
  assert.ok(Array.isArray(greekCandidates.entries));
  assert.equal(greekEditorial?.verifiedMorphology,false,
    'Las decisiones editoriales no verifican todas las flexiones');
  assert.ok(Array.isArray(greekEditorial.decisions));

  const candidateMap=new Map();
  for(const entry of greekCandidates.entries.filter(x=>x.kind==='N')){
    if(!candidateMap.has(key(entry.word)))candidateMap.set(key(entry.word),entry);
  }
  const teacherLemmas=new Set(greekCatalog.map(r=>key(r.lemma)));
  const reviews=greekCatalog.map(record=>{
    const w=candidateMap.get(key(record.lemma));
    const candidateEvidence=w?{
      source:'Wiktionary / Wiktextract (solo candidato)',
      sourcePage:w.source_page||null,
      proposedForms:w.forms?.length||0,
      matchingSlots:w.matchingSlots||0,
      license:greekCandidates.license,
      policy:'No valida claves de respuesta; no se copian las formas'
    }:null;
    const editorial=greekEditorial.decisions.filter(d=>
      key((d.entry||d.sourceEntry||'').split(',')[0])===key(record.lemma)||
      key((d.original||'').split(',')[0])===key(record.lemma)).map(d=>({
        id:d.id,from:d.original,to:d.entry,
        purpose:'Corrección del enunciado, no verificación morfológica'
      }));
    return {lemma:record.lemma,status:record.status,course:'gr1',
      ...(record.recordId?{recordId:record.recordId}:{}),
      wiktionary:candidateEvidence,editorial,
      verdict:record.status==='incorporado'?
        'UniMorph/Vocabula/Appendix; revisión filológica individual pendiente':
        'Pendiente; no seleccionar ni completar por analogía'};
  });
  const externalOnly=[...candidateMap].filter(([k])=>!teacherLemmas.has(k))
    .map(([,value])=>({lemma:value.word,
      sourcePage:value.source_page||null,
      status:'solo-propuesta-externa',
      reason:'No se atribuye pertenencia al vocabulario docente sin cotejo',
      license:greekCandidates.license}));
  return {
    schema:'schola-nominal-secondary-evidence/v1',sourceSha,
    sources:{
      wiktionary:{status:greekCandidates.status,license:greekCandidates.license,
        source:greekCandidates.source,attribution:greekCandidates.attribution},
      editorial:{verifiedMorphology:false,source:'GeneradorExamenes / decisiones docentes'},
      eulexis:{status:'no-consultado-en-este-compilador',
        reason:'Los resultados de Eulexis son propuestas, no pruebas de diez casillas'},
      perseus:{status:'no-consultado-en-este-compilador'},
      logeion:{status:'no-consultado-en-este-compilador'}
    },
    counts:{greekCatalog:greekCatalog.length,latinCatalog:latinCatalog.length,
      wiktionaryNouns:candidateMap.size,
      matchedGreek:reviews.filter(r=>r.wiktionary).length,
      editorialMatched:reviews.filter(r=>r.editorial.length).length,
      extraExternalOnly:externalOnly.length},
    greekReviews:reviews,externalOnly
  };
}
export async function readNounSecondaryEvidence(source){
  const dir=join(source,'data/lemmas');
  const [candidateData,editorialData]=await Promise.all([
    readFile(join(dir,'greek-nominal-candidates.json'),'utf8'),
    readFile(join(dir,'greek-editorial-decisions.json'),'utf8')
  ]);
  return {greekCandidates:JSON.parse(candidateData),
    greekEditorial:JSON.parse(editorialData)};
}
