'use strict';
// Solo consulta datos PÚBLICOS, sin crear palabras ni avisos de prueba.
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const config=readFileSync(join(__dirname,'../config.js'),'utf8');
const url=config.match(/window\.VOCAB_SERVICE\s*=\s*'([^']+)'/)?.[1];
assert.equal(url,'https://wpwlguufpkfnzlbyproe.supabase.co/functions/v1/vocabulary');
(async()=>{
 const response=await fetch(url,{method:'POST',
   headers:{'content-type':'application/json'},
   body:JSON.stringify({action:'public_words'}),
   signal:AbortSignal.timeout(20000)});
 assert.equal(response.status,200,'La consulta pública de vocabulario debe funcionar');
 const result=await response.json();
 assert.ok(Array.isArray(result.words),'Falta la lista de aportaciones activas');
 const ephesius=result.words.filter(word=>word.form==='Ephesius, –a, –um');
 assert.ok(ephesius.some(word=>word.subject==='lat1'&&word.active===true&&
   word.units.includes('UD 10')),'La aportación docente de Latín I no aparece para el alumnado');
 assert.ok(ephesius.some(word=>word.subject==='lat2'&&word.active===true&&
   word.units.includes('Adjetivos')),'La aportación docente de Latín II no aparece para el alumnado');
 assert.ok(result.words.every(word=>word.active===true),'La web no debe devolver palabras retiradas');
 console.log('OK: servicio público devuelve aportaciones docentes activas en Latín I y II');
})().catch(error=>{console.error(error);process.exitCode=1});
