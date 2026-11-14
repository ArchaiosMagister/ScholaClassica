// Genera únicamente paradigmas atestiguados en tablas del Appendix fijado.
// No crea flexiones por analogía ni valida automáticamente vocabulario externo.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';
import {compileAdditionalMorphology} from './morphology-expansion.mjs';
import {compileMorphologyUd67} from './morphology-ud6-ud7.mjs';
import {compileMorphologyUd8to14} from './morphology-ud8-14.mjs';
import {compileLatin4} from './morphology-latin4.mjs';
import {compileLatin2} from './morphology-latin2.mjs';
import {parsePauExamQuestions,compilePauNominalParadigms,latinFold} from './morphology-pau-latin2.mjs';
import {compilePauPronouns} from './morphology-pau-pronouns.mjs';
import {compilePauCompoundVerbs,compileVenioParadigm} from './morphology-pau-verbs.mjs';
import {compileGreekNounBatch,readGreekNounSource} from './greek-noun-conciliation.mjs';
const root=resolve(import.meta.dirname,'..');
const source=resolve(process.env.APPENDIX_SOURCE||join(root,'.sources/appendix'));
const CASES={latin:['nominativo','vocativo','acusativo','genitivo','dativo','ablativo'],
  griego:['nominativo','vocativo','acusativo','genitivo','dativo']};
const PERSONS=['1.ª singular','2.ª singular','3.ª singular','1.ª plural','2.ª plural','3.ª plural'];
const clean=text=>text.replace(/<[^>]*>/g,'')
  .replace(/&nbsp;/g,' ').replace(/&amp;/g,'&')
  .replace(/&aelig;/g,'æ').replace(/&AElig;/g,'Æ')
  .replace(/&lt;/g,'<').replace(/&gt;/g,'>')
  .replace(/\s+/g,' ').trim().normalize('NFC');
