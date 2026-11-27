import test from 'node:test';import assert from 'node:assert/strict';
import {items} from '../public/apps/latinismos/banco.mjs';
import {fresh,recordSelf,record,mastered,question,check,cleanState} from '../public/apps/latinismos/model.mjs';
test('PAU: producción libre sin calificación automática ni efecto en dominio',()=>{
 const s=fresh();s.config.mode='pau';const q=question(items[6],items,'pau',()=>0);
 assert.equal(q.prompt,'ad Kalendas Graecas');assert.deepEqual(q.options,[]);assert.equal(check(q,'Nunca'),null);
 record(s,7,true);recordSelf(s,7,true);recordSelf(s,7,false);assert.equal(s.stats[7].correct,1);assert.equal(s.stats[7].wrong,0);assert.equal(mastered(s.stats[7]),false);assert.deepEqual(cleanState(s),s);
});