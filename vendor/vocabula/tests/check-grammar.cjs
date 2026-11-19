'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const win={};
function load(name,scope){
 const code=fs.readFileSync(path.join(root,name),'utf8');
 vm.runInNewContext(code,scope,{filename:name,timeout:15000});
}
const html=fs.readFileSync(path.join(root,'gramatica.html'),'utf8');
for(const script of ['gramatica-contenidos.js','gramatica-enunciados.js','gramatica-paradigmas.js','gramatica-latin-imperfectos.js','gramatica-griego-ampliacion.js','gramatica-importada.js','gramatica.js']){
 assert.ok(html.includes('src="'+script),'Falta cargar el módulo '+script);
}
assert.ok(html.includes('<option value="Morfología" selected>'),'El repaso debe empezar filtrado por morfología');
assert.ok(!html.includes('id="topic"'),'No se debe dividir la selección de unidades por temas');
assert.ok(html.indexOf('src="gramatica-paradigmas.js')<html.indexOf('src="gramatica-griego-ampliacion.js'),'La ampliación griega debe cargarse después de los paradigmas');
assert.ok(html.indexOf('src="gramatica-griego-ampliacion.js')<html.indexOf('src="gramatica.js'),'Los paradigmas griegos deben cargarse antes del motor de ejercicios');
load('data.js',{window:win});
load('gramatica-enunciados.js',{window:win});
load('gramatica-contenidos.js',{window:win});
load('gramatica-paradigmas.js',{window:win});
load('gramatica-latin-imperfectos.js',{window:win});
load('gramatica-griego-ampliacion.js',{window:win});
assert.equal(new Set(win.GRAMMAR_PARADIGMS.map(p=>p.id)).size,win.GRAMMAR_PARADIGMS.length,'IDs de paradigmas duplicados');
assert.equal(win.GRAMMAR_PARADIGMS.filter(p=>p.id.startsWith('gr-')&&p.units.gr1).length>=20,true,'Cobertura mínima de paradigmas griegos');
const els=new Map();
function element(id){
 if(!els.has(id))els.set(id,{
  value:{subject:'lat1',topic:'all',category:'all','answer-mode':'all',length:'10'}[id]||'',
  textContent:'',innerHTML:'',checked:false,disabled:false,
  querySelectorAll(){return []},focus(){}
 });
 return els.get(id);
}
const doc={getElementById:element};
const warnings=[];
load('gramatica.js',{window:win,document:doc,
 localStorage:{getItem(){return '{}'},setItem(){}},
 console:{warn(...args){warnings.push(args.join(' '))}}});
const d=win.GrammarPracticeDebug;
assert.ok(d,'Debe exponerse el conjunto de preguntas para auditoría');
assert.equal(warnings.length,0,'Ningún paradigma debe quedar sin tema');
assert.equal(d.exercises.find(q=>q.id==='gr1|UD 6|gr-infinitivo|inf|write').prompt,'Escribe infinitivo de presente activo de '+win.GrammarEnunciation.display('gr1','λύω',true)+'.','Enunciado de infinitivo claro');
assert.ok(Object.values(d.syllabi).every(units=>units.every(([unit])=>unit!=='UD 0')),'La unidad 0 debe desaparecer');
assert.ok(d.exercises.every(q=>q.unit!=='UD 0'),'No se deben crear ejercicios de UD 0');
const ids=new Set();
const uniquePrompts=new Set();
const greekUnits=new Set();
for(const p of win.GRAMMAR_PARADIGMS.filter(p=>p.id.startsWith('gr-'))){
 assert.ok(p.units.gr1,'Paradigma griego sin unidad: '+p.id);
 assert.ok(Object.values(p.forms).every(s=>typeof s==='string'&&s.length>0),'Forma vacía: '+p.id);
}

