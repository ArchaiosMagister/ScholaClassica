// Extensión curricular conservadora: modelos con tabla explícita en Appendix
// y participios griegos contrastados con una tabla independiente.
// Se añade AL FINAL del banco para no renumerar IDs de práctica anteriores.
import assert from 'node:assert/strict';

const latinCases=['nominativo','vocativo','acusativo','genitivo','dativo','ablativo'];
const greekCases=['nominativo','acusativo','genitivo','dativo'];
const genders=['masculino','femenino','neutro'];
const clean=html=>String(html).replace(/<[^>]*>/gu,'').replace(/&nbsp;/gu,' ')
  .replace(/&amp;/gu,'&').replace(/&aelig;/gu,'æ')
  .replace(/\s+/gu,' ').trim().normalize('NFC');
const variants=value=>clean(value).split(/\s+\/\s+/u).map(x=>x.trim());
function lesson(curriculum,language,unit,topic){
  const found=curriculum[language]?.units.find(u=>u.number===unit)
    ?.topics.find(t=>t.title===topic);
  assert.ok(found,'No consta tema curricular '+language+'/'+unit+'/'+topic);
  return found;
}
function table(curriculum,language,unit,topic,caption){
  const section=lesson(curriculum,language,unit,topic);
  const blocks=[...section.html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gu)];
  const block=blocks.map(m=>m[1]).find(body=>{
    const cap=body.match(/<caption[^>]*>([\s\S]*?)<\/caption>/u);
    return clean(cap?.[1]||'').includes(caption);
  });
  assert.ok(block,'No consta la tabla '+language+'/'+unit+'/'+caption);
  const body=block.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/u)?.[1];
  assert.ok(body,'Falta el cuerpo de '+caption);
  return [...body.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gu)].map(m=>
    [...m[1].matchAll(/<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/gu)]
      .map(c=>clean(c[1])));
}
function evidence({language,unit,topic,caption,notes,referenceUrl}){
  return {source:'Appendix grammaticae',file:'assets/curriculum.json',unit,topic,caption,
    status:'paradigma-documentado',notes,
    ...(referenceUrl?{contrast:{source:'Schola Graeca',url:referenceUrl}}:{})};
}
function record({id,language,unit,kind,paradigm,forms,topic,caption,notes,referenceUrl}){
  assert.ok(forms.length>=4&&forms.every(f=>f.form&&f.analysis),id);
  return {id,language,unit,kind,paradigm,forms,
    evidence:evidence({language,unit,topic,caption,notes,referenceUrl})};
}
function latinPuerAger(curriculum){
  const unit=1,topic='Primera y segunda declinación',caption='Segunda declinación · puer y ager';
  const rows=table(curriculum,'latin',unit,topic,caption);
  assert.equal(rows.length,6);
  return [['puer','puer, pueri · 2.ª declinación, masculino',1],
    ['ager','ager, agri · 2.ª declinación, masculino',3]].map(([lemma,paradigm,col])=>{
    const forms=[];
    rows.forEach((row,i)=>{
      assert.equal(row.length,5);
      assert.equal(row[0].toLowerCase(),latinCases[i]);
      for(let n=0;n<2;n++){
        const number=n?'plural':'singular';
        forms.push({form:row[col+n],analysis:latinCases[i]+' '+number,
          case:latinCases[i],number,gender:'masculino'});
      }
    });
    assert.equal(forms.length,12);
    assert.equal(forms[0].form,lemma);
    return record({id:'latin-ud1-sustantivo-'+lemma,language:'latin',unit,
      kind:'sustantivo',paradigm,forms,topic,caption,
      notes:'Modelo de tema en -er tomado literalmente de la tabla; sin derivar formas por analogía.'});
  });
}
function latinBonus(curriculum){
  const unit=2,topic='Adjetivos de la primera clase';
  const caption='Adjetivos de la primera clase · bonus';
  const rows=table(curriculum,'latin',unit,topic,caption);
  assert.equal(rows.length,6);
  const forms=[];
  rows.forEach((row,i)=>{
    assert.equal(row.length,7);
    assert.equal(row[0].toLowerCase(),latinCases[i]);
    for(let col=1;col<=6;col++){
      const gender=genders[(col-1)%3],number=col<=3?'singular':'plural';
      forms.push({form:row[col],analysis:latinCases[i]+' '+gender+' '+number,
        case:latinCases[i],gender,number});
    }
  });
  assert.equal(forms.length,36);
  assert.equal(forms.find(f=>f.case==='vocativo'&&f.gender==='masculino'&&
    f.number==='singular')?.form,'bone');
  return record({id:'latin-ud2-adjetivo-bonus',language:'latin',unit,kind:'adjetivo',
    paradigm:'bonus, bona, bonum · primera clase',forms,topic,caption,
    notes:'Modelo escolar 2-1-2 de 36 casillas; todas las coincidencias conservan sus lecturas.'});
}
function latinPersonals(curriculum){
  const unit=3,topic='Pronombres personales',caption='Pronombres personales';
  const rows=table(curriculum,'latin',unit,topic,caption);
  const cases=['nominativo','acusativo','genitivo','dativo','ablativo'];
  const headings=['Nom.','Ac.','Gen.','Dat.','Abl.'];
  const persons=[['1.ª','singular'],['2.ª','singular'],
    ['1.ª','plural'],['2.ª','plural']];
  assert.equal(rows.length,5);
  const forms=[];
  rows.forEach((row,i)=>{
    assert.equal(row.length,5);
    assert.equal(row[0],headings[i]);
    for(let j=0;j<4;j++){
      const [person,number]=persons[j];
      for(const form of variants(row[j+1])){
        forms.push({form,analysis:cases[i]+' · '+person+' persona · '+number,
          case:cases[i],person:person+' '+number,number});
      }
    }
  });
  assert.equal(forms.length,22);
  assert.deepEqual(forms.filter(f=>f.analysis==='genitivo · 1.ª persona · plural')
    .map(f=>f.form),['nostri','nostrum']);
  return record({id:'latin-ud3-pronombres-personales',language:'latin',unit,
    kind:'pronombre',paradigm:'ego, tu, nos, vos · pronombres personales',forms,
    topic,caption,notes:'Sin vocativo ni género; genitivos plurales alternativos expresos.'});
}
function latinImperatives(curriculum){
  const unit=3,topic='Imperativo de presente',caption='Imperativo activo';
  const rows=table(curriculum,'latin',unit,topic,caption);
  const stems=['amo','habeo','duco','audio','capio'];
  const conjugations=['1.ª','2.ª','3.ª','4.ª','mixta'];
  assert.equal(rows.length,2);
  const forms=[];
  rows.forEach((row,i)=>{
    assert.equal(row.length,6);
    assert.equal(row[0],i===0?'2.ª sg.':'2.ª pl.');
    for(let j=0;j<5;j++){
      const number=i===0?'singular':'plural';
      forms.push({form:row[j+1],
        analysis:'2.ª '+number+' · imperativo de presente activo · '+
          stems[j]+' ('+conjugations[j]+')',
        person:'2.ª '+number,number,tense:'presente',mood:'imperativo',
        voice:'activa'});
    }
  });
  assert.equal(forms.length,10);
  assert.equal(forms.find(f=>f.analysis.includes('duco')&&f.number==='singular')?.form,'duc');
  return record({id:'latin-ud3-imperativos',language:'latin',unit,kind:'verbo',
    paradigm:'Imperativo presente activo · amo, habeo, duco, audio, capio',
    forms,topic,caption,
    notes:'Las cinco conjugaciones están agrupadas porque la tabla ofrece dos formas por verbo.'});
}
function latinIs(curriculum){
  const unit=5,topic='Pronombre reflexivo y pronombre fórico',caption='Fórico · is';
  const rows=table(curriculum,'latin',unit,topic,caption);
  const abbr=['Nom.','Ac.','Gen.','Dat.','Abl.'];
  const cases=['nominativo','acusativo','genitivo','dativo','ablativo'];
  assert.equal(rows.length,5);
  const forms=[];
  rows.forEach((row,i)=>{
    assert.equal(row.length,7);assert.equal(row[0],abbr[i]);
    for(let j=1;j<=6;j++){
      const gender=genders[(j-1)%3],number=j<=3?'singular':'plural';
      for(const form of variants(row[j]))
        forms.push({form,analysis:cases[i]+' '+gender+' '+number,
          case:cases[i],gender,number});
    }
  });
  assert.ok(forms.length>30);
  assert.deepEqual(forms.filter(f=>f.case==='nominativo'&&f.gender==='masculino'&&
    f.number==='plural').map(f=>f.form),['ei','ii']);
  return record({id:'latin-ud5-forico-is',language:'latin',unit,kind:'pronombre',
    paradigm:'is, ea, id · fórico',forms,topic,caption,
    notes:'Sin vocativo; variantes ei/ii y eis/iis expresamente documentadas.'});
}
function greekInfinitives(curriculum){
  const unit=6,topic='Infinitivos de presente activo y medio';
  const section=lesson(curriculum,'griego',unit,topic);
  // Solo cuatro ejemplos íntegros en el texto escolar: no se generan
  // infinitivos nuevos ni se adelantan otros tiempos verbales.
  const examples=[
    ['λύειν','infinitivo · presente · voz activa · λύω','activa'],
    ['λύεσθαι','infinitivo · presente · voz media/pasiva · λύω','media/pasiva'],
    ['ἐσθίειν','infinitivo · presente · voz activa · ἐσθίω','activa'],
    ['γίγνεσθαι','infinitivo · presente · forma media deponente · γίγνομαι','media']
  ];
  for(const [form] of examples)
    assert.ok(section.html.includes(form),'La fuente perdió el ejemplo '+form);
  const forms=examples.map(([form,analysis,voice])=>({form,analysis,
    tense:'presente',voice}));
  return record({id:'griego-ud6-infinitivos-presentes',language:'griego',unit,
    kind:'infinitivo',paradigm:'Infinitivos de presente · λύω, ἐσθίω y γίγνομαι',
    forms,topic,caption:'Ejemplos de infinitivo en la explicación de UD6',
    notes:'Cuatro ejemplos documentados en texto. La forma medio-pasiva de λύω se trata como sincrética; γίγνομαι es deponente.'});
}
const greekParticiplesSource='https://correll.github.io/greek-classroom-rome/grammar-13-infinitives-participles.html';
const greekRowsActive=[
  ['nominativo','λύων','λύουσα','λῦον','λύοντες','λύουσαι','λύοντα'],
  ['acusativo','λύοντα','λύουσαν','λῦον','λύοντας','λυούσας','λύοντα'],
  ['genitivo','λύοντος','λυούσης','λύοντος','λυόντων','λυουσῶν','λυόντων'],
  ['dativo','λύοντι','λυούσῃ','λύοντι','λύουσι','λυούσαις','λύουσι']
];
const greekRowsMiddle=[
  ['nominativo','λυόμενος','λυομένη','λυόμενον','λυόμενοι','λυόμεναι','λυόμενα'],
  ['acusativo','λυόμενον','λυομένην','λυόμενον','λυομένους','λυομένας','λυόμενα'],
  ['genitivo','λυομένου','λυομένης','λυομένου','λυομένων','λυομένων','λυομένων'],
  ['dativo','λυομένῳ','λυομένῃ','λυομένῳ','λυομένοις','λυομέναις','λυομένοις']
];
function greekParticiples(curriculum){
  const unit=10,topic='Participios de presente activo y medio';
  const section=lesson(curriculum,'griego',unit,topic);
  const sourceText=section.html.normalize('NFC');
  for(const form of ['λύων','λύουσα','λύον','λυόμενος'])
    assert.ok(sourceText.includes(form.normalize('NFC')),
      'El modelo ya no está explicado: '+form);
  const models=[
    ['activo','λύων, λύουσα, λῦον · participio presente activo',greekRowsActive],
    ['medio-pasivo','λυόμενος, λυομένη, λυόμενον · participio presente medio-pasivo',greekRowsMiddle]
  ];
  return models.map(([voice,paradigm,rows])=>{
    const forms=[];
    for(const row of rows){
      assert.equal(row.length,7);
      assert.ok(greekCases.includes(row[0]));
      for(let j=1;j<=6;j++){
        const gender=genders[(j-1)%3],number=j<=3?'singular':'plural';
        // El dativo plural de -ντ admite ν efelcística, no una nueva
        // casilla gramatical ni un género distinto.
        const alternatives=voice==='activo'&&row[0]==='dativo'&&
          (j===4||j===6)?[row[j],row[j]+'ν']:[row[j]];
        for(const form of alternatives)
          forms.push({form,analysis:row[0]+' '+gender+' '+number+
            ' · participio de presente '+voice,
            case:row[0],gender,number,tense:'presente',voice});
      }
    }
    assert.equal(forms.length,voice==='activo'?26:24);
    return record({id:'griego-ud10-lyo-participio-'+voice,language:'griego',
      unit,kind:'participio',paradigm,forms,topic,
      caption:'Participio de presente · tablas 121–122; modelo λύω contrastado',
      referenceUrl:greekParticiplesSource,
      notes:'Modelo completo de λύω contrastado con Schola Graeca; solo cuatro casos del temario y, en el activo, ν móvil en dativo plural.'});
  });
}
export function compileCurricularGapBatch(curriculum){
  const records=[...latinPuerAger(curriculum),latinBonus(curriculum),
    latinPersonals(curriculum),latinImperatives(curriculum),latinIs(curriculum),
    greekInfinitives(curriculum),...greekParticiples(curriculum)];
  assert.equal(records.length,9);
  assert.equal(new Set(records.map(r=>r.id)).size,records.length);
  return records;
}
