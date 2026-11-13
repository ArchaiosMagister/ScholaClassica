import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const read=p=>JSON.parse(readFileSync(join(root,p),'utf8'));
const lock=read('config/sources.lock.json');
const bank=read('dist/apps/morfologia/data/paradigmas.json');
const audit=read('build/morfologia/lote-unimorph-completo.json');
const original=read('build/morfologia/auditoria-unimorph-original.json');
test('consulta oficial fijada, no descarga o publicación del corpus íntegro',()=>{
  assert.equal(audit.schema,'schola-nominal-full-supplement/v1');
  assert.equal(audit.sources.griego,lock.sources.unimorphGrc.sha);
  assert.equal(audit.sources.latin,lock.sources.unimorphLat.sha);
  assert.equal(original.griego.sourceSha,lock.sources.unimorphGrc.sha);
  assert.equal(original.latin.sourceSha,lock.sources.unimorphLat.sha);
  assert.equal(original.griego.license,'CC BY-SA 3.0');
  assert.equal(original.latin.license,'CC BY-SA 3.0');
  assert.ok(original.griego.rows>=40000);
  assert.ok(original.latin.rows>=900000);
  assert.ok(original.griego.distinctMatchedLemmas>=80);
  assert.ok(original.latin.distinctMatchedLemmas>=250);
  for(const file of ['lat','grc']){
    assert.equal(existsSync(join(root,'dist/apps/morfologia/data/'+file)),false);
  }
});
test('cada ficha suplementaria enlaza inequívocamente a su SHA y no altera las previas',()=>{
  assert.ok(audit.imported.greek+audit.imported.latin>=0);
  const records=bank.records.filter(x=>x.evidence?.unimorphDatasetSha);
  assert.equal(records.length,audit.imported.greek+audit.imported.latin);
  assert.equal(new Set(records.map(r=>r.id)).size,records.length);
  for(const r of records){
    const sha=r.language==='griego'?audit.sources.griego:audit.sources.latin;
    assert.equal(r.evidence.unimorphDatasetSha,sha);
    assert.match(r.evidence.file,/^unimorph\/(grc\/grc|lat\/lat)$/);
    assert.equal(r.evidence.license,'CC BY-SA 3.0');
    assert.match(r.evidence.notes,/no generada por analogía/);
    assert.ok(r.unit>=1&&r.unit<=10);
    assert.ok(r.forms.length>=6);
    assert.ok(r.forms.every(f=>typeof f.form==='string'&&!f.form.includes('[')));
  }
});
