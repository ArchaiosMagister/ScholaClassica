import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';

/**
 * Capa de ampliación: no altera el Excel auditado ni sus huellas, los étimos
 * curriculares, sus IDs ni los historiales personales existentes.
 * Solo permite relaciones explícitas de las fuentes docentes contrastadas.
 */
const expansionPath=join(resolve(import.meta.dirname,'..'),
  'shared/academic/greek-etymology/review/expansion-gr1-pdfs-20261113.json');
const spelling=s=>String(s).normalize('NFC').toLocaleLowerCase('es')
  .replace(/[\s\u200B-\u200D\uFEFF]/gu,'');
const WORD=/^[\p{L}\p{M}]+$/u;

export function readExpansion(){
  const data=JSON.parse(readFileSync(expansionPath,'utf8'));
  assert.equal(data.schema,'etymologicon-derived-expansion/v1');
  assert.equal(data.course,'gr1');
  assert.ok(Array.isArray(data.groups)&&data.groups.length>0);
  return data;
}

/**
 * Los nuevos derivados solo se admiten en los étimos ya aprobados.
 * Un término presente bajo varios étimos ocupa una única ficha castellana.
 * Las grafías oficiales ya existentes se respetan y nunca se duplican.
 */
export function expandGreekI(catalog,expansion=readExpansion()){
  assert.equal(catalog?.schema,'etymologicon-audited-catalog/v1');
  assert.equal(catalog.course,'gr1');
  assert.equal(expansion.schema,'etymologicon-derived-expansion/v1');
  assert.equal(expansion.course,'gr1');
  const result=structuredClone(catalog);
  const byGreek=new Map(result.etymons.map(e=>[e.id,e]));
  const byForm=new Map();
  const byId=new Map(result.derivatives.map(d=>[d.id,d]));
  const existingRelations=new Set(result.relations.map(r=>r.etymonId+'|'+r.derivativeId));
  for(const derivative of result.derivatives){
    for(const form of [derivative.form,...derivative.officialOrthographicVariants]){
      const normalized=spelling(form);
      assert.ok(!byForm.has(normalized)||byForm.get(normalized)===derivative.id,
        'Variante inicial ambigua: '+form);
      byForm.set(normalized,derivative.id);
    }
  }
  const used=new Set();
  let newDerivatives=0,newRelations=0;
  for(const row of expansion.groups){
    assert.ok(row&&typeof row.etymonId==='string'&&!used.has(row.etymonId),
      'Grupo repetido o incorrecto');
    used.add(row.etymonId);
    const etymon=byGreek.get(row.etymonId);
    assert.ok(etymon&&etymon.editorialStatus==='approved_for_documented_derivatives',
      'No se puede ampliar un étimo no aprobado: '+row.etymonId);
    assert.ok(Array.isArray(row.forms)&&row.forms.length>0,'Grupo sin respuestas');
    const unique=new Set();
    for(const raw of row.forms){
      assert.ok(typeof raw==='string'&&WORD.test(raw)&&raw===raw.trim(),
        'Grafía española inválida: '+raw);
      const form=raw.normalize('NFC'),key=spelling(form);
      assert.ok(!unique.has(key),'Repetición dentro del grupo: '+form);
      unique.add(key);
      let id=byForm.get(key);
      if(!id){
        id='es:'+form.toLocaleLowerCase('es');
        assert.ok(!byId.has(id),'ID castellano duplicado: '+id);
        const item={id,form,officialOrthographicVariants:[],
          editorialStatus:'teacher_audit_approved'};
        byId.set(id,item);
        byForm.set(key,id);
        result.derivatives.push(item);
        newDerivatives++;
      }
      if(existingRelations.has(etymon.id+'|'+id))continue;
      result.relations.push({
        id:etymon.id+'→'+id,etymonId:etymon.id,derivativeId:id,
        editorialStatus:'teacher_audit_approved',
        eligibleFor:['cards','match','multiple_choice','write_two','meaning','exam']
      });
      existingRelations.add(etymon.id+'|'+id);
      etymon.teacherApprovedDerivatives.push(id);
      newRelations++;
    }
  }
  assert.equal(result.etymons.length,catalog.etymons.length,'Nunca añadir étimos de Griego II');
  assert.equal(result.etymons.filter(e=>e.editorialStatus==='reference_only').length,3);
  for(const e of result.etymons){
    assert.equal(new Set(e.teacherApprovedDerivatives).size,e.teacherApprovedDerivatives.length,
      'Respuesta repetida: '+e.id);
  }
  assert.ok(newDerivatives>=100&&newRelations>=100,'Ampliación incompleta');
  return {...result,extension:{schema:expansion.schema,
    newDerivatives,newRelations,baseDerivatives:catalog.derivatives.length,
    baseRelations:catalog.relations.length}};
}
