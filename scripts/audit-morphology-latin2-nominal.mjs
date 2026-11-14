// Audita nominales sobre el banco compilado, no sobre un recuento aislado
// de grafías. Las tablas fuente (Cuaderno Latín II pp. 64–70) se contrastan
// con Allen & Greenough §§73–74, 88–91, 113–129. Los errores en el PDF no
// son base suficiente para sustituir una flexión académicamente acreditada.
import assert from 'node:assert/strict';
const fold=x=>String(x??'').toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'').replace(/æ/g,'ae').trim();
const choose=(records,head,kind)=>{
  const key=fold(head);
  return records.filter(r=>r.kind===kind&&fold(r.headword?.split(',')[0])===key);
};
const findForm=(record,form,cas,number,gender)=>
  record.forms.filter(f=>fold(f.form)===fold(form)&&f.case===cas&&
    f.number===number&&(!gender||f.gender===gender));
const EXPECTED=[
  // 3.ª declinación: temas en -i y consonante
  ['adjetivo','brevis','brevium','genitivo','plural','masculino'],
  ['adjetivo','brevis','brevi','ablativo','singular','femenino'],
  ['adjetivo','brevis','brevia','acusativo','plural','neutro'],
  ['adjetivo','acer','acrium','genitivo','plural','masculino'],
  ['adjetivo','acer','acri','ablativo','singular','femenino'],
  ['adjetivo','audax','audacia','nominativo','plural','neutro'],
  ['adjetivo','audax','audacium','genitivo','plural','femenino'],
  ['adjetivo','vetus','vetere','ablativo','singular','masculino'],
  ['adjetivo','vetus','veterum','genitivo','plural','neutro'],
  ['adjetivo','vetus','vetera','acusativo','plural','neutro'],
  ['adjetivo','supplex','supplicum','genitivo','plural','masculino'],
  ['adjetivo','supplex','supplice','ablativo','singular','femenino'],
  ['sustantivo','mare','maria','nominativo','plural','neutro'],
  ['sustantivo','mare','marium','genitivo','plural','neutro'],
  ['sustantivo','mare','mari','ablativo','singular','neutro'],
  ['sustantivo','finis','finium','genitivo','plural','masculino'],
  ['sustantivo','civis','civium','genitivo','plural','masculino'],
  ['sustantivo','adulescens','adulescentium','genitivo','plural','masculino'],
  // 4.ª declinación, neutros con dativo -u
  ['sustantivo','genu','genu','dativo','singular','neutro'],
  ['sustantivo','genu','genua','acusativo','plural','neutro'],
  ['sustantivo','genu','genuum','genitivo','plural','neutro'],
  ['sustantivo','cornu','cornu','dativo','singular','neutro'],
  ['sustantivo','cornu','cornua','acusativo','plural','neutro'],
  // Pronombres, numerales y sincretismos
  ['pronombre','alter','alteras','acusativo','plural','femenino'],
  ['pronombre','alter','alterius','genitivo','singular','neutro'],
  ['pronombre','alius','alias','acusativo','plural','femenino'],
  ['pronombre','alius','alterius','genitivo','singular','femenino'],
  ['pronombre','alius','alius','genitivo','singular','masculino'],
  ['adjetivo','duo','duae','nominativo','plural','femenino'],
  ['adjetivo','duo','duas','acusativo','plural','femenino'],
  ['adjetivo','unus','unius','genitivo','singular','femenino'],
  ['adjetivo','unus','uni','dativo','singular','neutro'],
  // Comparación irregular (§129)
  ['adjetivo','melior','melius','nominativo','singular','neutro'],
  ['adjetivo','melior','meliorum','genitivo','plural','masculino'],
  ['adjetivo','peior','peius','acusativo','singular','neutro'],
  ['adjetivo','maior','maius','nominativo','singular','neutro'],
  ['adjetivo','minor','minus','nominativo','singular','neutro'],
  ['adjetivo','plures','plurium','genitivo','plural','femenino'],
  ['adjetivo','optimus','optimarum','genitivo','plural','femenino'],
  ['adjetivo','pessimus','pessima','nominativo','plural','neutro'],
  ['adjetivo','maximus','maximos','acusativo','plural','masculino'],
  ['adjetivo','minimus','minimis','dativo','plural','femenino'],
  ['adjetivo','veterrimus','veterrimo','dativo','singular','masculino'],
  ['adjetivo','propior','propius','nominativo','singular','neutro'],
  ['adjetivo','proximus','proximae','nominativo','plural','femenino']
];
const FORBIDDEN=[
  ['sustantivo','genu','genui','dativo','singular','neutro'],
  ['adjetivo','brevis','brevum','genitivo','plural','masculino'],
  ['adjetivo','vetus','veterium','genitivo','plural','masculino'],
  ['adjetivo','supplex','supplicium','genitivo','plural','masculino','ordinaria'],
  ['pronombre','alter','alterae','acusativo','plural','femenino'],
  ['pronombre','alius','aliae','acusativo','plural','femenino'],
  ['adjetivo','duo','dua','nominativo','plural','femenino'],
  ['adjetivo','plures','plurus','nominativo','singular','masculino']
];
const auditReferences=[
  {page:64,source:'tercera declinación',judgment:'distinguir -ium / -um según lema'},
  {page:65,source:'genu',judgment:'dativo singular neutro genu, no genui'},
  {page:66,source:'brevis (gen. pl. -um, abl. sg. -e)',
    judgment:'errata del resumen: brevium y brevi (Allen & Greenough §114)'},
  {page:66,source:'audax y vetus',judgment:'-i y -ium frente a consonántico -e y -um'},
  {page:67,source:'vetus: veterior',judgment:'comparativo preferido vetustior (A&G §125); no sustituir sin criterio'},
  {page:67,source:'grados irregulares',judgment:'modelos bonus/melior/optimus y otros (§129)'},
  {page:70,source:'alterae (acusativo femenino plural)',judgment:'alteras'},
  {page:70,source:'aliae (acusativo femenino plural)',judgment:'alias'},
  {page:70,source:'dua (nominativo femenino)',judgment:'duae'}
];
function issue(list,code,record,form,details={}){
  list.push({code,record,form,...details});
}
export function auditLatin2Nominal(bank){
  assert.ok(bank&&Array.isArray(bank.records)&&bank.coverage?.latin2?.includes(0));
  const records=bank.records.filter(r=>r.language==='latin2');
  const nominal=records.filter(r=>['sustantivo','adjetivo','pronombre'].includes(r.kind));
  const blocking=[],review=[];
  for(const [kind,head,form,cas,number,gender] of EXPECTED){
    const candidates=choose(nominal,head,kind);
    if(!candidates.some(r=>findForm(r,form,cas,number,gender).length))
      issue(blocking,'EXPECTED_FORM_MISSING',head,form,{kind,case:cas,number,gender});
  }
  for(const [kind,head,form,cas,number,gender,usage] of FORBIDDEN){
    for(const r of choose(nominal,head,kind)){
      const matches=findForm(r,form,cas,number,gender);
      const wrong=usage==='ordinaria'?matches.filter(f=>!f.usage):matches;
      if(wrong.length)
        issue(blocking,'INCORRECT_FORM_ACCEPTED',r.id,form,
          {case:cas,number,gender,usage:usage||'errata'});
    }
  }
  for(const [kind,head,form,cas,number,gender] of [
    ['adjetivo','supplex','supplicium','genitivo','plural','masculino'],
    ['adjetivo','supplex','supplici','ablativo','singular','masculino'],
    ['sustantivo','adulescens','adulescentum','genitivo','plural','masculino'],
    ['pronombre','alius','alius','genitivo','singular','femenino']
  ]){
    const rows=choose(nominal,head,kind).flatMap(r=>
      findForm(r,form,cas,number,gender));
    if(!rows.length||!rows.every(f=>typeof f.usage==='string'&&f.usage.length>8)){
      issue(blocking,'RARE_VARIANT_NOT_LABELLED',head,form,
        {case:cas,number,gender});
    }
  }
  // El valor de un sustantivo no admite una deducción de género basada
  // solo en la desinencia. Conservamos las entradas propias de cada lema.
  for(const r of nominal.filter(r=>r.kind==='sustantivo'&&r.gender)){
    if(!r.forms.every(f=>f.gender===r.gender)){
      issue(blocking,'NOUN_INCONSISTENT_GENDER',r.id,r.headword);
    }
  }
  const irregular=choose(nominal,'plures','adjetivo');
  if(irregular.some(r=>r.forms.some(f=>f.number==='singular')))
    issue(blocking,'PLURES_INVENTED_SINGULAR','plures','singular');
  // Revisión posterior, no transformar posibilidad léxica en paradigma
  // comprobado: locativos, género contextual, dativos plurales raros.
  review.push({code:'NOMINAL_CONTEXT_AND_VARIANTS',
    scope:'Nombres comunes en género, alomorfía, variantes poéticas y locativos',
    status:'no se consideran verificados por el mero cotejo de la tabla escolar'});
  return {schema:'schola-latin2-nominal-audit/v1',
    scope:'Latín II · sustantivos, adjetivos, comparativos, pronombres y numerales',
    summary:{records:nominal.length,
      forms:nominal.reduce((n,r)=>n+r.forms.length,0),
      byCategory:Object.fromEntries(['sustantivo','adjetivo','pronombre'].map(
        kind=>[kind,nominal.filter(r=>r.kind===kind).length])),
      exactChecks:EXPECTED.length,exclusions:FORBIDDEN.length,
      reservedVariantChecks:4},
    blockingIssues:blocking,reviewIssues:review,
    referenceNotes:auditReferences,
    completeIndividualVerification:false};
}
export function assertLatin2NominalAuditPasses(report){
  assert.equal(report.blockingIssues.length,0,
    'Errores nominales bloqueantes: '+
      report.blockingIssues.map(x=>x.code+' '+x.record+' '+x.form).join('; '));
}
