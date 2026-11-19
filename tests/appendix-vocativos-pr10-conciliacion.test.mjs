import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const read=p=>readFileSync(join(root,p),'utf8').normalize('NFC');
const sources=['vendor/appendix','dist/apps/gramatica'];
const languages=[
 {prefix:'',voc:'Vocativo',nom:'Nominativo',note:'Excepción',curriculum:'assets/curriculum.json'},
 {prefix:'val/',voc:'Vocatiu',nom:'Nominatiu',note:'Excepció',curriculum:'val/curriculum.json'}
];

for(const folder of sources)for(const lang of languages){
 const label=folder+' / '+(lang.prefix?'valenciano':'castellano');
 test(label+': acer masculino y acris femenino preservados',()=>{
  const html=read(join(folder,lang.prefix+'adjetivos.html'));
  const correct='<tr><th scope="row">'+lang.voc+'</th><td><i lang="la">acer</i></td><td><i lang="la">acris</i></td>';
  assert.equal(html.split(correct).length-1,1,'Debe haber un único vocativo escolar masculino acer');
  assert.match(html,/<i lang="la">acer<\/i>/);
 });
 test(label+': ἐλπί vocativo con excepción visible y nominativo ἐλπίς',()=>{
  const html=read(join(folder,lang.prefix+'griego-sustantivos.html'));
  const voc='<strong>'+lang.voc+'</strong></th><td>ἐλπί<sup>*</sup></td><td>ἐλπίδ<strong>ες</strong>';
  const nom='<strong>'+lang.nom+'</strong></th><td>ἐλπί<strong>ς</strong> (–δς)';
  assert.ok(html.includes(voc),'Vocativo singular ἐλπί conservado con llamada a su nota');
  assert.ok(html.includes(nom),'Nominativo singular ἐλπίς conservado');
  assert.ok(html.includes('<strong>* '+lang.note+':</strong>'),'Explicación de excepción conservada');
  assert.ok(html.includes('<i lang="grc">ἐλπί</i>'),'La nota debe identificar el vocativo');
 });
 test(label+': currículo dinámico y capítulos fuente son coherentes',()=>{
  const raw=JSON.parse(read(join(folder,lang.curriculum)));
  const greek=raw.griego.units.flatMap(x=>x.topics||[]).map(x=>x.html||'').join('\n').normalize('NFC');
  assert.ok(greek.includes('<strong>'+lang.voc+'</strong></th><td>ἐλπί<sup>*</sup></td>'),
   'Currículo griego no sincronizado con la tabla original');
  assert.ok(greek.includes('<strong>* '+lang.note+':</strong>'),
   'La lección por unidades debe contener la explicación de la excepción');
  assert.ok(greek.includes('<strong>'+lang.nom+'</strong></th><td>ἐλπί<strong>ς</strong>'),
   'El nominativo no debe perder su sigma');
  const latin=raw.latin.units.flatMap(x=>x.topics||[]).map(x=>x.html||'').join('\n').normalize('NFC');
  if(lang.prefix){
   assert.ok(latin.includes('<tr><th scope="row">'+lang.voc+'</th><td><i lang="la">acer</i></td><td><i lang="la">acris</i></td>'),
    'La unidad valenciana debe conservar acer/acris');
  }
 });
}
