// Seis decisiones expresas del docente (2026-11-13).
// No modifica Vocabula, Appendix, GeneradorExamenes ni los corpus externos.
// Excepciones nominales INDIVIDUALES con referencias; no crea un motor
// analógico ni atribuye a una palabra las variantes de otra.
import assert from 'node:assert/strict';

const CHOICES={
  anthropos:'masculino-docente',
  athenae:'plural-documentado-pendiente-fuente',
  cantus:'cuarta-sin-mezcla',
  domus:'conservar-variantes-documentadas',
  liber:'guardar-ambos',
  pais:'ambos-generos'
};
const CASES_LAT=['nominativo','vocativo','acusativo','genitivo','dativo','ablativo'];
const CASES_GRC=['nominativo','vocativo','acusativo','genitivo','dativo'];
const N=['singular','plural'];
const norm=s=>String(s||'').normalize('NFD')
  .replace(/\p{M}/gu,'').replace(/ς/g,'σ').replace(/æ/g,'ae')
  .toLocaleLowerCase('el').trim();
const noQuantity=s=>String(s||'').normalize('NFD')
  .replace(/[\u0304\u0306]/gu,'').normalize('NFC');
const DCC='https://dcc.dickinson.edu/grammar/latin/4th-declension-case-forms';
const CANTUS='https://www.latindictionary.io/entry/cantus-cantus';
const LIBER_NOUN='https://dcc.dickinson.edu/es/liber1';
const LIBER_ADJ='https://dcc.dickinson.edu/latin-core/liber2liberi';
const ANTHROPOS='https://www.apgads.lu.lv/fileadmin/user_upload/lu_portal/apgads/PDF/Antiquitas_Viva/Nr._5/06_Rumniece_Antiquitas_Viva_5_.pdf';
const PAIS='https://logeion.org/morpho/%CF%80%CE%B1%E1%BF%96%CF%82';
const ATHENAI='https://logeion.uchicago.edu/morpho/%E1%BC%88%CE%B8%E1%BF%86%CE%BD%CE%B1%CE%B9';
const ATHENAI_ATTIC='https://en.wiktionary.org/wiki/%E1%BC%88%CE%B8%E1%BF%86%CE%BD%CE%B1%CE%B9';

