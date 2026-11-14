import test from 'node:test';
import assert from 'node:assert/strict';
import {mapEagles,parseLemlatXml,LEMLAT3_REVISION} from '../scripts/lemlat3-latin2.mjs';

const xml='<?xml version="1.0" encoding="ISO-8859-1"?>\n<LEMLAT>'+
'<Analyses><input_worform>civium</input_worform><analysed_worform>civium</analysed_worform>'+
'<Analysis><morphological_analyses><morphological_feats>--gmp--</morphological_feats></morphological_analyses>'+
'<Lemmas><Lemma lemma="civis" gen="m" codmorf="NcC" codlem="C" n_id="c0001" is_derived="false"/></Lemmas>'+
'</Analysis></Analyses>'+
'<Analyses><input_worform>amat</input_worform><analysed_worform>amat</analysed_worform>'+
'<Analysis><morphological_analyses><morphological_feats>a1--s3-</morphological_feats>'+
'<morphological_feats>c1--s3-</morphological_feats></morphological_analyses>'+
'<Lemmas><Lemma lemma="amo" gen="" codmorf="VmF" codlem="F" n_id="a0001" is_derived="true">'+
'<Rule id="1" type="x" category="y"><Lemma lemma="amator" codmorf="NcC" codlem="C" n_id="a0999" gen="m"/></Rule>'+
'</Lemma></Lemmas></Analysis></Analyses>'+
'<Analyses><input_worform>ignota</input_worform><analysed_worform>ignota</analysed_worform></Analyses>'+
'</LEMLAT>';

test('LEMLAT3: mapeo EAGLES documentado, sin asignar tiempos dudosos',()=>{
  assert.deepEqual(mapEagles('NcC','--gmp--'),['N','GEN','MASC','PL']);
  assert.deepEqual(mapEagles('VmF','a1--s3-'),['V','IND','ACT','PRS','SG','3']);
  assert.deepEqual(mapEagles('VmF','b1--s3-'),['V','IND','PASS','PRS','SG','3']);
  assert.deepEqual(mapEagles('Vmf','j1nms--'),['V','V.PTCP','ACT','PRS','NOM','MASC','SG']);
  assert.deepEqual(mapEagles('VmF','c5--s3-'),['V','SBJV','ACT','SG','3']);
  assert.deepEqual(mapEagles('PcC','--g2p--'),['PRO','GEN','MASC','FEM','PL']);
});
test('LEMLAT3: homografías, derivación y códigos originales conservados',()=>{
  const {evidence,report}=parseLemlatXml(xml,{allowedWords:['civium','amat','ignota']});
  assert.equal(evidence.length,3);
  assert.deepEqual(evidence.filter(x=>x.form==='amat').map(x=>x.features),[
    ['V','IND','ACT','PRS','SG','3'],['V','SBJV','ACT','PRS','SG','3']]);
  assert.ok(!evidence.some(x=>x.lemma==='amator'));
  assert.equal(evidence[0].reference,'LEMLAT3:c0001:A1:F1');
  assert.equal(evidence[0].revision,LEMLAT3_REVISION);
  assert.equal(evidence[0].nativeFeatures.includes('morphological_feats='),true);
  assert.equal(report.unrecognized[0],'ignota');
  assert.equal(report.notReturned.length,0);
  assert.throws(()=>parseLemlatXml(xml,{allowedWords:['civium']}),/ajena al lote/);
});
test('LEMLAT3: XML truncado y etiquetas imprevistas no generan falsos acuerdos',()=>{
  assert.throws(()=>parseLemlatXml(xml.slice(0,-9)),/incompleto/);
  const result=parseLemlatXml(xml.replace('a1--s3-','a1 -s3-'));
  assert.equal(result.report.invalidCodes,1);
  assert.equal(result.evidence.length,2);
});
