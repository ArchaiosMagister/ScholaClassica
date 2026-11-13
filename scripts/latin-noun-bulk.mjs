// Banco docente latino: catalogación exhaustiva por lema y curso; solo
// paradigmas NOM/VOC/ACC/GEN/DAT/ABL completos de UniMorph entran en corrección.
// Se conservan las variantes explícitas y no se flexiona por analogía.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';

const CASES=[['nominativo','NOM'],['vocativo','VOC'],['acusativo','ACC'],
  ['genitivo','GEN'],['dativo','DAT'],['ablativo','ABL']];
const NUMBERS=[['singular','SG'],['plural','PL']];
const TAGS=new Map(CASES.flatMap(([cas,c])=>NUMBERS.map(([number,n])=>
  ['N;'+c+';'+n,{cas,number}])));
const norm=s=>String(s||'').toLowerCase().normalize('NFD')
  .replace(/\p{M}/gu,'').replace(/æ/g,'ae').replace(/œ/g,'oe')
  .replace(/j/g,'i').trim();
const plain=s=>String(s||'').normalize('NFD').replace(/[\u0304\u0306]/gu,'')
  .normalize('NFC').replace(/æ/g,'ae').replace(/Æ/g,'Ae');
const UNIT=/UD\s*(\d+)/u;
const COURSES=new Set(['lat1','lat4']);
const SOURCE_STATUS='conciliación interfuentes; pendiente de revisión docente individual';

