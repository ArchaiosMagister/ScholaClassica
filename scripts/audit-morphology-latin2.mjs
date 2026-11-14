// Auditoría filológica conservadora de Latín II (fase 1).
// Diagnostica, sin inferir que toda casilla del banco haya sido verificada.
// La presencia de un lema o forma en PAU/cuaderno acredita su relevancia,
// pero no convierte en filológicamente verificadas las flexiones generadas.
import assert from 'node:assert/strict';

const CANONICAL=[
  {id:'lat2-compuesto-proficiscor',form:'profectus est',lemma:'proficiscor',
    tense:'perfecto',mood:'indicativo',voice:'pasiva',person:'3.ª',number:'singular'},
  {id:'lat2-compuesto-polliceor',form:'erant polliciti',lemma:'polliceor',
    tense:'pluscuamperfecto',mood:'indicativo',voice:'deponente',person:'3.ª',number:'plural'},
  {id:'lat2-compuesto-confero',form:'collata erant',lemma:'confero',
    tense:'pluscuamperfecto',mood:'indicativo',voice:'pasiva',person:'3.ª',number:'plural'},
  {id:'lat2-compuesto-mitto',form:'missi sunt',lemma:'mitto',
    tense:'perfecto',mood:'indicativo',voice:'pasiva',person:'3.ª',number:'plural'},
  {id:'lat2-compuesto-capio',form:'captae sumus',lemma:'capio',
    tense:'perfecto',mood:'indicativo',voice:'pasiva',person:'1.ª',number:'plural'}
];
const DEONENT_IMPERATIVES=[
  {id:'latin2-pau-regular-verb-moror',
    headword:'moror',singular:'morare',plural:'moramini',
    invalid:['mora','morate']},
  {id:'latin2-pau-regular-verb-populor',
    headword:'populor',singular:'populare',plural:'populamini',
    invalid:['popula','populate']}
];
const AMBIGUOUS=[
  {id:'latin2-pau-venio-indicativo-subjuntivo',form:'venit',
    analyses:[['presente','indicativo'],['perfecto','indicativo']]},
  {id:'latin2-pau-regular-verb-instituo',form:'instituit',
    analyses:[['presente','indicativo'],['perfecto','indicativo']]},
  {id:'latin2-pau-regular-verb-mitto',form:'mitteris',
    analyses:[['presente','indicativo'],['futuro','indicativo']]},
  {id:'latin2-cuaderno-irregular-fero',form:'feram',
    analyses:[['futuro','indicativo'],['presente','subjuntivo']]},
  {id:'latin2-cuaderno-irregular-fio',form:'fiam',
    analyses:[['futuro','indicativo'],['presente','subjuntivo']]}
];

const comparable=s=>String(s||'').trim().toLowerCase()
  .replace(/æ/g,'ae').replace(/œ/g,'oe')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');
