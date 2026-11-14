// PAU de Latín II, Comunitat Valenciana (2006–2026).
// Catálogo literal de 352 preguntas y extensión SOLO de paradigmas nominales
// presentes íntegramente en el corpus UniMorph fijado de Vocabula.
import assert from 'node:assert/strict';
export const PAU_SOURCE='Selectividad de Latín II, Comunitat Valenciana, 2006–2026, PDF docente de 56 páginas';
export const latinFold=value=>String(value||'').normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'').replace(/æ/gi,'ae').replace(/œ/gi,'oe')
  .trim().toLowerCase().replace(/\s+/g,' ');

const YEAR_PAGES=[
  [2006,[1,2]],[2007,[3,4]],[2008,[5,6]],[2009,[7,8]],
  [2010,[9,10]],[2011,[11,12]],[2012,[13,14]],[2013,[15,16]],
  [2014,[17,18]],[2015,[19,20]],[2016,[21,22]],[2017,[23,24]],
  [2018,[25,26]],[2019,[27,28]],[2020,[29,30]],[2021,[31,32]],
  [2022,[33,34]],[2023,[35,36]],[2024,[37,38]],
  [2025,[39,42,45,48]],[2026,[51,54]]
];
export function parsePauExamQuestions(source){
  assert.equal(typeof source,'string');
  const records=source.split(/\r?\n/).filter(line=>/^\d\d\|/.test(line)).map(line=>{
    const [pageValue,model,text]=line.split('|');
    const page=Number(pageValue);
    const year=YEAR_PAGES.find(([,pages])=>pages.includes(page))?.[0];
    assert.ok(year&&['A','B','A/B'].includes(model),'Modelo o página ilegible: '+line);
    const forms=text.split(';').map(x=>x.normalize('NFC').trim());
    assert.equal(forms.length,model==='A/B'?8:4,'Cuestión de morfología incompleta en página '+page);
    assert.ok(forms.every(f=>/^[\p{L}\sæÆ-]+$/u.test(f)),'Forma no normalizada en página '+page);
    const month=page===1||page===3||page===5||page===7||page===9||
      page===11||page===13||page===15||page===17||page===19||
      page===21||page===23||page===25||page===27||page===31||
      page===33||page===35||page===37||page===39||page===42||
      page===51?'junio':
      (page>=15&&page!==29&&page!==30?'julio':
      (page===29?'julio':'septiembre'));
    const reserve=page===42||page===48;
    return {page,year,month,model,forms,reserve,
      extraction:page>=39?'subrayado de texto':
        [9,10].includes(page)?'cotejo visual por extracción fragmentada':'pregunta literal'};
  });
  assert.equal(records.length,78,'Faltan convocatorias o modelos del PDF');
  assert.equal(records.reduce((acc,item)=>acc+item.forms.length,0),352,'Faltan formas de PAU');
  assert.equal(new Set(records.flatMap(item=>item.forms.map(latinFold))).size,301,
    'La lista de formas distintas no coincide con la revisión docente');
  return records;
}
// Enunciado, género único nominal y clase conocidos de los vocabularios
// curriculares; todo el *conjunto de formas* se extrae de UniMorph, no de
// declinaciones producidas por analogía.
const NOUNS={
  civitas:['civitas, civitatis','femenino','3.ª'],
  miles:['miles, militis','masculino','3.ª'],
  eques:['eques, equitis','masculino','3.ª'],
  dies:['dies, diei','masculino','5.ª'],
  verbum:['verbum, verbi','neutro','2.ª'],
  iter:['iter, itineris','neutro','3.ª'],
  osculum:['osculum, osculi','neutro','2.ª'],
  signum:['signum, signi','neutro','2.ª'],
  annus:['annus, anni','masculino','2.ª'],
  custos:['custos, custodis','masculino','3.ª'],
  passus:['passus, passūs','masculino','4.ª'],
  flumen:['flumen, fluminis','neutro','3.ª'],
  portus:['portus, portūs','masculino','4.ª'],
  virtus:['virtus, virtutis','femenino','3.ª'],
  amicus:['amicus, amici','masculino','2.ª'],
  castra:['castra, castrorum','neutro','2.ª', 'plural'],
  homo:['homo, hominis','masculino','3.ª'],
  cornu:['cornu, cornūs','neutro','4.ª'],
  legatus:['legatus, legati','masculino','2.ª'],
  foedus:['foedus, foederis','neutro','3.ª'],
  navis:['navis, navis','femenino','3.ª'],
  pax:['pax, pacis','femenino','3.ª'],
  rex:['rex, regis','masculino','3.ª'],
  clamor:['clamor, clamoris','masculino','3.ª'],
  res:['res, rei','femenino','5.ª'],
  equitatus:['equitatus, equitatūs','masculino','4.ª'],
  opus:['opus, operis','neutro','3.ª'],
  domus:['domus, domūs','femenino','4.ª'],
  dux:['dux, ducis','masculino','3.ª'],
  peditatus:['peditatus, peditatūs','masculino','4.ª'],
  tempus:['tempus, temporis','neutro','3.ª']
};
const ADJECTIVES={
  proximus:['proximus, proxima, proximum','positivo','primera clase'],
  parvulus:['parvulus, parvula, parvulum','positivo','primera clase'],
  facilis:['facilis, facile','positivo','tercera clase, dos terminaciones'],
  secundus:['secundus, secunda, secundum','positivo','primera clase'],
  alter:['alter, altera, alterum','positivo','pronominal'],
  formosus:['formosus, formosa, formosum','positivo','primera clase'],
  militaris:['militaris, militare','positivo','tercera clase, dos terminaciones'],
  nullus:['nullus, nulla, nullum','positivo','pronominal'],
  tutus:['tutus, tuta, tutum','positivo','primera clase'],
  omnis:['omnis, omne','positivo','tercera clase, dos terminaciones'],
  magnus:['magnus, magna, magnum','positivo','primera clase'],
  summus:['summus, summa, summum','superlativo','primera clase'],
  optimus:['optimus, optima, optimum','superlativo','primera clase'],
  dexter:['dexter, dextra, dextrum','positivo','primera clase'],
  propinquus:['propinquus, propinqua, propinquum','positivo','primera clase'],
  paucus:['paucus, pauca, paucum','positivo','primera clase'],
  liber:['liber, libera, liberum','positivo','primera clase'],
  ingens:['ingens, ingentis','positivo','tercera clase, una terminación'],
  immensus:['immensus, immensa, immensum','positivo','primera clase'],
  maximus:['maximus, maxima, maximum','superlativo','primera clase']
};
const CASES={NOM:'nominativo',VOC:'vocativo',ACC:'acusativo',GEN:'genitivo',
  DAT:'dativo',ABL:'ablativo'};