function cells(html){
  return [...html.matchAll(/<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/g)]
    .map(match=>clean(match[1]));
}
function tableFor(topic,label){
  const tables=[...topic.html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/g)];
  const match=tables.map(x=>x[1]).find(t=>clean(t.match(/<caption[^>]*>([\s\S]*?)<\/caption>/)?.[1]||'').includes(label));
  assert.ok(match,'Falta tabla '+topic.title+' / '+label);
  const content=match.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/)?.[1];
  assert.ok(content,'Tabla sin cuerpo: '+label);
  return [...content.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].map(x=>cells(x[1]));
}
function topicOf(curriculum,lang,unit,title){
  const lesson=curriculum[lang]?.units.find(x=>x.number===unit);
  const topic=lesson?.topics.find(x=>x.title===title);
  assert.ok(topic,'Tema curricular ausente: '+lang+'/'+unit+'/'+title);
  return topic;
}
function create({language,unit,kind,topic,caption,paradigm,rows,columns,cases=CASES[language],formModifier=x=>x,sourceFile='assets/curriculum.json',notes=null}){
  assert.equal(rows.length,cases.length,paradigm+' tiene filas inesperadas');
  const forms=[];
  for(let r=0;r<rows.length;r++){
    assert.equal(rows[r].length,columns.length+1,paradigm+' tiene columnas inesperadas');
    assert.equal(rows[r][0].toLowerCase().replace(/\.$/,'').trim(),cases[r],
      paradigm+' caso fuera de orden: '+rows[r][0]);
    columns.forEach(({label,col},index)=>{
      const form=formModifier(rows[r][index+1]);
      assert.ok(form&&form.length<90,'Forma vacía o extensa en '+paradigm);
      forms.push({form,analysis:cases[r]+' '+label,case:cases[r],number:label});
    });
  }
  return {id:paradigm.replace(/[^a-z0-9]+/gi,'-').toLowerCase(),
    language,unit,kind,paradigm,forms,
    evidence:{source:'Appendix grammaticae',file:sourceFile,unit,topic,caption,
      status:'paradigma-documentado',...(notes?{notes}:{})}};
}
function nounFrom(curriculum,{language,unit,topic,caption,paradigm,columns,select}){
  const rows=tableFor(topicOf(curriculum,language,unit,topic),caption);
  return create({language,unit,kind:'sustantivo',topic,caption,paradigm,
    rows:select?rows.map(row=>[row[0],...select.map(i=>row[i])]):rows,columns,
    formModifier:x=>x});
}
function endingFrom(curriculum,{unit,topic,caption,paradigm}){
  const rows=tableFor(topicOf(curriculum,'griego',unit,topic),caption);
  return create({language:'griego',unit,kind:'desinencia',topic,caption,paradigm,
    rows,columns:[{label:'singular'},{label:'plural'}]});
}
function verbFrom(curriculum,{language,unit,topic,caption,paradigms}){
  const rows=tableFor(topicOf(curriculum,language,unit,topic),caption);
  assert.equal(rows.length,6,'El paradigma verbal no tiene seis personas');
  for(let i=0;i<6;i++)assert.equal(rows[i][0],PERSONS[i],'Orden verbal desconocido');
  return paradigms.map(({paradigm,column,tense})=>{
    const forms=rows.map((row,i)=>{
      const form=row[column].replace(/–/g,'').trim().normalize('NFC');
      assert.ok(form&&form.length<90,paradigm);
      return {form,analysis:PERSONS[i]+' · '+tense,person:PERSONS[i],tense};
    });
    return {id:paradigm.replace(/[^a-z0-9]+/gi,'-').toLowerCase(),
      language,unit,kind:'verbo',paradigm,forms,
      evidence:{source:'Appendix grammaticae',file:'assets/curriculum.json',unit,topic,caption,
        status:'paradigma-documentado'}};
  });
}
function articleFrom(curriculum){
  const topic='El artículo',caption='El artículo · tabla 99';
  const allRows=tableFor(topicOf(curriculum,'griego',3,topic),caption);
  // La tabla del artículo tiene dos filas de encabezados dentro de tbody.
  assert.equal(allRows.length,6,'Cambió la tabla del artículo: revisar estructura');
  assert.ok(allRows[0][0]==='—'&&allRows[1][0]==='—','Encabezados inesperados del artículo');
  const rows=allRows.slice(2);
  const cases=['nominativo','acusativo','genitivo','dativo'];
  const abbreviations=['Nom.','Ac.','Gen.','Dat.'];
  // La tabla del artículo es polisincrética: no impone un análisis único.
  const genders=['masculino','femenino','neutro'];
  const forms=[];
  assert.equal(rows.length,4);
  rows.forEach((row,i)=>{
    assert.equal(row.length,7);
    assert.equal(row[0],abbreviations[i]);
    for(let col=1;col<7;col++){
      const gender=genders[(col-1)%3],number=col<=3?'singular':'plural';
      forms.push({form:row[col],analysis:cases[i]+' '+gender+' '+number,
        case:cases[i],gender,number});
    }
  });
  return {id:'griego-articulo',language:'griego',unit:3,kind:'artículo',
    paradigm:'Artículo griego (sin vocativo)',forms,
    evidence:{source:'Appendix grammaticae',file:'assets/curriculum.json',
      unit:3,topic,caption,status:'paradigma-documentado'}};
}

