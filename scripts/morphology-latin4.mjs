// Latín de 4.º ESO: ocho unidades del programa docente de Vocabula.
// Transcribe paradigmas explícitos del programa y reutiliza tablas del Appendix
// con nueva fecha curricular; nunca crea flexiones nuevas por analogía.
import assert from 'node:assert/strict';

const COURSE_UNITS=Array.from({length:8},(_,i)=>i+1);
const CASES={nom:'nominativo',voc:'vocativo',acc:'acusativo',
  gen:'genitivo',dat:'dativo',abl:'ablativo'};
const NUMBERS={sg:'singular',pl:'plural'};
const GENDERS={m:'masculino',f:'femenino',n:'neutro'};
const PERSONS={'1':'1.ª','2':'2.ª','3':'3.ª'};
const TOPICS={
  1:'Primera declinación',
  2:'Segunda declinación y presente',
  3:'Adjetivos',
  4:'Imperfecto',
  5:'Tercera declinación',
  6:'Perfecto y voz pasiva',
  7:'Adjetivos de la tercera declinación y pluscuamperfecto',
  8:'Cuarta y quinta declinación y pronombres personales'
};
const clean=s=>String(s||'').replace(/<[^>]*>/g,'')
  .replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&aelig;/g,'æ')
  .replace(/&AElig;/g,'Æ').replace(/\s+/g,' ').trim().normalize('NFC');
