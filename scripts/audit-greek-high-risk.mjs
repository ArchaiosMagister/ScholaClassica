// Cotejo independiente, casilla por casilla, de paradigmas áticos de riesgo.
// Las lecturas esperadas proceden de gramáticas publicadas, no se generan desde
// la tabla de Appendix ni se derivan por analogía.
import assert from 'node:assert/strict';

const SMYTH='https://grammars.alpheios.net/smyth/xhtml/body.1_div1.2_div2.4.html';
const CAMBRIDGE='https://www.cs.toronto.edu/~simon/Athens/Thucydides3/cgcg.pdf';
const CASES=['nominativo','vocativo','acusativo','genitivo','dativo'];
const GENDERS=['masculino','femenino','neutro'];
const noun=(id,source,rows)=>({id,kind:'sustantivo',unit:8,sources:[source],rows});
const adjective=(id,rows)=>({id,kind:'adjetivo',unit:5,
  sources:[SMYTH,CAMBRIDGE],rows});
export const GREEK_RISK_REFERENCE=Object.freeze([
  noun('griego-ud8-noun-113-0-0',SMYTH,[
    ['ἐλπίς','ἐλπίδες'],['ἐλπί','ἐλπίδες'],
    ['ἐλπίδα','ἐλπίδας'],['ἐλπίδος','ἐλπίδων'],
    ['ἐλπίδι',['ἐλπίσι','ἐλπίσιν']]
  ]),
  noun('griego-ud8-noun-115-0-1',SMYTH,[
    ['ἡγεμών','ἡγεμόνες'],['ἡγεμών','ἡγεμόνες'],
    ['ἡγεμόνα','ἡγεμόνας'],['ἡγεμόνος','ἡγεμόνων'],
    ['ἡγεμόνι',['ἡγεμόσι','ἡγεμόσιν']]
  ]),
  noun('griego-ud8-noun-119-0-0',SMYTH,[
    ['ῥήτωρ','ῥήτορες'],['ῥῆτορ','ῥήτορες'],
    ['ῥήτορα','ῥήτορας'],['ῥήτορος','ῥητόρων'],
    ['ῥήτορι',['ῥήτορσι','ῥήτορσιν']]
  ]),
  noun('griego-ud8-noun-119-1-0',SMYTH,[
    ['πατήρ','πατέρες'],['πάτερ','πατέρες'],
    ['πατέρα','πατέρας'],['πατρός','πατέρων'],
    ['πατρί',['πατράσι','πατράσιν']]
  ]),
  noun('griego-ud8-noun-119-1-1',SMYTH,[
    ['ἀνήρ','ἄνδρες'],['ἄνερ','ἄνδρες'],
    ['ἄνδρα','ἄνδρας'],['ἀνδρός','ἀνδρῶν'],
    ['ἀνδρί',['ἀνδράσι','ἀνδράσιν']]
  ]),
  adjective('griego-adj-polys',[
    ['πολύς','πολλή','πολύ','πολλοί','πολλαί','πολλά'],
    ['πολύς','πολλή','πολύ','πολλοί','πολλαί','πολλά'],
    ['πολύν','πολλήν','πολύ','πολλούς','πολλάς','πολλά'],
    ['πολλοῦ','πολλῆς','πολλοῦ','πολλῶν','πολλῶν','πολλῶν'],
    ['πολλῷ','πολλῇ','πολλῷ','πολλοῖς','πολλαῖς','πολλοῖς']
  ]),
  adjective('griego-adj-megas',[
    ['μέγας','μεγάλη','μέγα','μεγάλοι','μεγάλαι','μεγάλα'],
    [['μεγάλε','μέγας'],'μεγάλη','μέγα','μεγάλοι','μεγάλαι','μεγάλα'],
    ['μέγαν','μεγάλην','μέγα','μεγάλους','μεγάλας','μεγάλα'],
    ['μεγάλου','μεγάλης','μεγάλου','μεγάλων','μεγάλων','μεγάλων'],
    ['μεγάλῳ','μεγάλῃ','μεγάλῳ','μεγάλοις','μεγάλαις','μεγάλοις']
  ])
]);

const normalize=s=>String(s).normalize('NFC');
const clean=values=>[...new Set(values.map(normalize))].sort();
function readSlots(record){
  const index=new Map();
  for(const item of record.forms){
    const k=item.case+'|'+(item.gender||'')+'|'+item.number;
    if(!index.has(k))index.set(k,[]);
    index.get(k).push(item.form);
  }
  return index;
}
export function auditGreekRiskParadigms(bank){
  assert.ok(bank&&Array.isArray(bank.records),'Banco morfológico no disponible');
  const results=[];
  for(const ref of GREEK_RISK_REFERENCE){
    const record=bank.records.find(x=>x.id===ref.id);
    assert.ok(record,'Falta un paradigma de alto riesgo: '+ref.id);
    assert.equal(record.language,'griego',ref.id);
    assert.equal(record.kind,ref.kind,ref.id);
    assert.equal(record.unit,ref.unit,ref.id);
    const actual=readSlots(record);
    const expected=new Map();
    let cells=0,forms=0;
    for(let i=0;i<CASES.length;i++){
      const row=ref.rows[i];
      const width=ref.kind==='adjetivo'?6:2;
      assert.equal(row.length,width,'Referencia filológica incompleta '+ref.id);
      for(let n=0;n<width;n++){
        const number=ref.kind==='adjetivo'?(n<3?'singular':'plural'):
          (n===0?'singular':'plural');
        const gender=ref.kind==='adjetivo'?GENDERS[n%3]:'';
        const slot=CASES[i]+'|'+gender+'|'+number;
        const readings=clean(Array.isArray(row[n])?row[n]:[row[n]]);
        assert.ok(!expected.has(slot),'Casilla duplicada en matriz: '+ref.id+' '+slot);
        expected.set(slot,readings);
        assert.deepEqual(clean(actual.get(slot)||[]),readings,
          'Lectura de paradigma discordante: '+ref.id+' '+slot);
        cells++;forms+=readings.length;
      }
    }
    assert.equal(actual.size,cells,'El paradigma tiene casillas no cotejadas '+ref.id);
    results.push({id:ref.id,unit:ref.unit,
      kind:ref.kind,individualSlotsChecked:cells,
      individualReadingsChecked:forms,
      status:'contrastado-por-casilla-con-tabla-gramatical',
      independentReferences:ref.sources,
      observations:ref.id==='griego-adj-megas'?
        'Vocativo habitual μεγάλε; también se admite μέγας como variante atestiguada.':
        ref.id==='griego-ud8-noun-115-0-1'?
        'El vocativo singular es ἡγεμών, no ἡγεμόν.':null});
  }
  assert.equal(results.length,7);
  assert.equal(results.reduce((s,r)=>s+r.individualSlotsChecked,0),110);
  assert.equal(results.reduce((s,r)=>s+r.individualReadingsChecked,0),116);
  return {
    schema:'scholaclassica-greek-risk-individual-review/v1',
    date:'2026-11-15',course:'Griego I',
    totalParadigms:results.length,
    totalSlotsChecked:110,totalReadingsChecked:116,
    sourcePrinciple:'Referencia independiente por casilla; no equivale a testimonio en corpus por cada forma.',
    results
  };
}
