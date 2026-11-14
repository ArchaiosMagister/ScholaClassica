import test from 'node:test';
import assert from 'node:assert/strict';
import {latinEnunciationSegments} from '../public/morfologia/latin-typography.mjs';

const show=(q,s)=>latinEnunciationSegments(q,s);
const italic=parts=>parts.filter(p=>p.italic).map(p=>p.text);
const roman=parts=>parts.filter(p=>!p.italic).map(p=>p.text).join('');
const reconstructed=parts=>parts.map(p=>p.text).join('');

test('Latín II: solo presente, perfecto y supino en cursiva; conjugación en redonda',()=>{
  const q={language:'latin2',kind:'verbo',headword:'amo, amare, amavi, amatum (1.ª)',
    paradigm:'amo, amare, amavi, amatum (1.ª)'};
  const parts=show(q,'verbo · amo, amare, amavi, amatum (1.ª) · 1.ª persona · plural');
  assert.deepEqual(italic(parts),['amo, amavi, amatum']);
  assert.ok(roman(parts).includes('(1.ª) · 1.ª persona · plural'));
  assert.equal(reconstructed(parts),'verbo · amo, amavi, amatum (1.ª) · 1.ª persona · plural');
});
test('Deponentes: infinitivo de presente eliminado y perfecto compuesto en cursiva',()=>{
  const q={language:'latin2',kind:'infinitivo',headword:'utor, uti, usus sum (3.ª deponente)'};
  const parts=show(q,'infinitivo · utor, uti, usus sum (3.ª deponente) · futuro · voz activa');
  assert.deepEqual(italic(parts),['utor, usus sum']);
  assert.ok(roman(parts).includes('(3.ª deponente)'));
  assert.equal(reconstructed(parts),'infinitivo · utor, usus sum (3.ª deponente) · futuro · voz activa');
});
test('Sustantivos: enunciado en cursiva, género y declinación fuera',()=>{
  const q={language:'latin2',kind:'sustantivo',headword:'flumen, fluminis (n.)'};
  const original='sustantivo · flumen, fluminis (n.) · genitivo · neutro · singular · 3.ª declinación';
  const parts=show(q,original);
  assert.deepEqual(italic(parts),['flumen, fluminis']);
  assert.ok(roman(parts).includes('(n.)'));
  assert.equal(reconstructed(parts),original);
});
test('Adjetivos y pronombres latinos: toda la serie lexical en cursiva',()=>{
  for(const name of ['bonus, bona, bonum','qui, quae, quod','Ephesius, -a, -um']){
    const q={language:'latin2',kind:'adjetivo',headword:name};
    assert.deepEqual(italic(show(q,'adjetivo · '+name+' · nominativo')),[name]);
  }
});
test('Latín I y 4.º: enunciado latino en cursiva, comentarios curriculares en redonda',()=>{
  const q={language:'latin',kind:'sustantivo',paradigm:'rosa, rosæ · 1.ª declinación'};
  const parts=show(q,'rosa, rosæ · 1.ª declinación');
  assert.deepEqual(italic(parts),['rosa, rosæ']);
  assert.equal(reconstructed(parts),'rosa, rosæ · 1.ª declinación');
  const four={language:'latin4',kind:'sustantivo',paradigm:'corpus, corporis (n.)'};
  assert.deepEqual(italic(show(four,'corpus, corporis (n.)')),['corpus, corporis']);
});
test('En los sintagmas la conjunción + permanece en redonda',()=>{
  const q={language:'latin4',kind:'sustantivo',
    paradigm:'bonus, -a, -um + puella, -ae'};
  const parts=show(q,q.paradigm);
  assert.deepEqual(italic(parts),['bonus, -a, -um','puella, -ae']);
  assert.ok(roman(parts).includes(' + '));
  assert.equal(reconstructed(parts),q.paradigm);
});
test('El enunciado repetido mantiene exactamente el texto y la opción original',()=>{
  const q={language:'latin2',kind:'verbo',headword:'duco, ducere, duxi, ductum (3.ª)'};
  const raw='verbo · duco, ducere, duxi, ductum (3.ª) / verbo · duco, ducere, duxi, ductum (3.ª)';
  const parts=show(q,raw);
  assert.deepEqual(italic(parts),['duco, duxi, ductum','duco, duxi, ductum']);
  assert.equal(reconstructed(parts),
    'verbo · duco, duxi, ductum (3.ª) / verbo · duco, duxi, ductum (3.ª)');
  assert.equal(q.headword,'duco, ducere, duxi, ductum (3.ª)');
});
test('El griego, los títulos españoles y las desinencias no reciben marcas latinas',()=>{
  const greek={language:'griego',kind:'sustantivo',paradigm:'λόγος, λόγου'};
  assert.deepEqual(show(greek,'λόγος, λόγου'),[{text:'λόγος, λόγου',italic:false}]);
  const endings={language:'latin',kind:'desinencia',
    paradigm:'Desinencias personales pasivas'};
  assert.deepEqual(show(endings,'Desinencias personales pasivas'),
    [{text:'Desinencias personales pasivas',italic:false}]);
});
test('Irregulares: la indicación editorial permanece en redonda',()=>{
  const q={language:'latin2',kind:'verbo',headword:'sum, esse, fui (irregular)'};
  const parts=show(q,'sum, esse, fui (irregular)');
  assert.deepEqual(italic(parts),['sum, fui']);
  assert.equal(roman(parts),' (irregular)');
});