function latinThirdDeclension(curriculum,latinNounsHtml){
  const unit=4,topic='Tercera declinación',caption='Tercera declinación · cuatro paradigmas';
  const summary=topicOf(curriculum,'latin',unit,topic);
  assert.ok(summary.html.includes('href="sustantivos.html"'),
    'UD4 debe remitir al capítulo de tercera declinación del Appendix');
  assert.ok(typeof latinNounsHtml==='string'&&latinNounsHtml.includes('id="tercera-declinacion"'),
    'Falta el capítulo completo del Appendix fijado');
  const rows=tableFor({title:topic,html:latinNounsHtml},caption);
  assert.equal(rows.length,6,'Tercera declinación: se esperan seis casos');
  for(const row of rows)assert.equal(row.length,9,'Tercera declinación: cuatro pares singular/plural');
  // Contrastamos los rasgos filológicos que distinguen las cuatro familias.
  assert.equal(rows[3][2],'ducum','Genitivo plural de tema consonántico');
  assert.equal(rows[3][4],'civium','Genitivo plural de tema en -i');
  assert.equal(rows[3][6],'fluminum','Genitivo plural neutro consonántico');
  assert.equal(rows[3][8],'marium','Genitivo plural neutro en -i');
  assert.equal(rows[0][8],'maria','Neutro en -i: nominativo plural en -ia');
  assert.equal(rows[2][8],'maria','Neutro en -i: acusativo plural en -ia');
  assert.equal(rows[5][7],'mari','Neutro en -i: ablativo singular en -i');
  assert.equal(rows[2][4],'cives / civis','Variantes del acusativo plural de civis');

  const models=[
    {paradigm:'dux, ducis · 3.ª declinación, consonante, M/F',select:[1,2]},
    {paradigm:'civis, civis · 3.ª declinación, tema en -i, M/F',select:[3,4]},
    {paradigm:'flumen, fluminis · 3.ª declinación, neutro consonántico',select:[5,6]},
    {paradigm:'mare, maris · 3.ª declinación, neutro en -i',select:[7,8]}
  ];
  return models.map(({paradigm,select})=>{
    const record=create({language:'latin',unit,kind:'sustantivo',topic,caption,paradigm,
      rows:rows.map(row=>[row[0],...select.map(i=>row[i])]),
      columns:[{label:'singular'},{label:'plural'}],sourceFile:'sustantivos.html',
      notes:'Se transcribe el paradigma completo; en civis se respetan las variantes explícitas del acusativo plural.'});
    // La barra de la tabla representa dos formas independientes, no una forma con barra.
    if(paradigm.startsWith('civis,')){
      const original=record.forms.find(entry=>entry.case==='acusativo'&&entry.number==='plural');
      assert.equal(original?.form,'cives / civis');
      record.forms=record.forms.flatMap(entry=>
        entry===original?entry.form.split(' / ').map(form=>({...entry,form})): [entry]);
    }else{
      assert.ok(record.forms.every(entry=>!entry.form.includes(' / ')),
        'Apareció una variante no revisada en '+paradigm);
    }
    return record;
  });
}
function latinPassiveEndings(curriculum){
  const unit=3,topic='Presente e imperfecto pasivos',caption='Desinencias de la voz pasiva';
  const rows=tableFor(topicOf(curriculum,'latin',unit,topic),caption);
  assert.equal(rows.length,6);
  const forms=rows.flatMap((row,i)=>{
    assert.equal(row.length,2);
    assert.equal(row[0],PERSONS[i]);
    return row[1].split(' / ').map(form=>({
      form,analysis:PERSONS[i]+' · desinencia personal pasiva',
      person:PERSONS[i],tense:'presente e imperfecto pasivos'
    }));
  });
  assert.deepEqual(forms.filter(form=>form.person==='2.ª singular').map(form=>form.form),
    ['-ris','-re'],'Falta la variante pasiva de segunda singular');
  return {id:'latin-desinencias-pasivas',language:'latin',unit,kind:'desinencia',
    paradigm:'Desinencias personales pasivas · presente e imperfecto',
    forms,evidence:{source:'Appendix grammaticae',file:'assets/curriculum.json',unit,topic,
      caption,status:'paradigma-documentado',
      notes:'La segunda singular admite -ris y -re; no se inventan paradigmas completos alternativos.'}};
}
function greekFirstDeclension(curriculum){
  const unit=3,topic='Primera declinación',caption='Primera declinación · tabla 98';
  const section=topicOf(curriculum,'griego',unit,topic);
  assert.ok(section.html.includes('temas mixtos'),'Falta explicar el modelo mixto');
  const rows=tableFor(section,caption);
  assert.equal(rows.length,7,'La primera declinación griega cambió de estructura');
  assert.equal(rows[0][0],'—');assert.equal(rows[1][0],'—');
  assert.ok(rows[1][1].includes('Fem.')&&rows[1][2].includes('Masc.'));
  const cases=['nominativo','vocativo','acusativo','genitivo','dativo'];
  const expected=[
    ['–α |–η','–ας | –ης','–αι'],
    ['–α |–η','–α','–αι'],
    ['–αν |–ην','–αν | –ην','–ας'],
    ['–ας |–ης','–ου','–ων'],
    ['–ᾳ |–ῃ','–ᾳ |–ῃ','–αις']
  ];
  const compact=value=>value.replace(/\s+/g,'').normalize('NFC');
  for(let index=0;index<cases.length;index++){
    const row=rows[index+2];
    assert.equal(row.length,4);
    assert.equal(row[0].toLowerCase(),cases[index]);
    for(let col=1;col<=3;col++)
      assert.equal(compact(row[col]),compact(expected[index][col-1]),
        'Cambió la tabla griega: revisar variantes, caso '+cases[index]);
  }
  const commonPlural=['–αι','–αι','–ας','–ων','–αις'];
  const designs=[
    {id:'griego-1f-alfa-puro',gender:'femenino',family:'tema en α puro (–α, –ας)',
      singular:['–α','–α','–αν','–ας','–ᾳ'],sourceCol:1},
    {id:'griego-1f-eta',gender:'femenino',family:'tema en η (–η, –ης)',
      singular:['–η','–η','–ην','–ης','–ῃ'],sourceCol:1},
    {id:'griego-1f-mixto',gender:'femenino',family:'tema mixto (–α, –ης)',
      singular:['–α','–α','–αν','–ης','–ῃ'],sourceCol:1},
    {id:'griego-1m-alfa',gender:'masculino',family:'tema en α (–ας, –ου)',
      singular:['–ας','–α','–αν','–ου','–ᾳ'],sourceCol:2},
    {id:'griego-1m-eta',gender:'masculino',family:'tema en η (–ης, –ου)',
      singular:['–ης','–α','–ην','–ου','–ῃ'],sourceCol:2}
  ];
  const alternatives=cell=>cell.split('|').map(s=>compact(s));
  return designs.map(model=>{
    const forms=[];
    cases.forEach((cas,i)=>{
      assert.ok(alternatives(rows[i+2][model.sourceCol]).includes(compact(model.singular[i])),
        'No hay evidencia textual para '+model.id+' '+cas);
      assert.equal(compact(rows[i+2][3]),compact(commonPlural[i]));
      for(const [number,form] of [
        ['singular',model.singular[i]],['plural',commonPlural[i]]
      ])forms.push({form,analysis:cas+' '+number+' · '+model.gender+' · '+model.family,
        case:cas,number,gender:model.gender});
    });
    return {id:model.id,language:'griego',unit,kind:'desinencia',
      paradigm:'1.ª declinación griega · '+model.gender+' · '+model.family,forms,
      evidence:{source:'Appendix grammaticae',file:'assets/curriculum.json',unit,topic,
        caption,status:'paradigma-documentado',
        notes:'Desinencias de una variante específica; no se generan sustantivos completos ni se mezclan variantes.'}};
  });
}

