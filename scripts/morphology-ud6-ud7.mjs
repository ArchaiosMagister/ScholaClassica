// Extensión cotejada contra los apartados UD6–UD7 del Appendix fijado.
// No genera verbos o sustantivos por analogía: lee celdas explícitas.
import assert from 'node:assert/strict';
const CASES_LAT=['nominativo','vocativo','acusativo','genitivo','dativo','ablativo'];
const CASES_PRON_LAT=['nominativo','acusativo','genitivo','dativo','ablativo'];
const CASES_PRON_GR=['nominativo','acusativo','genitivo','dativo'];
const GENDERS=['masculino','femenino','neutro'];
const PERSONS=['1.ª singular','2.ª singular','3.ª singular','1.ª plural','2.ª plural','3.ª plural'];
const normalize=text=>text.replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ')
  .replace(/&amp;/g,'&').replace(/&aelig;/g,'æ').replace(/&AElig;/g,'Æ')
  .replace(/\s+/g,' ').trim().normalize('NFC');
function topic(curriculum,language,unit,title){
  const t=curriculum[language]?.units.find(x=>x.number===unit)?.topics.find(x=>x.title===title);
  assert.ok(t,language+' UD'+unit+' sin tema '+title);
  return t;
}
function rows(curriculum,language,unit,title,caption){
  const section=topic(curriculum,language,unit,title);
  const table=[...section.html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/g)]
    .find(m=>normalize(m[1].match(/<caption[^>]*>([\s\S]*?)<\/caption>/)?.[1]||'')===caption);
  assert.ok(table,'Falta tabla '+caption+' de '+language+' UD'+unit);
  const body=table[1].match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/)?.[1];
  assert.ok(body,'Tabla sin cuerpo '+caption);
  const data=[...body.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].map(row=>
    [...row[1].matchAll(/<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/g)].map(x=>normalize(x[1])));
  assert.ok(data.length>=4,'Tabla sin datos '+caption);
  return data;
}
function evidence(unit,topicName,caption,notes){
  return {source:'Appendix grammaticae',file:'assets/curriculum.json',unit,
    topic:topicName,caption,status:'paradigma-documentado',notes};
}
function formVariants(text,{stripDashes=false}={}){
  const entries=text.split(/\s+\/\s+/).map(v=>
    (stripDashes?v.replace(/[–—]/g,''):v).trim().normalize('NFC'));
  assert.ok(entries.length>=1&&entries.every(x=>x&&x.length<80),'Variante curricular vacía');
  return entries;
}
function latinPronouns(curriculum){
  const unit=6,heading='Demostrativos y relativo';
  const layouts=[
    {id:'latin-ud6-hic',caption:'Demostrativo de cercanía · hic, hæc, hoc',paradigm:'hic, hæc, hoc · demostrativo'},
    {id:'latin-ud6-iste',caption:'iste, ista, istud',paradigm:'iste, ista, istud · demostrativo'},
    {id:'latin-ud6-ille',caption:'ille, illa, illud',paradigm:'ille, illa, illud · demostrativo'},
    {id:'latin-ud6-relativo',caption:'Relativo · qui, quæ, quod',paradigm:'qui, quæ, quod · relativo'}
  ];
  return layouts.map(spec=>{
    const data=rows(curriculum,'latin',unit,heading,spec.caption);
    assert.equal(data.length,5,'Pronombres latinos: cinco casos (sin vocativo)');
    const forms=[];
    data.forEach((row,i)=>{
      assert.equal(row.length,7);
      assert.equal(row[0],['Nom.','Ac.','Gen.','Dat.','Abl.'][i]);
      for(let col=1;col<=6;col++){
        const gender=GENDERS[(col-1)%3],number=col<=3?'singular':'plural';
        for(const form of formVariants(row[col]))
          forms.push({form,case:CASES_PRON_LAT[i],gender,number,
            analysis:CASES_PRON_LAT[i]+' '+gender+' '+number});
      }
    });
    assert.equal(forms.length,30);
    return {id:spec.id,language:'latin',unit,kind:'pronombre',
      paradigm:spec.paradigm,forms,evidence:evidence(unit,heading,spec.caption,
        'Tabla completa de casos del pronombre; no se crea vocativo.')};
  });
}
function latinNouns(curriculum){
  const unit=7,heading='Cuarta y quinta declinación';
  const data=rows(curriculum,'latin',unit,heading,'Cuarta declinación · exercitus / cornu');
  assert.equal(data.length,6);
  const specs=[
    {id:'latin-ud7-exercitus',paradigm:'exercitus, exercitūs · 4.ª declinación (m.)',
      columns:[1,2],gender:'masculino'},
    {id:'latin-ud7-cornu',paradigm:'cornū, cornūs · 4.ª declinación (n.)',
      columns:[3,4],gender:'neutro'}
  ];
  const results=specs.map(spec=>{
    const forms=[];
    data.forEach((row,i)=>{
      assert.equal(row.length,5);
      assert.equal(row[0].toLocaleLowerCase('es'),CASES_LAT[i]);
      ['singular','plural'].forEach((number,k)=>{
        const form=row[spec.columns[k]];
        assert.ok(form&&!form.includes('/'));
        forms.push({form,case:CASES_LAT[i],number,
          analysis:CASES_LAT[i]+' '+number});
      });
    });
    return {id:spec.id,language:'latin',unit,kind:'sustantivo',gender:spec.gender,
      paradigm:spec.paradigm,forms,evidence:evidence(unit,heading,
        'Cuarta declinación · exercitus / cornu','Género acreditado por encabezados masculino y neutro.')};
  });
  const fifth=rows(curriculum,'latin',unit,heading,'Quinta declinación · res, rei');
  assert.equal(fifth.length,6);
  const forms=[];
  fifth.forEach((row,i)=>{
    assert.equal(row.length,3);
    assert.equal(row[0].toLowerCase(),CASES_LAT[i]);
    ['singular','plural'].forEach((number,k)=>{
      forms.push({form:row[k+1],case:CASES_LAT[i],number,
        analysis:CASES_LAT[i]+' '+number});
    });
  });
  results.push({id:'latin-ud7-res',language:'latin',unit,kind:'sustantivo',
    gender:'femenino',paradigm:'res, rei · 5.ª declinación (f.)',forms,
    evidence:evidence(unit,heading,'Quinta declinación · res, rei',
      'El sustantivo res se declina como femenino; tabla nominal completa.')});
  assert.equal(results[0].forms.find(x=>x.case==='genitivo'&&x.number==='plural')?.form,'exercituum');
  assert.equal(results[1].forms.find(x=>x.case==='nominativo'&&x.number==='plural')?.form,'cornua');
  return results;
}
function latinFuture(curriculum){
  const unit=7,heading='Futuro imperfecto de indicativo: activa, pasiva y sum';
  const specs=[['Futuro imperfecto · voz activa','futuro activo','activa'],
    ['Futuro imperfecto · voz pasiva','futuro pasivo','pasiva']];
  const names=['amo','habeo','duco','audio','capio'];
  const results=[];
  for(const [caption,tense,voice] of specs){
    const data=rows(curriculum,'latin',unit,heading,caption);
    assert.equal(data.length,6);
    names.forEach((name,k)=>{
      const forms=data.map((row,i)=>{
        assert.equal(row.length,6);
        assert.equal(row[0],PERSONS[i]);
        return {form:row[k+1],analysis:PERSONS[i]+' · '+tense,
          person:PERSONS[i],tense};
      });
      results.push({id:'latin-ud7-futuro-'+voice+'-'+name,
        language:'latin',unit,kind:'verbo',paradigm:name+' · '+tense,forms,
        evidence:evidence(unit,heading,caption,
          'Formas completas de la tabla, conjugaciones 1.ª, 2.ª, 3.ª, 4.ª y mixta.')});
    });
  }
  const caption='sum, esse · futuro imperfecto';
  const data=rows(curriculum,'latin',unit,heading,caption);
  assert.equal(data.length,6);
  const forms=data.map((row,i)=>{
    assert.deepEqual([row.length,row[0]],[2,PERSONS[i]]);
    return {form:row[1],analysis:PERSONS[i]+' · futuro',
      person:PERSONS[i],tense:'futuro'};
  });
  results.push({id:'latin-ud7-futuro-sum',language:'latin',unit,kind:'verbo',
    paradigm:'sum, esse · futuro',forms,
    evidence:evidence(unit,heading,caption,'Futuro de sum documentado, sin voz pasiva.')});
  assert.equal(results.length,11);
  assert.equal(results.find(r=>r.id==='latin-ud7-futuro-pasiva-duco').forms[1].form,'duceris');
  return results;
}
function greekMiddle(curriculum){
  const unit=6,heading='Presente medio-pasivo',caption='λύω · presente medio-pasivo';
  const data=rows(curriculum,'griego',unit,heading,caption);
  assert.equal(data.length,6);
  const forms=[];
  data.forEach((row,i)=>{
    assert.equal(row.length,2);
    assert.equal(row[0],PERSONS[i]);
    const vals=formVariants(row[1],{stripDashes:true});
    vals.forEach(form=>forms.push({form,analysis:PERSONS[i]+' · presente medio-pasivo',
      person:PERSONS[i],tense:'presente medio-pasivo'}));
  });
  assert.equal(forms.length,7);
  assert.deepEqual(forms.filter(x=>x.person==='2.ª singular').map(x=>x.form),['λύει','λύῃ']);
  return {id:'griego-ud6-lyo-medio',language:'griego',unit,kind:'verbo',
    paradigm:'λύω · presente medio-pasivo',forms,
    evidence:evidence(unit,heading,caption,'Dos alternativas documentadas en segunda persona singular.')};
}
function greekPronouns(curriculum){
  const unit=7,heading='Demostrativos, anafórico y personales';
  const specs=[
    ['griego-ud7-hode','Los demostrativos · tabla 102','ὅδε, ἥδε, τόδε · demostrativo'],
    ['griego-ud7-houtos','Los demostrativos · tabla 103','οὗτος, αὕτη, τοῦτο · demostrativo'],
    ['griego-ud7-ekeinos','Los demostrativos · tabla 104','ἐκεῖνος, ἐκείνη, ἐκεῖνο · demostrativo'],
    ['griego-ud7-autos','El pronombre anafórico · tabla 105','αὐτός, αὐτή, αὐτό · anafórico']
  ];
  const result=specs.map(([id,caption,paradigm])=>{
    const data=rows(curriculum,'griego',unit,heading,caption);
    assert.equal(data.length,6);
    assert.deepEqual(data[0],['—','Singular','Plural']);
    assert.deepEqual(data[1],['—','M','F','N','M','F','N']);
    const forms=[];
    data.slice(2).forEach((row,i)=>{
      assert.equal(row.length,7);
      assert.equal(row[0],['Nom.','Ac.','Gen.','Dat.'][i]);
      for(let col=1;col<=6;col++){
        const gender=GENDERS[(col-1)%3],number=col<=3?'singular':'plural';
        for(const form of formVariants(row[col]))
          forms.push({form,case:CASES_PRON_GR[i],gender,number,
            analysis:CASES_PRON_GR[i]+' '+gender+' '+number});
      }
    });
    assert.equal(forms.length,24);
    return {id,language:'griego',unit,kind:'pronombre',paradigm,forms,
      evidence:evidence(unit,heading,caption,'Cuatro casos, sin vocativo; conservar acentos originales.')};
  });
  const caption='Pronombres personales · tabla 106';
  const data=rows(curriculum,'griego',unit,heading,caption);
  assert.equal(data.length,6);
  assert.deepEqual(data[0],['—','1ª persona','2ª persona']);
  assert.deepEqual(data[1],['—','Sing.','Pl.','Sing.','Pl.']);
  const forms=[];
  data.slice(2).forEach((row,i)=>{
    assert.equal(row.length,5);
    assert.equal(row[0],['Nom.','Ac.','Gen.','Dat.'][i]);
    for(let col=1;col<=4;col++){
      const person=col<=2?'1.ª':'2.ª',number=col%2?'singular':'plural';
      for(const form of formVariants(row[col]))
        forms.push({form,case:CASES_PRON_GR[i],number,person,
          analysis:CASES_PRON_GR[i]+' · '+person+' persona · '+number});
    }
  });
  assert.ok(forms.length>=20,'Pronombres personales sin variantes atestiguadas');
  result.push({id:'griego-ud7-personales',language:'griego',unit,kind:'pronombre',
    paradigm:'ἐγώ, σύ · pronombres personales',forms,
    evidence:evidence(unit,heading,caption,
      'Se aceptan formas átonas y tónicas documentadas, sin género ni vocativo.')});
  return result;
}
export function compileMorphologyUd67(curriculum){
  const result=[...latinPronouns(curriculum),...latinNouns(curriculum),
    ...latinFuture(curriculum),greekMiddle(curriculum),...greekPronouns(curriculum)];
  assert.equal(result.length,24);
  assert.equal(new Set(result.map(r=>r.id)).size,result.length);
  assert.ok(result.every(r=>r.forms.length>=6));
  return result;
}