function vocabulary(text){
  const match=String(text).match(/^window\.VOCAB=(\[[\s\S]*\]);?\s*$/);
  assert.ok(match,'El formato original de Vocabula cambió');
  const data=JSON.parse(match[1]);
  assert.ok(data.length>=1000,'Vocabulario original incompleto');
  return data;
}
function sourceIndex(parts){
  assert.equal(parts.length,32,'Se necesitan las 32 partes latinas de UniMorph');
  const map=new Map();
  for(const part of parts){
    assert.ok(Array.isArray(part),'Archivo de flexión latino inválido');
    for(const row of part){
      if(!Array.isArray(row)||row.length<3)continue;
      if(!/^(?:N|PROPN);/.test(row[2]))continue;
      const tag=row[2].replace(/^PROPN;/,'N;');
      if(!TAGS.has(tag))continue;
      const key=norm(row[0]);
      if(!map.has(key))map.set(key,[]);
      map.get(key).push([row[0],row[1],tag]);
    }
  }
  return map;
}
function declension(lemma,genitive){
  const nom=norm(lemma),gen=norm(genitive);
  if(gen.endsWith('ae')&&(nom.endsWith('a')||nom.endsWith('as')))
    return {unit:1,name:'1.ª declinación',topic:'Primera y segunda declinación'};
  if(gen.endsWith('i')&&
    (nom.endsWith('us')||nom.endsWith('um')||nom.endsWith('er')||
      nom.endsWith('ir')||nom.endsWith('os')||nom.endsWith('ius')))
    return {unit:1,name:'2.ª declinación',topic:'Primera y segunda declinación'};
  if(gen.endsWith('is'))
    return {unit:4,name:'3.ª declinación',topic:'Tercera declinación'};
  if(gen.endsWith('us')&&(nom.endsWith('us')||nom.endsWith('u')))
    return {unit:7,name:'4.ª declinación',topic:'Cuarta y quinta declinación'};
  if((gen.endsWith('ei')||gen.endsWith('ei'))&&
      (nom.endsWith('es')||nom.endsWith('ies')))
    return {unit:7,name:'5.ª declinación',topic:'Cuarta y quinta declinación'};
  return null;
}
function genre(entry,lemma,decl){
  const x=entry.form;
  if(/\((?:m\.|masc\.|masculino)\)/i.test(x))return {gender:'masculino',source:'docente'};
  if(/\((?:f\.|fem\.|femenino)\)/i.test(x))return {gender:'femenino',source:'docente'};
  if(/\((?:n\.|neut\.|neutro)\)/i.test(x))return {gender:'neutro',source:'docente'};
  if(/\([^)]*(?:\s+[oy]\s+|\/)\s*[mfn][^)]*\)/i.test(x))
    return {gender:null,source:'variable'};
  // Inferencia morfológica limitada. No añade automáticamente sustantivos
  // inferidos a los sintagmas: para ello se exige género docente explícito.
  const n=norm(lemma);
  if(decl.name==='2.ª declinación'&&n.endsWith('um'))return {gender:'neutro',source:'patrón'};
  if(decl.name==='2.ª declinación'&&
    (n.endsWith('us')||n.endsWith('er')||n.endsWith('ir')))
    return {gender:'masculino',source:'patrón'};
  if(decl.name==='1.ª declinación'&&n.endsWith('a'))return {gender:'femenino',source:'patrón'};
  return {gender:null,source:'no acreditado'};
}
function enunciado(entry){
  const segments=String(entry.form||'').split(',');
  if(segments.length!==2)throw Error('No es enunciado nominal de dos componentes');
  const lemma=segments[0].trim(),rest=segments[1].trim();
  if(!lemma||!rest||/\((?:irr|[1-5]ª|mx\.)\)/iu.test(rest))
    throw Error('Categoría o enunciado nominal dudoso');
  const bare=rest.replace(/\([^)]*\)/gu,'').trim();
  if(!/^[–−-]?[a-zA-ZæœÆŒāăēĕīĭōŏūŭȳÿ]+$/u.test(bare))
    throw Error('Genitivo incompleto o con variantes sin resolver');
  const ending=norm(bare.replace(/^[–−-]/u,''));
  // Adjetivos de dos terminaciones, formas verbales y otras categorías
  // no adquieren género nominal por compartir casualmente un lema.
  if(['a','um','e','on','ra','rum','ius'].includes(ending))
    throw Error('Posible adjetivo o enunciado no nominal');
  return {lemma,ending};
}
function fullParadigm(lemma,entry,rows){
  const byTag=new Map();
  for(const row of rows){
    if(!byTag.has(row[2]))byTag.set(row[2],new Set());
    byTag.get(row[2]).add(plain(row[1]));
  }
  for(const tag of TAGS.keys())if(!byTag.has(tag)||byTag.get(tag).size===0)
    throw Error('Faltan casillas del singular o plural en UniMorph: '+tag);
  const nominatives=byTag.get('N;NOM;SG');
  if(![...nominatives].some(f=>norm(f)===norm(lemma)))
    throw Error('El nominativo singular no coincide con el lema');
  const genitives=[...byTag.get('N;GEN;SG')];
  if(!genitives.some(f=>norm(f).endsWith(entry.ending)))
    throw Error('El genitivo de UniMorph contradice el vocabulario');
  // Un mismo lema puede ser homónimo de otra declinación. Cantus, -us,
  // por ejemplo, no permite mezclar casillas de una hipotética forma en -i.
  if(genitives.some(f=>!norm(f).endsWith(entry.ending)))
    throw Error('Genitivos divergentes: paradigmas homónimos no mezclables');
  const gen=genitives.find(f=>norm(f).endsWith(entry.ending));
  const forms=[];
  for(const [tag,features] of TAGS){
    // UniMorph da a veces variantes históricas que se conservan etiquetadas
    // como alternativas documentadas, no se interpolan.
    for(const form of [...byTag.get(tag)].sort()){
      if(!form||form.length>60||/[\[\]()\/]/u.test(form))
        throw Error('Forma no individualizada o ilegible');
      forms.push({form,analysis:features.cas+' '+features.number,
        case:features.cas,number:features.number});
    }
  }
  return {genitive:gen,forms};
}
function checkCurriculum(curriculum,decl){
  const topic=curriculum?.latin?.units?.find(u=>u.number===decl.unit)
    ?.topics?.find(x=>x.title===decl.topic);
  if(!topic?.html)throw Error('Falta el modelo de declinación del Appendix: '+decl.topic);
}
export function compileLatinNounExpansion({
  curriculum,vocabulaData,latinParts,vocabulaSha,existingRecords=[]
}){
  assert.match(vocabulaSha,/^[a-f0-9]{40}$/,'SHA de Vocabula no fijado');
  const lex=vocabulary(vocabulaData);
  const index=sourceIndex(latinParts);
  const accepted=new Set(existingRecords.filter(r=>
    r.language==='latin'&&r.kind==='sustantivo')
    .map(r=>norm(r.paradigm.split(',')[0])));
  const roster=lex.filter(x=>COURSES.has(x.subject)&&
    ['general','examen'].includes(x.mode)&&String(x.form).includes(',')&&
    x.form.split(',').length===2);
  const byKey=new Map();
  for(const entry of roster){
    const lemma=norm(entry.form.split(',')[0].trim());
    const key=entry.subject+':'+lemma;
    if(!byKey.has(key))byKey.set(key,[]);
    byKey.get(key).push(entry);
  }
  const records=[],review=[],catalog=[];
  const added=new Set();
  for(const [code,entries] of byKey){
    const [course]=code.split(':');
    const ordered=[...entries].sort((a,b)=>Number(b.mode==='examen')-
      Number(a.mode==='examen'));
    const entry=ordered[0];
    const source=entries.map(x=>({id:x.id,course:x.subject,mode:x.mode,
      form:x.form,units:x.units,meaning:x.meaning}));
    const state={language:'latin',course,lemma:entry.form.split(',')[0].trim(),
      sourceSha:vocabulaSha,sources:source};
    const reject=reason=>{
      catalog.push({...state,status:'pendiente',reason});
      review.push({course,lemma:state.lemma,reason,sources:source.map(x=>x.id)});
    };
    if(course==='lat4'){
      reject('Curso Latín 4.º: vocabulario inventariado; no habilitado en la interfaz de Latín I');
      continue;
    }
    if(accepted.has(norm(state.lemma))||added.has(norm(state.lemma))){
      catalog.push({...state,status:'incluido-anteriormente',
        reason:'Paradigma importado o publicado previamente; no duplicar'});
      continue;
    }
    try{
      const parsing=enunciado(entry);
      const variations=ordered.filter(x=>x.units?.some(u=>UNIT.test(u)));
      if(!variations.length)throw Error('Sin unidad de adquisición docente');
      // La unidad es acumulativa y se toma la primera aparición acreditada.
      const units=[...new Set(variations.flatMap(x=>x.units||[])
        .map(x=>Number(x.match(UNIT)?.[1])).filter(Boolean))];
      const firstUnit=Math.min(...units);
      if(firstUnit>10)throw Error('Unidad posterior a UD10: sin cobertura actual del Appendix');
      const sourceRows=index.get(norm(parsing.lemma))||[];
      if(!sourceRows.length)throw Error('Sin paradigma nominal en UniMorph latino fijado');
      const {forms,genitive}=fullParadigm(parsing.lemma,parsing,sourceRows);
      const decl=declension(parsing.lemma,genitive);
      if(!decl)throw Error('Declinación no clasificada sin ambigüedad');
      // Si el sustantivo aparece en una oración antes de estudiar su
      // declinación, la práctica completa se habilita después, no se excluye.
      const unit=Math.max(firstUnit,decl.unit);
      checkCurriculum(curriculum,decl);
      const g=genre(entry,parsing.lemma,decl);
      // La evidencia de género por inferencia queda marcada separadamente;
      // no se supone validación lexicográfica del género.
      const record={
        id:'latin-sustantivo-import-'+entry.id,
        language:'latin',unit,kind:'sustantivo',
        ...(g.gender?{gender:g.gender}:{}),
        paradigm:plain(parsing.lemma)+', '+genitive+' · '+decl.name,
        forms,evidence:{
          source:'UniMorph lat + vocabulario docente; cotejo curricular Appendix',
          file:'data/unimorph-syllabus/lat/part-*.json',
          unit:decl.unit,topic:decl.topic,
          caption:'Flexión nominal completa: '+plain(parsing.lemma),
          status:'paradigma-documentado',vocabulaSha,vocabulaEntry:entry.id,
          vocabulaGroup:entry.units?.join(', ')||'',
          genderEvidence:g.source,license:'CC BY-SA 3.0',
          review:SOURCE_STATUS,
          notes:'Casillas completas tomadas de UniMorph (algunas con variantes). '+
            'El género inferido por patrón no acredita por sí solo la concordancia léxica.'
        }
      };
      records.push(record);added.add(norm(parsing.lemma));
      catalog.push({...state,status:'incorporado',recordId:record.id,
        unit,gender:g.gender,genderEvidence:g.source,formCount:record.forms.length});
    }catch(error){reject(String(error?.message||error));}
  }
  records.sort((a,b)=>a.unit-b.unit||a.id.localeCompare(b.id));
  assert.equal(new Set(records.map(r=>r.id)).size,records.length);
  return {records,catalog,review,audit:{
    candidateEntries:roster.length,nominalEnunciados:byKey.size,
    includedPreviously:accepted.size,incorporated:records.length,
    reviewNeeded:review.length,latin4Staged:review.filter(r=>r.course==='lat4').length,
    sourceSha:vocabulaSha,excludesAfterUd10:true
  }};
}
export async function readLatinNounSource(source){
  const latinParts=[];
  for(let i=0;i<32;i++){
    const file='part-'+String(i).padStart(2,'0')+'.json';
    latinParts.push(JSON.parse(await readFile(join(source,
      'data/unimorph-syllabus/lat',file),'utf8')));
  }
  return {latinParts};
}
