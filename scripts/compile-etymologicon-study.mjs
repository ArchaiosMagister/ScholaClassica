import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const file=join(root,'shared/academic/greek-etymology/review/study-glosses-gr1-20261113.json');
const componentsFile=join(root,'shared/academic/greek-etymology/review/study-components-gr1-20261113.json');
const pdfFile=join(root,'shared/academic/greek-etymology/review/source-concordance-gr1-20261113.json');
const checksFile=join(root,'shared/academic/greek-etymology/review/lexicographic-checks-gr1-20261113.json');
const definitionCorrections={
  autarquía:'Condición o política de autosuficiencia: bastarse con los recursos propios.'
};
const editorialNotes={
  autarquía:'El DLE distingue autarquía¹ (de αὐταρχία, poder absoluto) y autarquía² (de αὐτάρκεια, autosuficiencia). Esta ficha recoge la segunda; no deben confundirse.',
  plastilina:'Según el DLE, procede de la marca registrada Plastilina®. La relación didáctica con la familia de πλαστός es indirecta, no la etimología inmediata.',
  macrobiótico:'El DLE define macrobiótica como un método de alimentación; no se debe atribuir necesariamente al adjetivo el sentido de vivir muchos años.',
  seudociencia:'No figura como entrada independiente en el DLE 2026. Sí están documentados seudo-/pseudo- y seudocientífico; su ausencia no la hace lingüísticamente imposible.',
  geniogloso:'Tecnicismo anatómico documentado en fuentes especializadas; sin entrada propia en el DLE 2026.',
  tanatología:'La palabra española llegó por el francés thanatologie; sus formantes últimos son griegos.',
  tomografía:'La palabra española procede del inglés tomography; los formantes últimos son griegos.'
};

export const normalizeSpanish=value=>String(value).normalize('NFD').toLocaleLowerCase('es')
  .replace(/\p{M}/gu,'').replace(/\s+/gu,' ').trim();

