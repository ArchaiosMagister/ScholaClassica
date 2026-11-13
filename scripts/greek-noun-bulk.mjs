// Expansión reproducible del repertorio nominal griego de Griego I.
// Cruza Vocabula (vocabulario de examen con unidad) con las diez casillas
// de UniMorph fijadas en el mismo SHA. No conjuga por semejanza, ni consulta red.
// Las entradas sin género unívoco, genitivo cotejable o modelo curricular
// documentado quedan fuera de los ejercicios y pasan al informe de revisión.
import assert from 'node:assert/strict';

const CASES=[['nominativo','NOM'],['vocativo','VOC'],['acusativo','ACC'],
  ['genitivo','GEN'],['dativo','DAT']];
const NUMBERS=[['singular','SG'],['plural','PL']];
const TAGS=new Set(CASES.flatMap(([,c])=>NUMBERS.map(([,n])=>'N;'+c+';'+n)));
const ARTICLES=new Map([['ὁ','masculino'],['ἡ','femenino'],['τὸ','neutro']]);
const GROUPS=new Map([['UD 1–4',4],['UD 5',5],['UD 6–7',7],
  ['UD 8',8],['UD 9',9],['UD 10',10]]);
const noQuantity=text=>String(text||'').normalize('NFD')
  .replace(/[\u0304\u0306]/gu,'').normalize('NFC');
const key=text=>noQuantity(text).normalize('NFD')
  .replace(/[\u0300\u0301\u0308\u0313\u0314\u0342]/gu,'')
  .replace(/ς/gu,'σ').normalize('NFC');

