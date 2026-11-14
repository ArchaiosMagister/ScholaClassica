// Paradigmas escolares nominales para los lemas acreditados por las PAU.
// Los lemas y los temas son explícitos; solo se usan tablas regulares de
// declinación. La coincidencia de la forma examinada es una prueba obligatoria.
// La derivación regular no equivale a verificación individual de cada celda.
import assert from 'node:assert/strict';
import {latinFold} from './morphology-pau-latin2.mjs';
const CASES=['nominativo','vocativo','acusativo','genitivo','dativo','ablativo'];
const NUMBERS=['singular','plural'];
const GENDERS=['masculino','femenino','neutro'];
// Lema|enunciado|género|clase|tema nominal|marca i-stem
const NOUN_SOURCE=`
quaestor|quaestor, quaestoris|masculino|3m|quaestor
saltus|saltus, saltūs|masculino|4m|salt
piscis|piscis, piscis|masculino|3m|pisc|i
musica|musica, musicae|femenino|1f|music
pes|pes, pedis|masculino|3m|ped
obses|obses, obsidis|masculino|3m|obsid
segesta|Segesta, Segestae|femenino|1f|segest
circuitus|circuitus, circuitūs|masculino|4m|circuit
consulatus|consulatus, consulatūs|masculino|4m|consulat
aditus|aditus, aditūs|masculino|4m|adit
manus|manus, manūs|femenino|4m|man
pons|pons, pontis|masculino|3m|pont|i
motus|motus, motūs|masculino|4m|mot
mensis|mensis, mensis|masculino|3m|mens|i
lapis|lapis, lapidis|masculino|3m|lapid
praedo|praedo, praedonis|masculino|3m|praedon
acies|acies, aciei|femenino|5f|aci
luctus|luctus, luctūs|masculino|4m|luct
pedes|pedes, peditis|masculino|3m|pedit
deditio|deditio, deditionis|femenino|3m|dedition
vulnus|vulnus, vulneris|neutro|3n|vulner
flos|flos, floris|masculino|3m|flor
frigus|frigus, frigoris|neutro|3n|frigor
praetorium|praetorium, praetorii|neutro|2n|praetori
tumulus|tumulus, tumuli|masculino|2m|tumul
nectar|nectar, nectaris|neutro|3n|nectar
vigilia|vigilia, vigiliae|femenino|1f|vigili
fluctus|fluctus, fluctūs|masculino|4m|fluct
dedecus|dedecus, dedecoris|neutro|3n|dedecor
colonus|colonus, coloni|masculino|2m|colon
pugna|pugna, pugnae|femenino|1f|pugn
causa|causa, causae|femenino|1f|caus
cohors|cohors, cohortis|femenino|3m|cohort|i
fraus|fraus, fraudis|femenino|3m|fraud
clades|clades, cladis|femenino|3m|clad|i
pugio|pugio, pugionis|masculino|3m|pugion
lacrima|lacrima, lacrimae|femenino|1f|lacrim
administratio|administratio, administrationis|femenino|3m|administration
convivium|convivium, convivii|neutro|2n|convivi
libido|libido, libidinis|femenino|3m|libidin
praedo|praedo, praedonis|masculino|3m|praedon
victor|victor, victoris|masculino|3m|victor
`.trim().split('\n').map(x=>x.split('|'));

// Sustantivos pedidos en textos y práctica del Cuaderno de Latín II 2026–27.
// La i marca los parisílabos con genitivo plural -ium según su lema.
const CUADERNO_NOUNS=`
finis|finis, finis|masculino|3m|fin|i
frumentum|frumentum, frumenti|neutro|2n|frument
oppidum|oppidum, oppidi|neutro|2n|oppid
nuntius|nuntius, nuntii|masculino|2m|nunti
cursus|cursus, cursūs|masculino|4m|curs
adulescens|adulescens, adulescentis|masculino|3m|adulescent
subsidium|subsidium, subsidii|neutro|2n|subsidi
responsum|responsum, responsi|neutro|2n|respons
timor|timor, timoris|masculino|3m|timor
puer|puer, pueri|masculino|2m|puer
liber|liber, libri|masculino|2m|libr
tabula|tabula, tabulae|femenino|1f|tabul
consul|consul, consulis|masculino|3m|consul
cantus|cantus, cantūs|masculino|4m|cant
genu|genu, genūs|neutro|4n|gen
deus|deus, dei|masculino|2m|de
`.trim().split('\n').map(x=>x.split('|'));

