import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const path=join(root,'shared/academic/greek-etymology/decomposition/gr1-pilot-v1.json');

/**
 * Banco independiente de composición. La autorización de 201 derivados como
 * respuestas de escritura NO autoriza automáticamente su descomposición.
 */
export function createDecompositionCatalog(catalog){
  assert.equal(catalog.schema,'etymologicon-audited-catalog/v1');
  assert.equal(catalog.course,'gr1');
  assert.equal(catalog.etymons.length,111);
  assert.equal(catalog.derivatives.length,201);
  assert.equal(catalog.relations.length,217);
  const pilot=JSON.parse(readFileSync(path,'utf8'));
  assert.equal(pilot.schema,'etymologicon-decomposition-pilot/v1');
  assert.equal(pilot.course,'gr1');
  assert.equal(pilot.publicationAllowed,false);
  assert.equal(pilot.items.length,16);
  const etyma=new Map(catalog.etymons.map(e=>[e.id,e]));
  const derivatives=new Map(catalog.derivatives.map(d=>[d.id,d]));
  const approvedLinks=new Set(catalog.relations
    .filter(r=>r.editorialStatus==='teacher_audit_approved')
    .map(r=>r.etymonId+'|'+r.derivativeId));
  const seen=new Set();
  const entries=pilot.items.map(row=>{
    assert.equal(row.verificationStatus,'approved_for_guided_decomposition');
    assert.equal(row.enabledForExams,false);
    assert.ok(!seen.has(row.derivativeId),'Derivado duplicado: '+row.derivativeId);
    seen.add(row.derivativeId);
    const derivative=derivatives.get(row.derivativeId);
    assert.ok(derivative&&derivative.editorialStatus==='teacher_audit_approved',
      'La palabra no está admitida: '+row.derivativeId);
    assert.equal(derivative.form,row.form);
    assert.equal(row.parts.length,2,'La fase piloto solo admite dos componentes');
    assert.equal(row.id,'decomp:gr1:'+row.form.normalize('NFD')
      .replace(/\p{M}/gu,'').replace(/[^a-z]/gi,''));
    assert.ok(typeof row.meaning==='string'&&row.meaning.length>20);
    assert.ok(/^https:\/\/dle\.rae\.es\//.test(row.evidence.url));
    assert.equal(row.evidence.checkedOn,'2026-11-12');
    assert.ok(row.evidence.editorialNote.length>20);
    assert.ok(new Set(row.parts.map(p=>p.etymonId)).size===2);
    let earliest=0;
    for(const part of row.parts){
      const etymon=etyma.get(part.etymonId);
      assert.ok(etymon&&etymon.editorialStatus==='approved_for_documented_derivatives',
        'Componente fuera del banco de Griego I: '+part.etymonId);
      assert.ok(part.greek.trim()&&part.gloss.trim()&&part.combiningForm.trim());
      assert.ok(Array.isArray(part.latinAccepted)&&part.latinAccepted.length>=1);
      assert.ok(part.latinAccepted.every(v=>/^[a-z]+$/.test(v)));
      assert.ok(new Set(part.latinAccepted).size===part.latinAccepted.length);
      assert.ok(Array.isArray(etymon.units)&&etymon.units.length>0);
      earliest=Math.max(earliest,Math.min(...etymon.units
        .map(u=>Number(u.replace('UD','')))));
    }
    assert.ok(row.parts.some(p=>approvedLinks.has(p.etymonId+'|'+row.derivativeId)),
      'Ni siquiera existe la relación docente original: '+row.derivativeId);
    assert.ok(earliest>=1&&earliest<=12,'Unidad de introducción incorrecta');
    return {
      id:row.id,derivativeId:row.derivativeId,form:row.form,meaning:row.meaning,
      parts:row.parts.map(p=>({etymonId:p.etymonId,greek:p.greek,
        gloss:p.gloss,latinAccepted:p.latinAccepted,
        combiningForm:p.combiningForm})),
      introducedAtUnit:'UD'+earliest,
      evidence:{authority:row.evidence.authority,url:row.evidence.url,
        route:row.evidence.route,editorialNote:row.evidence.editorialNote},
      verificationStatus:row.verificationStatus,
      enabledForExams:false
    };
  });
  assert.equal(entries.length,16);
  const other=catalog.derivatives.filter(d=>!seen.has(d.id)).map(d=>({
    derivativeId:d.id,status:'not_individually_checked_for_decomposition'
  }));
  assert.equal(other.length,185);
  return {
    schema:'etymologicon-decomposition-learners/v1',
    course:'gr1',sourceCatalog:'etymologicon-audited-catalog/v1',
    status:'closed_pilot_for_guided_practice_not_exam',
    entries,
    audit:{derivativesReviewedForEligibility:201,approvedForPractice:16,
      awaitingIndividualDecompositionReview:185,
      unreviewedDerivativeIds:other.map(x=>x.derivativeId)},
    publicationAllowed:false
  };
}

/**
 * Ampliación explícita: la lista histórica de 16 permanece inmutable.
 * Las voces nuevas se cruzan con el catálogo de escritura y el de consulta.
 * No se infieren ejercicios a partir de una coincidencia textual o de un PDF.
 */
export function createExpandedDecompositionCatalog(base,catalog,study,
  batch=JSON.parse(readFileSync(join(root,'shared/academic/greek-etymology/decomposition/gr1-review-batch-20261126.json'),'utf8')))){
  const pilot=createDecompositionCatalog(base);
  assert.equal(catalog.schema,base.schema);
  assert.equal(catalog.course,'gr1');
  assert.equal(study.schema,'etymologicon-study-catalog/v1');
  assert.equal(study.course,'gr1');
  assert.equal(batch.schema,'etymologicon-decomposition-review-batch/v1');
  assert.equal(batch.course,'gr1');
  assert.equal(batch.status,'approved_for_guided_practice_not_exam');
  assert.equal(batch.publicationAllowed,false);
  const etyma=new Map(catalog.etymons.map(e=>[e.id,e]));
  const words=new Map(study.words.map(w=>[w.form,w]));
  const derivatives=new Map(catalog.derivatives.map(d=>[d.id,d]));
  const relations=new Set(catalog.relations.filter(r=>r.editorialStatus==='teacher_audit_approved').map(r=>r.etymonId+'|'+r.derivativeId));
  const seen=new Set(pilot.entries.map(e=>e.derivativeId));
  const ids=new Set(pilot.entries.map(e=>e.id));
  const key=s=>s.normalize('NFD').replace(/\p{M}/gu,'').replace(/ς/g,'σ').toLowerCase();
  const newEntries=batch.items.map(row=>{
    assert.equal(row.enabledForPractice,true,row.form);
    assert.equal(row.enabledForExams,false,row.form);
    const word=words.get(row.form);
    assert.ok(word&&word.lexicographicStatus==='dle_consultado_individualmente',row.form);
    const derivative=derivatives.get(word.id);
    assert.ok(derivative?.editorialStatus==='teacher_audit_approved',row.form);
    assert.equal(derivative.form,row.form);
    assert.ok(!seen.has(word.id),row.form+' duplicado');
    seen.add(word.id);
    const id='decomp:gr1:'+row.form.normalize('NFD').replace(/\p{M}/gu,'').replace(/[^a-z]/gi,'');
    assert.ok(!ids.has(id),id+' duplicado');
    ids.add(id);
    assert.equal(row.components.length,2,row.form);
    assert.equal(word.components.length,2,row.form);
    assert.equal(new Set(row.components.map(p=>p.etymonId)).size,2,row.form);
    let earliest=0;
    const parts=row.components.map((part,i)=>{
      const etymon=etyma.get(part.etymonId),gloss=word.components[i];
      assert.ok(etymon?.editorialStatus==='approved_for_documented_derivatives',row.form);
      assert.equal(gloss.id,part.etymonId,row.form+' vínculo');
      assert.equal(key(gloss.greek),key(part.greek),row.form+' componente');
      assert.ok(!gloss.external&&!gloss.language,row.form);
      assert.ok(part.combiningForm.trim()&&gloss.gloss.trim(),row.form);
      assert.ok(part.latinAccepted.length>0&&part.latinAccepted.every(v=>/^[a-z]+$/.test(v)),row.form);
      assert.equal(new Set(part.latinAccepted).size,part.latinAccepted.length,row.form);
      if(part.greekAccepted)assert.ok(part.greekAccepted.every(v=>/^[\p{Script=Greek}\p{M}]+$/u.test(v)),row.form);
      earliest=Math.max(earliest,Math.min(...etymon.units.map(u=>Number(u.slice(2)))));
      return {...part,gloss:gloss.gloss};
    });
    assert.ok(parts.some(p=>relations.has(p.etymonId+'|'+word.id)),row.form);
    assert.equal(row.introducedAtUnit,'UD'+earliest,row.form);
    assert.ok(earliest>=1&&earliest<=12,row.form);
    assert.ok(row.meaning.length>20&&row.evidence.note.length>20,row.form);
    assert.equal(row.evidence.url,'https://dle.rae.es/'+encodeURIComponent(row.form));
    assert.match(row.evidence.checkedAt,/^\d{4}-\d{2}-\d{2}$/);
    return {id,derivativeId:word.id,form:row.form,meaning:row.meaning,parts,
      introducedAtUnit:row.introducedAtUnit,
      evidence:{...row.evidence,editorialNote:row.evidence.note,route:'documented_didactic_components'},
      verificationStatus:'approved_for_guided_decomposition',enabledForExams:false};
  });
  const entries=[...pilot.entries,...newEntries];
  const other=catalog.derivatives.filter(d=>!seen.has(d.id)).map(d=>d.id);
  return {...pilot,status:'expanded_guided_practice_not_exam',entries,
    audit:{catalogDerivatives:catalog.derivatives.length,approvedForPractice:entries.length,
      awaitingIndividualDecompositionReview:other.length,unreviewedDerivativeIds:other}};
}
