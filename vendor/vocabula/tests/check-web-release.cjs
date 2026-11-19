'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const checked=new Set();

function existsLocal(raw,source){
 if(/^(?:https?:|mailto:|tel:|data:|#)/i.test(raw))return;
 assert.ok(!/^javascript:/i.test(raw),'Enlace inseguro en '+source);
 const clean=raw.split(/[?#]/)[0]||'./';
 assert.ok(!clean.startsWith('/'),'Ruta absoluta incompatible con GitHub Pages: '+raw+' en '+source);
 const resolved=path.resolve(root,clean==='./'?'index.html':clean);
 assert.ok(resolved.startsWith(root+path.sep),'Ruta fuera del sitio: '+raw);
 assert.ok(fs.existsSync(resolved),'Falta '+raw+' (en '+source+')');
 assert.ok(fs.statSync(resolved).isFile(),'No es un archivo: '+raw);
 checked.add(clean);
}
for(const page of ['index.html','gramatica.html','morfologia.html']){
 const html=fs.readFileSync(path.join(root,page),'utf8');
 assert.ok(html.includes('<meta charset="utf-8">'),'Falta codificación UTF-8 en '+page);
 for(const [,tag,url] of html.matchAll(/<(script|link|a)\b[^>]*?\b(?:src|href)=["']([^"']+)["'][^>]*>/g)){
  existsLocal(url,page+' <'+tag+'>');
 }
}
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.ok(/href="gramatica\.html"/.test(home),'La portada no enlaza a gramática');
for(const [name,html,active] of [['Vocabulario',home,'./'],['Gramática',fs.readFileSync(path.join(root,'gramatica.html'),'utf8'),'gramatica.html']]){
 assert.match(html,/aria-label="Secciones de estudio"/,'Navegación accesible: '+name);
 for(const [href,label] of [['./','Vocabulario'],['gramatica.html','Gramática']]){
  assert.ok(html.includes('class="study-tab" href="'+href+'"'),'Falta pestaña '+label+' en '+name);
 }
 assert.ok(html.includes('class="study-tab" href="'+active+'" aria-current="page"'),'La pestaña activa es incorrecta en '+name);
 for(const id of ['open-report','report-dialog']){
  assert.ok(html.includes('id="'+id+'"'),'Falta '+id+' en '+name);
 }
 for(const id of ['open-teacher','teacher-dialog','teacher-code']){
  assert.ok(!html.includes('id="'+id+'"'),'No debe publicarse '+id+' en '+name);
 }
}
assert.ok(/src="teacher\.js(?:\?[^"]*)?"/.test(home),'Falta módulo de avisos y sincronización de Vocabulario');
const page=fs.readFileSync(path.join(root,'gramatica.html'),'utf8');
for(const script of ['config.js','gramatica-admin.js'])assert.ok(page.includes('src="'+script),'Falta '+script+' en Gramática');
const loginCode=fs.readFileSync(path.join(root,'teacher.js'),'utf8');
const grammarAdmin=fs.readFileSync(path.join(root,'gramatica-admin.js'),'utf8');
for(const script of [loginCode,grammarAdmin]){
 assert.ok(!script.includes('MagisterArchaios'),'El alumnado no debe cargar identidades docentes');
 assert.ok(!script.includes('sessionStorage'),'El alumnado no debe conservar tokens docentes');
 assert.ok(!script.includes("api('login'"),'El login docente está retirado');
 assert.ok(script.includes("api('report'"),'El formulario de avisos debe seguir disponible');
}
const backend=fs.readFileSync(path.join(root,'backend/index.ts'),'utf8');
for(const removed of ['vocab_sessions','vocab_settings',"action==='login'","action==='save_word'","action==='teacher_words'"]){
 assert.ok(!backend.includes(removed),'Acceso heredado todavía operativo: '+removed);
}
assert.ok(backend.includes("action==='public_words'"));
assert.ok(backend.includes("action==='report'"));


assert.ok(/id="start"/.test(page)&&/id="practice"/.test(page),'Falta interfaz para realizar el ejercicio');
assert.ok(/id="errors"/.test(page),'Falta el modo de repaso de fallos');
const manifestPath='data/unimorph-syllabus/manifest.json';
existsLocal(manifestPath,'gramatica-importada.js');
const manifest=JSON.parse(fs.readFileSync(path.join(root,manifestPath),'utf8'));
let total=0;
for(const [lang,info] of Object.entries(manifest.languages)){
 assert.equal(info.files.length,info.part_count,'Número de fragmentos incorrecto: '+lang);
 for(const file of info.files){
  assert.ok(file.path.startsWith(lang+'/'),'Ruta de idioma incorrecta: '+file.path);
  const rel='data/unimorph-syllabus/'+file.path;
  existsLocal(rel,'manifiesto UniMorph');
  const rows=JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
  assert.ok(Array.isArray(rows),'Formato incorrecto: '+rel);
  assert.equal(rows.length,file.rows,'Filas inesperadas: '+rel);
  total+=rows.length;
 }
}
assert.ok(total>1000,'No se ha publicado el banco importado');
console.log('OK publicación: '+checked.size+' recursos locales y '+total+' flexiones importadas disponibles.');
