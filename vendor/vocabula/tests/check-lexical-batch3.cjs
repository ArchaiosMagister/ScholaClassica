'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const data=JSON.parse(read('data.js').replace(/^window\.VOCAB\s*=\s*/,'').replace(/;\s*$/,''));
const fixture=JSON.parse(read('tests/fixtures/lexical-reviewed-batch3.json'));
assert.equal(fixture.schema,1);
assert.equal(data.length,2055,'No debe alterarse el banco de fichas durante una revisión filológica');
assert.equal(fixture.entries.length,23,'Faltan correcciones en la tercera tanda');
const byId=new Map(data.map(x=>[x.id,x]));
assert.equal(byId.size,data.length,'Identificadores duplicados');
const seen=new Set();
for(const item of fixture.entries){
 assert.ok(!seen.has(item.id),'Corrección documentada duplicada: '+item.id);
 seen.add(item.id);
 const entry=byId.get(item.id);
 assert.ok(entry,'Ficha eliminada: '+item.id);
 for(const field of ['subject','mode','form','meaning'])assert.equal(entry[field],item[field],
  'Cambio no revisado en '+field+': '+item.id);
 assert.deepEqual(entry.answers,item.answers,'Respuestas diferentes de la revisión: '+item.id);
 assert.deepEqual(entry.units,item.units,'Unidades modificadas sin cotejo: '+item.id);
 assert.ok(entry.originals.includes(item.original),'Se perdió la transcripción del Word: '+item.id);
 assert.ok(item.reason.length>=50,'Motivación filológica insuficiente: '+item.id);
}
const get=id=>{const e=byId.get(id);assert.ok(e);return e};
assert.match(get('175b8ee20e894e64').form,/\(f\.\)$/,'regio debe ser femenino');
assert.equal(get('0f9958c17ec34638').form,'mŭlĭĕr, –eris (f.)');
for(const id of ['d12f8675168ccf23','31d2c68af2dfebc4','2f0bcb4a9625a493',
 '1fe4003daf27deff','850f9bdeaa90952a','7cbc482eb4519361']){
 assert.match(get(id).form,/\([mfn]\.\)$/,'Género acreditado ausente: '+id);
}
assert.equal(get('377cff54f6405cbe').form,'pūgno (1ª)');
for(const id of ['b1c335d769f39410','329d8c126e690d13'])
 assert.equal(get(id).form,'currō (3ª)');
assert.ok(!data.filter(x=>x.subject.startsWith('lat')).some(x=>/[\u0400-\u052f]/u.test(x.form)),
 'Letras cirílicas en lemas latinos');
const diaExam=get('97b52ffa6430c102'),diaGeneral=get('4035d2c61419e709');
assert.ok(diaExam.answers.includes('a causa de')&&diaExam.answers.includes('por'));
assert.ok(!diaExam.answers.includes('a través de'),
 'Un acusativo de διά no debe enseñar «a través de» como valor ordinario');
assert.ok(diaGeneral.answers.includes('a través de'));
assert.match(diaGeneral.meaning,/gen\./);assert.match(diaGeneral.meaning,/ac\./);
for(const id of ['942b84cdc685e912','e059866e05a0ccec',
 'e5d021ce1f858092','1559ff0ad3392e4f','ac253a215f0b7b92']){
 assert.match(get(id).meaning,/gen\./,'No consta el régimen de genitivo: '+id);
}
assert.ok(get('e14da738b7598fff').answers.includes('alrededor de'),
 'La acepción documentada en el Word debe mantenerse');
assert.deepEqual(get('cd5d60bfc3e67704').answers,
 ['junto a','al lado de','en','a lo largo de']);
assert.ok(!get('cd5d60bfc3e67704').answers.includes('a lado de'));
assert.ok(data.some(e=>e.subject==='lat4'&&e.form.startsWith('pā̆trĭa')),
 'No borrar cantidades variables documentadas sin cotejo');
console.log('OK tanda 3: 13 entradas de Latín 4.º, 10 de Griego; género, régimen y fuente cotejados.');