const GENDERS={MASC:'masculino',FEM:'femenino',NEUT:'neutro'};
const NUMBERS={SG:'singular',PL:'plural'};
function combinations(tags,nominalKind){
  const values=tags.split(';').map(v=>v.split('+'));
  const keys=values.flat();
  const cases=keys.filter(x=>Object.hasOwn(CASES,x));
  const numbers=keys.filter(x=>Object.hasOwn(NUMBERS,x));
  const genders=keys.filter(x=>Object.hasOwn(GENDERS,x));
  if(!cases.length||numbers.length!==1||nominalKind==='adjetivo'&&!genders.length)return [];
  return cases.flatMap(cas=>(nominalKind==='adjetivo'?genders:[null]).map(gender=>({
    case:CASES[cas],number:NUMBERS[numbers[0]],...(gender?{gender:GENDERS[gender]}:{})
  })));
}
const FORMS_CASES=Object.values(CASES);
function complete(forms,kind,oneNumber){
  if(kind==='sustantivo')return (oneNumber?['plural']:Object.values(NUMBERS))
    .every(num=>FORMS_CASES.every(cas=>forms.some(f=>f.case===cas&&f.number===num)));
  return Object.values(NUMBERS).every(num=>FORMS_CASES.every(cas=>
    Object.values(GENDERS).every(gender=>forms.some(f=>f.case===cas&&f.number===num&&f.gender===gender))));
}
export function compilePauNominalParadigms({
  baseRecords,unimorphParts,sourceRevision,examQuestions
}){
  assert.ok(Array.isArray(baseRecords)&&Array.isArray(unimorphParts)&&unimorphParts.length===32);
  assert.match(sourceRevision,/^[a-f0-9]{40}$/);
  const targets=new Set(examQuestions.flatMap(q=>q.forms.map(latinFold)));
  const rows=unimorphParts.flat();
  const results=[],skipped=[];
  const basicIds=new Set(baseRecords.filter(x=>x.language==='latin2')
    .map(x=>x.kind+':'+latinFold(x.headword?.split(',')[0]||'')));
  for(const [pos,meta,kind] of [['N',NOUNS,'sustantivo'],['ADJ',ADJECTIVES,'adjetivo']]){
    for(const [lemma,definition] of Object.entries(meta)){
      const [headword,genderOrDegree,declOrType,onlyNumber]=definition;
      if(basicIds.has(kind+':'+lemma))continue;
      const entries=rows.filter(row=>latinFold(row[0])===lemma&&row[2].split(';')[0]===pos);
      const matches=entries.some(row=>targets.has(latinFold(row[1])));
      // También se completan paradigmas comunes de las mismas tablas, si el
      // programa los reconoce como necesarios: sin inflar el banco con lemas
      // ajenos a estos exámenes.
      if(!matches)continue;
      const forms=[];
      for(const [sourceLemma,sourceForm,tags] of entries){
        const form=latinFold(sourceForm);
        if(!form||form.includes(' '))continue;
        for(const traits of combinations(tags,kind)){
          const analysis=kind==='sustantivo'?
            'sustantivo · '+headword+' · '+traits.case+' · '+genderOrDegree+
              ' · '+traits.number+' · '+declOrType+' declinación':
            'adjetivo · grado '+genderOrDegree+' · '+headword+' · '+traits.case+
              ' · '+traits.gender+' · '+traits.number+' · tipo '+declOrType;
          forms.push({form,...traits,analysis,...(kind==='sustantivo'?{gender:genderOrDegree}:{})});
        }
      }
      // UniMorph no es una licencia para inventar las casillas que faltan.
      // Un paradigma incompleto se conserva en la auditoría, no en el sorteo.
      if(!complete(forms,kind,onlyNumber)){
        skipped.push({lemma,kind,reason:'paradigma fuente incompleto',available:forms.length});
        continue;
      }
      const unique=[...new Map(forms.map(f=>[f.form+'|'+f.analysis,f])).values()];
      results.push({id:'latin2-pau-unimorph-'+kind+'-'+lemma,language:'latin2',unit:0,
        kind,headword,paradigm:headword,
        ...(kind==='sustantivo'?{gender:genderOrDegree}:{}),
        forms:unique,evidence:{
          source:'UniMorph Latin (Wiktionary), corpus restringido de Vocabula',
          file:'data/unimorph-syllabus/lat/part-*.json',sourceRevision,
          license:'CC BY-SA 3.0',status:'paradigma-documentado',
          verification:'corpus publicado; no equivale a comprobación filológica individual',
          topic:'Latín II PAU, paradigma flexivo completo en la fuente',
          notes:'Todas las casillas proceden de las filas de fuente; sin nuevas formas inferidas.'
        }});
    }
  }
  return {records:results,skipped};
}