export function compileMorphology(curriculum,sha,{latinNounsHtml,latinIndicativeHtml,latinAdjectivesHtml}={}){
  assert.ok(/^[a-f0-9]{40}$/.test(sha),'SHA del Appendix no fijado');
  const records=[];
  records.push(nounFrom(curriculum,{language:'latin',unit:1,
    topic:'Primera y segunda declinación',caption:'Primera declinación',
    paradigm:'rosa, rosæ · 1.ª declinación',
    columns:[{label:'singular'},{label:'plural'}]}));
  records.push(nounFrom(curriculum,{language:'latin',unit:1,
    topic:'Primera y segunda declinación',caption:'Segunda declinación',
    paradigm:'dominus, domini · 2.ª declinación',
    select:[1,2],columns:[{label:'singular'},{label:'plural'}]}));
  records.push(nounFrom(curriculum,{language:'latin',unit:1,
    topic:'Primera y segunda declinación',caption:'Segunda declinación',
    paradigm:'bellum, belli · 2.ª declinación',
    select:[3,4],columns:[{label:'singular'},{label:'plural'}]}));
  const verbs=[
    {paradigm:'amo · presente activo',column:1,tense:'presente activo'},
    {paradigm:'habeo · presente activo',column:2,tense:'presente activo'},
    {paradigm:'duco · presente activo',column:3,tense:'presente activo'},
    {paradigm:'audio · presente activo',column:4,tense:'presente activo'},
    {paradigm:'capio · presente activo',column:5,tense:'presente activo'},
    {paradigm:'sum · presente',column:6,tense:'presente'}
  ];
  records.push(...verbFrom(curriculum,{language:'latin',unit:1,
    topic:'Conjugaciones y presente activo',caption:'Presente de indicativo · voz activa',
    paradigms:verbs}));
  records.push(...verbFrom(curriculum,{language:'latin',unit:2,
    topic:'Imperfecto de indicativo activo',caption:'Imperfecto de indicativo · voz activa',
    paradigms:verbs.map(p=>({...p,paradigm:p.paradigm.replace('presente','imperfecto'),
      tense:p.tense.replace('presente','imperfecto')}))}));
  records.push(endingFrom(curriculum,{unit:1,topic:'Segunda declinación masculina',
    caption:'Segunda declinación masculina',paradigm:'2.ª declinación griega · masculino'}));
  records.push(verbFrom(curriculum,{language:'griego',unit:1,
    topic:'Presente de εἰμί',caption:'εἰμί · presente de indicativo',
    paradigms:[{paradigm:'εἰμί · presente',column:1,tense:'presente'}]})[0]);
  records.push(endingFrom(curriculum,{unit:2,topic:'Segunda declinación neutra',
    caption:'Segunda declinación neutra',paradigm:'2.ª declinación griega · neutro'}));
  records.push(verbFrom(curriculum,{language:'griego',unit:2,
    topic:'Presente de indicativo activo',caption:'λύω · presente activo',
    paradigms:[{paradigm:'λύω · presente activo',column:1,tense:'presente activo'}]})[0]);
  records.push(articleFrom(curriculum));
  const passive=[
    {paradigm:'amo · presente pasivo',column:1,tense:'presente pasivo'},
    {paradigm:'habeo · presente pasivo',column:2,tense:'presente pasivo'},
    {paradigm:'duco · presente pasivo',column:3,tense:'presente pasivo'},
    {paradigm:'audio · presente pasivo',column:4,tense:'presente pasivo'},
    {paradigm:'capio · presente pasivo',column:5,tense:'presente pasivo'}
  ];
  records.push(...verbFrom(curriculum,{language:'latin',unit:3,
    topic:'Presente e imperfecto pasivos',caption:'Presente de indicativo · voz pasiva',
    paradigms:passive}));
  records.push(...verbFrom(curriculum,{language:'latin',unit:3,
    topic:'Presente e imperfecto pasivos',caption:'Imperfecto de indicativo · voz pasiva',
    paradigms:passive.map(p=>({...p,
      paradigm:p.paradigm.replace('presente','imperfecto'),
      tense:p.tense.replace('presente','imperfecto')}))}));
  records.push(latinPassiveEndings(curriculum));
  records.push(...latinThirdDeclension(curriculum,latinNounsHtml));
  records.push(...greekFirstDeclension(curriculum));
  records.push(...compileAdditionalMorphology({curriculum,latinIndicativeHtml,latinAdjectivesHtml}));
  records.push(...compileMorphologyUd67(curriculum));
  records.push(...compileMorphologyUd8to14(curriculum));
  // Ningún registro se habilita por inferencia; solo por tabla curricular.
  assert.equal(records.length,136);
  assert.equal(new Set(records.map(r=>r.id)).size,records.length,'IDs duplicados');
  for(const r of records)assert.ok(r.forms.length>=6,r.id);
  return {schema:'schola-morphology-source/v1',appendixSha:sha,
    coverage:{latin:[1,2,3,4,5,6,7,8,9,10],griego:[1,2,3,4,5,6,7,8,9,10,11,12,13,14]},records};
}
export async function buildMorphology({out,lock}){
  const path=join(source,'assets/curriculum.json');
  const data=compileMorphology(JSON.parse(await readFile(path,'utf8')),lock.sources.appendix.sha,
    {latinNounsHtml:await readFile(join(source,'sustantivos.html'),'utf8'),
     latinIndicativeHtml:await readFile(join(source,'indicativo.html'),'utf8'),
     latinAdjectivesHtml:await readFile(join(source,'adjetivos.html'),'utf8')});
  const vocabulaSource=resolve(process.env.VOCABULA_SOURCE||join(root,'.sources/vocabula'));
  const sourceData=await readGreekNounSource(vocabulaSource);
  const greekNouns=compileGreekNounBatch({
    curriculum:JSON.parse(await readFile(path,'utf8')),
    ...sourceData,vocabulaSha:lock.sources.vocabula.sha
  });
  const latin4=compileLatin4({
    baseRecords:data.records,vocabulaSha:lock.sources.vocabula.sha,
    teacherParadigmsJs:await readFile(join(vocabulaSource,'gramatica-paradigmas.js'),'utf8'),
    teacherImperfectsJs:await readFile(join(vocabulaSource,'gramatica-latin-imperfectos.js'),'utf8'),
    syllabusJs:await readFile(join(vocabulaSource,'gramatica-contenidos.js'),'utf8'),
    latinAdjectivesHtml:await readFile(join(source,'adjetivos.html'),'utf8')
  });
  const originalRecords=[...data.records,...greekNouns,...latin4];
  assert.equal(originalRecords.length,220);
  const latin2=compileLatin2(originalRecords);
  const exams=parsePauExamQuestions(await readFile(
    join(root,'shared/academic/latin2/pau-cv-2006-2026.tsv'),'utf8'));
  const curriculum=JSON.parse(await readFile(path,'utf8'));
  const pronouns=compilePauPronouns(curriculum);
  const compounds=compilePauCompoundVerbs(exams);
  const venio=compileVenioParadigm();
  const nominalParts=await Promise.all(Array.from({length:32},(_,i)=>
    readFile(join(vocabulaSource,'data/unimorph-syllabus/lat/part-'
      +String(i).padStart(2,'0')+'.json'),'utf8').then(JSON.parse)));
  const nominal=compilePauNominalParadigms({
    baseRecords:[...originalRecords,...latin2],unimorphParts:nominalParts,
    sourceRevision:lock.sources.vocabula.sha,examQuestions:exams
  });
  const additions=[...pronouns,...compounds,venio,...nominal.records];
  const fullRecords=[...originalRecords,...latin2,...additions];
  const finalBank={...data,vocabulaSha:lock.sources.vocabula.sha,
    coverage:{...data.coverage,latin4:[1,2,3,4,5,6,7,8],latin2:[0]},
    records:fullRecords};
  assert.equal(new Set(fullRecords.map(record=>record.id)).size,fullRecords.length);
  const examForms=[...new Set(exams.flatMap(q=>q.forms.map(latinFold)))];
  const latin2Surface=new Set(fullRecords.filter(r=>r.language==='latin2')
    .flatMap(r=>r.forms.map(f=>latinFold(f.form))));
  const covered=examForms.filter(form=>latin2Surface.has(form));
  const missing=examForms.filter(form=>!latin2Surface.has(form));
  const audit={source:'PAU de Latín II CV, PDF de 56 páginas',
    years:[2006,2026],models:exams.length,occurrences:352,
    distinctForms:examForms.length,coveredForms:covered.length,
    missingForms:missing,nominalImported:nominal.records.length,
    nominalIncomplete:nominal.skipped,pronounsAdded:pronouns.length,
    compoundsAdded:compounds.length};
  const dir=join(out,'apps/morfologia/data');
  await mkdir(dir,{recursive:true});
  await writeFile(join(dir,'paradigmas.json'),JSON.stringify(finalBank,null,2)+'\n');
  await writeFile(join(dir,'pau-latin2-audit.json'),JSON.stringify(audit,null,2)+'\n');
  console.log('Morfología: '+fullRecords.length+
    ' fichas; '+covered.length+' de 301 formas PAU incorporadas por paradigmas completos');
}
