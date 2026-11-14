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
// Ampliación prudente. Solo ἄνθρωπος se adelanta a UD1 porque Appendix
// lo muestra explícitamente en la UD1; los otros seis mantienen la unidad
// común acreditada por Vocabula («UD 1–4»), sin adivinar subunidades.
const EARLY_ADDITIONS=[
  {id:'anthropos',lemma:'ἄνθρωπος',genitive:'ἀνθρώπου',gender:'común',
    decl:'2.ª declinación',unit:1,vocab:'UD 1–4',grammarUnit:1},
  {id:'biblion',lemma:'βιβλίον',genitive:'βιβλίου',gender:'neutro',
    decl:'2.ª declinación',unit:4,vocab:'UD 1–4',grammarUnit:2},
  {id:'zoon',lemma:'ζῷον',genitive:'ζῴου',gender:'neutro',
    decl:'2.ª declinación',unit:4,vocab:'UD 1–4',grammarUnit:2},
  {id:'agora',lemma:'ἀγορά',genitive:'ἀγορᾶς',gender:'femenino',
    decl:'1.ª declinación (α puro)',genitiveSuffix:'–ας',
    unit:4,vocab:'UD 1–4',grammarUnit:3},
  {id:'aletheia',lemma:'ἀλήθεια',genitive:'ἀληθείας',gender:'femenino',
    decl:'1.ª declinación (α puro)',genitiveSuffix:'–ας',
    unit:4,vocab:'UD 1–4',grammarUnit:3},
  {id:'adikia',lemma:'ἀδικία',genitive:'ἀδικίας',gender:'femenino',
    decl:'1.ª declinación (α puro)',genitiveSuffix:'–ας',
    unit:4,vocab:'UD 1–4',grammarUnit:3},
  {id:'eleutheria',lemma:'ἐλευθερία',genitive:'ἐλευθερίας',gender:'femenino',
    decl:'1.ª declinación (α puro)',genitiveSuffix:'–ας',
    unit:4,vocab:'UD 1–4',grammarUnit:3}
];
// Palabras exigibles con lección propia o bloque curricular delimitado.
// Las de «UD 6–7» se habilitan en UD7, nunca en UD6 por conjetura.
// Se aceptan grafías distintas de genitivo abreviado solo cuando constan
// expresamente en la ficha de Vocabula; la flexión procede de UniMorph.
const EXIGIBLE_ADDITIONS=[
  {id:'arche',lemma:'ἀρχή',genitive:'ἀρχῆς',gender:'femenino',
    decl:'1.ª declinación (η)',vocabSuffix:'–ῆς',
    unit:5,vocab:'UD 5',grammarUnit:3},
  {id:'strategos',lemma:'στρατηγός',genitive:'στρατηγοῦ',gender:'masculino',
    decl:'2.ª declinación',unit:5,vocab:'UD 5',grammarUnit:1},
  {id:'epistole',lemma:'ἐπιστολή',genitive:'ἐπιστολῆς',gender:'femenino',
    decl:'1.ª declinación (η)',unit:7,vocab:'UD 6–7',grammarUnit:3},
  {id:'kephale',lemma:'κεφαλή',genitive:'κεφαλῆς',gender:'femenino',
    decl:'1.ª declinación (η)',vocabSuffix:'–ῆς',
    unit:7,vocab:'UD 6–7',grammarUnit:3},
  {id:'mache',lemma:'μάχη',genitive:'μάχης',gender:'femenino',
    decl:'1.ª declinación (η)',unit:7,vocab:'UD 6–7',grammarUnit:3},
  {id:'petra',lemma:'πέτρα',genitive:'πέτρας',gender:'femenino',
    decl:'1.ª declinación (α puro)',genitiveSuffix:'–ας',
    unit:7,vocab:'UD 6–7',grammarUnit:3},
  {id:'ouranos',lemma:'οὐρανός',genitive:'οὐρανοῦ',gender:'masculino',
    decl:'2.ª declinación',vocabSuffix:'–οῦ',
    unit:9,vocab:'UD 9',grammarUnit:1},
  {id:'hoplon',lemma:'ὅπλον',genitive:'ὅπλου',gender:'neutro',
    decl:'2.ª declinación',unit:10,vocab:'UD 10',grammarUnit:2},
  {id:'phobos',lemma:'φόβος',genitive:'φόβου',gender:'masculino',
    decl:'2.ª declinación',unit:10,vocab:'UD 10',grammarUnit:1}
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
  // Enunciados como «κεφαλή, –ῆς (ἡ)» incluyen el artículo del género
  // después del genitivo abreviado; ese artículo se coteja por separado
  // con UniMorph y no pertenece a la terminación del genitivo.
  const gen=(entry.form.split(',')[1]?.trim()||'')
    .replace(/\s+\((?:ὁ|ἡ|τὸ|τό)\)$/u,'');
  assert.ok(['–ου','–οῦ','–ης','–ῆς','–ας'].includes(gen),'Enunciado nominal no esperado: '+entry.form);
  assert.equal(gen,spec.vocabSuffix||spec.genitiveSuffix||
    '–'+(spec.decl.startsWith('1.')?'ης':'ου'),
    'Genitivo curricular incoherente: '+spec.lemma);
  return entry;
}
function checkGrammar(curriculum,spec){
  const title=spec.grammarUnit===1?'Segunda declinación masculina':
    spec.grammarUnit===2?'Segunda declinación neutra':'Primera declinación';
  const topic=curriculum.griego.units.find(u=>u.number===spec.grammarUnit)?.topics
    .find(x=>x.title===title);
  assert.ok(topic,'Falta correspondencia en Appendix: '+spec.lemma);
  const expected=spec.decl.startsWith('1.')?(spec.genitiveSuffix||'–ης'):
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
  const documentedGender=spec.gender==='común'?
    article?.startsWith('ὁ, ἡ '):
    article?.startsWith(GENDERS[spec.gender]+' ');
  assert.ok(documentedGender,
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
      (GENDERS[spec.gender]||'ὁ/ἡ')+') · '+spec.decl,
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
// Se preserva el lote inicial de ocho fichas e índices originales.
// Los sustantivos adicionales se añaden al final del banco, no entre ellas.
export function compileGreekEarlyNounBatch({curriculum,vocabulaData,unimorphParts,vocabulaSha}){
  assert.ok(/^[a-f0-9]{40}$/.test(vocabulaSha));
  assert.ok(Array.isArray(unimorphParts)&&unimorphParts.length===8);
  const lex=vocabList(vocabulaData),rows=unimorphParts.flat();
  const records=EARLY_ADDITIONS.map(spec=>{
    const entry=checkVocab(lex,spec);
    if(spec.id==='anthropos'){
      const introductory=curriculum.griego.units.find(u=>u.number===1)
        ?.topics.find(t=>t.title==='Copulativas con nominativo y genitivo')?.html;
      assert.ok(introductory?.includes('ἄνθρωπος'),
        'ἄνθρωπος no está acreditado en UD1: no adelantarlo');
    }
    return readOneNoun(spec,rows,entry,curriculum,vocabulaSha);
  });
  assert.equal(records.length,7);
  assert.equal(new Set(records.map(r=>r.id)).size,7);
  return records;
}
export function compileGreekExigibleNounBatch({curriculum,vocabulaData,unimorphParts,vocabulaSha}){
  assert.ok(/^[a-f0-9]{40}$/.test(vocabulaSha));
  assert.ok(Array.isArray(unimorphParts)&&unimorphParts.length===8);
  const lex=vocabList(vocabulaData),rows=unimorphParts.flat();
  const recordIds=new Set();
  const records=EXIGIBLE_ADDITIONS.map(spec=>{
    assert.ok(!recordIds.has(spec.id),'Candidatura duplicada');recordIds.add(spec.id);
    const source=checkVocab(lex,spec);
    return readOneNoun(spec,rows,source,curriculum,vocabulaSha);
  });
  assert.equal(records.length,9);
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
