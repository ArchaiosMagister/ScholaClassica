import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const file=join(root,'build/morfologia/paradigmas-preparados-sin-unidad.json');
const publicFile=join(root,'dist/apps/morfologia/data/paradigmas.json');
const staging=JSON.parse(readFileSync(file,'utf8'));
const bank=JSON.parse(readFileSync(publicFile,'utf8'));
test('conservar fuentes nominales completas sin falsear la unidad de 4.º o de Griego I',()=>{
  assert.equal(staging.schema,'schola-noun-staging/v1');
  assert.equal(staging.license,'CC BY-SA 3.0');
  assert.equal(staging.notForGrading,true);
  assert.equal(staging.counts.greek,staging.greek.length);
  assert.equal(staging.counts.latin4,staging.latin4.length);
  assert.ok(staging.greek.length>=5,'Existen lemas griegos completos sin unidad');
  assert.ok(staging.latin4.length>=10,'Conservar parte del banco de Latín 4.º sin publicarlo');
  for(const r of [...staging.greek,...staging.latin4]){
    assert.equal(r.kind,'sustantivo');
    assert.equal(r.unit,null);
    assert.equal(r.evidence.license,'CC BY-SA 3.0');
    assert.ok(r.forms.length>=10);
    assert.ok(['paradigma-sin-unidad','paradigma-sin-curso'].includes(r.evidence.status));
    assert.ok(!bank.records.some(b=>b.id===r.id),'Una ficha sin unidad no puede sortearse');
  }
  assert.ok(!existsSync(join(root,'dist/apps/morfologia/data/paradigmas-preparados-sin-unidad.json')));
});
test('auditoría por lema identifica las casillas sin fuente y las mantiene apartadas',()=>{
  const greek=JSON.parse(readFileSync(join(root,'build/morfologia/auditoria-sustantivos-griegos.json'),'utf8'));
  const lat=JSON.parse(readFileSync(join(root,'build/morfologia/auditoria-sustantivos-latinos.json'),'utf8'));
  assert.equal(greek.stagedWithoutUnit,staging.greek.length);
  assert.equal(lat.stagedLatin4,staging.latin4.length);
  assert.ok(greek.review.some(r=>r.missingSlots?.length>0));
  assert.ok(greek.review.some(r=>r.missingSlots?.length===10));
  assert.ok(greek.review.every(r=>r.missingSlots?.every(slot=>/^N;(?:NOM|VOC|ACC|GEN|DAT);(?:SG|PL)$/.test(slot))));
  assert.ok(!bank.records.some(r=>r.id.includes('-stage-')));
});
