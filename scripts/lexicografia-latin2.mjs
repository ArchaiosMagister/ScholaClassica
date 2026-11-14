// Verificación lexicográfica asistida de Latín II.
// Nunca transforma una coincidencia de UniMorph en "atestiguado en autor",
// ni equipara dos copias de UniMorph con dos fuentes independientes.
// Corpus externo leído solo en el entorno de auditoría; NO en PWA.
// Licencia datos UniMorph Latin: CC BY-SA 3.0 (fuente Wiktionary).
import assert from 'node:assert/strict';

export const UNIMORPH_LATIN_REVISION='050924c9f013e6aba4d7c87be243a1d79b6c5b10';
export const LEXICAL_SCHEMA='schola-latin2-lexical-audit/v1';

export function latinKey(value){
  return String(value||'').normalize('NFD')
    .replace(/æ/gi,'ae').replace(/œ/gi,'oe')
    .replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/\s+/g,' ').trim();
}
export function parseUniMorphRow(line){
  const row=line.trimEnd().split('\t');
  if(row.length!==3||!row.every(Boolean))return null;
  const [lemma,form,features]=row;
  const tags=features.split(';');
  // Las etiquetas son datos de una fuente externa: signos como '-' o '?'
  // son posibles y NO deben provocar que descartemos silenciosamente filas.
  if(!tags.every(t=>t.trim().length>0))return null;
  return {lemma,form,features:tags,rawFeatures:features};
}
export function parseExternalEvidenceRow(line){
  const v=JSON.parse(line);
  assert.ok(v&&typeof v.lemma==='string'&&v.lemma.trim());
  assert.ok(typeof v.form==='string'&&v.form.trim());
  assert.ok(['LEMLAT3','Collatinus'].includes(v.source),
    'La fuente secundaria debe ser LEMLAT3 o Collatinus, no otro nombre arbitrario ni una copia de UniMorph');
  assert.equal(v.tagset,'UniMorph',
    'La conversión de etiquetas nativas a UniMorph debe ser explícita y auditable');
  assert.ok(typeof v.revision==='string'&&v.revision.trim());
  assert.ok(typeof v.reference==='string'&&v.reference.trim(),
    'Falta referencia individual del registro original');
  assert.ok(typeof v.nativeFeatures==='string'&&v.nativeFeatures.trim(),
    'La exportación debe conservar las etiquetas nativas para auditoría');
  assert.ok(Array.isArray(v.features)&&v.features.every(x=>
    typeof x==='string'&&x.length>0));
  return {...v,rawFeatures:v.features.join(';')};
}
const CASE={nominativo:'NOM',vocativo:'VOC',acusativo:'ACC',genitivo:'GEN',
  dativo:'DAT',ablativo:'ABL',locativo:'LOC'};
