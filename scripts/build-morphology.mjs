// Genera únicamente paradigmas atestiguados en tablas del Appendix fijado.
// No crea flexiones por analogía ni valida automáticamente vocabulario externo.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';
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
function create({language,unit,kind,topic,caption,paradigm,rows,columns,cases=CASES[language],formModifier=x=>x}){
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
    evidence:{source:'Appendix grammaticae',file:'assets/curriculum.json',unit,topic,caption,
      status:'paradigma-documentado'}};
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
  const rows=tableFor(topicOf(curriculum,'griego',3,topic),caption);
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
export function compileMorphology(curriculum,sha){
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
  // Ningún registro se habilita por inferencia; solo por tabla curricular.
  assert.equal(records.length,20);
  assert.equal(new Set(records.map(r=>r.id)).size,records.length,'IDs duplicados');
  for(const r of records)assert.ok(r.forms.length>=6,r.id);
  return {schema:'schola-morphology-source/v1',appendixSha:sha,
    coverage:{latin:[1,2],griego:[1,2,3]},records};
}
export async function buildMorphology({out,lock}){
  const path=join(source,'assets/curriculum.json');
  const data=compileMorphology(JSON.parse(await readFile(path,'utf8')),lock.sources.appendix.sha);
  const dir=join(out,'apps/morfologia/data');
  await mkdir(dir,{recursive:true});
  await writeFile(join(dir,'paradigmas.json'),JSON.stringify(data,null,2)+'\n');
  console.log('Morfología curricular: '+data.records.length+' paradigmas tomados del Appendix fijado');
}
