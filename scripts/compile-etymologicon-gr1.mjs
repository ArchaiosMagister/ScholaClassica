import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const base=join(root,'shared/academic/greek-etymology');
const part=name=>readFileSync(join(base,'source',name),'utf8');
const digest=value=>createHash('sha256').update(value).digest('hex');
const auditPrefix='teacher-audit-gr1-2026-11-12.part';
const expectedPartHashes=[
  'a0875d0d09cc3bf10038e4db7a4b7fce66ed5bf167f74bfd703492e47c7aa5e8',
  '8d3c650c25e9f7b5f5263988a7ebd6aaffc2f9fe381e34afd6f8c9488bd1693b',
  '67840213ae959e89928149aa65099cc0bf060578241b0de4c1043e8b4f3d3b87',
  'b06f2707722b20e11f5fe496e343958abdda03631a98c292a1b2c03c310d7ba5'
];
const shaGzip='f2da6c719425bbdad6126b6deca4dcbd4414970da875278e51fe770feabcf382';
const shaJson='36a2f1efb36d6a7f627fe51a228758d8ab3d17a833e50a08a474cafbe701cb6d';
const shaWorkbook='c2f16a97c305120be771e6aff71bf1649ffeee1171669e64660d25481e16adaf';

export function readTeacherAudit(){
  const chunks=expectedPartHashes.map((expected,i)=>{
    const chunk=part(auditPrefix+i+'.b64').trim();
    assert.equal(digest(chunk),expected,'Fragmento de auditoría alterado: '+i);
    return chunk;
  });
  const compressed=Buffer.from(chunks.join(''),'base64');
  assert.equal(digest(compressed),shaGzip,'La auditoría comprimida ha cambiado');
  const original=gunzipSync(compressed);
  assert.equal(digest(original),shaJson,'La auditoría descomprimida no coincide');
  const data=JSON.parse(original.toString('utf8'));
  assert.equal(data.version,'etymologicon-teacher-audit/v1');
  assert.equal(data.file_sha256,shaWorkbook);
  return data;
}