const GENDER={masculino:'MASC',femenino:'FEM',neutro:'NEUT'};
const NUMBER={singular:'SG',plural:'PL'};
const MOOD={indicativo:'IND',subjuntivo:'SBJV',imperativo:'IMP'};
const POS={
  sustantivo:['N','PROPN'],adjetivo:['ADJ'],pronombre:['PRO','DET'],
  verbo:['V'],infinitivo:['V'],participio:['V','V.PTCP']
};
const dimensions={
  case:['NOM','VOC','ACC','GEN','DAT','ABL','LOC'],
  gender:['MASC','FEM','NEUT'],
  number:['SG','PL','DU'],
  mood:['IND','SBJV','IMP'],
  voice:['ACT','PASS'],
  person:['1','2','3'],
  tense:['PRS','FUT','PST']
};
function getPerson(form){
  const x=String(form.person||form.analysis||'').match(/([123])\.ª/);
  return x?.[1]||null;
}
export function expectedFeatures(record,form){
  const analysis=String(form.analysis||'');
  const expected={pos:POS[record.kind]||[]};
  const cas=form.case||Object.keys(CASE).find(k=>
    analysis.includes(' · '+k+' · '));
  if(CASE[cas])expected.case=CASE[cas];
  const gender=form.gender||Object.keys(GENDER).find(k=>
    analysis.includes(' · '+k+' · '));
  if(GENDER[gender])expected.gender=GENDER[gender];
  const number=form.number||Object.keys(NUMBER).find(k=>
    analysis.includes(' · '+k));
  if(NUMBER[number])expected.number=NUMBER[number];
  if(['verbo','infinitivo','participio'].includes(record.kind)){
    const mood=form.mood||Object.keys(MOOD).find(k=>analysis.includes(' · '+k+' · '));
    if(MOOD[mood]&&record.kind==='verbo')expected.mood=MOOD[mood];
    if(record.kind==='infinitivo')expected.finiteness='NFIN';
    if(record.kind==='participio')expected.participle='V.PTCP';
    const person=getPerson(form);
    if(person&&record.kind==='verbo')expected.person=person;
    const tense=form.tense||['futuro perfecto','pluscuamperfecto',
      'imperfecto','perfecto','presente','futuro'].find(t=>
      analysis.includes(' · '+t+' · '));
    // En UniMorph PST+IPFV significa imperfecto y PST+PFV perfecto.
    // Los valores de pluscuamperfecto y futuro perfecto requieren
    // correspondencias más precisas y NO se dan por cotejados aquí.
    if(tense==='presente')expected.tense='PRS';
    else if(tense==='futuro')expected.tense='FUT';
    else if(tense==='imperfecto')expected.tense='PST+IPFV';
    else if(tense==='perfecto')expected.tense='PST+PFV';
    if(record.kind==='verbo'){
      const voice=String(form.voice||'');
      if(!/deponente|impersonal/i.test(voice)&&
         !/deponente|impersonal/i.test(analysis)){
        if(voice==='activa'||analysis.includes('voz activa'))expected.voice='ACT';
        if(voice==='pasiva'||analysis.includes('voz pasiva'))expected.voice='PASS';
      }
    }
  }
  return expected;
}
function hasFeature(bundle,feature){
  return bundle.some(value=>value.split('+').includes(feature));
}
export function compareWithMorphology(expected,sourceTags){
  const tags=Array.isArray(sourceTags)?sourceTags:String(sourceTags).split(';');
  const matched=[],conflicts=[],unknown=[];
  const claimedPos=tags.find(t=>['N','PROPN','ADJ','PRO','DET','V','V.PTCP'].includes(t));
  if(expected.pos.length){
    if(expected.pos.includes(claimedPos)||expected.pos.includes('V')&&claimedPos==='V.PTCP'){
      matched.push('categoría');
    }else if(claimedPos){
      conflicts.push('categoría');
    }else unknown.push('categoría');
  }
  for(const dim of ['case','gender','number','mood','person','voice','tense']){
    const want=expected[dim];
    if(!want)continue;
    const declared=dimensions[dim].some(x=>hasFeature(tags,x));
    if(dim==='tense'&&want.includes('+')){
      const [tense,aspect]=want.split('+');
      if(!declared||!tags.includes('IPFV')&&!tags.includes('PFV')){
        unknown.push(dim);
      }else if(hasFeature(tags,tense)&&hasFeature(tags,aspect)){
        matched.push(dim);
      }else conflicts.push(dim);
    }else if(!declared){
      unknown.push(dim);
    }else if(hasFeature(tags,want)){
      matched.push(dim);
    }else conflicts.push(dim);
  }
  for(const dim of ['finiteness','participle']){
    if(!expected[dim])continue;
    if(hasFeature(tags,expected[dim]))matched.push(dim);
    else if(dim==='participle'&&tags[0]==='V.PTCP')matched.push(dim);
    else if(tags.includes('NFIN')||tags.includes('V.PTCP'))conflicts.push(dim);
    else unknown.push(dim);
  }
  return {matched,conflicts,unknown,compared:matched.length+conflicts.length};
}
function lexicalHeadword(record){
  return latinKey(record.headword||record.paradigm||'')
    .split(',')[0].split(' (')[0].trim();
}
export function makeTargets(bank,{pau=[],cuaderno=[]}={}){
  assert.ok(bank?.records&&Array.isArray(bank.records));
  const pauSet=new Set(pau.map(latinKey));
  const cuadernoSet=new Set(cuaderno.map(latinKey));
  const targets=[],dedup=new Set();
  for(const r of bank.records.filter(x=>x.language==='latin2')){
    const lemma=lexicalHeadword(r);
    for(const f of r.forms){
      const form=latinKey(f.form);
      const key=JSON.stringify([r.id,form,f.analysis]);
      if(dedup.has(key))continue;
      dedup.add(key);
      const sources=[
        ...(pauSet.has(form)?['PAU']:[]),
        ...(cuadernoSet.has(form)?['cuaderno']:[])
      ];
      targets.push({id:targets.length,recordId:r.id,kind:r.kind,
        lemma,form,displayForm:f.form,analysis:f.analysis,
        expected:expectedFeatures(r,f),
        priority:sources.length===2?'P0':sources.length?'P1':'P2',
        corpusQuestions:sources,
        type:form.includes(' ')?'compuesto':'simple',
        evidence:[]});
    }
  }
  return targets;
}
function indexTargets(targets){
  const index=new Map();
  for(const target of targets){
    if(target.type==='compuesto')continue;
    if(!index.has(target.form))index.set(target.form,[]);
    index.get(target.form).push(target);
  }
  return index;
}
export function createMatcher(targets){
  const index=indexTargets(targets);
  const seenLemmas=new Set();
  const relevantLemmas=new Set(targets.map(x=>x.lemma));
  const stats={totalRows:0,relevantRows:0,matchedLemmaFormRows:0,
    malformedRows:0};
  return {targets,stats,seenLemmas,
    ingest(row,{source='UniMorph',revision=UNIMORPH_LATIN_REVISION,line=0}={}){
      stats.totalRows++;
      const lemma=latinKey(row.lemma);
      if(relevantLemmas.has(lemma))seenLemmas.add(lemma);
      const form=latinKey(row.form);
      const possible=index.get(form);
      if(!possible)return;
      stats.relevantRows++;
      for(const target of possible){
        if(target.lemma!==lemma)continue;
        stats.matchedLemmaFormRows++;
        const comparison=compareWithMorphology(target.expected,row.features);
        // Keep at most eight distinct source analyses to bound output size.
        const identity=source+'|'+revision+'|'+row.rawFeatures;
        if(!target._seen)target._seen=new Set();
        if(target._seen.has(identity))continue;
        target._seen.add(identity);
        // La clasificación compara TODAS las lecturas únicas, incluso
        // cuando solo se conservan ocho ejemplos visibles por fuente.
        if(!target._allComparisons)
          target._allComparisons={uniqueRows:0,compatible:new Map()};
        target._allComparisons.uniqueRows++;
        if(!comparison.conflicts.length){
          if(!target._allComparisons.compatible.has(source))
            target._allComparisons.compatible.set(source,new Map());
          const dims=[...new Set(comparison.matched)].sort();
          target._allComparisons.compatible.get(source).set(dims.join('|'),new Set(dims));
        }
        // Cupo de presentación únicamente; nunca afecta al veredicto.
        if(target.evidence.filter(e=>e.source===source).length<8)
          target.evidence.push({
          source,revision,line,
          features:row.rawFeatures,
          ...(row.reference?{reference:row.reference}:{}),
          ...(row.nativeFeatures?{nativeFeatures:row.nativeFeatures}:{}),
          comparison});
      }
    }
  };
}
function classifyTarget(target,sources){
  if(target.type==='compuesto')return 'requiere-analizador-de-compuestos';
  const comparisons=target._allComparisons;
  if(!comparisons?.uniqueRows)return sources.hasLemma(target.lemma)?
    'no-hallada-para-lema':'lema-fuera-de-cobertura';
  const perSource=[...(comparisons.compatible?.entries()||[])];
  // Comparar todos los perfiles distintos, no solo las ocho muestras
  // retenidas por fuente para el archivo del informe.
  for(let i=0;i<perSource.length;i++){
    for(let j=i+1;j<perSource.length;j++){
      for(const a of perSource[i][1].values()){
        if(a.size<2)continue;
        for(const b of perSource[j][1].values()){
          if(b.size<2)continue;
          if([...a].filter(x=>b.has(x)).length>=2)
            return 'acuerdo-de-fuentes-no-testimonio-textual';
        }
      }
    }
  }
  const profiles=perSource.flatMap(([,features])=>[...features.values()]);
  if(profiles.some(s=>s.size>=2))return 'coincidencia-parcial-de-rasgos';
  if(profiles.length)return 'lema-y-forma-coincidentes-rasgos-insuficientes';
  return 'discrepancia-de-rasgos-pendiente';
}
export function finalizeAudit(matcher,{sources=[]}={}){
  const {targets,stats,seenLemmas}=matcher;
  const sourceIDs=new Set(sources.map(s=>s.id));
  const entries=targets.map(t=>{
    const status=classifyTarget(t,{hasLemma:l=>seenLemmas.has(l)});
    const {id,recordId,kind,lemma,form,displayForm,analysis,expected,priority,
      corpusQuestions,type,evidence}=t;
    return {id,recordId,kind,lemma,form,displayForm,analysis,expected,priority,
      corpusQuestions,type,status,evidence,
      comparisonCoverage:{
        uniqueAnalysesCompared:t._allComparisons?.uniqueRows||0,
        displayedExamples:evidence.length,
        examplesTruncated:(t._allComparisons?.uniqueRows||0)>evidence.length
      }};
  });
  const byStatus=Object.fromEntries([...new Set(entries.map(e=>e.status))].sort()
    .map(s=>[s,entries.filter(e=>e.status===s).length]));
  const byPriority=Object.fromEntries(['P0','P1','P2'].map(s=>
    [s,entries.filter(e=>e.priority===s).length]));
  const findings=entries.filter(e=>
    !['acuerdo-de-fuentes-no-testimonio-textual','coincidencia-parcial-de-rasgos']
      .includes(e.status)).sort((a,b)=>a.priority.localeCompare(b.priority)||
        a.recordId.localeCompare(b.recordId)||a.form.localeCompare(b.form));
  const summary={schema:LEXICAL_SCHEMA,generatedBy:'scripts/audit-latin2-lexicography.mjs',
    sourceRevisions:sources,independentSourceCount:sourceIDs.size,
    scope:'Latín II (sin alterar sorteos ni acreditaciones docentes)',
    sourceRows:stats.totalRows,relevantRows:stats.relevantRows,
    matchedLemmaFormRows:stats.matchedLemmaFormRows,records:new Set(entries.map(e=>e.recordId)).size,
    entries:entries.length,byStatus,byPriority,
    findingsForReview:findings.length,
    entriesWithTruncatedExampleDisplays:entries.filter(e=>e.comparisonCoverage.examplesTruncated).length,
    individuallyVerified:false,claimsOfTextualAttestation:0,
    notes:[
      'Una coincidencia en UniMorph no prueba presencia en textos clásicos.',
      'UniMorph y las copias alojadas en Vocabula cuentan como una sola fuente.',
      'La falta de cobertura no es un error filológico.',
      'El contraste de tiempos compuestos requiere un analizador adicional.',
      'Las discrepancias NO modifican automáticamente el banco ni el sorteo.'
    ]};
  return {summary,entries,findings};
}
