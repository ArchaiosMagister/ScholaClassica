import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const file=join(root,'shared/academic/greek-etymology/review/study-glosses-gr1-20261113.json');
const componentsFile=join(root,'shared/academic/greek-etymology/review/study-components-gr1-20261113.json');
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
export function createStudyCatalog(source,learners,lexicon=readStudyGlosses(),componentGlosses=readStudyComponents()){
  assert.equal(source?.schema,'etymologicon-audited-catalog/v1');
  assert.equal(learners?.schema,'etymologicon-audited-catalog/v1');
  assert.equal(learners.etymons.length,111);
  assert.equal(learners.derivatives.length,487);
  assert.equal(learners.course,'gr1');
  assert.equal(lexicon.schema,'etymologicon-study-glosses/v1');
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
    const definition=prior?.definitions?.[0]?.text||lexicon.definitions[d.form];
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
    const direct=confirmedDle.has(d.form);
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
  return {schema:'etymologicon-study-catalog/v1',course:'gr1',etymons,words,
    audit:{allHaveDidacticDefinition:true,covered:words.length,
      explicitComponentReviews:words.filter(w=>w.componentReview==='analisis_explicito_del_banco_docente').length,
      compounds:words.filter(w=>w.components.length>1).length,
      singleStemOrFamily:words.filter(w=>w.components.length===1).length,
      individualDleChecks:confirmed,remainingDleChecks:words.length-confirmed,
      editorialScope:'Las 487 fichas tienen definiciones propias. Solo los contrastes DLE individuales expresamente anotados se presentan como comprobados; las demás voces disponen de un enlace de consulta.'}};
}
