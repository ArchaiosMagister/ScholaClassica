import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join,resolve} from 'node:path';
import {GRAMMAR_CORE} from '../scripts/build-gramatica-pwa.mjs';

const root=resolve(import.meta.dirname,'..');
const original=join(root,'.sources/appendix');
const integrated=join(root,'dist/apps/gramatica');
const read=(base,path)=>readFileSync(join(base,path),'utf8');

test('Appendix: el SHA de compilación y el del workflow coinciden con el origen real',()=>{
 const lock=JSON.parse(read(root,'config/sources.lock.json'));
 const head=execFileSync('git',['-C',original,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
 assert.equal(lock.sources.appendix.sha,head);
 const workflow=read(root,'.github/workflows/integracion.yml');
 assert.ok(workflow.includes('ref: '+head),'CI usa otra revisión de Appendix');
 assert.equal(lock.sources.appendix.integrated,true);
});

test('Las consultas latinas de Latín II conservan nexos, cursivas y subtipos en ES/VAL',()=>{
 const signatures=[];
 for(const prefix of ['', 'val/']){
  const chapter=read(integrated,prefix+'subordinadas.html');
  const guide=read(integrated,prefix+'conjunciones.html');
  const syntax=read(integrated,prefix+'sintaxis.html');
  assert.ok(chapter.includes('<h2 id="por-nexo">'),'Falta consulta por nexo: '+prefix);
  assert.ok(chapter.includes('class="article subordinate-chapter"'));
  assert.ok(guide.includes('class="article conjunction-guide"'));
  assert.ok(syntax.includes('class="card conjunction-card"'));
  for(const nexo of ['ut','ne','cum','quod','si','nisi']){
   assert.ok(chapter.includes('<i lang="la">'+nexo+'</i>'),
    'Nexo sin cursiva: '+nexo+' '+prefix);
   assert.ok(guide.includes('<i lang="la">'+nexo+'</i>'),
    'Guía sin cursiva: '+nexo+' '+prefix);
  }
  const items=(chapter.match(/<p class="subordinate-item">– /gu)||[]).length;
  assert.ok(items>=18,'Han desaparecido subtipos con guion: '+prefix);
  const conditional=chapter.split('<p id="condicionales" class="subordinate-type">')[1]||'';
  assert.ok(conditional.includes('<i lang="la">'),
   'Condicionales sin ejemplos latinos en cursiva: '+prefix);
  signatures.push(items);
  for(const path of ['sintaxis.html','conjunciones.html','subordinadas.html']){
   assert.ok(existsSync(join(original,prefix+path)));
   assert.ok(existsSync(join(integrated,prefix+path)));
  }
 }
 assert.equal(signatures[0],signatures[1],'Subtipos ES/VAL descompensados');
 const css=read(integrated,'assets/style.css');
 for(const name of ['.conjunction-card i[lang="la"]',
                    '.conjunction-guide i[lang="la"]',
                    '.subordinate-chapter i[lang="la"]',
                    '.subordinate-chapter .subordinate-item'])
  assert.ok(css.includes(name),'Estilo perdido: '+name);
});

test('Las seis páginas de sintaxis ES/VAL se precargan en caché propia',()=>{
 const sw=read(integrated,'sw.js');
 assert.match(sw,/const PREFIX="schola-gramatica-"/);
 assert.match(sw,/key.startsWith\(PREFIX\)/);
 assert.equal(new Set(GRAMMAR_CORE).size,GRAMMAR_CORE.length);
 for(const prefix of ['', 'val/']){
  for(const page of ['sintaxis.html','conjunciones.html','subordinadas.html']){
   const path='./'+prefix+page;
   assert.ok(GRAMMAR_CORE.includes(path),'Sin precaché: '+path);
   assert.ok(sw.includes('"'+path+'"'),'No aparece en service worker: '+path);
  }
 }
});
