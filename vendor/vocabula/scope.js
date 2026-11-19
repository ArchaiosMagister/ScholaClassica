'use strict';
// Selección exacta: nunca se infieren unidades por prefijos, traducciones o proximidad.
function vocabularyForScope(entries,subject,mode,units,failedProgress=null){
 if(!Array.isArray(units)||!units.length)return [];
 const allowed=new Set(units);
 return entries.filter(e=>e.subject===subject&&e.mode===mode&&
  Array.isArray(e.units)&&e.units.some(unit=>allowed.has(unit))&&
  (!failedProgress||failedProgress[e.id]?.failed===true));
}
if(typeof module!=='undefined'&&module.exports)module.exports={vocabularyForScope};
