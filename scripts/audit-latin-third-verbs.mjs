// Cotejo preventivo de modelos escolares latinos de tercera declinación y
// tiempos indicativos. Referencias explícitas independientes de los bancos.
// NO altera datos, IDs, historia ni los repositorios originales.
import assert from 'node:assert/strict';
const NOUN_SOURCE='https://dcc.dickinson.edu/grammar/latin/3rd-declension-summary-i-stem-forms';
const VERB_SOURCE='https://dcc.dickinson.edu/grammar/latin/four-conjugations';
const FORM_SOURCE='https://dcc.dickinson.edu/grammar/latin/forms-conjugation';
const CASES=['nominativo','vocativo','acusativo','genitivo','dativo','ablativo'];
const PERSONS=['1.ª singular','2.ª singular','3.ª singular','1.ª plural','2.ª plural','3.ª plural'];
export const LATIN_NOMINAL_REFERENCE=Object.freeze([
 ['dux',[['dux','duces'],['dux','duces'],['ducem','duces'],['ducis','ducum'],['duci','ducibus'],['duce','ducibus']]],
 ['civis',[['civis','cives'],['civis','cives'],['civem',['cives','civis']],['civis','civium'],['civi','civibus'],['cive','civibus']]],
 ['flumen',[['flumen','flumina'],['flumen','flumina'],['flumen','flumina'],['fluminis','fluminum'],['flumini','fluminibus'],['flumine','fluminibus']]],
 ['mare',[['mare','maria'],['mare','maria'],['mare','maria'],['maris','marium'],['mari','maribus'],['mari','maribus']]],
 ['rex',[['rex','reges'],['rex','reges'],['regem','reges'],['regis','regum'],['regi','regibus'],['rege','regibus']]],
 ['corpus',[['corpus','corpora'],['corpus','corpora'],['corpus','corpora'],['corporis','corporum'],['corpori','corporibus'],['corpore','corporibus']]]
]);
export const LATIN_VERBAL_REFERENCE=Object.freeze([
 {tense:'presente',latinUnit:1,latin4Unit:2,voice:'activo',cells:{
  amo:['amo','amas','amat','amamus','amatis','amant'],habeo:['habeo','habes','habet','habemus','habetis','habent'],
  duco:['duco','ducis','ducit','ducimus','ducitis','ducunt'],audio:['audio','audis','audit','audimus','auditis','audiunt'],
  capio:['capio','capis','capit','capimus','capitis','capiunt'],sum:['sum','es','est','sumus','estis','sunt']}},
 {tense:'imperfecto',latinUnit:2,latin4Unit:4,voice:'activo',cells:{
  amo:['amabam','amabas','amabat','amabamus','amabatis','amabant'],
  habeo:['habebam','habebas','habebat','habebamus','habebatis','habebant'],
  duco:['ducebam','ducebas','ducebat','ducebamus','ducebatis','ducebant'],
  audio:['audiebam','audiebas','audiebat','audiebamus','audiebatis','audiebant'],
  capio:['capiebam','capiebas','capiebat','capiebamus','capiebatis','capiebant'],
  sum:['eram','eras','erat','eramus','eratis','erant']}},
 {tense:'presente',latinUnit:3,latin4Unit:6,voice:'pasivo',cells:{
  amo:['amor','amaris','amatur','amamur','amamini','amantur'],
  habeo:['habeor','haberis','habetur','habemur','habemini','habentur'],
  duco:['ducor','duceris','ducitur','ducimur','ducimini','ducuntur'],
  audio:['audior','audiris','auditur','audimur','audimini','audiuntur'],
  capio:['capior','caperis','capitur','capimur','capimini','capiuntur']}},
 {tense:'imperfecto',latinUnit:3,latin4Unit:6,voice:'pasivo',cells:{
  amo:['amabar','amabaris','amabatur','amabamur','amabamini','amabantur'],
  habeo:['habebar','habebaris','habebatur','habebamur','habebamini','habebantur'],
  duco:['ducebar','ducebaris','ducebatur','ducebamur','ducebamini','ducebantur'],
  audio:['audiebar','audiebaris','audiebatur','audiebamur','audiebamini','audiebantur'],
  capio:['capiebar','capiebaris','capiebatur','capiebamur','capiebamini','capiebantur']}},
 {tense:'perfecto',latinUnit:4,latin4Unit:6,voice:'activo',cells:{
  amo:['amavi','amavisti','amavit','amavimus','amavistis','amaverunt'],
  habeo:['habui','habuisti','habuit','habuimus','habuistis','habuerunt'],
  duco:['duxi','duxisti','duxit','duximus','duxistis','duxerunt'],
  audio:['audivi','audivisti','audivit','audivimus','audivistis','audiverunt'],
  capio:['cepi','cepisti','cepit','cepimus','cepistis','ceperunt'],
  sum:['fui','fuisti','fuit','fuimus','fuistis','fuerunt']}},
 {tense:'pluscuamperfecto',latinUnit:4,latin4Unit:7,voice:'activo',cells:{
  amo:['amaveram','amaveras','amaverat','amaveramus','amaveratis','amaverant'],
  habeo:['habueram','habueras','habuerat','habueramus','habueratis','habuerant'],
  duco:['duxeram','duxeras','duxerat','duxeramus','duxeratis','duxerant'],
  audio:['audiveram','audiveras','audiverat','audiveramus','audiveratis','audiverant'],
  capio:['ceperam','ceperas','ceperat','ceperamus','ceperatis','ceperant'],
  sum:['fueram','fueras','fuerat','fueramus','fueratis','fuerant']}}
]);
const norm=s=>String(s).normalize('NFC');
const ordered=a=>[...new Set(a.map(norm))].sort();
const values=x=>Array.isArray(x)?x:[x];
function slots(record,kind){
 const grouped=new Map();
 for(const f of record.forms){
  const key=kind==='noun'?f.case+'|'+f.number:f.person;
  assert.ok(typeof key==='string'&&key&&!key.includes('undefined'),record.id);
  grouped.set(key,[...(grouped.get(key)||[]),norm(f.form)]);
 }
 return grouped;
}
function single(records,test,desc){
 const matches=records.filter(test);
 assert.equal(matches.length,1,'Candidatura curricular ambigua o ausente: '+desc);
 return matches[0];
}
function nominal(records,language,lemma,unit){
 return single(records,r=>r.language===language&&r.unit===unit&&
  r.kind==='sustantivo'&&r.paradigm.startsWith(lemma+','),
  language+' '+lemma+' UD'+unit);
}
function verbal(records,language,lemma,group,unit){
 const ending=group.tense+(group.voice==='pasivo'?' pasivo':
  lemma==='sum'&&['presente','imperfecto'].includes(group.tense)?'':' activo');
 return single(records,r=>r.language===language&&r.unit===unit&&
  r.kind==='verbo'&&(language==='latin'||r.id.startsWith('latin4-appendix-'))&&
  (r.paradigm.startsWith(lemma+' ')||r.paradigm.startsWith(lemma+','))&&
  r.paradigm.endsWith(' · '+ending),
  language+' '+lemma+' '+ending+' UD'+unit);
}
function checked(record,expected,kind,label){
 const actual=slots(record,kind);
 const expectedKeys=new Set();
 let readings=0;
 for(const [key,forms] of expected){
  const right=ordered(values(forms));
  assert.deepEqual(ordered(actual.get(key)||[]),right,
   'Lectura divergente: '+record.id+' '+key+' ('+label+')');
  expectedKeys.add(key);readings+=right.length;
 }
 assert.equal(actual.size,expectedKeys.size,
  'Casillas adicionales no cotejadas '+record.id);
 return {id:record.id,course:record.language,unit:record.unit,
  slotsChecked:expectedKeys.size,readingsChecked:readings};
}
export function auditLatinNounsAndVerbs(bank){
 assert.ok(Array.isArray(bank?.records)&&bank.records.length>0);
 const records=bank.records,nounResults=[],verbResults=[],teacherResults=[];
 for(const [lemma,rows] of LATIN_NOMINAL_REFERENCE){
  for(const language of lemma==='rex'||lemma==='corpus'?['latin4']:['latin','latin4']){
   const unit=language==='latin'?4:5;
   const record=nominal(records,language,lemma,unit);
   const expected=CASES.flatMap((cas,i)=>
    ['singular','plural'].map((number,j)=>[cas+'|'+number,rows[i][j]]));
   nounResults.push({...checked(record,expected,'noun',lemma),lemma,
    sources:[NOUN_SOURCE]});
  }
 }
 for(const group of LATIN_VERBAL_REFERENCE){
  for(const [lemma,forms] of Object.entries(group.cells)){
   assert.equal(forms.length,6,'Faltan personas en referencia '+lemma);
   const expected=PERSONS.map((person,i)=>[person,forms[i]]);
   for(const language of ['latin','latin4']){
    const unit=language==='latin'?group.latinUnit:group.latin4Unit;
    verbResults.push({...checked(verbal(records,language,lemma,group,unit),
      expected,'verb',lemma+' '+group.tense),lemma,tense:group.tense,
      voice:group.voice,sources:[VERB_SOURCE,FORM_SOURCE]});
   }
  }
 }
 const docenteAmor=[
  ['lat-amo-present','presente','activo'],['lat-amo-imperfect','imperfecto','activo'],
  ['lat-amo-passive','presente','pasivo'],['lat-amo-perfect','perfecto','activo'],
  ['lat-amo-pluperfect','pluscuamperfecto','activo']
 ];
 for(const [id,tense,voice] of docenteAmor){
  const group=LATIN_VERBAL_REFERENCE.find(g=>g.tense===tense&&g.voice===voice);
  const r=single(records,x=>x.id==='latin4-docente-'+id,'fuente docente '+id);
  teacherResults.push({...checked(r,PERSONS.map((p,i)=>[p,group.cells.amo[i]]),
    'verb','docente '+id),lemma:'amo',tense,voice,sources:[VERB_SOURCE,FORM_SOURCE]});
 }
 const totals=arr=>({models:arr.length,slots:arr.reduce((n,x)=>n+x.slotsChecked,0),
  readings:arr.reduce((n,x)=>n+x.readingsChecked,0)});
 const count={nouns:totals(nounResults),verbs:totals(verbResults),
  teacher:totals(teacherResults)};
 assert.deepEqual(count,{
  nouns:{models:10,slots:120,readings:122},
  verbs:{models:68,slots:408,readings:408},
  teacher:{models:5,slots:30,readings:30}
 });
 return {schema:'schola-latin-third-verbal-selective-v1',
  scope:'Latín I y Latín 4.º de ESO',counts:count,
  sourceMode:'contraste de paradigma escolar, no certificación textual individual',
  unchangedOriginalBanks:true,
  results:{nouns:nounResults,verbs:verbResults,teacher:teacherResults},
  pending:['No se extrapolan estas matrices a verbos fuera de los seis modelos contrastados.',
   'Las variantes válidas no documentadas en estas tablas no quedan prohibidas.']};
}
