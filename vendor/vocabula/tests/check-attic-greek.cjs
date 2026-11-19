'use strict';
// Política del curso: griego ático clásico; no aceptar como equivalentes
// formas de la koiné, jónicas, dóricas, épicas o lemas homógrafos distintos.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const file=p=>fs.readFileSync(path.join(root,p),'utf8');
const data=JSON.parse(file('data.js').replace(/^window\.VOCAB\s*=\s*/,'').replace(/;\s*$/,''));
const review=JSON.parse(file('tests/fixtures/attic-reviewed-batch4.json'));
assert.equal(review.schema,1);
assert.equal(review.entries.length,27);
assert.equal(data.length,2055);
const ids=new Set();
for(const e of data){assert.ok(!ids.has(e.id));ids.add(e.id)}
const byId=new Map(data.map(e=>[e.id,e]));
for(const change of review.entries){
 const entry=byId.get(change.id);
 assert.ok(entry,'No existe la ficha revisada '+change.id);
 assert.equal(entry.subject,'gr1','Revisión ajena a Griego I');
 assert.equal(entry.mode,change.mode);
 assert.deepEqual(entry.units,change.units,'Se han modificado las unidades: '+change.id);
 assert.equal(entry.form,change.current.form,'Enunciado revertido: '+change.id);
 assert.equal(entry.meaning,change.current.meaning,'Traducción revertida: '+change.id);
 assert.deepEqual(entry.answers,change.current.answers,'Respuestas alteradas: '+change.id);
 assert.ok(entry.originals.includes(change.sourceOriginal),'Se ha perdido la lectura del Word: '+change.id);
 assert.ok(change.reason.length>40,'Falta motivación filológica: '+change.id);
 assert.ok(change.authority?.startsWith('https://'),'Falta enlace de verificación: '+change.id);
}
const forms=new Set(data.filter(e=>e.subject==='gr1').map(e=>e.form));
for(const correct of ['γένος, γένους (τὸ)','πέλαγος, πελάγους (τὸ)',
 'Σωκράτης, Σωκράτους (ὁ)','κεφαλή, –ῆς (ἡ)','πρᾶγμα, πράγματος (τὸ)',
 'κίνδυνος, –ου (ὁ)','Πρωταγόρας, –ου (ὁ)']){
 assert.ok(forms.has(correct),'Falta enunciado ático: '+correct);
}
const amph=byId.get('52e031d10d50cc04');
assert.ok(amph.form.includes('genitivo / acusativo'));
assert.ok(!amph.form.includes('dativo'),'No se debe enseñar ἀμφί + dativo como prosa ática');
assert.ok(amph.originals[0].includes('dativo'),'La fuente histórica debe seguir preservada');
const source=byId.get('46b910c9848d3d41');
assert.deepEqual(source.answers,['pedir','solicitar']);
assert.ok(!source.answers.includes('buscar'),'No confundir αἰτέω con ζητέω');
const ctx=vm.createContext({window:{}});
vm.runInContext(file('gramatica-importada.js'),ctx,{filename:'gramatica-importada.js'});
const {atticHeadKey,atticHeadMatches}=ctx.window.GrammarImported;
assert.equal(typeof atticHeadKey,'function');
for(const [sourceHead,dict,expected] of [
 ['νόμος','νόμος, –ου',true],['νομός','νόμος, –ου',false],
 ['δῆμος','δῆμος, –ου',true],['δημός','δῆμος, –ου',false],
 ['βίος','βίος, –ου',true],['βιός','βίος, –ου',false],
 ['παῖς','παῖς, παιδός',true],['πάϊς','παῖς, παιδός',false],
 ['ἱερὸν','ἱερόν, –οῦ (τὸ)',true],
 ['κεφαλή','κεφαλή, –ῆς (ἡ)',true],
 ['Ἑλληνικός','Ἑλληνικός, –ή, –όν',true],
 ['ἀλήθεια','ἀλήθεια, –ας',true]]){
 assert.equal(atticHeadMatches(sourceHead,dict),expected,
 'Confusión de lema o variante dialectal: '+sourceHead+' / '+dict);
}
// La importación comparte la misma política que la carga en el navegador.
const importer=file('scripts/import_unimorph.mjs');
assert.match(importer,/greekHeadKey\(head\)/,'La importación no comprueba el lema con acento');
assert.match(importer,/greekAuthorizedHeads/,'Falta el índice de lemas autorizados');
console.log('OK ático: 27 fichas revisadas, 3 lemas homógrafos separados y dativo no ático de ἀμφί excluido.');