function jsonAssignment(script,pattern,description){
  assert.equal(typeof script,'string',description+' no disponible');
  const match=script.match(pattern);
  assert.ok(match,description+' cambió de formato; revisar origen antes de importar');
  return JSON.parse(match[1]);
}
function sourceEvidence(unit,source,file,caption,notes,more={}){
  return {source,file,unit,topic:TOPICS[unit],caption,
    status:'paradigma-documentado',notes,...more};
}
function teacherRecord(item,file,sha){
  const match=/^UD ([1-8])$/.exec(item.units?.lat4||'');
  assert.ok(match,'Ficha sin unidad 4.º: '+item.id);
  const unit=Number(match[1]),kind=item.kind==='verbal'?'verbo':
    item.gender==='personal'?'pronombre':
    item.gender?.startsWith('adjetivo')?'adjetivo':'sustantivo';
  assert.ok(item.lang==='lat'&&item.id.startsWith('lat-')&&item.lemma&&
    item.topic&&item.forms&&typeof item.forms==='object',item.id);
  const forms=[];
  for(const [key,original] of Object.entries(item.forms)){
    const split=key.split('.'),values=String(original).split(/\s+\/\s+/).map(clean);
    assert.ok(values.every(v=>v&&!v.includes('/')),'Variante no aislada: '+item.id+' '+key);
    if(kind==='verbo'){
      assert.equal(split.length,2,'Persona desconocida '+item.id+' '+key);
      const [person,number]=split;
      assert.ok(PERSONS[person]&&NUMBERS[number]&&item.desc);
      for(const form of values)forms.push({form,
        person:PERSONS[person]+' '+NUMBERS[number],tense:item.desc,
        analysis:PERSONS[person]+' '+NUMBERS[number]+' · '+item.desc});
    }else{
      assert.ok(split.length===2||split.length===3,'Caso desconocido '+item.id+' '+key);
      const [cas,second,third]=split;
      const gender=third?GENDERS[second]:undefined;
      const number=NUMBERS[third||second];
      assert.ok(CASES[cas]&&number&&(!third||gender),'Celda nominal desconocida '+item.id+' '+key);
      for(const form of values)forms.push({form,case:CASES[cas],number,
        ...(gender?{gender}:{}),
        analysis:CASES[cas]+(gender?' '+gender:'')+' '+number});
    }
  }
  assert.ok(forms.length>=6,'Paradigma demasiado corto '+item.id);
  const record={
    id:'latin4-docente-'+item.id,language:'latin4',unit,kind,
    paradigm:item.lemma+(item.desc?' · '+item.desc:''),
    forms,evidence:sourceEvidence(unit,'Vocabula Latina Graecaque · paradigma docente',
      file,item.id,'Casillas expresas del modelo docente; otras flexiones no se infieren.',
      {sourceTopic:item.topic,vocabulaSha:sha})
  };
  if(kind==='sustantivo'){
    const gender=item.gender?.match(/^(masculino|femenino|neutro)/)?.[1];
    assert.ok(gender,'Sustantivo sin género documentado '+item.id);
    record.gender=gender;
  }
  return record;
}
// Correspondencia expresa entre la introducción de un contenido en Latín I y 4.º.
// Una forma puede reutilizarse; NUNCA se adelanta su unidad de 4.º.
const BRIDGE=[
  [1,1,'sustantivo',r=>r.paradigm.startsWith('rosa,'),1],
  [2,1,'sustantivo',r=>/^(dominus|bellum),/.test(r.paradigm),2],
  [2,1,'verbo',r=>/ · presente(?: activo)?$/.test(r.paradigm),6],
  [4,2,'verbo',r=>/ · imperfecto activo$/.test(r.paradigm),6],
  [5,4,'sustantivo',r=>true,4],
  [6,3,'verbo',r=>/ · (?:presente|imperfecto) pasivo$/.test(r.paradigm),10],
  [6,3,'desinencia',r=>r.id==='latin-desinencias-pasivas',1],
  [6,4,'verbo',r=>/ · perfecto activo$/.test(r.paradigm),6],
  [7,5,'adjetivo',r=>true,4],
  [7,4,'verbo',r=>/ · pluscuamperfecto activo$/.test(r.paradigm),6],
  [8,7,'sustantivo',r=>true,3]
];
function appendixModels(baseRecords){
  const output=[];
  for(const [unit,sourceUnit,kind,predicate,expected] of BRIDGE){
    const rows=baseRecords.filter(r=>r.language==='latin'&&
      r.unit===sourceUnit&&r.kind===kind&&predicate(r));
    assert.equal(rows.length,expected,
      'Cambió el conjunto de modelos de Appendix para 4.º UD'+unit+'/'+kind);
    for(const item of rows)output.push({
      ...item,id:'latin4-appendix-'+item.id,language:'latin4',unit,
      forms:item.forms.map(f=>({...f})),
      evidence:{...item.evidence,unit,sourceUnit,topic:TOPICS[unit],
        notes:'Paradigma curricular publicado en Appendix, habilitado en 4.º únicamente desde UD'+unit+'.'}
    });
  }
  assert.equal(output.length,49);
  return output;
}
function firstClassAdjective(html){
  const caption='Adjetivos de la primera clase · bonus, -a, -um';
  const tables=[...html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/g)];
  const matches=tables.filter(m=>clean(m[1].match(/<caption[^>]*>([\s\S]*?)<\/caption>/)?.[1])===caption);
  assert.equal(matches.length,1,'Falta el paradigma de bonus en Appendix');
  const tbody=matches[0][1].match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/)?.[1];
  assert.ok(tbody,'Tabla de bonus sin cuerpo');
  const rows=[...tbody.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].map(m=>
    [...m[1].matchAll(/<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/g)]
      .map(c=>clean(c[1])));
  const cases=['nominativo','vocativo','acusativo','genitivo','dativo','ablativo'];
  assert.equal(rows.length,6,'La tabla de bonus cambió');
  const forms=[];
  for(const [i,row] of rows.entries()){
    assert.equal(row.length,7,'bonus: faltan géneros o números');
    assert.equal(row[0].toLowerCase(),cases[i]);
    for(let j=1;j<7;j++){
      const gender=['masculino','femenino','neutro'][(j-1)%3];
      const number=j<4?'singular':'plural';
      assert.ok(row[j]&&!row[j].includes('/'),'Forma dudosa en bonus');
      forms.push({form:row[j],case:cases[i],number,gender,
        analysis:cases[i]+' '+gender+' '+number});
    }
  }
  assert.equal(forms.length,36);
  assert.equal(forms.find(f=>f.analysis==='vocativo masculino singular').form,'bone');
  assert.equal(forms.find(f=>f.analysis==='ablativo femenino singular').form,'bonā');
  return {id:'latin4-appendix-bonus',language:'latin4',unit:3,
    kind:'adjetivo',paradigm:'bonus, bona, bonum · primera clase',forms,
    evidence:sourceEvidence(3,'Appendix grammaticae','adjetivos.html',caption,
      'Tabla completa publicada de la primera clase, sin completar formas por analogía.')};
}
export function compileLatin4({
  baseRecords,teacherParadigmsJs,teacherImperfectsJs,
  syllabusJs,latinAdjectivesHtml,vocabulaSha
}){
  assert.ok(Array.isArray(baseRecords)&&/^[a-f0-9]{40}$/.test(vocabulaSha));
  const syllabus=jsonAssignment(syllabusJs,
    /window\.GRAMMAR_CONTENT\s*=\s*(\{[\s\S]*\});?\s*$/,
    'Temario docente');
  const latin4=syllabus.syllabi?.lat4;
  assert.deepEqual(latin4?.map(row=>row[0]),COURSE_UNITS.map(i=>'UD '+i),
    'Cambió la secuencia curricular de 4.º');
  assert.deepEqual(latin4.map(row=>row[1]),[
    ['Introducción al latín','Primera declinación'],
    ['Segunda declinación','Presente'],
    ['Adjetivos','Preposiciones'],
    ['El imperfecto'],
    ['La tercera declinación'],
    ['El perfecto','Voz pasiva'],
    ['Adjetivos de la 3ª declinación','Pluscuamperfecto'],
    ['Cuarta y quinta declinación','Pronombres personales']
  ],'Cambió el temario de 4.º: requiere nueva conciliación');
  const teacher=jsonAssignment(teacherParadigmsJs,
    /window\.GRAMMAR_PARADIGMS\s*=\s*(\[[\s\S]*\]);?\s*$/,
    'Paradigmas docentes');
  const additional=jsonAssignment(teacherImperfectsJs,
    /window\.GRAMMAR_PARADIGMS\.push\(\.\.\.(\[[\s\S]*\])\);?\s*$/,
    'Imperfectos docentes');
  const selected=[...teacher,...additional].filter(x=>x.units?.lat4);
  assert.equal(teacher.filter(x=>x.units?.lat4).length,16);
  assert.equal(additional.filter(x=>x.units?.lat4).length,10);
  const teacherRows=selected.map(item=>
    teacherRecord(item,teacher.includes(item)?'gramatica-paradigmas.js':
      'gramatica-latin-imperfectos.js',vocabulaSha));
  const result=[...teacherRows,...appendixModels(baseRecords),
    firstClassAdjective(latinAdjectivesHtml)];
  assert.equal(result.length,76);
  assert.equal(new Set(result.map(x=>x.id)).size,result.length,'IDs de 4.º repetidos');
  for(const unit of COURSE_UNITS)assert.ok(result.some(r=>r.unit===unit),'Unidad sin ejercicios '+unit);
  return result;
}