const DECLS={'1f':'1.ª','2m':'2.ª','2n':'2.ª','3m':'3.ª','3n':'3.ª','4m':'4.ª','4n':'4.ª','5f':'5.ª'};
function caseMap(noun,stem,group,isIStem){
  const sg={
    '1f':[noun,noun,stem+'am',stem+'ae',stem+'ae',stem+'a'],
    '2m':[noun,noun.endsWith('er')||noun==='deus'?noun:(noun.endsWith('ius')?stem:stem+'e'),stem+'um',stem+'i',stem+'o',stem+'o'],
    '2n':[noun,noun,noun,stem+'i',stem+'o',stem+'o'],
    '3m':[noun,noun,stem+'em',stem+'is',stem+'i',stem+'e'],
    '3n':[noun,noun,noun,stem+'is',stem+'i',stem+'e'],
    '4m':[noun,noun,stem+'um',stem+'us',stem+'ui',stem+'u'],
    '4n':[noun,noun,noun,stem+'us',stem+'u',stem+'u'],
    '5f':[noun,noun,stem+'em',stem+'ei',stem+'ei',stem+'e']
  }[group];
  const pl={
    '1f':[stem+'ae',stem+'ae',stem+'as',stem+'arum',stem+'is',stem+'is'],
    '2m':[stem+'i',stem+'i',stem+'os',stem+'orum',stem+'is',stem+'is'],
    '2n':[stem+'a',stem+'a',stem+'a',stem+'orum',stem+'is',stem+'is'],
    '3m':[stem+'es',stem+'es',stem+'es',stem+(isIStem?'ium':'um'),stem+'ibus',stem+'ibus'],
    '3n':[stem+'a',stem+'a',stem+'a',stem+'um',stem+'ibus',stem+'ibus'],
    '4m':[stem+'us',stem+'us',stem+'us',stem+'uum',stem+'ibus',stem+'ibus'],
    '4n':[stem+'ua',stem+'ua',stem+'ua',stem+'uum',stem+'ibus',stem+'ibus'],
    '5f':[stem+'es',stem+'es',stem+'es',stem+'erum',stem+'ebus',stem+'ebus']
  }[group];
  assert.ok(sg&&pl);
  return [sg,pl];
}
export function compilePauSchoolNouns(exams,existing){
  const targets=new Set(exams.flatMap(q=>q.forms.map(latinFold)));
  const already=new Set(existing.filter(r=>r.language==='latin2'&&r.kind==='sustantivo')
    .map(r=>latinFold(r.headword.split(',')[0])));
  const result=[],seen=new Set();
  for(const [lemma,headword,gender,group,stem,ism] of [...NOUN_SOURCE,...CUADERNO_NOUNS]){
    if(seen.has(lemma))continue;seen.add(lemma);
    if(already.has(lemma))continue;
    const [sg,pl]=caseMap(lemma,stem,group,ism==='i');
    if(lemma==='deus'){
      sg[1]='deus';
      pl[0]='dei';pl[1]='dei';pl[2]='deos';
      pl[3]='deorum';pl[4]='deis';pl[5]='deis';
    }
    const forms=[];
    for(const [index,values] of [sg,pl].entries()){
      const number=NUMBERS[index];
      for(const [j,cas] of CASES.entries()){
        const form=values[j];
        forms.push({form,case:cas,gender,number,analysis:
          'sustantivo · '+headword+' · '+cas+' · '+gender+' · '+number+
          ' · '+DECLS[group]+' declinación'});
      }
    }
    const match=forms.some(f=>targets.has(latinFold(f.form)));
    if(!match)continue;
    assert.equal(forms.length,12);
    result.push({id:'latin2-pau-school-noun-'+lemma,language:'latin2',unit:0,
      kind:'sustantivo',headword,gender,paradigm:headword,forms,
      evidence:{source:'Paradigma escolar de declinación; PAU CV y Cuaderno de Latín II 2026–27',
        file:CUADERNO_NOUNS.some(x=>x[0]===lemma)?
          'shared/academic/latin2/cuaderno-2026-27-morfologia.tsv':
          'shared/academic/latin2/pau-cv-2006-2026.tsv',unit:0,
        topic:'Lemas examinados en PAU',caption:lemma,
        status:'paradigma-documentado',
        verification:'paradigma regular generado; formas no verificadas individualmente',
        notes:'Declinación completa solo para lemas con tema declarado; contraste de presencia de forma PAU.'}});
  }
  return result;
}
