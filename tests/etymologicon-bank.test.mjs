import test from 'node:test';
import assert from 'node:assert/strict';
import {auditEtymologicon} from '../scripts/validate-etymologicon.mjs';

test('la importación académica conserva todas las apariciones, relaciones y estados pendientes',()=>{
  const audit=auditEtymologicon();
  assert.equal(audit.etymons,111);
  assert.equal(audit.occurrences,117);
  assert.equal(audit.derivatives,196);
  assert.equal(audit.relations,212);
  assert.equal(audit.legacyEligible,105);
  assert.equal(audit.academicVerifiedRelations,0);
  assert.equal(audit.readyToPublish,false);
});
