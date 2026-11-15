// Matriz individual conservadora para formas latinas todavía sin cotejo transversal.
// Los valores proceden de paradigmas escolares contrastados con A&G §§88-91,
// §98 y §§184-188. La matriz NO genera flexiones ni altera los bancos.
import assert from 'node:assert/strict';

export const LATIN_EXTRA_NOUNS=Object.freeze({
 exercitus:{
  singular:['exercitus','exercitus','exercitum','exercitūs','exercitui','exercitū'],
  plural:['exercitūs','exercitūs','exercitūs','exercituum','exercitibus','exercitibus'],
  docenteSingular:['exercitus','exercitus','exercitum','exercitus','exercitui','exercitu'],
  docentePlural:['exercitus','exercitus','exercitus','exercituum','exercitibus','exercitibus'],
  gender:'masculino'},
 cornu:{
  singular:['cornū','cornū','cornū','cornūs','cornū','cornū'],
  plural:['cornua','cornua','cornua','cornuum','cornibus','cornibus'],
  gender:'neutro'},
 res:{
  singular:['res','res','rem','rei','rei','re'],
  plural:['res','res','res','rerum','rebus','rebus'],
  gender:'femenino'}
});
export const LATIN_EXTRA_FUTURES=Object.freeze({
 activo:{
  amo:['amabo','amabis','amabit','amabimus','amabitis','amabunt'],
  habeo:['habebo','habebis','habebit','habebimus','habebitis','habebunt'],
  duco:['ducam','duces','ducet','ducemus','ducetis','ducent'],
  audio:['audiam','audies','audiet','audiemus','audietis','audient'],
  capio:['capiam','capies','capiet','capiemus','capietis','capient']},
 pasivo:{
  amo:['amabor','amaberis','amabitur','amabimur','amabimini','amabuntur'],
  habeo:['habebor','habeberis','habebitur','habebimur','habebimini','habebuntur'],
  duco:['ducar','duceris','ducetur','ducemur','ducemini','ducentur'],
  audio:['audiar','audieris','audietur','audiemur','audiemini','audientur'],
  capio:['capiar','capieris','capietur','capiemur','capiemini','capientur']},
 sum:['ero','eris','erit','erimus','eritis','erunt']
});
export const LATIN_EXTRA_DEPONENTS=Object.freeze({
 hortor:['hortor','hortaris','hortatur','hortamur','hortamini','hortantur'],
 vereor:['vereor','vereris','veretur','veremur','veremini','verentur'],
 sequor:['sequor','sequeris','sequitur','sequimur','sequimini','sequuntur'],
 patior:['patior','pateris','patitur','patimur','patimini','patiuntur'],
 orior:['orior','oriris','oritur','orimur','orimini','oriuntur']
});
export const LATIN_EXTRA_IMPERATIVES=Object.freeze({
 amo:['ama','amate'],habeo:['habe','habete'],duco:['duc','ducite'],
 audio:['audi','audite'],capio:['cape','capite']
});
export const LATIN4_DOCENT_IMPERFECTS=Object.freeze({
 ambulo:['ambulabam','ambulabas','ambulabat','ambulabamus','ambulabatis','ambulabant'],
 debeo:['debebam','debebas','debebat','debebamus','debebatis','debebant'],
 habeo:['habebam','habebas','habebat','habebamus','habebatis','habebant'],
 video:['videbam','videbas','videbat','videbamus','videbatis','videbant'],
 duco:['ducebam','ducebas','ducebat','ducebamus','ducebatis','ducebant'],
 lego:['legebam','legebas','legebat','legebamus','legebatis','legebant'],
 ludo:['ludebam','ludebas','ludebat','ludebamus','ludebatis','ludebant'],
 capio:['capiebam','capiebas','capiebat','capiebamus','capiebatis','capiebant'],
 audio:['audiebam','audiebas','audiebat','audiebamus','audiebatis','audiebant'],
 pugno:['pugnabam','pugnabas','pugnabat','pugnabamus','pugnabatis','pugnabant']
});
const CASES=['nominativo','vocativo','acusativo','genitivo','dativo','ablativo'];
const PERSONS=['1.ª singular','2.ª singular','3.ª singular','1.ª plural','2.ª plural','3.ª plural'];
const normalize=s=>String(s).normalize('NFC');
function one(records,id,language,unit,kind){
 const found=records.filter(r=>r.id===id);
 assert.equal(found.length,1,'Ficha no acreditada o duplicada '+id);
 const record=found[0];
 assert.equal(record.language,language,id);
 assert.equal(record.unit,unit,id);
 assert.equal(record.kind,kind,id);
 return record;
}
function check(record,expected,keyOf){
 const actual=new Map();
 for(const f of record.forms){
  const key=keyOf(f);
  assert.ok(!key.includes('undefined'),'Rasgo insuficiente: '+record.id+' '+key);
  const readings=actual.get(key)||[];
  readings.push(normalize(f.form));
  actual.set(key,readings);
 }
 for(const [key,accepted] of expected){
  const normalized=accepted.map(normalize).sort();
  assert.deepEqual((actual.get(key)||[]).sort(),normalized,
   'Casilla discordante en '+record.id+': '+key);
 }
 assert.equal(actual.size,expected.length,
  'Casilla no contrastada en '+record.id);
 return {id:record.id,course:record.language,unit:record.unit,
  slotsChecked:expected.length,readingsChecked:expected.reduce((n,x)=>n+x[1].length,0)};
}
const nounSlots=ref=>{
 const slots=[];
 for(const [number,rows] of [['singular',ref.singular],['plural',ref.plural]])
  for(let i=0;i<CASES.length;i++)slots.push([CASES[i]+'|'+number,[rows[i]]]);
 return slots;
};
const verbSlots=forms=>PERSONS.map((p,i)=>[p,[forms[i]]]);
const nominalKey=f=>f.case+'|'+f.number;
const verbalKey=f=>f.person;
const U4='https://dcc.dickinson.edu/grammar/latin/4th-declension-stem-paradigm-and-gender';
const U5='https://www.nationalarchives.gov.uk/latin/stage-1-latin/lessons/lesson-11-fourth-and-fifth-declension-nouns-days-of-the-week/';
const CONJ='https://grammars.alpheios.net/allen-greenough/conjugations.htm';
const DEP='https://dcc.dickinson.edu/grammar/latin/deponent-verbs';
const IRREG='https://dcc.dickinson.edu/grammar/latin/imperative';
export function auditLatinRemainingCurricularForms(bank){
 assert.ok(Array.isArray(bank?.records)&&bank.records.length>0,'Banco incompleto');
 const records=bank.records,nominal=[],future=[],deponent=[],imperative=[],teacherImperfect=[];
 for(const [lemma,ref] of Object.entries(LATIN_EXTRA_NOUNS)){
  for(const lang of ['latin','latin4']){
   const id=(lang==='latin'?'latin-ud7-':'latin4-appendix-latin-ud7-')+lemma;
   const row=one(records,id,lang,lang==='latin'?7:8,'sustantivo');
   if('gender'in row)assert.equal(row.gender,ref.gender);
   nominal.push({...check(row,nounSlots(ref),nominalKey),
    lemma,scope:'Appendix',source:lemma==='res'?U5:U4});
  }
  if(lemma!=='cornu'){
   const id='latin4-docente-lat-'+lemma,unit=8;
   const row=one(records,id,'latin4',unit,'sustantivo');
   assert.equal(row.gender,ref.gender);
   const withoutMacrons={
    singular:ref.docenteSingular||ref.singular,
    plural:ref.docentePlural||ref.plural
   };
   nominal.push({...check(row,nounSlots(withoutMacrons),nominalKey),
    lemma,scope:'modelo-docente',source:lemma==='res'?U5:U4});
  }
 }
 for(const [voice,all] of Object.entries(LATIN_EXTRA_FUTURES)){
  if(voice==='sum'){
   const row=one(records,'latin-ud7-futuro-sum','latin',7,'verbo');
   future.push({...check(row,verbSlots(all),verbalKey),
    lemma:'sum',voice:'activo',source:CONJ});
   continue;
  }
  for(const [lemma,forms] of Object.entries(all)){
   const id='latin-ud7-futuro-'+(voice==='activo'?'activa':'pasiva')+'-'+lemma;
   const row=one(records,id,'latin',7,'verbo');
   future.push({...check(row,verbSlots(forms),verbalKey),lemma,voice,source:CONJ});
  }
 }
 for(const [lemma,forms] of Object.entries(LATIN_EXTRA_DEPONENTS)){
  const row=one(records,'latin-ud7-deponente-'+lemma,'latin',7,'verbo');
  assert.ok(row.forms.every(f=>f.voice==='pasiva (deponente, sentido activo)' &&
    f.mood==='indicativo'),'Clasificación verbal alterada: '+lemma);
  deponent.push({...check(row,verbSlots(forms),verbalKey),lemma,source:DEP,
    note:lemma==='orior'?'oriris es la opción docente; otras fuentes recogen una variante.':null});
 }
 const imp=one(records,'latin-ud3-imperativos','latin',3,'verbo');
 const reference=[];
 for(const [lemma,forms] of Object.entries(LATIN_EXTRA_IMPERATIVES)){
  for(const [index,number] of ['singular','plural'].entries()){
   reference.push([lemma+'|'+number,[forms[index]]]);
  }
 }
 imperative.push({...check(imp,reference,f=>{
   const lemma=Object.keys(LATIN_EXTRA_IMPERATIVES).find(x=>f.analysis.includes(x+' ('));
   assert.ok(lemma,'Lemma de imperativo ausente');
   return lemma+'|'+f.number;
 }),source:IRREG});
 for(const [lemma,forms] of Object.entries(LATIN4_DOCENT_IMPERFECTS)){
  const row=one(records,'latin4-docente-lat-'+lemma+'-imperfect','latin4',4,'verbo');
  teacherImperfect.push({...check(row,verbSlots(forms),verbalKey),lemma,source:CONJ});
 }
 const sum=a=>a.reduce((n,x)=>n+x.slotsChecked,0);
 const count={nominal:nominal.length,futures:future.length,
  deponents:deponent.length,imperatives:imperative.length,teacherImperfect:teacherImperfect.length};
 const slots={nominal:sum(nominal),futures:sum(future),
  deponents:sum(deponent),imperatives:sum(imperative),teacherImperfect:sum(teacherImperfect)};
 assert.deepEqual(count,{nominal:8,futures:11,deponents:5,imperatives:1,teacherImperfect:10});
 assert.deepEqual(slots,{nominal:96,futures:66,deponents:30,imperatives:10,teacherImperfect:60});
 return {
  schema:'schola-latin-remaining-curricular-forms/v1',
  scope:'Latín I y Latín 4.º: modelos seleccionados de 4.ª/5.ª, futuro, deponentes, imperativos e imperfecto docente',
  counts:count,slots,readingsChecked:Object.values(slots).reduce((n,x)=>n+x,0),
  status:'cotejo-matricial-sin-certificacion-corpus',
  limitation:'Las formas se cotejan con tablas y gramáticas, no con ocurrencias textuales individuales.',
  findings:{
   sourceErrata:[],
   teacherReservations:[
    {lemma:'orior',matter:'Variante de segunda persona según fuente y criterio escolar',
     action:'Conservar oriris y la nota documentada; no promover variantes sin decisión.'}
   ]
  },
  results:{nominal,future,deponent,imperative,teacherImperfect}
 };
}