const has=(text,needle)=>comparable(text).includes(comparable(needle));
const seen=values=>[...new Set(values)];
function classify(record){
  const evidence=record.evidence||{};
  const flag=String(evidence.verification||'')+' '+String(evidence.notes||'');
  if(/generad|no equivale|sin acreditaci[oó]n|sin verificaci[oó]n|requiere cotejo|sin cotejo|no constituye cotejo|no implica cotejo|modelo escolar/i.test(flag))
    return 'paradigma-derivado-no-cotejado-individualmente';
  if(evidence.sourceRevision||evidence.vocabulaSha)
    return 'tabla-de-fuente-fijada';
  return 'paradigma-declarado-sin-certificacion-individual';
}
function findRecord(records,id){return records.find(r=>r.id===id)}
function feature(entry,fragment){
  return has(entry.analysis,fragment);
}
function add(issues,priority,code,description,referent,details={}){
  issues.push({priority,code,description,referent,...details});
}
export function auditLatin2Morphology(bank){
  assert.ok(bank&&Array.isArray(bank.records)&&bank.coverage?.latin2?.includes(0));
  const records=bank.records.filter(r=>r.language==='latin2');
  const issues=[];
  const summary={
    records:records.length,
    forms:records.reduce((n,r)=>n+r.forms.length,0),
    distinctSurfaceForms:new Set(records.flatMap(r=>r.forms.map(f=>comparable(f.form)))).size,
    byCategory:Object.fromEntries(
      seen(records.map(r=>r.kind)).sort().map(k=>[k,records.filter(r=>r.kind===k).length])),
    byEvidenceLevel:Object.fromEntries(
      seen(records.map(classify)).sort().map(x=>[x,records.filter(r=>classify(r)===x).length]))
  };
  // Los paradigmas por modelo son útiles para práctica, pero no deben recibir
  // automáticamente el estatus de cotejados forma a forma.
  for(const r of records){
    if(!r.headword || !Array.isArray(r.forms)||r.forms.length<2){
      add(issues,'blocking','RECORD_INCOMPLETE','Enunciado o flexiones ausentes',r.id);
      continue;
    }
    for(const [i,f] of r.forms.entries()){
      if(!f.form||!f.analysis||!has(f.analysis,r.headword)){
        add(issues,'blocking','ENTRY_WITHOUT_HEADWORD',
          'Una casilla carece de forma, análisis o enunciado completo',r.id,{index:i});
      }
      if(r.kind==='verbo'&&/\s(?:sum|es|est|eram|erat|erant|sunt|sim|essem|erunt)$/i.test(f.form)&&
        !f.analysis.startsWith('verbo · ')){
        add(issues,'blocking','COMPOUND_WRONG_CATEGORY',
          'Un tiempo compuesto no está anotado como verbo',r.id,{form:f.form});
      }
    }
  }
  for(const spec of DEONENT_IMPERATIVES){
    const r=findRecord(records,spec.id);
    if(!r){add(issues,'blocking','DEPONENT_NOT_FOUND',
      'Falta el paradigma deponente examinado',spec.id);continue}
    const imperatives=r.forms.filter(f=>has(f.analysis,' · imperativo · '));
    for(const [number,expected] of [['singular',spec.singular],['plural',spec.plural]]){
      const entries=imperatives.filter(f=>has(f.analysis,'2.ª persona · '+number));
      if(!entries.some(f=>comparable(f.form)===expected&&
          has(f.analysis,'deponente'))){
        add(issues,'blocking','DEPONENT_IMPERATIVE_MISSING',
          'El imperativo debe mantener desinencia pasiva y sentido activo',spec.id,
          {number,expected,found:entries.map(x=>x.form)});
      }
    }
    for(const f of imperatives.filter(x=>spec.invalid.includes(comparable(x.form)))){
      add(issues,'blocking','DEPONENT_FALSE_ACTIVE_IMPERATIVE',
        'Se generó un imperativo deponente con desinencia activa',spec.id,{form:f.form});
    }
  }
  for(const spec of CANONICAL){
    const matches=records.filter(r=>r.kind==='verbo'&&
      has(r.headword,spec.lemma)&&
      r.forms.some(f=>comparable(f.form)===spec.form));
    const correct=matches.some(r=>r.forms.some(f=>
      comparable(f.form)===spec.form&&
      [spec.tense,spec.mood,spec.voice,
        spec.person+' persona',spec.number].every(part=>feature(f,part))));
    if(!correct)add(issues,'blocking','COMPOUND_MISANALYSED',
      'La forma compuesta debe pertenecer al verbo léxico completo',spec.id,
      {form:spec.form,expectedLemma:spec.lemma});
  }
  for(const spec of AMBIGUOUS){
    const r=findRecord(records,spec.id);
    const entries=r?.forms.filter(f=>comparable(f.form)===spec.form)||[];
    for(const [tense,mood] of spec.analyses){
      if(!entries.some(f=>feature(f,tense)&&feature(f,mood)))
        add(issues,'blocking','AMBIGUITY_LOST',
          'No puede reducirse una forma sincrética a una sola lectura',spec.id,
          {form:spec.form,missingTense:tense,missingMood:mood});
    }
  }
  const fio=findRecord(records,'latin2-cuaderno-irregular-fio');
  if(fio){
    // Allen & Greenough (DCC §204) entrecorcheta ambas formas; no son
    // típicas de buena prosa. Reservar prioridad de consulta, no borrarlas.
    for(const form of ['fimus','fitis']){
      if(fio.forms.some(f=>comparable(f.form)===form))
        add(issues,'review','FIO_RARE_FORM',
          'Forma recogida en el paradigma, pero poco usual en prosa clásica',
          fio.id,{form,source:'Allen & Greenough §204, DCC'});
    }
  }
  const blocking=issues.filter(i=>i.priority==='blocking');
  return {schema:'schola-latin2-philological-audit/v1',
    phase:1,scope:'Latín II · invariantes verbales y provenance de paradigmas',
    summary,blockingIssues:blocking,reviewIssues:issues.filter(i=>i.priority==='review'),
    completeIndividualVerification:false,
    declaration:'Cobertura didáctica y paradigma completo no equivalen a verificación filológica individual de todas las casillas.'};
}
export function assertLatin2AuditPasses(report){
  assert.equal(report.blockingIssues.length,0,
    'Se detectaron errores morfológicos bloqueantes: '+
      report.blockingIssues.map(i=>i.code+' @ '+i.referent+
        (i.form?' / '+i.form:'')).join('; '));
}
