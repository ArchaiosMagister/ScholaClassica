import test from 'node:test';
import assert from 'node:assert/strict';
import {readTeacherAudit,compileTeacherAudit} from '../scripts/compile-etymologicon-gr1.mjs';

test('la fuente editorial conserva 111 étimos, 202 filas de derivados y 22 decisiones',()=>{
 const original=readTeacherAudit();
 assert.equal(original.etymons.length,111);
 assert.equal(original.derivatives.length,202);
 assert.equal(original.decisions.length,22);
 assert.equal(original.file_sha256,'c2f16a97c305120be771e6aff71bf1649ffeee1171669e64660d25481e16adaf');
});
test('el banco cerrado editorial tiene 108 étimos elegibles, 201 derivados y 217 relaciones',()=>{
 const c=compileTeacherAudit();
 assert.equal(c.etymons.length,111);
 assert.equal(c.etymons.filter(x=>x.editorialStatus==='approved_for_documented_derivatives').length,108);
 assert.equal(c.derivatives.length,201);
 assert.equal(c.relations.length,217);
 assert.equal(c.excluded.length,1);
 assert.equal(c.editorialDecisions.length,22);
 assert.equal(c.status,'editorially_reconciled_not_published');
});
test('las correcciones, exclusiones y variantes registradas no se pierden',()=>{
 const c=compileTeacherAudit(),get=x=>c.derivatives.find(r=>r.form===x);
 const terms=new Set(c.etymons.map(x=>x.lemma));
 for(const x of ['θεός','φόβος','ψευδής, –ές','πρωκτός'])assert.ok(terms.has(x),x);
 for(const x of ['δῶρον','δίκη','παιδίον'])assert.equal(c.etymons.find(y=>y.lemma===x).editorialStatus,'reference_only');
 assert.deepEqual(c.excluded.map(x=>x.form),['heliópolis']);
 assert.deepEqual(get('icono').officialOrthographicVariants,['ícono']);
 assert.ok(get('políglota').officialOrthographicVariants.includes('poliglota'));
 assert.ok(get('seudónimo').officialOrthographicVariants.includes('pseudónimo'));
 assert.ok(get('ginecólogo'));
 assert.equal(c.greek2.etymons.length,0);
 assert.equal(c.correctionPolicy.unambiguousOrthographicError,0.5);
});
test('la fuente lexicográfica permanece diferenciada de una revisión directa aún pendiente',()=>{
 const c=compileTeacherAudit();
 assert.equal(c.summary.dictionarySourcesIndependentlyChecked,7);
 assert.equal(c.summary.greekMeaningsCompleted,57);
 assert.equal(c.summary.published,false);
 assert.ok(c.derivatives.every(x=>x.definitions.length===1&&!x.lexicalSource.checkedIndependently));
 assert.ok(c.relations.every(x=>!x.decompositionReady&&!x.inverseReady));
});
test('diferencias exactas frente al banco original del generador',()=>{
 const s=compileTeacherAudit().summary;
 assert.deepEqual(s.addedComparedWithGenerator,['atelectasia','atelocardia','geniogloso','helioterapia','prosodia','prosélito']);
 assert.deepEqual(s.removedComparedWithGenerator,['heliópolis']);
});
