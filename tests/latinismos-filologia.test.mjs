import test from 'node:test';import assert from 'node:assert/strict';
import {items} from '../public/apps/latinismos/banco.mjs';
import {matches,question,compatibleDistractor} from '../public/apps/latinismos/model.mjs';
test('anexo IV: numeración, variantes y grafías',()=>{
 assert.equal(items.length,87);assert.deepEqual(items.map(i=>i.number),Array.from({length:87},(_,i)=>i+1));
 for(const i of items){assert.equal(i.contexts.length,3);for(const v of i.variants)assert.ok(matches(i,v),v);}
 assert.ok(matches(items[8],'adenda'));assert.ok(matches(items[30],'ex profeso'));assert.ok(matches(items[40],'infraganti'));assert.ok(matches(items[63],'plácet'));assert.ok(matches(items[80],'suigéneris'));
 assert.ok(!matches(items[54],'motu propio'));assert.ok(!matches(items[33],'a grosso modo'));assert.ok(!matches(items[26],'etcetera'));assert.ok(!matches(items[78],'status quo'));
 assert.equal(items[26].italic,false);assert.equal(items[6].italic,true);
});
test('contexto: excluir otros adverbiales y expresiones próximas',()=>{
 for(const [a,b] of [[1,2],[5,31],[7,77],[40,48],[43,74],[23,82]])assert.equal(compatibleDistractor(items[a-1],items[b-1],'context'),false);
 for(const i of items){const q=question(i,items,'context',()=>.5);assert.equal(q.kind,'context');assert.equal(q.options.length,4);for(const o of q.options.filter(o=>o.id!==i.number))assert.ok(compatibleDistractor(i,items[o.id-1],'context'));}
});