// Conciliación cerrada de lemas de Griego I: Vocabula + formas UniMorph (ambos
// con el mismo SHA Vocabula fijado) + control de género y declinación de Appendix.
// No se completan casillas por reglas ni se importan lemas sin unidad acreditada.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
const CASES=[['nominativo','NOM'],['vocativo','VOC'],['acusativo','ACC'],
  ['genitivo','GEN'],['dativo','DAT']];
const NUMBERS=[['singular','SG'],['plural','PL']];
const CASE_CODES=new Set(CASES.flatMap(([,c])=>NUMBERS.map(([,n])=>'N;'+c+';'+n)));
const GENDERS={masculino:'ὁ',femenino:'ἡ',neutro:'τὸ'};
const SELECTED=[
  {id:'hippos',lemma:'ἵππος',genitive:'ἵππου',gender:'masculino',decl:'2.ª declinación',
    unit:4,vocab:'UD 1–4',grammarUnit:1},
  {id:'bios',lemma:'βίος',genitive:'βίου',gender:'masculino',decl:'2.ª declinación',
    unit:4,vocab:'UD 1–4',grammarUnit:1},
  {id:'dike',lemma:'δίκη',genitive:'δίκης',gender:'femenino',decl:'1.ª declinación (η)',
    unit:4,vocab:'UD 1–4',grammarUnit:3},
  {id:'arete',lemma:'ἀρετή',genitive:'ἀρετῆς',gender:'femenino',decl:'1.ª declinación (η)',
    unit:4,vocab:'UD 1–4',grammarUnit:3},
  {id:'logos',lemma:'λόγος',genitive:'λόγου',gender:'masculino',decl:'2.ª declinación',
    unit:7,vocab:'UD 6–7',grammarUnit:1},
  {id:'doron',lemma:'δῶρον',genitive:'δώρου',gender:'neutro',decl:'2.ª declinación',
    unit:7,vocab:'UD 6–7',grammarUnit:2},
  {id:'nike',lemma:'νίκη',genitive:'νίκης',gender:'femenino',decl:'1.ª declinación (η)',
    unit:7,vocab:'UD 6–7',grammarUnit:3},
  {id:'eirene',lemma:'εἰρήνη',genitive:'εἰρήνης',gender:'femenino',decl:'1.ª declinación (η)',
    unit:7,vocab:'UD 6–7',grammarUnit:3}
];
// La cantidad vocálica no se exige en los ejercicios, pero sí acento y espíritu.
// No se borra la iota suscrita ni otros elementos de la flexión.
const noQuantity=s=>String(s).normalize('NFD').replace(/[\u0304\u0306]/gu,'').normalize('NFC');
const key=s=>noQuantity(s).normalize('NFD')
  .replace(/[\u0300\u0301\u0308\u0313\u0314\u0342]/gu,'')
  .replace(/ς/gu,'σ').normalize('NFC');
