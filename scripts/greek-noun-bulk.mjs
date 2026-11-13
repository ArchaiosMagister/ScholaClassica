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
const GROUPS=new Map([['UD 1–4',4],['UD 5',5],['UD 6–7',7]]);
const noQuantity=text=>String(text||'').normalize('NFD')
  .replace(/[\u0304\u0306]/gu,'').normalize('NFC');
const key=text=>noQuantity(text).normalize('NFD')
  .replace(/[\u0300\u0301\u0308\u0313\u0314\u0342]/gu,'')
  .replace(/ς/gu,'σ').normalize('NFC');

function declension(nom,gen,gender){
  const n=key(nom),g=key(gen);
  const ends=s=>n.endsWith(key(s)),endsGen=s=>g.endsWith(key(s));
  if(ends('ος')&&endsGen('ου')&&gender==='masculino')
    return {name:'2.ª declinación',unit:1,topic:'Segunda declinación masculina',marker:'–ος'};
  if(ends('ον')&&endsGen('ου')&&gender==='neutro')
    return {name:'2.ª declinación',unit:2,topic:'Segunda declinación neutra',marker:'–ον'};
  if(ends('η')&&endsGen('ης')&&gender==='femenino')
    return {name:'1.ª declinación (η)',unit:3,topic:'Primera declinación',marker:'–ης'};
  if(ends('α')&&endsGen('ας')&&gender==='femenino')
    return {name:'1.ª declinación (α)',unit:3,topic:'Primera declinación',marker:'–ας'};
  if((ends('ης')||ends('ας'))&&endsGen('ου')&&gender==='masculino')
    return {name:'1.ª declinación masculina',unit:3,topic:'Primera declinación',marker:'–ου'};
  return null; // La tercera declinación se habilitará con su unidad curricular.
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
function checkedForms(lemma,rows){
  if(rows.length!==10||new Set(rows.map(r=>r[2])).size!==10)
    throw Error('No hay diez casos y números sin duplicados');
  const byTag=new Map(rows.map(r=>[r[2],r]));
  const nominative=byTag.get('N;NOM;SG');
  const genitive=byTag.get('N;GEN;SG');
  if(!nominative||!genitive||key(nominative[1])!==key(lemma))
    throw Error('Nominativo o genitivo no concordante');
  const evidence=String(nominative[3]||'');
  const possible=[...ARTICLES].filter(([article])=>evidence.startsWith(article+' '));
  // No desambiguamos ὁ, ἡ ni el género contextual automáticamente.
  if(possible.length!==1||evidence.includes(','))
    throw Error('Género no acreditado unívocamente por el artículo');
  const gender=possible[0][1];
  const forms=CASES.flatMap(([cas,c])=>NUMBERS.map(([number,n])=>{
    const row=byTag.get('N;'+c+';'+n);
    const form=noQuantity(row?.[1]);
    if(!form||form.length>80||/[()[\]\/]/u.test(form))
      throw Error('Casilla vacía, múltiple o ilegible');
    return {form,analysis:cas+' '+number,case:cas,number};
  }));
  if(gender==='neutro'){
    for(const number of ['singular','plural']){
      const nom=forms.find(f=>f.case==='nominativo'&&f.number===number);
      const acc=forms.find(f=>f.case==='acusativo'&&f.number===number);
      if(key(nom.form)!==key(acc.form))throw Error('Neutro sin nominativo=acusativo');
    }
  }
  return {gender,genitive:noQuantity(genitive[1]),forms};
}
function checkLexGen(entry,genitive){
  const tokens=entry.form.split(',');
  if(tokens.length!==2)throw Error('Enunciado no nominal o con formas adicionales');
  const second=tokens[1].replace(/\([^)]*\)/gu,'').trim();
  const match=second.match(/^[–−-]\s*([\p{Script=Greek}\p{M}]+)$/u);
  if(!match||!key(genitive).endsWith(key(match[1])))
    throw Error('Genitivo del enunciado distinto al paradigma');
}
function checkLexGender(entry,gender){
  const declared=entry.form.match(/\((ὁ|ἡ|τὸ)\)/u)?.[1];
  if(declared&&ARTICLES.get(declared)!==gender)
    throw Error('Género contradice el enunciado docente');
  if(/\([^)]*(?:\s+o\s+|\/)[^)]*\)/u.test(entry.form))
    throw Error('Género de uso variable: necesita decisión docente');
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
  const candidates=lex.filter(x=>x.subject==='gr1'&&x.mode==='examen'&&
    x.units?.length===1&&GROUPS.has(x.units[0]));
  const byLemma=new Map();
  for(const entry of candidates){
    const k=key(entry.form.split(',')[0].trim());
    if(!byLemma.has(k))byLemma.set(k,[]);
    byLemma.get(k).push(entry);
  }
  const records=[],review=[];
  for(const [lemma,entries] of byLemma){
    const display=entries[0].form.split(',')[0].trim();
    if(accepted.has(lemma))continue;
    const reject=reason=>review.push({lemma:display,unit:entries[0].units[0],
      entries:entries.map(x=>x.id),reason});
    try{
      if(entries.length!==1)throw Error('Enunciados duplicados: revisión necesaria');
      const entry=entries[0],rows=grouped.get(lemma)||[];
      const checked=checkedForms(display,rows);
      checkLexGen(entry,checked.genitive);
      checkLexGender(entry,checked.gender);
      const decl=declension(display,checked.genitive,checked.gender);
      if(!decl)throw Error('Tipo no habilitado o flexión irregular: requiere cotejo');
      checkCurriculum(curriculum,decl);
      const unit=GROUPS.get(entry.units[0]);
      // No anticipar el tipo flexivo antes de su unidad en Appendix.
      if(decl.unit>unit)throw Error('Modelo no explicado en la unidad indicada');
      records.push({
        id:'griego-sustantivo-import-'+entry.id,language:'griego',
        unit,kind:'sustantivo',gender:checked.gender,
        paradigm:noQuantity(display)+', '+checked.genitive+' ('+
          [...ARTICLES].find(([,g])=>g===checked.gender)[0]+') · '+decl.name,
        forms:checked.forms,
        evidence:{
          source:'UniMorph grc + Vocabula; cotejo curricular con Appendix',
          file:'data/unimorph-syllabus/grc/part-*.json',
          unit:decl.unit,topic:decl.topic,
          caption:'Paradigma nominal completo: '+noQuantity(display),
          status:'paradigma-documentado',vocabulaSha,vocabulaEntry:entry.id,
          vocabulaGroup:entry.units[0],license:'CC BY-SA 3.0',
          review:'conciliación interfuentes; pendiente de revisión docente individual',
          notes:'Diez casillas tomadas de UniMorph, no generadas por analogía. '+
            'El currículo acredita el modelo, no cada forma. Género de artículo '+checked.gender+'.'
        }
      });
    }catch(e){reject(String(e?.message||e));}
  }
  records.sort((a,b)=>a.unit-b.unit||a.id.localeCompare(b.id));
  assert.equal(new Set(records.map(r=>r.id)).size,records.length,'IDs repetidos');
  return {records,review,audit:{candidates:candidates.length,
    uniqueLemmas:byLemma.size,alreadyIncluded:accepted.size,
    incorporated:records.length,reviewNeeded:review.length,
    sourceSha:vocabulaSha,excludedBeyondUd7:true}};
}
