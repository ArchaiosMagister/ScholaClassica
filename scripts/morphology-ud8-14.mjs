// Extensión UD8–UD10 de Latín I y UD8–UD14 de Griego I.
// SOLO celdas explícitas del Appendix inmovilizado por SHA; se omiten
// tablas de reglas y listados que no constituyen paradigmas completos.
// Excepciones tipográficas griegas identificadas y contrastadas más abajo.
import assert from 'node:assert/strict';

const LAT_CASES=['nominativo','vocativo','acusativo','genitivo','dativo','ablativo'];
const GR_CASES=['nominativo','vocativo','acusativo','genitivo','dativo'];
const PR_CASES=['nominativo','acusativo','genitivo','dativo'];
const GENDERS=['masculino','femenino','neutro'];
const PERSONS=['1.ª singular','2.ª singular','3.ª singular','1.ª plural','2.ª plural','3.ª plural'];
const clean=value=>String(value||'').replace(/<[^>]*>/g,'')
  .replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<')
  .replace(/&gt;/g,'>').replace(/&aelig;/g,'æ').replace(/&AElig;/g,'Æ')
  .replace(/\s+/g,' ').trim().normalize('NFC');
function table(curriculum,language,unit,topicName,caption){
  const lesson=curriculum[language]?.units.find(u=>u.number===unit);
  const topic=lesson?.topics.find(t=>t.title===topicName);
  assert.ok(topic,language+' UD'+unit+': falta tema '+topicName);
  const matching=[...topic.html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/g)]
    .filter(match=>clean(match[1].match(/<caption[^>]*>([\s\S]*?)<\/caption>/)?.[1])===caption);
  assert.equal(matching.length,1,'La tabla cambió o es ambigua: '+caption);
  const tbody=matching[0][1].match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/)?.[1];
  assert.ok(tbody,'Sin cuerpo de tabla: '+caption);
  const rows=[...tbody.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].map(row=>
    [...row[1].matchAll(/<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/g)]
      .map(cell=>clean(cell[1])));
  assert.ok(rows.length>=3,'Tabla vacía: '+caption);
  return rows;
}
function evidence(unit,topic,caption,notes,correction=null){
  return {source:'Appendix grammaticae',file:'assets/curriculum.json',
    unit,topic,caption,status:'paradigma-documentado',notes,
    ...(correction?{correction}:{})};
}
function record(id,language,unit,kind,paradigm,forms,topic,caption,notes,more={}){
  assert.ok(forms.length>=6&&forms.every(f=>f.form&&f.analysis),
    'Fichas incompletas: '+id);
  return {id,language,unit,kind,paradigm,forms,
    evidence:evidence(unit,topic,caption,notes,more.correction||null),
    ...(more.gender?{gender:more.gender}:{})};
}
function normalizedForm(text){
  return clean(text).replace(/\u00b5/g,'μ').replace(/[\u2010-\u2015]/g,'').normalize('NFC');
}
function greekCell(raw,{ending=false}={}){
  let value=clean(raw);
  // El texto entre corchetes tras un espacio explica la evolución histórica;
  // [ν] pegado a la forma es una variante fonética realmente indicada.
  value=value.replace(/\s+\[(?!ν\])[^\]]+\]/g,'');
  // Paréntesis de explicación fonética, no formas admitidas de respuesta.
  const alt=value.match(/^(.+?)\s+\(\s*(ἄττα)\s*\)$/u);
  if(alt)return [alt[1],alt[2]].map(normalizedForm);
  value=value.replace(/\s+\([^)]*\)/g,'');
  if(value.includes('[')){
    assert.ok(value.includes('[ν]')&&!value.replaceAll('[ν]','').includes('['),
      'Variante no acreditada: '+raw);
    const without=normalizedForm(value.replaceAll('[ν]',''));
    const withNu=normalizedForm(value.replaceAll('[ν]','ν'));
    return [...new Set([without,withNu])];
  }
  if(ending){
    assert.match(value,/^[–-]/,'Se esperaba una desinencia de participio');
    return [clean(value).normalize('NFC')];
  }
  assert.ok(!value.includes('<')&&!value.includes('>'),'Celda con explicación no aislada');
  return [normalizedForm(value)];
}
function nounFormsFromBlock(block,caption){
  assert.equal(block.length,8,'La tabla nominal cambió: '+caption);
  const columns=block[2];
  const models=(columns.length-1)/2;
  assert.ok([1,2].includes(models)&&block[1].length===models+1,'Cabeceras nominales inválidas');
  assert.equal(columns.length,1+models*2);
  const output=[];
  for(let model=0;model<models;model++){
    const lemma=block[1][model+1].split(' (')[0].trim().normalize('NFC');
    assert.ok(lemma&&!lemma.includes('—'),'Sin enunciado del sustantivo');
    const forms=[];
    block.slice(3).forEach((row,i)=>{
      assert.equal(row.length,1+models*2,'Celdas nominales incompletas');
      assert.equal(row[0],['Nominativo','Vocativo','Acusativo','Genitivo','Dativo'][i]);
      for(let n=0;n<2;n++){
        const number=n?'plural':'singular',cas=GR_CASES[i];
        for(const form of greekCell(row[model*2+n+1])){
          forms.push({form,case:cas,number,analysis:cas+' '+number});
        }
      }
    });
    output.push({lemma,forms});
  }
  return output;
}
function latinPronoun(curriculum,caption,id,paradigm){
  const topic='Identidad y énfasis',unit=8;
  const data=table(curriculum,'latin',unit,topic,caption);
  assert.equal(data.length,5);
  const forms=[];
  data.forEach((row,i)=>{
    assert.equal(row.length,7);
    assert.equal(row[0],['Nom.','Ac.','Gen.','Dat.','Abl.'][i]);
    for(let col=1;col<=6;col++){
      const cas=PR_CASES[i],gender=GENDERS[(col-1)%3],number=col<=3?'singular':'plural';
      assert.ok(row[col]&&!row[col].includes('/'));
      forms.push({form:row[col],case:cas,gender,number,analysis:cas+' '+gender+' '+number});
    }
  });
  return record(id,'latin',unit,'pronombre',paradigm,forms,topic,caption,
    'Pronombre de identidad o énfasis: cinco casos, sin vocativo.');
}
function latinInfinitives(curriculum){
  const topic='Infinitivos y oración de infinitivo',caption='Infinitivos · formación',unit=8;
  const data=table(curriculum,'latin',unit,topic,caption);
  assert.equal(data.length,3);
  assert.deepEqual(data.map(row=>row[0]),['Presente','Perfecto','Futuro']);
  const conjugations=['1.ª','2.ª','3.ª','4.ª','mixta'];
  const forms=[];
  for(const [voice,col] of [['activo',1],['pasivo',2]]){
    const entries=data[0][col].split(/\s+\/\s+/);
    assert.equal(entries.length,5);
    entries.forEach((form,i)=>forms.push({form,analysis:'infinitivo de presente '+voice+
      ' · conjugación '+conjugations[i],tense:'infinitivo presente '+voice}));
  }
  const full=[
    ['amavisse','perfecto activo',1],['amatum esse','perfecto pasivo',2],
    ['amaturum esse','futuro activo',1],['amatum iri','futuro pasivo',2]
  ];
  for(const [expected,tense,col] of full){
    const row=tense.startsWith('perfecto')?1:2;
    assert.ok(data[row][col].endsWith(': '+expected),
      'No se documenta el infinitivo compuesto: '+expected);
    forms.push({form:expected,analysis:'infinitivo de '+tense+' · amo',
      tense:'infinitivo '+tense});
  }
  return record('latin-ud8-infinitivos','latin',unit,'verbo',
    'Infinitivos de las conjugaciones y de amo, amavi, amatum',forms,topic,caption,
    'Solo infinitivos íntegros mostrados como ejemplos, no formas completadas por analogía.');
}
function latinComparative(curriculum,unit,caption,paradigm,id){
  const topic=unit===9?'Comparativos y superlativos':'Participios concertados y ablativo absoluto';
  const data=table(curriculum,'latin',unit,topic,caption);
  assert.equal(data.length,6);
  const forms=[];
  data.forEach((row,i)=>{
    assert.equal(row.length,5);
    assert.equal(row[0].toLowerCase(),LAT_CASES[i]);
    for(const [n,col] of [['singular',1],['plural',3]]){
      for(const [g,offset] of [['masculino',0],['femenino',0],['neutro',1]]){
        const form=row[col+offset],cas=LAT_CASES[i];
        forms.push({form,case:cas,number:n,gender:g,
          analysis:cas+' '+g+' '+n});
      }
    }
  });
  return record(id,'latin',unit,'adjetivo',paradigm,forms,topic,caption,
    'Adjetivo o participio con flexión masculina/femenina común y neutra documentadas.');
}
function latinPassive(curriculum){
  const unit=9,topic='Participio de perfecto y tiempos compuestos pasivos';
  const caption='Perfecto y pluscuamperfecto pasivos';
  const data=table(curriculum,'latin',unit,topic,caption);
  assert.equal(data.length,4);
  const expected=['Masculino singular','Femenino singular','Masculino plural','Femenino plural'];
  const forms=[];
  data.forEach((row,i)=>{
    assert.equal(row.length,4);assert.equal(row[0],expected[i]);
    const number=i<2?'singular':'plural',person=i<2?'1.ª singular':'1.ª plural';
    const gender=i%2?'femenino':'masculino';
    for(let col=1;col<=2;col++){
      const tense=col===1?'perfecto pasivo':'pluscuamperfecto pasivo',form=row[col];
      assert.ok(/^(?:amat|amatæ)/.test(form),'Compuesto pasivo no reconocido');
      forms.push({form,person,tense,analysis:person+' · '+tense+' · '+gender});
    }
  });
  return record('latin-ud9-compuestos-pasivos','latin',unit,'verbo',
    'amo, amavi, amatum · ejemplos de perfecto y pluscuamperfecto pasivos',
    forms,topic,caption,'Solo las primeras personas explícitas en la tabla, sin inferir las demás.');
}
function latinPerfectParticiple(curriculum){
  const unit=10,topic='Participios concertados y ablativo absoluto';
  const caption='Participio de perfecto · amatus, -a, -um',data=table(curriculum,'latin',unit,topic,caption);
  assert.equal(data.length,6);
  const forms=[];
  data.forEach((row,i)=>{
    assert.equal(row.length,4);assert.equal(row[0].toLowerCase(),LAT_CASES[i]);
    GENDERS.forEach((gender,j)=>forms.push({
      form:row[j+1],case:LAT_CASES[i],number:'singular',gender,
      analysis:LAT_CASES[i]+' '+gender+' singular'
    }));
  });
  return record('latin-ud10-participio-perfecto','latin',unit,'adjetivo',
    'amatus, -a, -um · participio de perfecto, formas del singular',
    forms,topic,caption,'La fuente solo documenta singular: no se añade plural por analogía.');
}
function greekPronoun(curriculum,unit,topic,caption,id,paradigm,{mfShared=false}={}){
  const data=table(curriculum,'griego',unit,topic,caption);
  assert.equal(data.length,6);
  assert.deepEqual(data[0],['—','Singular','Plural']);
  assert.deepEqual(data[1],mfShared?['—','M/F','N','M/F','N']:['—','M','F','N','M','F','N']);
  const genders=mfShared?['masculino','femenino','neutro']:GENDERS;
  const forms=[];
  for(let i=2;i<6;i++){
    const row=data[i],cas=PR_CASES[i-2];
    assert.equal(row[0],['Nom.','Ac.','Gen.','Dat.'][i-2]);
    assert.equal(row.length,mfShared?5:7);
    for(let numberIndex=0;numberIndex<2;numberIndex++){
      for(const gender of genders){
        const col=mfShared?1+numberIndex*2+(gender==='neutro'?1:0):
          1+numberIndex*3+GENDERS.indexOf(gender);
        for(const form of greekCell(row[col])){
          forms.push({form,case:cas,gender,number:numberIndex?'plural':'singular',
            analysis:cas+' '+gender+' '+(numberIndex?'plural':'singular')});
        }
      }
    }
  }
  return record(id,'griego',unit,'pronombre',paradigm,forms,topic,caption,
    'Cuatro casos, sin vocativo. Se admiten solo las variantes de la tabla.');
}
function greekThirdNouns(curriculum){
  const topic='Tercera declinación: consonantes',unit=8;
  const names=[
    ['Temas en oclusiva · tabla 111','labiales'],
    ['Temas en oclusiva · tabla 112','guturales'],
    ['Temas en oclusiva · tabla 113','dentales'],
    ['Temas en oclusiva · tabla 114','neutros dentales'],
    ['Temas en nasal (ν) · tabla 115','nasales'],
    ['Temas en nasal (ν) · tabla 116','nasales en ιν'],
    ['Temas en ντ · tabla 117','temas en ντ'],
    ['Temas en ντ · tabla 118','temas en ντ'],
    ['Temas en líquida (ρ, λ) · tabla 119','líquidas']
  ];
  const out=[];
  for(const [caption,type] of names){
    const data=table(curriculum,'griego',unit,topic,caption);
    assert.ok(data.length===8||caption.endsWith('119')&&data.length===16);
    const blocks=data.length===16?[data.slice(0,8),data.slice(8)]:[data];
    for(let group=0;group<blocks.length;group++){
      const models=nounFormsFromBlock(blocks[group],caption);
      for(let index=0;index<models.length;index++){
        const spec=models[index];
        out.push(record('griego-ud8-noun-'+caption.match(/tabla (\d+)/)[1]+'-'+group+'-'+index,
          'griego',unit,'sustantivo',spec.lemma+' · tercera declinación ('+type+')',
          spec.forms,topic,caption,'Formas nominales completas, sin reconstruir el tema ni asignar género ambiguo.',
          {gender:/tabla 114/.test(caption)?'neutro':null}));
      }
    }
  }
  assert.equal(out.length,16,'La tercera declinación cambió de modelos');
  return out;
}
function greekParticiple(curriculum,caption,id,paradigm,ending){
  const unit=10,topic='Participios de presente activo y medio';
  const data=table(curriculum,'griego',unit,topic,caption);
  assert.equal(data.length,6);
  assert.deepEqual(data[0],['—','Singular','Plural']);
  assert.deepEqual(data[1],['—','M','F','N','M','F','N']);
  const forms=[];
  data.slice(2).forEach((row,i)=>{
    assert.equal(row.length,7);assert.equal(row[0],['Nom.','Ac.','Gen.','Dat.'][i]);
    for(let col=1;col<=6;col++){
      const cas=PR_CASES[i],gender=GENDERS[(col-1)%3],number=col<=3?'singular':'plural';
      for(const form of greekCell(row[col],{ending}))
        forms.push({form,case:cas,gender,number,
          analysis:cas+' '+gender+' '+number});
    }
  });
  return record(id,'griego',unit,ending?'desinencia':'adjetivo',paradigm,
    forms,topic,caption,'Declinación de participio: únicamente los cuatro casos de la tabla.');
}
function greekSimpleVerb(curriculum,unit,topic,caption,id,paradigm,tense){
  const data=table(curriculum,'griego',unit,topic,caption);
  assert.equal(data.length,6);
  const forms=[];
  data.forEach((row,i)=>{
    assert.equal(row.length,2);assert.equal(row[0],PERSONS[i]);
    for(const form of greekCell(row[1])){
      forms.push({form,person:PERSONS[i],tense,analysis:PERSONS[i]+' · '+tense});
    }
  });
  return record(id,'griego',unit,'verbo',paradigm,forms,topic,caption,
    'Paradigma personal completo de la tabla. Se retiran separadores morfémicos, no se inventan formas.');
}
function greekAorists(curriculum){
  const unit=12,topic='Aoristo sigmático y temático',specs=[
    ['Aoristo sigmático · activa y media · tabla 123','λύω','sigmático'],
    ['Griego I · tabla 124','λαμβάνω','temático']
  ];
  const out=[];
  for(const [caption,verb,type] of specs){
    const data=table(curriculum,'griego',unit,topic,caption);
    assert.equal(data.length,8);assert.equal(data[0].length,1);
    assert.deepEqual(data[1],['Voz activa','Voz media']);
    for(let voice=0;voice<2;voice++){
      const forms=[];
      data.slice(2).forEach((row,i)=>{
        assert.equal(row.length,2);
        for(const form of greekCell(row[voice])){
          forms.push({form,person:PERSONS[i],tense:'aoristo '+(voice?'medio':'activo'),
            analysis:PERSONS[i]+' · aoristo '+(voice?'medio':'activo')});
        }
      });
      out.push(record('griego-ud12-'+(type==='sigmático'?'sigmatico':'tematico')+
        '-'+(voice?'medio':'activo'),'griego',unit,'verbo',
        verb+' · aoristo '+type+' '+(voice?'medio':'activo'),
        forms,topic,caption,'Solo formas personales expresas; ninguna derivación de aoristos léxicos aislados.'));
    }
  }
  return out;
}
const CONTRACT_FIXES={
  // Correcciones cotejadas con una segunda tabla de conjugación:
  // https://www.azimonti.com/philology/ancient-greek/morphology/verbs/contract-verbs/
  '128|2|4':'ἐποιεῖτε',
  '129|1|3':'ἐτιμῶ'
};
function greekContracts(curriculum){
  const unit=14,topic='Verbos contractos',out=[];
  const verbs=['τιμάω','ποιέω','δηλόω'];
  const periods=[['126','presente activo'],['127','presente medio'],
    ['128','imperfecto activo'],['129','imperfecto medio']];
  for(const [number,tense] of periods){
    const caption='Griego I · tabla '+number,data=table(curriculum,'griego',unit,topic,caption);
    assert.equal(data.length,8);assert.equal(data[0].length,1);
    assert.equal(data[1].length,3);
    for(let v=0;v<3;v++){
      assert.equal(data[1][v],verbs[v],'Cambió el orden de los verbos contractos');
      const forms=[],corrections=[];
      data.slice(2).forEach((row,i)=>{
        assert.equal(row.length,3);
        let raw=row[v].split(' < ')[0].split(' &lt; ')[0].trim();
        // En la tabla, "lt;" es solo una nota de contracción; jamás una grafía.
        const fix=CONTRACT_FIXES[number+'|'+v+'|'+i];
        if(fix){
          assert.ok(raw&&raw!==fix,'La errata ya está corregida en la fuente');
          corrections.push({source:raw,verified:fix,person:PERSONS[i]});
          raw=fix;
        }
        for(const form of greekCell(raw)){
          forms.push({form,person:PERSONS[i],tense,analysis:PERSONS[i]+' · '+tense});
        }
      });
      const more=corrections.length?{correction:{
        notes:'Errata contrastada con la conjugación de contractos en Azimonti (tabla imperfecto).',
        url:'https://www.azimonti.com/philology/ancient-greek/morphology/verbs/contract-verbs/',
        entries:corrections
      }}:{};
      out.push(record('griego-ud14-contract-'+number+'-'+v,'griego',unit,'verbo',
        verbs[v]+' · '+tense,forms,topic,caption,
        'Formas contractas, sin la explicación gráfica situada tras el signo de comparación.',more));
    }
  }
  return out;
}
function greekSibilants(curriculum){
  const unit=14,topic='Temas en silbante',out=[];
  for(const number of ['131','132','133']){
    const caption='Temas en silbante (σ) · tabla '+number;
    const data=table(curriculum,'griego',unit,topic,caption);
    const models=nounFormsFromBlock(data,caption);
    assert.equal(models.length,1);
    const {lemma,forms}=models[0];
    out.push(record('griego-ud14-sibilant-'+number,'griego',unit,'sustantivo',
      lemma+' · tema en silbante',forms,topic,caption,
      'Se excluyen las reconstrucciones históricas entre corchetes; no son variantes aceptadas.',
      {gender:number==='132'?null:'neutro'}));
  }
  return out;
}
export function compileMorphologyUd8to14(curriculum){
  const result=[
    latinInfinitives(curriculum),
    latinPronoun(curriculum,'Identificativo · idem, eadem, idem',
      'latin-ud8-idem','idem, eadem, idem · identificativo'),
    latinPronoun(curriculum,'ipse, ipsa, ipsum',
      'latin-ud8-ipse','ipse, ipsa, ipsum · enfático'),
    latinComparative(curriculum,9,'Comparativo · altior, altius',
      'altior, altius · comparativo','latin-ud9-comparativo'),
    latinPassive(curriculum),
    latinComparative(curriculum,10,'Participio de presente · amans, amantis',
      'amans, amantis · participio de presente','latin-ud10-participio-presente'),
    latinPerfectParticiple(curriculum),
    greekPronoun(curriculum,8,'Interrogativos e indefinidos','El indefinido · tabla 107',
      'griego-ud8-tis-indefinido','τις, τι · indefinido',{mfShared:true}),
    greekPronoun(curriculum,8,'Interrogativos e indefinidos','El interrogativo · tabla 108',
      'griego-ud8-tis-interrogativo','τίς, τί · interrogativo',{mfShared:true}),
    ...greekThirdNouns(curriculum),
    greekPronoun(curriculum,9,'Pronombre relativo ὅς, ἥ, ὅ','El relativo simple · tabla 120',
      'griego-ud9-relativo','ὅς, ἥ, ὅ · relativo'),
    greekParticiple(curriculum,'Participio de presente · tabla 121',
      'griego-ud10-on','ὤν, οὔσα, ὄν · participio presente de εἰμί',false),
    greekParticiple(curriculum,'Participio de presente · tabla 122',
      'griego-ud10-menos','Participio de presente medio · desinencias -μένος, -μένη, -μενον',true),
    greekSimpleVerb(curriculum,11,'Futuro e imperfecto activos','λύω · futuro activo',
      'griego-ud11-futuro-lyo','λύω · futuro activo','futuro activo'),
    greekSimpleVerb(curriculum,11,'Futuro e imperfecto activos','λύω · imperfecto activo',
      'griego-ud11-imperfecto-lyo','λύω · imperfecto activo','imperfecto activo'),
    ...greekAorists(curriculum),
    greekSimpleVerb(curriculum,13,'Perfecto y pluscuamperfecto activos','λύω · perfecto activo',
      'griego-ud13-perfecto-lyo','λύω · perfecto activo','perfecto activo'),
    greekSimpleVerb(curriculum,13,'Perfecto y pluscuamperfecto activos','λείπω · perfecto activo',
      'griego-ud13-perfecto-leipo','λείπω · perfecto activo','perfecto activo'),
    greekSimpleVerb(curriculum,13,'Perfecto y pluscuamperfecto activos','λύω · pluscuamperfecto activo',
      'griego-ud13-pluscuamperfecto-lyo','λύω · pluscuamperfecto activo','pluscuamperfecto activo'),
    ...greekContracts(curriculum),
    ...greekSibilants(curriculum)
  ];
  assert.equal(result.length,52,'Cambió el número de paradigmas curriculares de UD8–UD14');
  assert.equal(new Set(result.map(x=>x.id)).size,result.length,'IDs repetidos');
  assert.deepEqual([...new Set(result.filter(x=>x.language==='latin').map(x=>x.unit))],[8,9,10]);
  assert.deepEqual([...new Set(result.filter(x=>x.language==='griego').map(x=>x.unit))],[8,9,10,11,12,13,14]);
  return result;
}