function vocabList(text){
  assert.ok(text.startsWith('window.VOCAB=['),'Formato del vocabulario modificado');
  const match=text.match(/^window\.VOCAB=(\[[\s\S]*\]);?\s*$/);
  assert.ok(match,'No es posible extraer el vocabulario fijado');
  const items=JSON.parse(match[1]);
  assert.ok(items.length>300);
  return items;
}
function checkVocab(items,spec){
  const entries=items.filter(x=>x.subject==='gr1'&&x.mode==='examen'&&
    key(x.form.split(',')[0].trim())===key(spec.lemma)&&x.units?.includes(spec.vocab));
  assert.equal(entries.length,1,'Lema o unidad de examen ambiguos: '+spec.lemma);
  const entry=entries[0];
  const gen=entry.form.split(',')[1]?.trim()||'';
  assert.ok(gen==='–ου'||gen==='–ης','Enunciado nominal no esperado: '+entry.form);
  assert.equal(gen,'–'+(spec.decl.startsWith('1.')?'ης':'ου'),
    'Genitivo curricular incoherente: '+spec.lemma);
  return entry;
}
function checkGrammar(curriculum,spec){
  const title=spec.grammarUnit===1?'Segunda declinación masculina':
    spec.grammarUnit===2?'Segunda declinación neutra':'Primera declinación';
  const topic=curriculum.griego.units.find(u=>u.number===spec.grammarUnit)?.topics
    .find(x=>x.title===title);
  assert.ok(topic,'Falta correspondencia en Appendix: '+spec.lemma);
  const expected=spec.decl.startsWith('1.')?'–ης':
    spec.gender==='neutro'?'–ον':'–ος';
  assert.ok(topic.html.includes(expected),'El modelo del Appendix cambió: '+spec.lemma);
  return title;
}
function readOneNoun(spec,rows,entry,curriculum,vocabulaSha){
  const hits=rows.filter(row=>Array.isArray(row)&&row.length>=3&&key(row[0])===key(spec.lemma)&&
    CASE_CODES.has(row[2]));
  assert.equal(hits.length,10,'Exigir diez casillas diferentes de '+spec.lemma);
  const byTag=new Map();
  for(const row of hits){
    assert.equal(row[0]&&typeof row[1], 'string','Fila inválida');
    assert.ok(!byTag.has(row[2]),'Forma o caso duplicados: '+spec.lemma+' '+row[2]);
    byTag.set(row[2],row);
  }
  const nom=byTag.get('N;NOM;SG');
  assert.ok(nom&&key(nom[1])===key(spec.lemma),'Nominativo no coincide: '+spec.lemma);
  const gen=byTag.get('N;GEN;SG');
  assert.ok(gen&&key(gen[1])===key(spec.genitive),'Genitivo no coincide: '+spec.lemma);
  // Género documentado: ejemplo UniMorph del artículo nominativo singular.
  const article=nom[3];
  assert.ok(article?.startsWith(GENDERS[spec.gender]+' '),
    'El artículo nominal no acredita género de '+spec.lemma);
  // Control interfuentes de los principales morfemas, además de nominativo/genitivo.
  if(spec.gender==='neutro'){
    assert.equal(key(byTag.get('N;ACC;SG')[1]),key(nom[1]));
    assert.equal(key(byTag.get('N;ACC;PL')[1]),key(byTag.get('N;NOM;PL')[1]));
  }
  const grammar=checkGrammar(curriculum,spec);
  const forms=CASES.flatMap(([cas,tag])=>NUMBERS.map(([number,numberTag])=>{
    const row=byTag.get('N;'+tag+';'+numberTag);
    assert.ok(row&&typeof row[1]==='string','Falta forma nominal '+spec.lemma);
    const form=noQuantity(row[1]);
    assert.ok(form&&!/[()\[\]\/]/u.test(form),'Variante no individualizada '+form);
    return {form,analysis:cas+' '+number,case:cas,number};
  }));
  return {
    id:'griego-sustantivo-'+spec.id,
    language:'griego',unit:spec.unit,kind:'sustantivo',gender:spec.gender,
    paradigm:noQuantity(spec.lemma)+', '+noQuantity(spec.genitive)+' ('+
      GENDERS[spec.gender]+') · '+spec.decl,
    forms,
    evidence:{
      source:'UniMorph grc + Vocabula; cotejo curricular con Appendix',
      file:'data/unimorph-syllabus/grc/part-*.json',
      unit:spec.grammarUnit,topic:grammar,caption:'Paradigma nominal completo: '+spec.lemma,
      status:'paradigma-documentado',vocabulaSha,
      vocabulaEntry:entry.id,vocabulaGroup:spec.vocab,
      license:'CC BY-SA 3.0',review:'conciliación interfuentes; pendiente de revisión docente individual',
      notes:'Diez casillas NOM/VOC/ACC/GEN/DAT en singular/plural; género del artículo '+
        'ejemplificado en UniMorph; no se genera ninguna forma por analogía.'
    }
  };
}
export function compileGreekNounBatch({curriculum,vocabulaData,unimorphParts,vocabulaSha}){
  assert.ok(/^[a-f0-9]{40}$/.test(vocabulaSha),'SHA Vocabula no fijado');
  assert.ok(Array.isArray(unimorphParts)&&unimorphParts.length===8);
  const lex=vocabList(vocabulaData),records=[];
  const ids=new Set();
  for(const spec of SELECTED){
    assert.ok(!ids.has(key(spec.lemma)));ids.add(key(spec.lemma));
    const entry=checkVocab(lex,spec);
    records.push(readOneNoun(spec,unimorphParts.flat(),entry,curriculum,vocabulaSha));
  }
  assert.equal(records.length,8);
  return records;
}
export async function readGreekNounSource(source){
  const vocabulaData=await readFile(join(source,'data.js'),'utf8');
  const unimorphParts=[];
  for(let i=0;i<8;i++)
    unimorphParts.push(JSON.parse(await readFile(join(source,
      'data/unimorph-syllabus/grc/part-0'+i+'.json'),'utf8')));
  return {vocabulaData,unimorphParts};
}