const greekKey=value=>String(value).split(/[|,]/)[0].replace(/\s*\(.*/, '').normalize('NFD')
  .replace(/\p{M}/gu,'').toLowerCase().replace(/ς/g,'σ').trim();
const spanishKey=value=>String(value).normalize('NFC').toLocaleLowerCase('es').replace(/\s+/g,' ').trim();
const units=value=>(String(value).match(/UD\d+/g)||[]).map(u=>u.trim());
const terms=value=>value?String(value).split(',').map(x=>x.trim()).filter(Boolean):[];
const itemIdGreek=value=>'grc:'+greekKey(value);
const itemIdSpanish=value=>'es:'+spanishKey(value);
const classifySource=(name,label,url)=>({
  authority:label==='dle'?'RAE-ASALE DLE':label,
  url:label==='dle'?'https://dle.rae.es/'+encodeURIComponent(name):url,
  sourceKind:label==='dle'?'official_dictionary':'alternative',
  checkedIndependently:false,
  sourceRecordedIn:'Derivados'
});
const correctionPolicy={
  correctDerivative:1,
  unambiguousOrthographicError:0.5,
  incorrectOrUncatalogued:0,
  approximateMatchIsNotProof:true,
  caseAndAccidentalSpacesIgnored:true,
  sameLemmaVariantsAreOneAnswer:true,
  greekAccentsAndBreathingsOptionalForTransliteratedInput:true,
  note:'Política docente posterior a la auditoría: prevalece el 0,5 sobre la antigua regla de 0 puntos para las faltas.'
};

export function compileTeacherAudit(){
  const raw=readTeacherAudit();
  assert.equal(raw.etymons.length,111);
  assert.equal(raw.derivatives.length,202);
  assert.equal(raw.decisions.length,22);
  const etymons=raw.etymons.map((row,i)=>{
    const [lemma,unitText,status,notes,answers]=row;
    assert.ok(['ELEGIBLE','SOLO CONSULTA'].includes(status));
    assert.ok(lemma&&units(unitText).length);
    const derivatives=terms(answers).map(itemIdSpanish);
    assert.equal(new Set(derivatives).size,derivatives.length,'Derivado repetido en étimo '+lemma);
    if(status==='ELEGIBLE')assert.ok(derivatives.length>=2,'Étimo sin dos respuestas '+lemma);
    if(status==='SOLO CONSULTA')assert.equal(derivatives.length,0,'Solo consulta con respuestas '+lemma);
    return {
      id:itemIdGreek(lemma),lemma:String(lemma).normalize('NFC'),meaning:null,
      course:'gr1',units:units(unitText),
      editorialStatus:status==='ELEGIBLE'?'approved_for_documented_derivatives':'reference_only',
      teacherApprovedDerivatives:derivatives,
      orthographicVariants:[],
      notes:notes||null,
      source:{workbook:raw.file,sheet:'Etimos',row:i+2},
      independentLexicographicReview:false
    };
  });
  const byEtymon=new Map(etymons.map(x=>[x.id,x]));
  assert.equal(byEtymon.size,111,'Identificadores de étimos duplicados');

  const derivatives=[];
  const excluded=[];
  const relations=[];
  const referencedRelations=new Map();
  for(let i=0;i<raw.derivatives.length;i++){
    const [name,definition,unitText,sourceEtymons,status,variantCell,note,frequency,kind,otherSource,otherUrl]=raw.derivatives[i];
    const key=itemIdSpanish(name),approved=status==='APTO';
    assert.ok(status==='APTO'||status==='EXCLUIDO','Estado desconocido '+status);
    assert.ok(name&&definition&&unitText&&sourceEtymons,'Ficha incompleta en fila '+(i+2));
    if(!approved){excluded.push({form:name,id:key,reason:note||'Excluido en auditoría',source:{sheet:'Derivados',row:i+2}});continue;}
    const spellingVariants=(variantCell?String(variantCell).split('|'):[]).map(x=>x.trim()).filter(Boolean);
    const spellingIds=new Set([key,...spellingVariants.map(itemIdSpanish)]);
    assert.equal(spellingIds.size,spellingVariants.length+1,'Variantes duplicadas: '+name);
    const derivative={
      id:key,form:String(name).normalize('NFC'),
      definitions:[{text:definition,origin:'teacher_audit_original',dictionaryCheckedIndependently:false}],
      officialOrthographicVariants:spellingVariants,
      lexicalSource:classifySource(name,kind,otherUrl),
      sourceLabel:otherSource||'DLE RAE-ASALE (enlace de consulta)',
      frequency:frequency||'Normal',notes:note||null,
      course:'gr1',units:units(unitText),
      editorialStatus:'teacher_audit_approved',
      source:{workbook:raw.file,sheet:'Derivados',row:i+2}
    };
    assert.ok(/^https:\/\//.test(derivative.lexicalSource.url),'URL de consulta inválida '+name);
    derivatives.push(derivative);
    const related=String(sourceEtymons).split(';').map(x=>x.trim()).filter(Boolean);
    assert.ok(related.length,'Sin étimo para '+name);
    for(const form of related){
      const eid=itemIdGreek(form);
      const etymon=byEtymon.get(eid);
      assert.ok(etymon,'Étimo no encontrado para '+name+': '+form);
      assert.ok(etymon.teacherApprovedDerivatives.includes(key),'No coincide relación entre hojas: '+name+' / '+form);
      assert.equal(etymon.editorialStatus,'approved_for_documented_derivatives');
      const id=eid+'→'+key;
      assert.ok(!referencedRelations.has(id),'Relación duplicada '+id);
      referencedRelations.set(id,true);
      relations.push({
        id,etymonId:eid,derivativeId:key,
        editorialStatus:'teacher_audit_approved',
        relationType:/indirect[ao]?/i.test(note||'')?'indirect_recorded':'not_individually_classified',
        eligibleFor:['cards','match','multiple_choice','write_two','meaning','exam'],
        decompositionReady:false,inverseReady:false,
        source:{workbook:raw.file,sheet:'Derivados',row:i+2}
      });
    }
  }
  assert.equal(derivatives.length,201,'Derivados admitidos');
  assert.equal(excluded.length,1,'Derivados excluidos');
  assert.equal(relations.length,217,'Relaciones de la auditoría');
  assert.equal(new Set(derivatives.map(x=>x.id)).size,201,'Derivados principales duplicados');
  assert.equal(etymons.filter(x=>x.editorialStatus==='approved_for_documented_derivatives').length,108);
  assert.equal(etymons.filter(x=>x.editorialStatus==='reference_only').length,3);
  assert.deepEqual(etymons.filter(x=>x.editorialStatus==='reference_only').map(x=>x.id),
    ['grc:δωρον','grc:δικη','grc:παιδιον']);
  assert.deepEqual(excluded.map(x=>spanishKey(x.form)),['heliópolis']);
  const derivativeSet=new Set(derivatives.map(x=>x.id));
  for(const x of etymons)for(const did of x.teacherApprovedDerivatives)
    assert.ok(derivativeSet.has(did)&&referencedRelations.has(x.id+'→'+did),'Respuesta sin correspondencia: '+x.lemma+' '+did);
  const allForms=new Map();
  for(const d of derivatives){
    for(const word of [d.form,...d.officialOrthographicVariants]){
      const folded=spanishKey(word);
      const owner=allForms.get(folded);
      assert.ok(!owner||owner===d.id,'La variante coincide con otro lema: '+word);
      allForms.set(folded,d.id);
    }
  }
  assert.equal(raw.decisions.length,22);
  const editorialDecisions=raw.decisions.map(row=>({id:row[0],etymonOrScope:row[1],originalMaterial:row[2],action:row[3],justification:row[4]}));
  for(let n=1;n<=22;n++)assert.ok(editorialDecisions.some(x=>x.id==='G-'+String(n).padStart(2,'0')),'Falta decisión G-'+n);
  const required=['θεός','φόβος','ψευδής, –ές','πρωκτός'];
  for(const lemma of required)assert.ok(etymons.some(x=>x.lemma===lemma),'No se aplicó grafía: '+lemma);
  const keyIndex=new Map(derivatives.map(x=>[x.id,x]));
  assert.deepEqual(keyIndex.get('es:icono').officialOrthographicVariants,['ícono']);
  assert.deepEqual(keyIndex.get('es:seudociencia').officialOrthographicVariants,['pseudociencia']);
  assert.ok(byEtymon.get('grc:γυνη').teacherApprovedDerivatives.includes('es:ginecólogo'));
  assert.ok(byEtymon.get('grc:προσ').teacherApprovedDerivatives.includes('es:prosodia'));
  assert.ok(byEtymon.get('grc:ατελησ').teacherApprovedDerivatives.includes('es:atelectasia'));

  const sourceCandidate=JSON.parse(readFileSync(join(base,'source/gr1-generador.snapshot.json'),'utf8'));
  const oldWords=new Set(sourceCandidate.units.flat().flatMap(([lemma,words])=>terms(words).map(spanishKey)));
  const actualWords=new Set(derivatives.map(x=>spanishKey(x.form)));
  const added=[...actualWords].filter(w=>!oldWords.has(w)).sort();
  const removed=[...oldWords].filter(w=>!actualWords.has(w)).sort();
  assert.deepEqual(added,['atelocardia','atelectasia','geniogloso','helioterapia','prosélito','prosodia'].sort());
  assert.deepEqual(removed,['heliópolis']);
  // Los significados y contrastes externos se importan por una capa separada;
  // nunca se deducen de las letras de un derivado ni se escriben en el Excel.
  const evidence=JSON.parse(readFileSync(join(base,'review/lexical-evidence-v1.json'),'utf8'));
  assert.equal(evidence.schema,'etymologicon-lexical-evidence/v1');
  assert.equal(evidence.publicationAllowed,false);
  const normalizeMeaning=gloss=>String(gloss).replace(/[‘’“”]/g,'').replace(/\s*\|\s*/g,'; ').trim();
  let curricular=0, curricularPartial=0, externalMeanings=0, reviewedDefinitions=0, attestedOnly=0;
  const seenMeanings=new Set();
  for(const row of evidence.teacherGlosses){
    const etymon=byEtymon.get(row.etymonId);
    assert.ok(etymon,'Significado escolar sin étimo: '+row.etymonId);
    assert.ok(!seenMeanings.has(row.etymonId),'Glosa escolar duplicada: '+row.etymonId);
    assert.equal(row.source.repository,'ArchaiosMagister/GeneradorExamenes');
    assert.equal(row.source.path,'data/greek1-materials.json');
    assert.match(row.source.commit,/^[0-9a-f]{40}$/);
    assert.equal(row.externalDictionaryChecked,false);
    assert.ok(row.curricularGloss);
    seenMeanings.add(row.etymonId);
    etymon.meaningEvidence={
      kind:'teacher_curriculum',status:row.primaryLemmaOnly?'partial_compound':'curriculum_crosschecked',
      primaryLemma:row.sourceLemma,glossAsRecorded:row.curricularGloss,reference:row.source,lexicographicConfirmation:false
    };
    if(row.primaryLemmaOnly){
      assert.ok(etymon.lemma.includes('|'),'Se marcó como compuesto un lema simple: '+etymon.lemma);
      curricularPartial++;
      // No equivale a un significado de ambos miembros del étimo compuesto.
    }else{
      etymon.meaning=normalizeMeaning(row.curricularGloss);
      curricular++;
    }
  }
  for(const row of evidence.externallyCheckedGreekMeanings){
    const etymon=byEtymon.get(row.etymonId);
    assert.ok(etymon,'Significado lexicográfico sin étimo: '+row.etymonId);
    assert.ok(!seenMeanings.has(row.etymonId),'Conflicto entre glosa escolar y lexicográfica: '+row.etymonId);
    assert.ok(/^https:\/\/(atlas\.perseus\.tufts\.edu|dicciomed\.usal\.es|dle\.rae\.es)\//.test(row.reference));
    assert.ok(row.meaning);
    seenMeanings.add(row.etymonId);
    etymon.meaning=row.meaning;
    etymon.meaningEvidence={
      kind:row.kind,status:'externally_checked',source:row.source,url:row.reference,
      lexicographicConfirmation:true
    };
    etymon.independentLexicographicReview=true;
    externalMeanings++;
  }
  const seenDictionary=new Set();
  for(const row of evidence.spanishDictionaryReviews){
    const did=itemIdSpanish(row.word),derivative=derivatives.find(x=>x.id===did);
    assert.ok(derivative,'Revisión castellana sin derivado activo: '+row.word);
    assert.ok(!seenDictionary.has(did),'Revisión castellana repetida: '+did);
    assert.ok(/^https:\/\//.test(row.ref),'URL inválida de contraste: '+row.word);
    assert.ok(['confirmed','confirmed_specialized_not_DLE','term_attested_definition_pending'].includes(row.lexicalReview));
    seenDictionary.add(did);
    // El campo 'lexicalSource' conserva la referencia original del Excel:
    // esta fuente independiente se añade sin reescribir esa procedencia.
    derivative.dictionaryReview={
      status:row.lexicalReview,scope:row.scope,authority:row.authority,
      url:row.ref,checkedAt:row.reviewDate,didacticCrosscheck:row.didacticCrosscheck||null,
      attestedVariant:row.attestedVariant||null
    };
    if(row.lexicalReview==='term_attested_definition_pending'){
      assert.equal(row.scope,'attestation_only');
      attestedOnly++;
    }else{
      assert.ok(row.didacticCrosscheck,'Falta definición contrastada: '+row.word);
      reviewedDefinitions++;
    }
  }
  assert.equal(evidence.teacherGlosses.length,55);
  assert.equal(curricularPartial,4);
  assert.equal(curricular,51);
  assert.equal(externalMeanings,6);
  assert.equal(reviewedDefinitions,7);
  assert.equal(attestedOnly,1);
  assert.equal(etymons.filter(x=>x.meaning!==null).length,57);
  assert.equal(etymons.filter(x=>x.meaning===null).length,54);
  // Segunda capa de significados: todos los étimos tienen traducción didáctica,
  // pero la cobertura no equivale a 111 consultas lexicográficas individuales.
  const completion=JSON.parse(readFileSync(join(base,'review/meaning-completion-v1.json'),'utf8'));
  assert.equal(completion.schema,'etymologicon-greek-meaning-completion/v1');
  assert.equal(completion.course,'gr1');
  assert.equal(completion.publicationAllowed,false);
  assert.equal(completion.preexistingMeanings,57);
  assert.equal(completion.entries.length,54);
  const assigned=new Set();
  let checkedNew=0,draftNew=0,completedPairs=0;
  for(const row of completion.entries){
    assert.ok(!assigned.has(row.id),'Significado duplicado en segundo lote: '+row.id);
    assigned.add(row.id);
    const etymon=byEtymon.get(row.id);
    assert.ok(etymon,'El significado no corresponde a un étimo auditado: '+row.id);
    assert.equal(etymon.meaning,null,'Se intentó sobrescribir una glosa ya completa: '+row.id);
    assert.equal(itemIdGreek(etymon.lemma),row.id,'El lema no corresponde al étimo del Excel: '+row.id);
    if(!etymon.lemma.startsWith(row.lemma)){
      etymon.spellingReviewNeeded={
        approvedAuditLemma:etymon.lemma,
        lexiconHeadword:row.lemma,
        status:'accentuation_to_check_without_rewriting_audit'
      };
    }
    assert.ok(row.meaning.trim().length>0,'Glosa vacía: '+row.id);
    assert.ok(['dictionary_entry_checked','meaning_draft_pending_dictionary_check'].includes(row.status));
    const partial=etymon.meaningEvidence?.status==='partial_compound';
    if(etymon.meaningEvidence)assert.ok(partial,'No sobrescribir un significado de procedencia previa: '+row.id);
    const hasComponents=!!row.components;
    if(partial){
      assert.ok(hasComponents&&row.components.parts.length===2,'Pareja léxica incompleta: '+row.id);
      for(const part of row.components.parts)assert.ok(part.lemma&&part.meaning);
      completedPairs++;
    }
    if(row.status==='dictionary_entry_checked'){
      assert.ok(row.reference?.individuallyChecked,'Sin marca de comprobación individual: '+row.id);
      assert.ok(/^https:\/\//.test(row.reference.url),'URL de diccionario no válida: '+row.id);
      checkedNew++;
    }else{
      assert.equal(row.reference,null,'No se puede adjuntar una fuente no consultada: '+row.id);
      assert.ok(/^https:\/\/logeion\.uchicago\.edu\//.test(row.proposedLookup),'Referencia de futura consulta ausente: '+row.id);
      draftNew++;
    }
    if(row.components){
      assert.ok(['allomorphs','associated_lexemes'].includes(row.components.type),'Tipo de agrupación no válido');
      assert.equal(row.components.parts.length,2,'Agrupación con cantidad incorrecta de miembros');
      if(row.components.type==='allomorphs')assert.equal(etymon.id,'grc:εκ','La alternancia ἐκ/ἐξ es única');
    }
    etymon.meaning=row.meaning;
    etymon.meaningReviewStatus=row.status;
    etymon.meaningCompletionEvidence={
      batch:'meaning-completion-v1',status:row.status,
      checkedSource:row.reference||null,suggestedLookup:row.proposedLookup||null,
      components:row.components||null,philologicalCaution:row.philologicalCaution||null
    };
    if(!etymon.meaningEvidence)etymon.meaningEvidence={kind:'new_meaning_batch',status:row.status};
    if(row.status==='dictionary_entry_checked')etymon.independentLexicographicReview=true;
  }
  assert.equal(assigned.size,54);
  assert.equal(checkedNew,25);
  assert.equal(draftNew,29);
  assert.equal(completedPairs,4);
  assert.equal(etymons.filter(x=>x.meaning===null).length,0);
  // Una glosa de borrador no convierte el étimo en elegible para nuevas modalidades.
  for(const rel of relations)assert.ok(!rel.inverseReady&&!rel.decompositionReady);
  const summary={
    etymons:etymons.length,eligibleEtymons:108,consultOnlyEtymons:3,
    acceptedDerivatives:201,excludedDerivatives:1,relations:relations.length,editorialDecisions:22,
    addedComparedWithGenerator:added,removedComparedWithGenerator:removed,
    dictionarySourcesIndependentlyChecked:reviewedDefinitions,
    greekMeaningsCompleted:etymons.length,
    meaningCompletionChecked:checkedNew,
    meaningCompletionDrafts:draftNew,
    previouslyPartialCompoundGlosses:completedPairs,
    greekMeaningsPendingIndependentReview:curricular+draftNew,
    greekMeaningsFromTeacherCurriculum:curricular,
    partialCompoundGlosses:0,
    greekMeaningsFromExternalLexicons:externalMeanings+checkedNew,
    spanishEntriesOnlyAttested:attestedOnly,
    greekMeaningsPending:0,
    published:false
  };
  return {
    schema:'etymologicon-audited-catalog/v1',
    provenance:{originalWorkbook:raw.file,sha256:shaWorkbook,source:'uploaded_teacher_audit',importDate:'2026-11-12',
      fromGenerator:'ae96718559e6ce6a6f2216dced7ea47c71ec48b0'},
    course:'gr1',
    greek2:{course:'gr2',status:'awaiting_teacher_inventory',etymons:[]},
    status:'editorially_reconciled_not_published',
    caution:'Los 111 étimos disponen de glosas didácticas; 31 tienen contraste externo de acepción, 51 proceden del vocabulario escolar y 29 son propuestas por cotejar individualmente. Ninguna glosa habilita sola ejercicios inversos o de composición.',
    correctionPolicy,
    etymons,derivatives,relations,excluded,editorialDecisions,summary
  };
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=compileTeacherAudit();
  const dir=join(root,'build/etymologicon');
  mkdirSync(dir,{recursive:true});
  writeFileSync(join(dir,'gr1-audited.json'),JSON.stringify(result,null,2)+'\n','utf8');
  console.log('OK: auditoría docente conciliada. '+JSON.stringify(result.summary));
  console.log('Salida: build/etymologicon/gr1-audited.json (sin publicación)');
}
