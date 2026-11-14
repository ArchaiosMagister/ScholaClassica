// Parche local SOLO en el artefacto integrado, nunca en Appendix original.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
function once(s,a,b,label){
 assert.equal(s.split(a).length-1,1,'Cambió Appendix ('+label+')');
 return s.replace(a,b);
}
function change(s,regex,replacement,label){
 const all=new RegExp(regex.source,'gu');
 assert.equal((s.match(all)||[]).length,1,'Cambió Appendix ('+label+')');
 return s.replace(regex,replacement);
}
export function adaptLatin4App(source,locale){
 const es=locale==='es';
 source=once(source,
  "year:params.get('curso')==='2'?'2':params.get('curso')==='1'?'1':saved.year||'1',unit:1}",
  "year:params.get('curso')==='4'?'4':params.get('curso')==='2'?'2':params.get('curso')==='1'?'1':saved.year||'1',unit:1}",
  'Año en selector');
 source=once(source,
  "const maxUnits=language=>language==='griego'?14:10;",
  "if(selection.language==='griego'&&selection.year==='4')selection.year='1';\n"+
  "const maxUnits=(language,year)=>year==='4'&&language==='latin'?8:language==='griego'?14:10;",
  'Número de unidades');
 source=source.replaceAll('maxUnits(selection.language)',
  'maxUnits(selection.language,selection.year)');
 source=change(source,
  /const courseURL=\(language,year,unit=1\)=>[^\n]+;/u,
  'const courseURL=(language,year,unit=1)=>"curso.html?lengua="+language+"&curso="+year+(year==="2"?"":"&unidad="+unit);',
  'Rutas de curso');
 source=once(source,'let curriculum,visibleSearch=[],requestId=0;',
  'let curriculum,curriculumLatin4,visibleSearch=[],requestId=0;',
  'Carga de contenido');
 const titleTo=es?
  "const languageName=selection.language==='latin'?'Latín':'Griego';\n"+
  " const courseName=selection.year==='4'?'Latín · 4.º de ESO':languageName+' '+(selection.year==='1'?'I':'II');\n"+
  " document.title=courseName+' · Appendix grammaticæ';":
  "const languageName=selection.language==='latin'?'Llatí':'Grec';\n"+
  " const courseName=selection.year==='4'?\"Llatí · 4t d'ESO\":languageName+' '+(selection.year==='1'?'I':'II');\n"+
  " document.title=courseName+' · Appendix grammaticæ';";
 source=change(source,
  /const languageName=selection\.language==='latin'\?[^;\n]+;document\.title=[^\n]+;/u,
  titleTo,'Título de curso');
 source=change(source,
  /document\.querySelector\('#course-title'\)\.textContent=[^\n]+;updateSelectors\(\);/u,
  "document.querySelector('#course-title').textContent=courseName;updateSelectors();",
  'Título visible');
 if(!es)source=once(source,
  "document.querySelector('#course-title').textContent=courseName;updateSelectors();",
  "document.querySelector('#course-title').textContent=courseName;updateSelectors();"+
  "const translationNote=document.querySelector('main > .course-note');"+
  "if(translationNote)translationNote.hidden=selection.year==='4';",
  'Aviso antiguo de traducción en Valenciano');
 const asset=es?'assets/curriculum-latin4.json':'curriculum-latin4.json';
 const ordinary=es?'assets/curriculum.json?v=20261110-final1':
  'curriculum.json?v=20261110-final1';
 source=once(source,
  "try{curriculum??=await loadJSON('"+ordinary+"');if(ticket!==requestId)return;",
  "try{if(selection.year==='4')curriculumLatin4??=await loadJSON('"+asset+"');\n"+
  "  else curriculum??=await loadJSON('"+ordinary+"');\n"+
  "  if(ticket!==requestId)return;\n"+
  "  const currentUnits=selection.year==='4'?curriculumLatin4.latin.units:curriculum[selection.language].units;",
  'Carga de ocho unidades');
 source=once(source,
  'for(const unit of curriculum[selection.language].units.filter(u=>u.number<=selection.unit)){',
  'for(const unit of currentUnits.filter(u=>u.number<=selection.unit)){',
  'Progresión acumulativa');
 source=once(source,
  "selection={language,year,unit:language===selection.language?selection.unit:1};safeStorage.set(selection);",
  "selection={language,year:language==='griego'&&year==='4'?'1':year,"+
  "unit:language===selection.language&&year===selection.year?selection.unit:1};"+
  "selection.unit=Math.min(selection.unit,maxUnits(selection.language,selection.year));"+
  "safeStorage.set(selection);",
  'Formulario de curso');
 source=once(source,
  "const limited=page==='curso.html'&&selection.year==='1';",
  "const limited=page==='curso.html'&&selection.year!=='2';",
  'Búsqueda curricular');
 // 4.º de ESO solo es una opción del latín, no del griego.
 const before="for(const form of document.querySelectorAll('.course-selector'))form.addEventListener('submit',e=>{";
 const after="for(const form of document.querySelectorAll('.course-selector')){\n"+
  " const lang=form.elements.lengua,year=form.elements.curso;\n"+
  " const update=()=>{const option=year?.querySelector('option[value=\"4\"]');"+
  "if(option){option.disabled=lang.value!=='latin';"+
  "if(option.disabled&&year.value==='4')year.value='1';}};\n"+
  " lang?.addEventListener('change',update);update();\n"+
  "}\n"+before;
 source=once(source,before,after,'Opción de Griego');
 return source;
}
function addOption(source,locale){
 const before=locale==='es'?
  '<option value="1">1.º Bachillerato</option>':
  '<option value="1">1r de Batxillerat</option>';
 const label=locale==='es'?'4.º de ESO':"4t d'ESO";
 return once(source,before,'<option value="4">'+label+'</option>'+before,'Opción 4.º');
}
export async function adaptAppendixLatin4UI(destination){
 for(const [locale,folder] of [['es',''],['val','val']]){
  const root=join(destination,folder);
  const file=join(root,locale==='es'?'assets/app.js':'app.js');
  await writeFile(file,adaptLatin4App(await readFile(file,'utf8'),locale));
  for(const name of ['index.html','curso.html']){
   const path=join(root,name);
   let html=addOption(await readFile(path,'utf8'),locale);
   if(name==='index.html'){
    const direct=locale==='es'?
      '<p class="course-note"><a href="curso.html?lengua=latin&amp;curso=4&amp;unidad=1">Gramática de Latín · 4.º de ESO</a></p>':
      '<p class="course-note"><a href="curso.html?lengua=latin&amp;curso=4&amp;unidad=1">Gramàtica de Llatí · 4t d’ESO</a></p>';
    html=once(html,'<div class="hero-mark" aria-hidden="true">',
      direct+'<div class="hero-mark" aria-hidden="true">','Enlace de 4.º');
   }
   await writeFile(path,html);
  }
 }
}