function declension(nom,gen,gender){
  const n=key(nom),g=key(gen);
  const ends=s=>n.endsWith(key(s)),endsGen=s=>g.endsWith(key(s));
  if(ends('ος')&&endsGen('ου')&&gender!=='neutro')
    return {name:'2.ª declinación',unit:1,topic:'Segunda declinación masculina',marker:'–ος'};
  if(ends('ον')&&endsGen('ου')&&gender==='neutro')
    return {name:'2.ª declinación',unit:2,topic:'Segunda declinación neutra',marker:'–ον'};
  if(ends('η')&&endsGen('ης')&&gender!=='masculino')
    return {name:'1.ª declinación (η)',unit:3,topic:'Primera declinación',marker:'–ης'};
  if(ends('α')&&endsGen('ας')&&gender!=='masculino')
    return {name:'1.ª declinación (α)',unit:3,topic:'Primera declinación',marker:'–ας'};
  if(ends('α')&&endsGen('ης')&&gender!=='masculino')
    return {name:'1.ª declinación (α mixto, genitivo –ης)',
      unit:3,topic:'Primera declinación',marker:'–ης'};
  if((ends('ης')||ends('ας'))&&endsGen('ου')&&gender==='masculino')
    return {name:'1.ª declinación masculina',unit:3,topic:'Primera declinación',marker:'–ου'};
  // Appendix UD8 incluye los temas consonánticos de la 3.ª, entre ellos
  // oclusivas, nasales, nasales + t y líquidas. Se excluyen los temas
  // vocálicos/sibilantes, que requieren reglas y unidades posteriores.
  const genEnding=key('ος');
  const stem=g.endsWith(genEnding)?g.slice(0,-genEnding.length):'';
  if(stem&&/[βγδθκλμνπρτφχ]$/u.test(stem))
    return {name:'3.ª declinación, tema consonántico',unit:8,
      topic:'Tercera declinación: consonantes',marker:'Tercera declinación · tabla 109'};
  return null;
}
function sourceRows(unimorphParts){
  assert.equal(unimorphParts.length,8,'Se esperan las ocho partes fijadas de UniMorph');
  const index=new Map();
  for(const part of unimorphParts){
    assert.ok(Array.isArray(part),'Parte UniMorph no válida');
    for(const row of part){
      if(!Array.isArray(row)||!TAGS.has(row[2]))continue;
      const lemma=key(row[0]);
      if(!index.has(lemma))index.set(lemma,[]);
      index.get(lemma).push(row);
    }
  }
  return index;
}
function checkedForms(lemma,rows,entry){
  if(rows.length!==10||new Set(rows.map(r=>r[2])).size!==10)
    throw Error('No hay diez casos y números sin duplicados');
  const byTag=new Map(rows.map(r=>[r[2],r]));
  const nominative=byTag.get('N;NOM;SG');
  const genitive=byTag.get('N;GEN;SG');
  if(!nominative||!genitive||key(nominative[1])!==key(lemma))
    throw Error('Nominativo o genitivo no concordante');
  const declared=entry.form.match(/\((ὁ|ἡ|τὸ|τό)\)/u)?.[1];
  const variable=/\([^)]*(?:\s+o\s+|\/)\s*(?:ὁ|ἡ|m|f)[^)]*\)/iu.test(entry.form);
  const explicit=declared?(declared==='τό'?'neutro':ARTICLES.get(declared)):null;
  const seen=new Set();
  for(const [tag,parts] of [
    ['N;NOM;SG',[[/ὁ(?=[,\s])/u,'masculino'],[/ἡ(?=[,\s])/u,'femenino'],
      [/τ[ὸό](?=[,\s])/u,'neutro']]],
    ['N;ACC;SG',[[/τὸν(?=[,\s])/u,'masculino'],[/τὴν(?=[,\s])/u,'femenino'],
      [/τὸ(?=[,\s])/u,'neutro']]]]){
    const evidence=String(byTag.get(tag)?.[3]||'').split(/\s+/).slice(0,5).join(' ');
    // No inferir por letras del propio sustantivo: solo artículos aislados
    // presentes en un testimonio explícito del corpus.
    for(const [article,gender] of parts)if(article.test(evidence))seen.add(gender);
  }
  // Cuando UniMorph ofrece dos géneros para un nombre común, la ficha del
  // profesor puede delimitar UN género explícito; sin esa decisión se excluye.
  if(explicit&&seen.size&&!seen.has(explicit))
    throw Error('Artículo de fuente y género docente incompatibles');
  const gender=variable?null:(explicit||([...seen].length===1?[...seen][0]:null));
  const genderEvidence=variable?'género-variable-enunciado-docente':
    (explicit?
      (seen.size>1?'docente-acepción-con-fuente-de-género-variable':
        'artículo-docente-contrastado'):
      (gender?'artículo-singular-de-UniMorph':'sin-género-único-acreditado'));
  const forms=CASES.flatMap(([cas,c])=>NUMBERS.flatMap(([number,n])=>{
    const row=byTag.get('N;'+c+';'+n);
    const source=noQuantity(row?.[1]);
    if(!source||source.length>80)
      throw Error('Casilla vacía o ilegible');
    // Solo la grafía tradicional -σι(ν) acredita expresamente dos
    // realizaciones (nu eufónica): sin ν y con ν. No se generaliza
    // por analogía a otras formas.
    const variants=source.endsWith('(ν)')&&cas==='dativo'&&number==='plural'?
      [source.slice(0,-3),source.slice(0,-3)+'ν']:[source];
    if(variants.some(form=>!form||/[()[\]\/]/u.test(form)))
      throw Error('Alternativa no individualizada en fuente UniMorph');
    return variants.map(form=>({form,analysis:cas+' '+number,case:cas,number}));
  }));
  if(gender==='neutro'){
    for(const number of ['singular','plural']){
      const nom=forms.find(f=>f.case==='nominativo'&&f.number===number);
      const acc=forms.find(f=>f.case==='acusativo'&&f.number===number);
      if(key(nom.form)!==key(acc.form))throw Error('Neutro sin nominativo=acusativo');
    }
  }
  return {gender,genderEvidence,nominative:noQuantity(nominative[1]),genitive:noQuantity(genitive[1]),forms};
}
function checkLexGen(entry,genitive){
  const tokens=entry.form.split(',');
  if(tokens.length!==2)throw Error('Enunciado no nominal o con formas adicionales');
  const second=tokens[1].replace(/\([^)]*\)/gu,'').trim();
  const suffix=second.match(/^[–−-]\s*([\p{Script=Greek}\p{M}]+)$/u);
  const full=second.match(/^([\p{Script=Greek}\p{M}]+)$/u);
  if(!suffix&&!full)throw Error('Genitivo docente no interpretable');
  if((suffix&&!key(genitive).endsWith(key(suffix[1])))||
    (full&&key(genitive)!==key(full[1]))){
    // δόξα es α impura: en ático tiene genitivo δόξης, no δόξας.
    // Corrección específica cotejada con Cambridge Grammar of Classical
    // Greek y Wiktionary; NO se autoriza ninguna analogía por terminación.
    if(key(tokens[0])===key('δόξα')&&key(genitive)===key('δόξης'))
      return {from:entry.form,to:'δόξα, –ης (ἡ)',
        sources:['https://www.cs.toronto.edu/~simon/Athens/Thucydides3/cgcg.pdf',
          'https://en.wiktionary.org/wiki/δόξα'],
        reason:'Genitivo ático de tema en α mixto; corrección de ficha docente'};
    throw Error('Genitivo del enunciado distinto al paradigma');
  }
  return null;
}
function checkLexGender(entry,gender){
  const declared=entry.form.match(/\((ὁ|ἡ|τὸ|τό)\)/u)?.[1];
  if(declared&&(declared==='τό'?'neutro':ARTICLES.get(declared))!==gender)
    throw Error('Género contradice el enunciado docente');
  // Un género variable impide el uso en concordancia, pero no en
  // análisis o declinación si las diez casillas están documentadas.
  // checkedForms asigna gender:null y conserva la ambigüedad.
}
function checkCurriculum(curriculum,decl){
  const topic=curriculum?.griego?.units?.find(u=>u.number===decl.unit)?.topics
    ?.find(t=>t.title===decl.topic);
  if(!topic?.html?.includes(decl.marker))
    throw Error('Modelo de declinación no acreditado en Appendix: '+decl.topic);
}
function vocabList(vocabulaData){
  const match=String(vocabulaData).match(/^window\.VOCAB=(\[[\s\S]*\]);?\s*$/);
  assert.ok(match,'Formato de Vocabula inesperado');
  const items=JSON.parse(match[1]);
  assert.ok(items.length>300,'Banco de Vocabula incompleto');
  return items;
}
export function compileGreekNounExpansion({
  curriculum,vocabulaData,unimorphParts,vocabulaSha,existingRecords=[]
}){
  assert.ok(/^[a-f0-9]{40}$/.test(vocabulaSha),'SHA de Vocabula no fijado');
  const lex=vocabList(vocabulaData);
  const grouped=sourceRows(unimorphParts);
  const accepted=new Set(existingRecords.filter(x=>x.kind==='sustantivo'&&
    x.language==='griego').map(x=>key(x.paradigm.split(',')[0])));
  // Se examina TODO el vocabulario nominal, no únicamente las fichas de examen.
  const candidates=lex.filter(x=>x.subject==='gr1'&&
    ['general','examen'].includes(x.mode)&&x.form?.split(',').length===2);
  const byLemma=new Map();
  for(const entry of candidates){
    const k=key(entry.form.split(',')[0].trim());
    if(!byLemma.has(k))byLemma.set(k,[]);
    byLemma.get(k).push(entry);
  }
  const records=[],review=[],catalog=[],staged=[];
  for(const [lemma,entries] of byLemma){
    const ordered=[...entries].sort((a,b)=>
      Number(b.mode==='examen')-Number(a.mode==='examen'));
    const matching=ordered.filter(e=>e.units?.some(u=>GROUPS.has(u)));
    const entry=matching[0]||ordered[0];
    const display=entry.form.split(',')[0].trim();
    const state={lemma:noQuantity(display),language:'griego',
      sources:entries.map(e=>({id:e.id,mode:e.mode,form:e.form,
        units:e.units,meaning:e.meaning})),sourceSha:vocabulaSha};
    const reject=reason=>{
      const attested=(grouped.get(lemma)||[]).filter(r=>TAGS.has(r[2]));
      const seen=new Set(attested.map(r=>r[2]));
      const missing=[...TAGS].filter(t=>!seen.has(t));
      review.push({lemma:display,unit:entry.units?.[0]||null,
        entries:entries.map(x=>x.id),reason,
        sourceCells:seen.size,missingSlots:missing});
      catalog.push({...state,status:'pendiente',reason,
        sourceCells:seen.size,missingSlots:missing});
    };
    if(accepted.has(lemma)){
      catalog.push({...state,status:'incluido-anteriormente',
        reason:'Paradigma conservado de la fase anterior'});
      continue;
    }
    try{
      const checked=checkedForms(display,grouped.get(lemma)||[],entry);
      const lexicalCorrection=checkLexGen(entry,checked.genitive);
      checkLexGender(entry,checked.gender);
      const decl=declension(display,checked.genitive,checked.gender);
      if(!decl)throw Error('Modelo flexivo no acreditado por Appendix UD1–UD10');
      checkCurriculum(curriculum,decl);
      const unit=matching.length?
        Math.min(...entry.units.filter(u=>GROUPS.has(u)).map(u=>GROUPS.get(u))):null;
      const enabledUnit=unit===null?decl.unit:Math.max(decl.unit,unit);
      if(enabledUnit>10)throw Error('Modelo todavía no habilitado en la interfaz');
      const record={
        id:'griego-sustantivo-import-'+entry.id,language:'griego',
        unit:enabledUnit,kind:'sustantivo',
        ...(checked.gender?{gender:checked.gender}:{}),
        paradigm:checked.nominative+', '+checked.genitive+
          (checked.gender?' ('+[...ARTICLES].find(([,g])=>g===checked.gender)[0]+')':' (género variable/no acreditado)')+
          ' · '+decl.name,
        forms:checked.forms,
        evidence:{
          source:'UniMorph grc + Vocabula; cotejo curricular con Appendix',
          file:'data/unimorph-syllabus/grc/part-*.json',
          unit:decl.unit,topic:decl.topic,
          caption:'Paradigma nominal completo: '+checked.nominative,
          status:'paradigma-documentado',genderEvidence:checked.genderEvidence,
          ...(lexicalCorrection?{lexicalCorrection}:{}),
          vocabulaSha,vocabulaEntry:entry.id,
          vocabulaGroup:entry.units[0],license:'CC BY-SA 3.0',
          review:'conciliación interfuentes; pendiente de revisión docente individual',
          notes:'Diez casillas UniMorph (y variantes de ν eufónica explícitas). '+
            'Nominativo canónico del corpus, tras comprobar el lema docente; '+
            'el currículo acredita el modelo, no cada forma.'
        }
      };
      if(unit===null){
        const stagedRecord={...record,id:'griego-sustantivo-stage-'+entry.id,
          unit:null,evidence:{...record.evidence,status:'paradigma-sin-unidad',
            review:'Paradigma atestiguado, pero sin unidad docente asignada; nunca usar para calificar'}};
        staged.push(stagedRecord);
        catalog.push({...state,status:'paradigma-completo-sin-unidad',
          stagedId:stagedRecord.id,proposedFirstUnit:decl.unit,
          gender:record.gender,formCount:record.forms.length});
      }else{
        records.push(record);
        catalog.push({...state,status:'incorporado',recordId:record.id,
          unit:enabledUnit,gender:record.gender,formCount:record.forms.length});
      }
    }catch(e){reject(String(e?.message||e));}
  }
  records.sort((a,b)=>a.unit-b.unit||a.id.localeCompare(b.id));
  assert.equal(new Set(records.map(r=>r.id)).size,records.length,'IDs repetidos');
  return {records,staged,review,catalog,audit:{candidates:candidates.length,
    uniqueLemmas:byLemma.size,alreadyIncluded:accepted.size,
    incorporated:records.length,stagedWithoutUnit:staged.length,
    reviewNeeded:review.length,
    sourceSha:vocabulaSha,excludedBeyondUd10:true}};
}
