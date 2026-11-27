import test from 'node:test';
import assert from 'node:assert/strict';
import {items} from '../public/apps/latinismos/banco.mjs';
test('87 latinismos con numeración docente y 261 contextos únicos',()=>{
 assert.deepEqual(items.map(x=>x.number),Array.from({length:87},(_,i)=>i+1));
 assert.equal(new Set(items.map(x=>x.latinism)).size,87);
 assert.equal(items[6].latinism,'ad Kalendas Graecas');
 const contexts=items.flatMap(x=>{assert.ok(x.meaning.trim());assert.equal(x.contexts.length,3);return x.contexts});
 assert.equal(new Set(contexts).size,261);
 for(const c of contexts)assert.equal(c.split('___').length,2);
});