for(const q of d.exercises){
 if(q.subject==='gr1'&&q.category==='Morfología verbal')greekUnits.add(q.unit);
 if(q.mode==='write'){
  const key=[q.subject,q.unit,q.topic,q.prompt,q.answer].join('|');
  assert.ok(!uniquePrompts.has(key),'Ejercicio escrito duplicado: '+key);
  uniquePrompts.add(key);
 }
 assert.ok(q.id&&q.subject&&q.unit&&q.topic&&q.category&&q.prompt&&q.answer,q.id);
 assert.equal(ids.has(q.id),false,'ID duplicado: '+q.id);ids.add(q.id);
 assert.ok(d.syllabi[q.subject].some(([unit,topics])=>unit===q.unit&&topics.includes(q.topic)),'Tema fuera de currículo: '+q.id);
 if(q.mode==='choice'){
  assert.ok(q.options.length>=2,'Test sin alternativas: '+q.id);
  assert.equal(q.options.filter(x=>x===q.answer).length,1,'Solución de test no única: '+q.id);
  assert.equal(new Set(q.options).size,q.options.length,'Opciones duplicadas: '+q.id);
 }else{
  assert.ok(q.accepted.includes(d.norm(q.answer.split(' / ')[0].replaceAll('(ν)',''))),'Respuesta escrita no admitida: '+q.id);
 }
}
for(const [subject,units] of Object.entries(d.syllabi)){
 for(const [unit,topics]of units)for(const topic of topics){
  assert.ok(d.exercises.some(q=>q.subject===subject&&q.unit===unit&&q.topic===topic),'Falta apartado: '+subject+' '+unit+' '+topic);
 }
}
for(const unit of ['UD 1','UD 2','UD 6','UD 10','UD 11','UD 12','UD 13','UD 14']){
 assert.ok(greekUnits.has(unit),'Sin ejercicios de morfología verbal griega en '+unit);
}
for(const [id,feature,expected] of [
 ['gr-lyo-mid-imperfect','1.sg','ἐλυόμην'],
 ['gr-lyo-mid-future','2.pl','λύσεσθε'],
 ['gr-lyo-mid-aor','1.sg','ἐλυσάμην'],
 ['gr-lyo-pluperfect','1.sg','ἐλελύκειν'],
 ['gr-poieo-contract','3.sg','ποιεῖ'],
 ['gr-deloo-contract','3.sg','δηλοῖ']
]){
 const p=win.GRAMMAR_PARADIGMS.find(x=>x.id===id);
 assert.ok(p,'Falta el paradigma '+id);
 assert.equal(p.forms[feature],expected,'Flexión griega inesperada: '+id);
 assert.ok(d.exercises.some(q=>q.id.includes('|'+id+'|'+feature+'|write')&&q.accepted.includes(d.norm(expected))),'Flexión sin ejercicio autocorregible: '+id);
}
const imp1=d.exercises.filter(q=>q.subject==='lat1'&&q.unit==='UD 2'&&q.topic==='El imperfecto de indicativo'&&q.mode==='write');
const imp4=d.exercises.filter(q=>q.subject==='lat4'&&q.unit==='UD 4'&&q.topic==='El imperfecto'&&q.mode==='write');
assert.ok(new Set(imp1.map(q=>q.lemma)).size>=15,'Faltan verbos variados en el imperfecto de Latín I');
assert.ok(new Set(imp4.map(q=>q.lemma)).size>=9,'Faltan verbos variados en el imperfecto de 4.º ESO');
for(const q of [...imp1,...imp4]){
 assert.match(q.prompt,/, [^,]+, [^,]+ \((?:1ª|2ª|3ª|4ª|mx\.)\)\./,'Enunciado verbal incompleto: '+q.id);
 assert.ok(q.accepted.length>0,'Ejercicio no autocorregible: '+q.id);
}
assert.ok(imp1.some(q=>q.lemma==='duco'&&q.answer==='ducebam'),'Falta 3.ª conjugación');
assert.ok(imp1.some(q=>q.lemma==='dormio'&&q.answer==='dormiebam'),'Falta 4.ª conjugación');
const sample={gr1:400,lat1:550,lat4:280};
for(const [subject,minCount] of Object.entries(sample))assert.ok(d.exercises.filter(q=>q.subject===subject).length>=minCount,'Cobertura insuficiente en '+subject);
assert.ok(d.norm('λόγῳ')!==d.norm('λόγω'),'La iota suscrita debe conservarse');
assert.deepEqual(Array.from(d.variants('λύουσι(ν)')),['λυουσι','λυουσιν']);
assert.deepEqual(Array.from(d.variants('nostri / nostrum')),['nostri','nostrum']);
console.log('OK: '+ids.size+' ejercicios únicos y todos los apartados cubiertos.');