const educationalComponents={
  'filología':[
    {id:'grc:φιλοσ',greek:'φίλος',gloss:'amigo, amante de'},
    {id:'grc:λογοσ',greek:'λόγος',gloss:'palabra, discurso, estudio'}
  ],
  'filosofía':[
    {id:'grc:φιλοσ',greek:'φίλος',gloss:'amigo, amante de'},
    {id:'grc:σοφοσ',greek:'σοφία',gloss:'sabiduría'}
  ],
  'misoginia':[
    {id:'grc:μισεω',greek:'μισέω',gloss:'odiar'},
    {id:'grc:γυνη',greek:'γυνή',gloss:'mujer'}
  ],
  'misantropía':[
    {id:'grc:μισεω',greek:'μισέω',gloss:'odiar'},
    {id:'grc:ανθρωποσ',greek:'ἄνθρωπος',gloss:'ser humano'}
  ],
  'antropocentrismo':[
    {id:'grc:ανθρωποσ',greek:'ἄνθρωπος',gloss:'ser humano'},
    {greek:'κέντρον',gloss:'centro',external:true}
  ],
  'antropología':[
    {id:'grc:ανθρωποσ',greek:'ἄνθρωπος',gloss:'ser humano'},
    {id:'grc:λογοσ',greek:'λόγος',gloss:'estudio, razonamiento'}
  ],
  'bibliografía':[
    {id:'grc:βιβλιον',greek:'βιβλίον',gloss:'libro'},
    {id:'grc:γραφω',greek:'γράφω',gloss:'escribir'}
  ],
  'ortografía':[
    {greek:'ὀρθός',gloss:'recto, correcto',external:true},
    {id:'grc:γραφω',greek:'γράφω',gloss:'escribir'}
  ],
  'ecología':[
    {id:'grc:οικια',greek:'οἶκος',gloss:'casa, entorno (familia de οἰκία)'},
    {id:'grc:λογοσ',greek:'λόγος',gloss:'estudio'}
  ],
  'economía':[
    {id:'grc:οικια',greek:'οἶκος',gloss:'casa, patrimonio (familia de οἰκία)'},
    {id:'grc:νομοσ',greek:'νόμος',gloss:'administración, norma'}
  ],
  'perihelio':[
    {id:'grc:περι',greek:'περί',gloss:'alrededor'},
    {id:'grc:ηλιοσ',greek:'ἥλιος',gloss:'sol'}
  ],
  'afelio':[
    {id:'grc:απο',greek:'ἀπό',gloss:'lejos de'},
    {id:'grc:ηλιοσ',greek:'ἥλιος',gloss:'sol'}
  ],
  'gastronomía':[
    {id:'grc:γαστηρ',greek:'γαστήρ',gloss:'estómago'},
    {id:'grc:νομοσ',greek:'νόμος',gloss:'norma, organización'}
  ],
  'autopsia':[
    {id:'grc:αυτοσ',greek:'αὐτός',gloss:'uno mismo'},
    {greek:'ὄψις',gloss:'vista, observación',external:true}
  ],
  'teogonía':[
    {id:'grc:θεοσ',greek:'θεός',gloss:'dios'},
    {greek:'γονή',gloss:'origen, generación',external:true}
  ],
  'panteísmo':[
    {greek:'πᾶν',gloss:'todo',external:true},
    {id:'grc:θεοσ',greek:'θεός',gloss:'dios'}
  ],
  'misoneísmo':[
    {id:'grc:μισεω',greek:'μισέω',gloss:'odiar'},
    {greek:'νέος',gloss:'nuevo',external:true}
  ],
  'microchip':[
    {id:'grc:μικροσ',greek:'μικρός',gloss:'pequeño'},
    {greek:'chip',gloss:'componente electrónico (inglés)',external:true,language:'en'}
  ]
};
const specialConnections={
  'filología':'La composición evoca el amor o interés por las palabras y los textos; hoy designa una disciplina científica.',
  'filosofía':'Su sentido compositivo es «amor a la sabiduría»; el uso actual designa el estudio racional de cuestiones fundamentales.',
  'misoginia':'Expresa la aversión (μισέω) hacia las mujeres (γυνή).',
  'misantropía':'Combina la idea de odiar (μισέω) con la de ser humano (ἄνθρωπος).',
  'antropocentrismo':'ἄνθρωπος aporta «ser humano» y κέντρον, «centro»: coloca a la persona como referencia de todo.',
  'ecología':'El primer elemento procede de οἶκος, de la familia de οἰκία: «casa» pasó a entenderse como entorno o hábitat.',
  'economía':'De οἶκος, «casa», y la familia de νόμος, «norma»; de la administración doméstica al conjunto de actividades económicas.',
  'microchip':'micro- procede de μικρός; chip es una palabra inglesa, no un segundo étimo griego.',
  'policía':'Su relación con πόλις es histórica e indirecta, a través de palabras griegas y latinas sobre la administración de la ciudad.',
  'catarata':'El vínculo de κατά es a través de derivados compuestos históricos; no debe descomponerse como simple prefijo más una base española.',
  'afelio':'Combina una idea de alejamiento con el nombre griego del Sol.',
  'perihelio':'Combina la noción de «alrededor» con «Sol»; hoy nombra el punto orbital de máxima proximidad solar.'
};
const confirmedDle=new Set([
  'antropocentrismo','misoginia','misantropía','filología','filosofía',
  'psicosomático','ortografía','dermalgia','misoneísmo','autoevaluación',
  'antroposofía','bibliotecología','cacoquimia','hepatomegalia','tanatofobia','ginecocracia'
]);
const greekMain=form=>String(form).split(/[|,]/)[0].replace(/\s*\(.*/,'').trim().normalize('NFC');
const externalLanguages={
  bus:'en',chip:'en',bureau:'fr',oculus:'la',molecula:'la',mobilis:'la',
  globina:'es',química:'es',medicina:'es',luminiscencia:'es',
  degradable:'es',evaluación:'es',procesador:'es',tensión:'es',
  onda:'es',vatio:'es',masaje:'es',ciencia:'es'
};
const componentSources={
  antropomorfismo:[
    {kind:'pdf_docente',title:'Etimologías griegas · PAU Griego II (2008-09)',page:17},
    {kind:'lexicografia',url:'https://www.filosofia.org/enc/ros/antrop4.htm'}
  ],
  telegrama:[
    {kind:'pdf_docente',title:'Breve diccionario de helenismos de griego clásico',page:2},
    {kind:'pdf_docente',title:'Etimologías griegas · Gálvez Marín (2009)',page:371},
    {kind:'lexicografia',url:'https://lalengua.es/d/echegaray/telegrama'}
  ],
  geodesia:[{kind:'lexicografia',url:'https://www.etymonline.com/word/geodesy'}],
  catarata:[{kind:'lexicografia',url:'https://dicciomed.usal.es/palabra/catarata'}],
  neumonía:[{kind:'lexicografia',url:'https://dicciomed.usal.es/lexema/pulmon'}],
  autarquía:[{kind:'estudio_etimologico',url:'https://dialnet.unirioja.es/descarga/articulo/4859068.pdf'}]
};
export function readStudyGlosses(){
  const data=JSON.parse(readFileSync(file,'utf8'));
  assert.equal(data.schema,'etymologicon-study-glosses/v1');
  assert.equal(data.course,'gr1');
  return data;
}
const normalGreek=value=>String(value).normalize('NFD').toLocaleLowerCase('el')
  .replace(/\p{M}/gu,'').replace(/ς/g,'σ').replace(/[^α-ω]/gu,'');
export function readStudyComponents(){
  const data=JSON.parse(readFileSync(componentsFile,'utf8'));
  assert.equal(data.schema,'etymologicon-study-components/v1');
  assert.equal(data.course,'gr1');
  return data.words;
}
export function readSourceConcordance(){
  const data=JSON.parse(readFileSync(pdfFile,'utf8'));
  assert.equal(data.schema,'etymologicon-source-concordance/v1');
  assert.equal(data.course,'gr1');
  assert.equal(Object.keys(data.firstPageByTerm).length,487);
  assert.equal(data.counts.pdfAttested,475);
  assert.equal(data.counts.notAttested,12);
  return data;
}
export function readLexicographicChecks(){
  const data=JSON.parse(readFileSync(checksFile,'utf8'));
  assert.equal(data.schema,'etymologicon-lexicographic-checks/v1');
  assert.equal(data.course,'gr1');
  assert.equal(Object.keys(data.records).length,24);
  return data;
}
export function createStudyCatalog(source,learners,lexicon=readStudyGlosses(),
  componentGlosses=readStudyComponents(),pdfIndex=readSourceConcordance(),
  checks=readLexicographicChecks()){
  assert.equal(source?.schema,'etymologicon-audited-catalog/v1');
  assert.equal(learners?.schema,'etymologicon-audited-catalog/v1');
  assert.equal(learners.etymons.length,111);
  assert.equal(learners.derivatives.length,487);
  assert.equal(learners.course,'gr1');
  assert.equal(lexicon.schema,'etymologicon-study-glosses/v1');
  const allNames=new Set(learners.derivatives.map(w=>w.form));
  for(const name of Object.keys(pdfIndex.firstPageByTerm))
    assert.ok(allNames.has(name),'Fuente PDF para término desconocido: '+name);
  for(const name of Object.keys(checks.records))
    assert.ok(allNames.has(name),'Cotejo lexicográfico para término desconocido: '+name);
  const original=new Map(source.derivatives.map(d=>[d.id,d]));
  const etyma=new Map(learners.etymons.map(e=>[e.id,e]));
  const greekLookup=new Map();
  for(const e of learners.etymons){
    e.lemma.split('|').forEach((part,i)=>{
      const root=normalGreek(greekMain(part));
      if(!root)return;
      const old=greekLookup.get(root);
      // Un lema independiente prevalece sobre una variante incluida en otro lema.
      if(!old||(!i&&old.variant))greekLookup.set(root,{id:e.id,variant:!!i});
    });
  }
  const relations=new Map();
  for(const rel of learners.relations){
    if(rel.editorialStatus!=='teacher_audit_approved')continue;
    if(!relations.has(rel.derivativeId))relations.set(rel.derivativeId,new Set());
    relations.get(rel.derivativeId).add(rel.etymonId);
  }
  const words=learners.derivatives.map(d=>{
    const prior=original.get(d.id);
    const definition=definitionCorrections[d.form]||
      prior?.definitions?.[0]?.text||lexicon.definitions[d.form];
    assert.ok(typeof definition==='string'&&definition.length>=8,'Falta glosa propia: '+d.form);
    const ids=[...(relations.get(d.id)||[])];
    assert.ok(ids.length>0,'Derivado sin étimo: '+d.form);
    const additional=componentGlosses[d.form];
    assert.ok(Array.isArray(additional)&&additional.length>0,
      'Falta revisión explícita de los componentes: '+d.form);
    const override=educationalComponents[d.form]||
      (additional.map(c=>{
        const greek=normalGreek(c.greek);
        const linked=greekLookup.get(greek);
        const language=c.language||externalLanguages[c.greek]||
          (/^[A-Za-zÀ-ÿ]+$/u.test(c.greek)?'es':undefined);
        return {...c,id:linked?.id,external:!linked||
          etyma.get(linked.id)?.editorialStatus==='reference_only',language};
      }));
    const components=override.map(c=>({
      ...c,greek:String(c.greek).normalize('NFC'),external:!!c.external
    }));
    assert.ok(components.length>=1&&components.every(c=>c.greek&&c.gloss),
      'Componentes incompletos: '+d.form);
    for(const component of components)if(component.id)
      assert.ok(etyma.has(component.id),'Componente fuera del inventario: '+d.form+' '+component.id);
    const checked=checks.records[d.form]||null;
    const direct=confirmedDle.has(d.form)||
      checked?.status==='dle_individual_contrastado';
    const pages=pdfIndex.firstPageByTerm[d.form];
    assert.ok(Array.isArray(pages)&&pages.length===3,
      'No consta la ficha de concordancia documental: '+d.form);
    const pdfAttestations=pages.flatMap((page,i)=>page===null?[]:[{
      sourceId:pdfIndex.sources[i].id,
      title:pdfIndex.sources[i].title,
      page
    }]);
    const connection=specialConnections[d.form]||
      (components.length===1
        ?'El étimo '+components[0].greek+' aporta la idea de «'+components[0].gloss+'» a esta familia léxica; la acepción española puede haberse especializado con el tiempo.'
        :'En esta voz se relacionan '+components.map(c=>c.greek+' («'+c.gloss+'»)').join(' y ')+
          '. El significado actual no es necesariamente una traducción literal de la composición.');
    return {
      id:d.id,form:d.form,definition,units:[...new Set(ids.flatMap(id=>etyma.get(id).units))],
      etymonIds:ids,components,connection,
      source:prior?'auditoria_docente':'ampliacion_documental',
      lexicographicStatus:direct?'dle_consultado_individualmente':'glosa_docente_no_cotejada_individualmente_dle',
      dleUrl:'https://dle.rae.es/'+encodeURIComponent(d.form),
      note:prior?.notes||null,
      editorialNote:editorialNotes[d.form]||null,
      lexicographicCheck:checked,
      pdfAttestations,
      pdfAttested:pdfAttestations.length>0,
      componentReview:'analisis_explicito_del_banco_docente',
      componentSources:componentSources[d.form]||[],
      formation:components.length>1?'varias_bases':'base_o_familia',
      explicitMultiple:components.length>1
    };
  });
  const approvedWords=new Set(words.map(w=>w.form));
  assert.equal(Object.keys(componentGlosses).length,487,
    'La revisión exige una ficha de componentes para cada derivado');
  for(const term of Object.keys(componentGlosses))
    assert.ok(approvedWords.has(term),'Componente de palabra fuera del catálogo: '+term);
    assert.equal(new Set(words.map(w=>w.id)).size,words.length);
  const allId=new Set(words.map(x=>x.id));
  for(const e of learners.etymons)for(const id of e.teacherApprovedDerivatives)
    assert.ok(allId.has(id),'Étimo con respuesta sin ficha: '+e.id+' / '+id);
  const etymons=learners.etymons.map(e=>({
    id:e.id,lemma:e.lemma,meaning:e.meaning,units:e.units,
    eligible:e.editorialStatus==='approved_for_documented_derivatives',
    wordIds:e.teacherApprovedDerivatives
  }));
  assert.equal(etymons.filter(e=>e.eligible).length,108);
  const confirmed=words.filter(w=>w.lexicographicStatus==='dle_consultado_individualmente').length;
  const pdfAttested=words.filter(w=>w.pdfAttested).length;
  const individualChecks=words.filter(w=>w.lexicographicCheck?.status==='dle_individual_contrastado').length;
  const specialistChecks=words.filter(w=>w.lexicographicCheck?.status==='fuente_especializada_contrastada').length;
  const dleNotListed=words.filter(w=>w.lexicographicCheck?.status==='dle_no_incluye_entrada_independiente').length;
  assert.equal(pdfAttested,475,'Concordancia documental inesperada');
  return {schema:'etymologicon-study-catalog/v1',course:'gr1',etymons,words,
    audit:{allHaveDidacticDefinition:true,covered:words.length,
      explicitComponentReviews:words.filter(w=>w.componentReview==='analisis_explicito_del_banco_docente').length,
      compounds:words.filter(w=>w.components.length>1).length,
      singleStemOrFamily:words.filter(w=>w.components.length===1).length,
      individualDleChecks:confirmed,remainingDleChecks:words.length-confirmed,
      pdfAttested,pdfNoExactMatch:words.length-pdfAttested,
      individuallyCheckedDleThisReview:individualChecks,
      individuallyCheckedSpecialistThisReview:specialistChecks,
      confirmedNotIndependentDleThisReview:dleNotListed,
      editorialScope:'Se cotejó la presencia textual en tres PDF docentes, con primera página registrada para cada coincidencia. Una mención documental no acredita por sí sola el significado o la etimología. Los artículos del DLE consultados individualmente y las fuentes especializadas se anotan aparte.'}};
}
