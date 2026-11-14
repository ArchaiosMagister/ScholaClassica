// Segunda ampliación curricular: no altera ninguna ficha existente.
// Las fuentes documentan las formas exactamente o declaran expresamente
// la regla escolar aplicada. No implica cotejo textual individual.
import assert from 'node:assert/strict';

const cases=['acusativo','genitivo','dativo','ablativo'];
const genders=['masculino','femenino','neutro'];
const persons=['1.ª singular','2.ª singular','3.ª singular',
  '1.ª plural','2.ª plural','3.ª plural'];
const normalize=text=>String(text).replace(/<[^>]*>/gu,'')
  .replace(/&aelig;/gu,'æ').replace(/&nbsp;/gu,' ')
  .replace(/\s+/gu,' ').trim().normalize('NFC');
function topic(curriculum,unit,title){
  const t=curriculum.latin?.units.find(u=>u.number===unit)
    ?.topics.find(t=>t.title===title);
  assert.ok(t,'No consta tema latino '+unit+': '+title);
  return t;
}
function parsedRows(t,caption){
  const found=[...t.html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gu)]
    .map(m=>m[1]).find(html=>
      normalize(html.match(/<caption[^>]*>([\s\S]*?)<\/caption>/u)?.[1]||'')
        .includes(caption));
  assert.ok(found,'Falta la tabla '+caption);
  const body=found.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/u)?.[1];
  assert.ok(body,'Tabla sin contenido: '+caption);
  return [...body.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gu)]
    .map(m=>[...m[1].matchAll(/<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/gu)]
      .map(c=>normalize(c[1])));
}
function result({id,unit,kind,paradigm,forms,heading,caption,notes,
  sources=[],source='Appendix grammaticae'}){
  assert.ok(forms.length>=4&&forms.every(f=>f.form&&f.analysis),id);
  return {id,language:'latin',unit,kind,paradigm,forms,
    evidence:{source,file:'assets/curriculum.json',unit,topic:heading,
      caption,status:'paradigma-documentado',notes,
      ...(sources.length?{contrastSources:sources}:{})}};
}
function reflexive(curriculum){
  const unit=5,heading='Pronombre reflexivo y pronombre fórico';
  const caption='Reflexivo de tercera persona';
  const rows=parsedRows(topic(curriculum,unit,heading),caption);
  assert.equal(rows.length,4);
  const forms=rows.map((row,index)=>{
    assert.deepEqual(row,[cases[index][0].toUpperCase()+cases[index].slice(1),
      ['se','sui','sibi','se'][index]],
    'Cambió el reflexivo escolar: revisar el caso');
    return {form:row[1],analysis:cases[index]+' · singular o plural',
      case:cases[index],number:'singular o plural'};
  });
  return result({id:'latin-ud5-reflexivo-sui',unit,kind:'pronombre',
    paradigm:'se, sui, sibi, se · reflexivo de tercera persona',
    forms,heading,caption,notes:'Sin nominativo ni distinción formal de número; '+
    'la misma forma se aplica al sujeto singular o plural. Cuatro casos acreditados; '+
    'no se inventan casillas ni se atribuye género.'});
}
const deponents=[
 ['hortor','hortor, hortaris, hortari','1.ª',
   ['hortor','hortaris','hortatur','hortamur','hortamini','hortantur']],
 ['vereor','vereor, vereris, vereri','2.ª',
   ['vereor','vereris','veretur','veremur','veremini','verentur']],
 ['sequor','sequor, sequeris, sequi','3.ª',
   ['sequor','sequeris','sequitur','sequimur','sequimini','sequuntur']],
 ['patior','patior, pateris, pati','3.ª mixta',
   ['patior','pateris','patitur','patimur','patimini','patiuntur']],
 ['orior','orior, oriris, oriri','4.ª (orior)',
   ['orior','oriris','oritur','orimur','orimini','oriuntur']]
];
function deponentModels(curriculum){
  const unit=7,heading='Verbos deponentes';
  const html=topic(curriculum,unit,heading).html;
  return deponents.map(([lemma,headword,conjugation,forms])=>{
    for(const form of headword.split(', '))
      assert.ok(html.includes(form),'Falta el enunciado curricular de '+lemma+': '+form);
    assert.equal(forms.length,6);
    return result({id:'latin-ud7-deponente-'+lemma,unit,kind:'verbo',
      paradigm:headword+' · '+conjugation+' deponente, presente de indicativo',
      forms:forms.map((form,index)=>({
        form,analysis:persons[index]+' · presente · indicativo · '+
          'voz pasiva deponente (sentido activo)',
        person:persons[index],tense:'presente',mood:'indicativo',
        voice:'pasiva (deponente, sentido activo)'})),
      heading,caption:'Cinco enunciados del tema; presente de indicativo contrastado',
      source:'Appendix grammaticae + paradigmas externos de deponentes',
      sources:[
        'https://en.wikisource.org/wiki/Latin_for_beginners_(1911)/Appendix_I',
        'https://www.azimonti.com/philology/latin/morphology/verbs/deponent/',
        ...(lemma==='orior'?['https://www.latindictionary.io/entry/orior-oriri-ortus-sum-28938']:[])
      ],
      notes:'Se examinan solo seis personas del presente de indicativo. '+
        'La flexión es pasiva y la traducción activa. No se incluyen participios, '+
        'perfectos ni otros tiempos. Orior presenta variantes de segunda persona '+
        'en otras fuentes; aquí se conserva oriris según el temario.'});
  });
}
const superlatives=[
 ['altissimus','latin2-cuaderno-nominal-adjective-altissimus'],
 ['pulcherrimus','latin2-cuaderno-nominal-adjective-pulcherrimus'],
 ['facillimus','latin2-cuaderno-nominal-adjective-facillimus'],
 ['optimus','latin2-pau-unimorph-adjetivo-optimus'],
 ['maximus','latin2-pau-unimorph-adjetivo-maximus']
];
function superlativeModels(curriculum,records){
  const unit=9,heading='Comparativos y superlativos';
  const html=topic(curriculum,unit,heading).html;
  return superlatives.map(([lemma,id])=>{
    assert.ok(html.includes(lemma),'El superlativo dejó de figurar: '+lemma);
    const prior=records.find(r=>r.id===id);
    assert.ok(prior&&prior.language==='latin2'&&prior.kind==='adjetivo'&&
      prior.forms.length===36,'Falta paradigma previo de '+lemma);
    const unique=new Set(prior.forms.map(f=>f.case+':'+f.gender+':'+f.number));
    assert.equal(unique.size,36,'Flexión incompleta del superlativo '+lemma);
    const forms=prior.forms.map(f=>({
      form:f.form,case:f.case,gender:f.gender,number:f.number,
      analysis:f.case+' '+f.gender+' '+f.number+' · grado superlativo'
    }));
    return result({id:'latin-ud9-superlativo-'+lemma,unit,kind:'adjetivo',
      paradigm:prior.paradigm+' · grado superlativo',forms,heading,
      caption:'Superlativos en la explicación de UD9; paradigma completo ya documentado',
      source:'Appendix grammaticae + corpus nominal consolidado de Latín II',
      sources:[prior.evidence.file],
      notes:'Reutilización literal de 36 formas escolares del banco Latín II; '+
        'sin inferir ni certificar nuevas flexiones. Origen del banco: '+
        prior.evidence.source+'. '+(prior.evidence.verification||'')});
  });
}
function completeParticiple(curriculum,records){
  const unit=10,heading='Participios concertados y ablativo absoluto';
  const html=topic(curriculum,unit,heading).html;
  assert.ok(html.includes('Se declina como cualquier adjetivo de tres terminaciones'),
    'Cambió la regla escolar de la declinación del participio');
  const singular=records.find(r=>r.id==='latin-ud10-participio-perfecto');
  const adjective=records.find(r=>r.id==='latin-ud2-adjetivo-bonus');
  assert.ok(singular&&adjective,'Faltan modelos de participio y bonus');
  assert.equal(singular.forms.length,18);
  assert.equal(adjective.forms.length,36);
  const plural=adjective.forms.filter(f=>f.number==='plural').map(f=>({
    form:f.form.replace(/^bon/u,'amat'),case:f.case,gender:f.gender,number:f.number,
    analysis:f.case+' '+f.gender+' '+f.number+' · participio de perfecto pasivo'
  }));
  assert.equal(plural.length,18);
  for(const [gender,form] of [['masculino','amati'],['femenino','amatæ'],
    ['neutro','amata']]){
    assert.equal(plural.find(f=>f.case==='nominativo'&&f.gender===gender)?.form,form);
  }
  const forms=[...singular.forms.map(f=>({
    ...f,analysis:f.analysis+' · participio de perfecto pasivo'
  })),...plural];
  assert.equal(forms.length,36);
  return result({id:'latin-ud10-participio-perfecto-completo',unit,kind:'participio',
    paradigm:'amatus, amata, amatum · participio de perfecto pasivo',
    forms,heading,caption:'Participio de perfecto · amatus, -a, -um',
    notes:'Las 18 casillas singulares se copian del modelo explícito de UD10; '+
      'las 18 plurales se forman siguiendo la regla textual «se declina como bonus» '+
      'y la tabla íntegra bonus de UD2, no por consulta individual de cada grafía. '+
      'La ficha singular anterior se conserva intacta para preservar el progreso.'});
}
export function compileLatinCurricularFollowup(curriculum,records){
  const additions=[reflexive(curriculum),...deponentModels(curriculum),
    ...superlativeModels(curriculum,records),completeParticiple(curriculum,records)];
  assert.equal(additions.length,12);
  assert.equal(new Set(additions.map(r=>r.id)).size,12);
  return additions;
}
