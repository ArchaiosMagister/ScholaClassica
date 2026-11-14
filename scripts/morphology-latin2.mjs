// Latín II no se organiza en unidades. Reutiliza únicamente formas individuales
// ya publicadas y acreditadas en Appendix/Vocabula; no genera flexiones nuevas.
import assert from 'node:assert/strict';

const VERBS={
  amo:'amo, amavi, amatum (1.ª)',
  habeo:'habeo, habui, habitum (2.ª)',
  duco:'duco, duxi, ductum (3.ª)',
  audio:'audio, audivi, auditum (4.ª)',
  capio:'capio, cepi, captum (3.ª mixta)',
  sum:'sum, fui, — (irregular)'
};
const NOUNS=[
  ['rosa,','rosa, rosæ','femenino','1.ª'],
  ['dominus,','dominus, domini','masculino','2.ª'],
  ['bellum,','bellum, belli','neutro','2.ª'],
  ['flumen,','flumen, fluminis','neutro','3.ª'],
  ['mare,','mare, maris','neutro','3.ª'],
  ['exercitus,','exercitus, exercitūs','masculino','4.ª'],
  ['cornū,','cornū, cornūs','neutro','4.ª'],
  ['res,','res, rei','femenino','5.ª'],
  ['puella','puella, puellæ','femenino','1.ª'],
  ['rex,','rex, regis','masculino','3.ª'],
  ['corpus,','corpus, corporis','neutro','3.ª']
];
const ADJECTIVES=[
  ['latin4-appendix-bonus','bonus, bona, bonum','positivo','primera clase, tres terminaciones'],
  ['latin-adj-brevis','brevis, breve','positivo','tercera declinación, dos terminaciones'],
  ['latin-adj-acer','acer, acris, acre','positivo','tercera declinación, tres terminaciones'],
  ['latin-adj-audax','audax, audacis','positivo','tercera declinación, una terminación'],
  ['latin-adj-vetus','vetus, veteris','positivo','tercera declinación, una terminación'],
  ['latin-ud9-comparativo','altior, altius','comparativo','tercera declinación, dos terminaciones']
];
const PRONOUN_TYPES={
  'latin-ud6-hic':'demostrativo de cercanía',
  'latin-ud6-iste':'demostrativo de segunda persona',
  'latin-ud6-ille':'demostrativo de lejanía',
  'latin-ud6-relativo':'relativo',
  'latin-ud8-idem':'identificativo',
  'latin-ud8-ipse':'enfático'
};
const SIMPLE=p=>p.split(' · ')[0];
const norm=s=>String(s||'').trim().normalize('NFC');
function fromSource(record,kind,headword,forms,detail){
  assert.ok(record&&record.evidence?.status==='paradigma-documentado',
    'Fuente no documentada de Latín II');
  assert.ok(forms.length>=2&&forms.every(f=>norm(f.form)&&norm(f.analysis)),
    'No hay formas individuales contrastadas: '+record.id);
  return {id:'latin2-'+record.id,language:'latin2',unit:0,kind,
    headword,paradigm:headword,forms,evidence:{...record.evidence,
      unit:0,sourceUnit:record.unit,
      topic:'Latín II: análisis morfológico sin unidades',
      notes:'Reutilización de casillas explícitas, sin reconstrucción de flexiones. '+detail}};
}
const nominal=(f,kind,head,extra)=>({
  ...f,analysis:kind+' · '+head+' · '+f.case+' · '+
    (f.gender?f.gender+' · ':'')+f.number+' · '+extra
});
function nounRecords(records){
  return NOUNS.map(([prefix,headword,gender,declension])=>{
    const selectedLanguage=['puella','rex,','corpus,'].includes(prefix)?'latin4':'latin';
    const possible=records.filter(r=>r.language===selectedLanguage&&
      r.kind==='sustantivo'&&r.paradigm.startsWith(prefix));
    assert.equal(possible.length,1,'El sustantivo cambió: '+prefix);
    const r=possible[0];
    assert.ok(r.forms.every(f=>f.case&&f.number),'Casos no acreditados: '+prefix);
    const forms=r.forms.map(f=>({
      ...f,gender,analysis:'sustantivo · '+headword+' · '+f.case+
      ' · '+gender+' · '+f.number+' · '+declension+' declinación'
    }));
    return fromSource(r,'sustantivo',headword,forms,
      'Un único género léxico según el paradigma seleccionado.');
  });
}
function adjectiveRecords(records){
  return ADJECTIVES.map(([id,headword,degree,type])=>{
    const r=records.find(x=>x.id===id);
    assert.ok(r&&r.kind==='adjetivo'&&r.forms.every(f=>f.case&&f.gender&&f.number),
      'El adjetivo cambió: '+id);
    const forms=r.forms.map(f=>({...f,analysis:'adjetivo · grado '+degree+
      ' · '+headword+' · '+f.case+' · '+f.gender+' · '+f.number+' · tipo '+type}));
    return fromSource(r,'adjetivo',headword,forms,
      'Grado, terminaciones y casillas tomados del modelo acreditado.');
  });
}
function pronounRecords(records){
  return Object.entries(PRONOUN_TYPES).map(([id,type])=>{
    const r=records.find(x=>x.id===id);
    assert.ok(r&&r.kind==='pronombre'&&r.forms.every(f=>f.case&&f.number&&f.gender),
      'Falta una casilla pronominal: '+id);
    const headword=SIMPLE(r.paradigm);
    const forms=r.forms.map(f=>({...f,analysis:'pronombre · '+type+
      ' · '+headword+' · '+f.case+' · '+f.gender+' · '+f.number}));
    return fromSource(r,'pronombre',headword,forms,
      'Sin vocativos ni géneros no recogidos en la tabla original.');
  });
}
function verbRecords(records){
  const chosen=records.filter(r=>r.language==='latin'&&r.kind==='verbo'&&
    r.id!=='latin-ud8-infinitivos'&&/^(amo|habeo|duco|audio|capio|sum)(?=[, ·])/.test(r.paradigm));
  assert.ok(chosen.length>=35,'Desaparecieron paradigmas verbales documentados');
  return chosen.map(r=>{
    const lemma=r.paradigm.match(/^(amo|habeo|duco|audio|capio|sum)(?=[, ·])/)[1];
    const headword=VERBS[lemma];
    const forms=r.forms.map(f=>{
      const person=(f.person||'').match(/^([123]\.ª) (singular|plural)$/);
      const tense=(f.tense||'').match(/^(presente|imperfecto|futuro|perfecto|pluscuamperfecto)/);
      assert.ok(person&&tense,'Persona o tiempo no acreditados: '+r.id);
      const voice=/pasiv/.test(f.tense)?'pasiva':'activa';
      return {...f,analysis:'verbo · '+headword+' · '+person[1]+' persona · '+
        person[2]+' · '+tense[1]+' · indicativo · voz '+voice};
    });
    return fromSource(r,'verbo',headword,forms,
      'Persona, tiempo, modo indicativo y voz del paradigma curricular.');
  });
}
function participleRecords(records){
  return [
    ['latin-ud10-participio-presente','presente','activa'],
    ['latin-ud10-participio-perfecto','perfecto','pasiva']
  ].map(([id,tense,voice])=>{
    const r=records.find(x=>x.id===id);
    assert.ok(r&&r.kind==='adjetivo'&&r.forms.every(f=>f.case&&f.gender&&f.number),
      'Participio no documentado: '+id);
    const headword=VERBS.amo;
    const forms=r.forms.map(f=>({...f,analysis:'participio · '+headword+
      ' · '+tense+' · voz '+voice+' · '+f.case+' · '+f.gender+' · '+f.number}));
    return fromSource(r,'participio',headword,forms,
      'Se conserva solo el número y los casos acreditados en la tabla del participio.');
  });
}
function infinitiveRecords(records){
  const r=records.find(x=>x.id==='latin-ud8-infinitivos');
  assert.ok(r&&r.kind==='verbo','No hay tabla curricular de infinitivos');
  const selected=[];
  const names=['amo','habeo','duco','audio','capio'];
  for(const [i,lemma] of names.entries()){
    const headword=VERBS[lemma],conjugation=['1.ª','2.ª','3.ª','4.ª','mixta'][i];
    const cells=r.forms.filter(f=>f.analysis.includes('conjugación '+conjugation));
    const extras=lemma==='amo'?r.forms.filter(f=>f.analysis.endsWith('· amo')):[];
    assert.equal(cells.length,2,'Cambió el infinitivo de presente de '+lemma);
    assert.equal(extras.length,lemma==='amo'?4:0,'Infinitivos compuestos de amo modificados');
    const forms=[...cells,...extras].map(f=>{
      const part=f.tense.match(/^infinitivo (presente|perfecto|futuro) (activo|pasivo)$/);
      assert.ok(part,'Infinitivo de tiempo/voz no reconocido: '+f.tense);
      const voice=part[2]==='activo'?'activa':'pasiva';
      return {...f,analysis:'infinitivo · '+headword+' · '+part[1]+' · voz '+voice,
        tense:part[1],voice};
    });
    selected.push(fromSource({...r,id:r.id+'-'+lemma},'infinitivo',headword,forms,
      'Infinitivos presentes y compuestos indicados literalmente en la fuente.'));
  }
  return selected;
}
export function compileLatin2(sourceRecords){
  assert.ok(Array.isArray(sourceRecords)&&sourceRecords.length>=200,
    'No está disponible el banco curricular de origen');
  const records=[
    ...nounRecords(sourceRecords),
    ...adjectiveRecords(sourceRecords),
    ...pronounRecords(sourceRecords),
    ...verbRecords(sourceRecords),
    ...participleRecords(sourceRecords),
    ...infinitiveRecords(sourceRecords)
  ];
  assert.equal(new Set(records.map(x=>x.id)).size,records.length,'IDs duplicados de Latín II');
  for(const r of records)assert.ok(r.forms.every(f=>
    f.analysis.startsWith(r.kind+' · ')&&f.analysis.includes(' · '+r.headword+' · ')),
    'Falta categoría o enunciado verbal/nominal completo: '+r.id);
  for(const kind of ['sustantivo','adjetivo','pronombre','verbo','participio','infinitivo'])
    assert.ok(records.some(r=>r.kind===kind),'Categoría sin ejercicios de Latín II: '+kind);
  return records;
}