function lexicalData(vocabulaData){
  const match=String(vocabulaData).match(/^window\.VOCAB=(\[[\s\S]*\]);?\s*$/);
  assert.ok(match,'Formato de Vocabula distinto del SHA fijado');
  const rows=JSON.parse(match[1]);
  const find=(subject,lemma,unit)=>{
    const matches=rows.filter(e=>e.subject===subject&&
      norm(e.form.split(',')[0])===norm(lemma)&&
      (!unit||e.units?.includes(unit)));
    assert.ok(matches.length,'Falta '+lemma+' ('+subject+', '+unit+') en el vocabulario fijado');
    return matches;
  };
  return find;
}
function formRows(model,cases,{numberScope='both'}={}){
  const forms=[];
  for(const cas of cases){
    const group=model[cas];
    assert.ok(group&&typeof group==='object','Sin caso individual '+cas);
    for(const number of numberScope==='both'?N:[numberScope]){
      const source=group[number];
      assert.ok(Array.isArray(source)&&source.length>=1,'Sin casilla de '+cas+' '+number);
      for(const form of [...new Set(source.map(noQuantity))]){
        assert.ok(form&&!/[\[\]()/]/u.test(form),'Forma ilegible en '+cas);
        forms.push({form,analysis:cas+' '+number,case:cas,number});
      }
    }
  }
  const expected=cases.length*(numberScope==='both'?2:1);
  assert.equal(new Set(forms.map(x=>x.analysis)).size,expected,'Paradigma sin casillas completas');
  return forms;
}
const latinModels={
  domus:{
    unit:7,gender:'femenino',genitive:'domūs',declension:'4.ª y 2.ª (mixta)',
    sources:[DCC,'https://dcc.dickinson.edu/sites/default/files/4th_decl_domus.pdf'],
    forms:{
      nominativo:{singular:['domus'],plural:['domūs']},
      vocativo:{singular:['domus'],plural:['domūs']},
      acusativo:{singular:['domum'],plural:['domōs','domūs']},
      genitivo:{singular:['domūs','domī'],plural:['domuum','domōrum']},
      dativo:{singular:['domuī','domō'],plural:['domibus']},
      ablativo:{singular:['domō','domū'],plural:['domibus']},
      locativo:{singular:['domī','domuī']}
    },
    restrictedVariants:{
      'genitivo:singular:domi':'Arcaico (Plauto); domī es mucho más frecuente como locativo.',
      'genitivo:plural:domorum':'Tardío o poético.',
      'locativo:singular:domui':'Muy raro; se prefiere domī.',
      'dativo:singular:domo':'Variante de tema en o.',
      'ablativo:singular:domu':'Variante de tema en u.'
    }
  },
  cantus:{
    unit:7,gender:'masculino',genitive:'cantūs',declension:'4.ª declinación',
    sources:[CANTUS,'https://dcc.dickinson.edu/grammar/latin/4th-declension-nouns'],
    forms:{
      nominativo:{singular:['cantus'],plural:['cantūs']},
      vocativo:{singular:['cantus'],plural:['cantūs']},
      acusativo:{singular:['cantum'],plural:['cantūs']},
      genitivo:{singular:['cantūs'],plural:['cantuum']},
      dativo:{singular:['cantuī'],plural:['cantibus']},
      ablativo:{singular:['cantū'],plural:['cantibus']}
    }
  },
  liber:{
    unit:1,gender:'masculino',genitive:'librī',declension:'2.ª declinación',
    sources:[LIBER_NOUN,'https://www.mobot.org/mobot/latindict/keyDetail.aspx?keyWord=liber'],
    forms:{
      nominativo:{singular:['liber'],plural:['librī']},
      vocativo:{singular:['liber'],plural:['librī']},
      acusativo:{singular:['librum'],plural:['librōs']},
      genitivo:{singular:['librī'],plural:['librōrum']},
      dativo:{singular:['librō'],plural:['librīs']},
      ablativo:{singular:['librō'],plural:['librīs']}
    }
  }
};
const athenaeForms={
  nominativo:{plural:['Ἀθῆναι']},
  vocativo:{plural:['Ἀθῆναι']},
  acusativo:{plural:['Ἀθήνας']},
  genitivo:{plural:['Ἀθηνῶν']},
  dativo:{plural:['Ἀθήναις']}
};
function makeLatinRecord(id,entry,model,vocabulaSha){
  const forms=formRows(model.forms,CASES_LAT);
  if(id==='domus')forms.push(...formRows({locativo:model.forms.locativo},['locativo'],
    {numberScope:'singular'}));
  return {
    id:'latin-sustantivo-decision-'+id,
    language:'latin',unit:model.unit,kind:'sustantivo',gender:model.gender,
    paradigm:id+', '+noQuantity(model.genitive)+' · '+model.declension,
    forms,evidence:{
      source:'Decisión docente con cotejo individual de gramática y diccionario',
      file:'cotejo-lexicografico-individual',
      topic:model.declension,unit:model.unit,
      caption:'Paradigma aprobado: '+id,
      status:'paradigma-documentado',vocabulaSha,
      vocabulaEntry:entry.id,vocabulaGroup:entry.units.join(', '),
      numberScope:'both',genderEvidence:'diccionario-y-decision-docente',
      references:model.sources,
      ...(model.restrictedVariants?{restrictedVariants:model.restrictedVariants}:{}),
      decisionId:'latin-'+id,teacherDecision:CHOICES[id],
      review:'conciliación interfuentes y decisión docente explícita; conservar adscripción filológica de variantes',
      notes:id==='domus'?
        'Tema mixto de cuarta y segunda; locativo singular individual. '+
        'Las variantes de uso restringido conservan su atribución histórica.':
        id==='cantus'?
          'Solo cuarta declinación: se excluye cualquier forma de segunda por homonimia.':
          'liber, librī (libro), distinto del adjetivo līber, lībera, līberum.'
    }
  };
}
function makeAthenaeRecord(entry,vocabulaSha){
  return {
    id:'griego-sustantivo-decision-athenai',
    language:'griego',unit:4,kind:'sustantivo',gender:'femenino',
    paradigm:'Ἀθῆναι, Ἀθηνῶν (αἱ) · 1.ª declinación, pluralia tantum',
    forms:formRows(athenaeForms,CASES_GRC,{numberScope:'plural'}),
    evidence:{
      source:'Logeion Morpho y cotejo con Wiktionary ático; ficha docente Vocabula',
      file:'cotejo-lexicografico-individual',unit:3,
      topic:'Primera declinación',caption:'Pluralia tantum: Ἀθῆναι',
      status:'paradigma-documentado',vocabulaSha,
      vocabulaEntry:entry.id,vocabulaGroup:entry.units.join(', '),
      numberScope:'plural',genderEvidence:'artículo plural αἱ y diccionario',
      references:[ATHENAI,ATHENAI_ATTIC],
      decisionId:'griego-athenai',teacherDecision:CHOICES.athenae,
      review:'conciliación interfuentes y decisión docente explícita; solo plural ático documentado',
      notes:'Solo cinco casos plurales áticos, sin inventar singular, dual ni variantes dialectales. '+
        'Se usa como nombre propio de Atenas, y no como singular Ἀθήνη.'
    }
  };
}
export function applyNominalTeacherDecisions({records,curriculum,vocabulaData,vocabulaSha,
  manifest}){
  assert.match(vocabulaSha,/^[a-f0-9]{40}$/);
  assert.equal(manifest?.schema,'schola-nominal-teacher-decisions/v1');
  assert.equal(manifest.status,'aprobado-por-docente');
  assert.deepEqual(manifest.choices,CHOICES,
    'La selección docente aprobada cambió; no sobrescribir decisiones automáticamente');
  const find=lexicalData(vocabulaData);
  assert.ok(curriculum.latin.units.find(u=>u.number===7)?.topics
    .some(t=>t.title==='Cuarta y quinta declinación'));
  assert.ok(curriculum.griego.units.find(u=>u.number===3)?.topics
    .some(t=>t.title==='Primera declinación'));
  const all=[...records];
  const ids=new Set(all.map(r=>r.id));
  const added=[],changed=[];
  for(const id of ['domus','cantus','liber']){
    const entries=find('lat1',id,id==='domus'?'UD 7':id==='cantus'?'UD 7':'UD 1');
    const entry=entries.find(x=>x.mode==='general')||entries[0];
    const r=makeLatinRecord(id,entry,latinModels[id],vocabulaSha);
    assert.ok(!ids.has(r.id),'Sustantivo duplicado: '+id);
    assert.ok(!all.some(x=>x.kind==='sustantivo'&&x.language==='latin'&&
      norm(x.paradigm.split(',')[0])===norm(id)),
      'El sustantivo ya estaba importado: '+id);
    all.push(r);ids.add(r.id);added.push(r);
  }
  const at=find('gr1','Ἀθῆναι','UD 1–4');
  const athenae=makeAthenaeRecord(at.find(x=>x.mode==='examen')||at[0],vocabulaSha);
  assert.ok(!all.some(x=>x.kind==='sustantivo'&&x.language==='griego'&&
    norm(x.paradigm.split(',')[0])===norm('Ἀθῆναι')));
  all.push(athenae);ids.add(athenae.id);added.push(athenae);
  for(const [lemma,choice,source] of [
    ['ἄνθρωπος',CHOICES.anthropos,ANTHROPOS],
    ['παῖς',CHOICES.pais,PAIS]]){
    const isAnthropos=lemma==='ἄνθρωπος';
    find('gr1',lemma,isAnthropos?'UD 1–4':'UD 8');
    const index=all.findIndex(r=>r.language==='griego'&&
      r.kind==='sustantivo'&&norm(r.paradigm.split(',')[0])===norm(lemma));
    assert.ok(index>=0,'Falta sustantivo previo que requiere decisión: '+lemma);
    const old=all[index];
    assert.ok(old.forms.length>=10,'No se puede autorizar concordancia sin declinación');
    assert.ok(!old.gender,'Se revisa el género ambiguo, no un género ya verificado');
    const genders=isAnthropos?['masculino']:['masculino','femenino'];
    const updated={...old,
      ...(isAnthropos?{gender:'masculino'}:{}),
      agreementGenders:genders,
      paradigm:old.paradigm.replace(' (género variable/no acreditado)',
        isAnthropos?' (ὁ, uso docente; también ἡ)':' (ὁ / ἡ)'),
      evidence:{...old.evidence,
        decisionId:isAnthropos?'griego-anthropos':'griego-pais',
        teacherDecision:choice,
        genderEvidence:isAnthropos?'masculino-prioritario-por-decision-docente':
          'doble-genero-lexicograficamente-documentado-y-aprobado',
        references:[...(old.evidence.references||[]),source],
        notes:old.evidence.notes+(isAnthropos?
          ' En esta PWA se exige el masculino en sintagmas, sin negar el femenino documentado.':
          ' Se admiten por separado ambos artículos y concordancias sin alterar la flexión.')
      }};
    all[index]=updated;changed.push({before:old,after:updated});
  }
  assert.equal(new Set(all.map(r=>r.id)).size,all.length);
  const stagedAdjectives=[{
    id:'latin-adjetivo-reserva-liber-free',
    language:'latin',kind:'adjetivo',unit:2,
    entry:'līber, lībera, līberum',
    lemma:'liber',meaning:'libre',
    status:'preparado-para-fase-de-adjetivos',
    source:LIBER_ADJ,
    note:'Se conserva la -e- en lībera/līberum; no confundir con liber, librī (libro).',
    notForGrading:true,teacherDecision:CHOICES.liber
  }];
  return {records:all,added,changed,stagedAdjectives,approved:{...CHOICES},
    audit:{added:added.length,modified:changed.length,
      stagedAdjectives:stagedAdjectives.length,sourceSha:vocabulaSha,
      approvedOn:manifest.date}
  };
}
