import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';

// El build no modifica Appendix: comprueba las copias finales que ve el alumno.
const root=resolve(import.meta.dirname,'..');
const source=join(root,'vendor/appendix');
const target=join(root,'dist/apps/gramatica');
const read=(base,path)=>readFileSync(join(base,path),'utf8');
function row(html,from,label){
  const index=html.indexOf(from);
  assert.ok(index>=0,'Falta el paradigma '+from);
  const section=html.slice(index);
  const start=section.indexOf('<tr><th scope="row">'+label+'</th>');
  assert.ok(start>=0,'Falta la fila de '+label+' en '+from);
  const end=section.indexOf('</tr>',start);
  assert.ok(end>start);
  return section.slice(start,end+5);
}
for(const {locale,folder,currLatin,currGreek,original,search} of [
  {locale:'es',folder:'',currLatin:'assets/curriculum-latin1.json',
   currGreek:'assets/curriculum-griego1.json',original:'assets/curriculum.json',
   search:'assets/search-data.json'},
  {locale:'val',folder:'val',currLatin:'curriculum-latin1.json',
   currGreek:'curriculum-griego1.json',original:'curriculum.json',
   search:'search-data.json'}
]){
 test('Vocativos y excepción griega ES/VAL en los currículos integrados: '+locale,()=>{
   const base=join(target,folder);
   const l=JSON.parse(read(base,currLatin));
   const g=JSON.parse(read(base,currGreek));
   const latinHtml=l.latin.units[4].topics.find(t=>t.html?.includes('<caption>acer, acris, acre'))?.html;
   assert.ok(latinHtml,'Falta acer en Latín I UD5');
   const latinVoc=row(latinHtml,'<caption>acer, acris, acre',
     locale==='es'?'Vocativo':'Vocatiu');
   const cells=[...latinVoc.matchAll(/<td><i lang="la">([^<]+)<\/i><\/td>/gu)]
     .map(m=>m[1]);
   assert.deepEqual(cells,['acer','acris','acre','acres','acres','acria']);
   const greekHtml=g.griego.units[7].topics.find(t=>t.html?.includes('ἐλπίς, ἐλπίδος'))?.html;
   assert.ok(greekHtml,'Falta ἐλπίς en Griego I UD8');
   const voc=row(greekHtml,'ἐλπίς, ἐλπίδος',
     '<strong>'+(locale==='es'?'Vocativo':'Vocatiu')+'</strong>');
   assert.ok(voc.includes('<td>ἐλπί<sup>*</sup></td>'), 'Vocativo singular sin nota');
   assert.ok(voc.includes('<td>ἐλπίδ<strong>ες</strong></td>'), 'Vocativo plural alterado');
   assert.ok(greekHtml.includes('<strong>* '+(locale==='es'?'Excepción':'Excepció')+':</strong>'));
   assert.ok(greekHtml.includes('–ιδ') && greekHtml.includes('ἐλπίς') &&
      greekHtml.includes('ἐλπί'));
   const greekOriginal=read(base,original);
   assert.equal(greekOriginal,read(join(source,folder),original),
      'El currículo original no debe ser transformado');
   const indexed=JSON.parse(read(base,search)).find(x=>x.url==='griego-sustantivos.html');
   assert.ok(indexed?.text.includes((locale==='es'?'Vocativo':'Vocatiu')+' ἐλπί* ἐλπίδ ες'),
     'El buscador debe reflejar el vocativo anotado');
 });
}
