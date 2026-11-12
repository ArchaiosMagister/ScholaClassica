import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const bank=join(root,'shared/academic/greek-etymology');
const read=path=>JSON.parse(readFileSync(join(bank,path),'utf8'));
const greekKey=value=>String(value).split(/[|,]/)[0].replace(/\s*\(.*/, '').normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/ς/g,'σ').trim();
const spanishKey=value=>String(value).normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('es');

export function auditEtymologicon() {
  const snapshot=read('source/gr1-generador.snapshot.json');
  const etymons=read('candidates/etymons.json');
  const derivatives=read('candidates/derivatives.json');
  const relations=read('candidates/relations.json');
  const gr1=read('courses/gr1.json');
  const gr2=read('courses/gr2.json');
  const editorial=read('editorial/decisions.json');
  const report=read('audit/reconciliation.json');
  const schema=read('model-v1.schema.json');

  assert.equal(snapshot.schema,'etymologicon-generator-source/v1');
  assert.equal(snapshot.course,'gr1');
  assert.match(snapshot.provenance.commit,/^[0-9a-f]{40}$/);
  assert.equal(snapshot.provenance.repository,'ArchaiosMagister/GeneradorExamenes');
  assert.equal(snapshot.provenance.symbol,'greekEtymologyUnits');
  assert.equal(snapshot.units.length,12);
  const records=snapshot.units.flat();
  assert.equal(records.length,117);
  for(const unit of snapshot.units)for(const row of unit)
    assert.ok(Array.isArray(row)&&row.length===2&&typeof row[0]==='string'&&typeof row[1]==='string');

  const ids=(data,field='id')=>new Set(data.map(x=>x[field]));
  assert.equal(ids(etymons.items).size,etymons.items.length,'Étimos duplicados');
  assert.equal(ids(derivatives.items).size,derivatives.items.length,'Derivados duplicados');
  assert.equal(ids(relations.items).size,relations.items.length,'Relaciones duplicadas');
  for(const data of [etymons,derivatives,relations]){
    assert.equal(data.schema,'etymologicon-candidates/v1');
    assert.equal(data.sourceCommit,snapshot.provenance.commit);
  }
  const byEtymon=new Map(etymons.items.map(e=>[e.id,e]));
  const byDerivative=new Map(derivatives.items.map(e=>[e.id,e]));
  const byRelation=new Map(relations.items.map(e=>[e.id,e]));
  const expectedEtym=new Map(),expectedDer=new Map(),expectedRel=new Map();

  snapshot.units.forEach((rows,index)=>rows.forEach(([form,raw],offset)=>{
    const eid='grc:'+greekKey(form),sourceRef='gr1:ud'+(index+1)+':entry'+(offset+1);
    if(!expectedEtym.has(eid))expectedEtym.set(eid,[]);
    expectedEtym.get(eid).push([form,sourceRef,index+1]);
    const entry=byEtymon.get(eid);
    assert.ok(entry,'Étimo del original no importado: '+form);
    assert.ok(entry.sourceReferences.includes(sourceRef),'Referencia de étimo no conservada: '+sourceRef);
    assert.ok(entry.sourceSpellings.includes(form),'Grafía original no conservada: '+form);
    for(const word of raw.split(',').map(x=>x.trim()).filter(Boolean)){
      const did='es:'+spanishKey(word),rid=eid+'→'+did;
      expectedDer.set(did,word);
      if(!expectedRel.has(rid))expectedRel.set(rid,[]);
      expectedRel.get(rid).push(sourceRef);
      assert.ok(byDerivative.has(did),'Derivado perdido: '+word);
      assert.ok(byRelation.has(rid),'Relación perdida: '+form+' / '+word);
      assert.ok(byRelation.get(rid).sourceReferences.includes(sourceRef),'Procedencia de relación perdida: '+rid);
    }
  }));
  assert.equal(etymons.items.length,expectedEtym.size);
  assert.equal(derivatives.items.length,expectedDer.size);
  assert.equal(relations.items.length,expectedRel.size);
  assert.equal(etymons.items.length,111);
  assert.equal(derivatives.items.length,196);
  assert.equal(relations.items.length,212);
  const legacyEligible=etymons.items.filter(e=>e.legacyHasTwoDerivatives).length;
  assert.equal(legacyEligible,105);
  assert.ok(etymons.items.every(e=>e.verificationStatus==='pending_review'&&e.eligible===false&&e.meaning===null&&
    e.orthographicVariants.length===0&&e.components.length===0),'Un étimo candidato ha sido aprobado sin evidencia');
  assert.ok(derivatives.items.every(e=>e.verificationStatus==='pending_review'&&e.definitions.length===0&&
    e.officialOrthographicVariants.length===0&&e.dleVerification==='not_checked'),'Definiciones o variantes sin evidencia');
  assert.ok(relations.items.every(e=>e.verificationStatus==='pending_review'&&e.relationType==='undetermined'&&
    e.eligibleFor.length===0),'Relación candidata elevada a válida sin auditoría');

  for(const rel of relations.items){
    assert.ok(byEtymon.has(rel.etymonId),'Relación con étimo huérfano');
    assert.ok(byDerivative.has(rel.derivativeId),'Relación con derivado huérfano');
    assert.deepEqual(rel.sourceReferences,expectedRel.get(rel.id),'Referencias de relación incongruentes');
  }
  assert.equal(gr1.course,'gr1');
  assert.equal(gr1.status,'pending_academic_audit');
  assert.equal(gr1.units.length,snapshot.units.length);
  gr1.units.forEach((u,i)=>{
    assert.equal(u.unit,'UD'+(i+1));
    assert.deepEqual(u.etymonIds,snapshot.units[i].map(r=>'grc:'+greekKey(r[0])));
  });
  assert.equal(gr2.course,'gr2');
  assert.equal(gr2.status,'awaiting_teacher_inventory');
  assert.deepEqual(gr2.units,[],'No hay inventario autorizado de Griego II');
  assert.equal(editorial.imported,false,'La auditoría docente todavía no está incorporada');
  assert.deepEqual(editorial.decisions,[],'No se deben presumir decisiones no contrastadas');
  assert.equal(report.referenceCommit,snapshot.provenance.commit);
  assert.equal(report.publicationAllowed,false);
  assert.equal(report.reportedExternalAudit.status,'not_individually_reconciled');
  assert.equal(report.reportedExternalAudit.uniqueEtymons,111);
  assert.equal(report.reportedExternalAudit.eligibleEtymons,108);
  assert.equal(report.reportedExternalAudit.admittedDerivatives,201);
  assert.equal(report.discrepancies.eligibleVersusLegacy,108-legacyEligible);
  assert.equal(report.discrepancies.derivativesVersusCurrent,201-expectedDer.size);
  assert.equal(report.current.distinctDerivativeForms,expectedDer.size);
  assert.equal(report.current.distinctEtymonDerivativeRelations,expectedRel.size);
  assert.equal(report.current.academicVerifiedRelations,0);
  for(const key of ['sourceRef','etymon','derivative','relation','course','catalog'])assert.ok(schema.$defs[key],'Esquema incompleto: '+key);
  assert.ok(byRelation.has('grc:γυνη→es:ginecólogo'),'Perdido el derivado de γυνή en UD10');
  assert.deepEqual(byEtymon.get('grc:φοβοσ')?.sourceSpellings,['φόβος','φοβός']);

  return {sourceCommit:snapshot.provenance.commit,units:snapshot.units.length,occurrences:records.length,
    etymons:expectedEtym.size,legacyEligible,derivatives:expectedDer.size,relations:expectedRel.size,
    academicVerifiedRelations:0,readyToPublish:false};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=auditEtymologicon();
  console.log('OK: inventario etimológico candidato verificado, sin aprobación filológica automática');
  console.log(JSON.stringify(result,null,2));
}
