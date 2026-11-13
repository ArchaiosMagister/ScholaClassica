import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {compileLatinNounExpansion,readLatinNounSource} from '../scripts/latin-noun-bulk.mjs';
import {availableRecords} from '../public/morfologia/engine.mjs';
import {correctWritten,evaluateTable} from '../public/morfologia/written.mjs';
const root=resolve(import.meta.dirname,'..');
const source=join(root,'.sources/vocabula');
const cfg=JSON.parse(readFileSync(join(root,'config/sources.lock.json'),'utf8'));
const curriculum=JSON.parse(readFileSync(join(root,'.sources/appendix/assets/curriculum.json'),'utf8'));
const vocabulaData=readFileSync(join(source,'data.js'),'utf8');
const {latinParts}=await readLatinNounSource(source);
const bank=JSON.parse(readFileSync(join(root,'dist/apps/morfologia/data/paradigmas.json'),'utf8'));
const base=bank.records.filter(r=>!r.id.startsWith('latin-sustantivo-import-'));
const compile=(mod={})=>compileLatinNounExpansion({curriculum,vocabulaData,latinParts,
  vocabulaSha:cfg.sources.vocabula.sha,existingRecords:base,...mod});
const result=compile();
const get=prefix=>result.records.find(r=>r.paradigm.toLowerCase().startsWith(prefix));

test('se recorre todo Vocabula latino y se separan Latín I / 4.º sin suplantar currículo',()=>{
  assert.ok(result.audit.candidateEntries>250);
  assert.ok(result.audit.latin4Staged>0);
  assert.ok(result.records.length>=10);
  assert.equal(result.audit.incorporated,result.records.length);
  assert.equal(result.audit.reviewNeeded,result.review.length);
  assert.equal(result.catalog.length,result.audit.nominalEnunciados);
  assert.equal(result.audit.sourceSha,cfg.sources.vocabula.sha);
  assert.ok(result.catalog.some(r=>r.course==='lat4'&&r.status==='pendiente'));
  assert.ok(!result.records.some(r=>r.course==='lat4'));
  const start=bank.records.findIndex(r=>r.id===result.records[0].id);
  assert.ok(start>=0);
  assert.deepEqual(bank.records.slice(start,start+result.records.length),result.records);
});

test('doce casillas con sincretismos y variantes explícitas; evidencia y unidades',()=>{
  for(const record of result.records){
    assert.equal(record.kind,'sustantivo');
    assert.equal(record.language,'latin');
    assert.ok(record.unit>=1&&record.unit<=10);
    assert.equal(record.evidence.license,'CC BY-SA 3.0');
    assert.equal(record.evidence.vocabulaSha,cfg.sources.vocabula.sha);
    assert.match(record.evidence.review,/pendiente de revisión docente/);
    const scope=record.evidence.numberScope||'both';
    assert.ok(['both','singular','plural'].includes(scope));
    assert.ok(record.forms.length>=(scope==='both'?12:6),
      'Debe documentar todos los casos del número habilitado');
    for(const cas of ['nominativo','vocativo','acusativo','genitivo','dativo','ablativo']){
      for(const number of (scope==='both'?['singular','plural']:[scope])){
        assert.ok(record.forms.some(f=>f.case===cas&&f.number===number),
          record.paradigm+' no tiene '+cas+' '+number);
      }
      if(scope!=='both')
        assert.ok(!record.forms.some(f=>f.case===cas&&f.number!==scope),
          'No interpolar casillas del número excluido');
    }
    assert.ok(record.forms.every(f=>f.form===f.form.normalize('NFC')));
    assert.ok(record.forms.every(f=>!/[\u0304\u0306]/u.test(f.form.normalize('NFD'))));
  }
});

test('los números no atestiguados nunca son inventados y las fuentes quedan marcadas',()=>{
  const defective=result.records.filter(r=>r.evidence.numberScope!=='both');
  assert.ok(defective.length>=4,'Debe recuperar nombres propios singulares documentados');
  for(const r of defective){
    assert.equal(r.forms.every(f=>f.number===r.evidence.numberScope),true);
    assert.match(r.evidence.notes,/sin inventar/);
  }
  const carthago=result.records.find(r=>r.paradigm.startsWith('Carthago,'));
  if(carthago){
    assert.equal(carthago.gender,'femenino');
    assert.match(carthago.evidence.genderEvidence,/diccionario/);
    assert.ok(carthago.evidence.editorialCorrection.source.includes('latin-dictionary.net'));
  }
});
test('nombres latinos presentes en los vocabularios del docente entran sin duplicar modelos',()=>{
  for(const lemma of ['agricola','vita','silva','verbum']){
    const r=get(lemma);
    assert.ok(r,lemma+' debe ser elegible');
  }
  const vita=get('vita');
  assert.ok(vita.forms.some(f=>f.case==='genitivo'&&f.number==='singular'&&f.form==='vitae'));
  assert.ok(vita.forms.some(f=>f.case==='acusativo'&&f.number==='plural'&&f.form==='vitas'));
  const agri=get('agricola');
  assert.equal(agri.gender,'masculino');
  assert.equal(agri.evidence.genderEvidence,'docente');
  assert.ok(!result.records.some(r=>/^rosa,/.test(r.paradigm)));
  assert.ok(!result.records.some(r=>/^bellum,/.test(r.paradigm)));
  assert.ok(!result.records.some(r=>/^dux,/.test(r.paradigm)));
});

test('no se anticipa morfología a unidades previas; el error detectado se aparta',()=>{
  assert.ok(result.review.some(r=>/UD10|posterior a UD10|no acreditad/i.test(r.reason)));
  const ud1=availableRecords(bank,{language:'latin',unit:1,kind:'sustantivo'});
  const ud7=availableRecords(bank,{language:'latin',unit:7,kind:'sustantivo'});
  assert.ok(ud7.length>ud1.length);
  assert.ok(ud7.every(r=>r.unit<=7));
  const altered=structuredClone(latinParts);
  let found=false;
  for(const part of altered){
    const i=part.findIndex(r=>r[0]==='agricola'&&r[2]==='N;DAT;PL');
    if(i>=0){part.splice(i,1);found=true;break}
  }
  if(found){
    const downgraded=compile({latinParts:altered});
    assert.ok(!downgraded.records.some(r=>r.paradigm.startsWith('agricola,')));
    assert.ok(downgraded.review.some(r=>r.lemma.toLowerCase().includes('agricola')));
  }
  assert.throws(()=>compile({vocabulaSha:'main'}),/SHA de Vocabula no fijado/);
});

test('las respuestas escritas latinas admiten formas completas y conservan variantes',()=>{
  const vita=get('vita');
  assert.ok(vita);
  const gen=vita.forms.find(f=>f.case==='genitivo'&&f.number==='singular');
  const q={activity:'written',language:'latin',acceptedForms:[gen.form],correct:gen.form};
  assert.equal(correctWritten(q,gen.form).correct,true);
  assert.equal(correctWritten(q,'vitam').correct,false);
});
