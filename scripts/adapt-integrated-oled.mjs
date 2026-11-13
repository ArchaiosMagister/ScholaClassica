import assert from 'node:assert/strict';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';

// Adaptaciones SOLO en dist: los repositorios fijados siguen inalterados.
// OLED usa exactamente la paleta interactiva de oscuro; se ennegrece el lienzo.
async function patch(directory,path,transform){
  const file=join(directory,path);
  const before=await readFile(file,'utf8');
  const after=transform(before);
  assert.notEqual(after,before,'No se encontró el contrato de tema en '+path);
  await writeFile(file,after,'utf8');
}
function replaceRequired(source,from,to,description){
  assert.ok(source.includes(from),'Cambió la estructura de '+description);
  return source.replace(from,to);
}

export async function adaptAppendixOled(destination){
  await patch(destination,'assets/style.css',css=>{
    assert.ok(css.includes(':root[data-theme=dark]'),'Falta el tema oscuro de Appendix');
    return css.replaceAll(':root[data-theme=dark]',
      ':root:is([data-theme=dark],[data-theme=oled])')+
      '\n/* OLED: conservar gramática y controles del modo oscuro, fondo negro puro. */\n'+
      '@media screen{:root[data-theme=oled]{--paper:#000}}\n';
  });
  await patch(destination,'assets/language-colors.css',css=>{
    assert.ok(css.includes('[data-theme=dark]'),'Faltan colores por lengua de Appendix');
    return css.replaceAll('[data-theme=dark]',
      ':is([data-theme=dark],[data-theme=oled])')+
      '\n/* Prioridad sobre los fondos latín/griego, también en valenciano. */\n'+
      '@media screen{:root[data-language][data-theme=oled]{--paper:#000}}\n';
  });
  await patch(destination,'assets/theme.js',js=>{
    let out=replaceRequired(js,"['system','light','dark']",
      "['system','light','dark','oled']",'temas disponibles Appendix');
    out=out.replaceAll("['system','light','dark']","['system','light','dark','oled']");
    return replaceRequired(out,
      "document.addEventListener('DOMContentLoaded',()=>{apply();const picker=document.getElementById('theme-mode');if(picker)picker.addEventListener('change'",
      "document.addEventListener('DOMContentLoaded',()=>{const picker=document.getElementById('theme-mode');if(picker&&!picker.querySelector('option[value=\"oled\"]'))picker.add(new Option('OLED','oled'));apply();if(picker)picker.addEventListener('change'",
      'selector de Appendix');
  });
  // Obligar a recuperar los nuevos CSS/JS sin alterar rutas ni datos de Appendix.
  const pages=(await readdir(destination,{recursive:true})).filter(path=>path.endsWith('.html'));
  let changed=0;
  for(const path of pages){
    const file=join(destination,path);
    const before=await readFile(file,'utf8');
    const after=before.replace(/(assets\\/(?:theme\\.js|style\\.css|language-colors\\.css)\\?v=[a-zA-Z0-9-]+)(?=["'])/g,'$1-oled1');
    if(after!==before){await writeFile(file,after,'utf8');changed++;}
  }
  assert.ok(changed>=4,'Faltan páginas de Appendix con recursos de tema');
}
export async function adaptVocabulaOled(destination){
  await patch(destination,'style.css',css=>{
    assert.ok(css.includes(':root[data-theme="dark"]'),'Falta el tema oscuro de Vocabula');
    return css.replaceAll(':root[data-theme="dark"]',
      ':root:is([data-theme="dark"],[data-theme="oled"])')+
      '\n/* OLED comparte todos los botones, acentos y estados con oscuro. */\n'+
      ':root[data-theme="oled"]{--paper:#000}\n';
  });
  await patch(destination,'theme.js',js=>{
    let out=replaceRequired(js,
      "valid=['system','light','dark']",
      "valid=['system','light','dark','oled']",'preferencias Vocabula');
    out=replaceRequired(out,
      "const dark=preference==='dark'||(preference==='system'&&media.matches);",
      "const dark=preference==='dark'||preference==='oled'||(preference==='system'&&media.matches);",
      'detección oscura Vocabula');
    out=replaceRequired(out,
      "document.documentElement.dataset.theme=dark?'dark':'light';",
      "document.documentElement.dataset.theme=preference==='oled'?'oled':dark?'dark':'light';",
      'aplicación de tema Vocabula');
    return replaceRequired(out,
      "if(meta)meta.content=dark?'#101b18':'#f6f4ed';",
      "if(meta)meta.content=preference==='oled'?'#000000':dark?'#101b18':'#f6f4ed';",
      'meta theme-color Vocabula');
  });
  await patch(destination,'index.html',html=>replaceRequired(html,
    '<option value="dark">Oscuro</option>',
    '<option value="dark">Oscuro</option><option value="oled">OLED</option>',
    'selector HTML Vocabula'));
}
export async function adaptEvolutioOled(destination){
  await patch(destination,'style.css',css=>{
    let out=replaceRequired(css,':root[data-theme="dark"] {',
      ':root:is([data-theme="dark"],[data-theme="oled"]) {',
      'paleta oscura Evolutio');
    // El antiguo OLED cambiaba acento, errores, aciertos y botones.
    out=replaceRequired(out,
      ':root[data-theme="oled"] { color-scheme: dark; --bg:#000000;--panel:#000000;--panel2:#111416;--ink:#f4f7f7;--muted:#aebbbc;--border:#394449;--accent:#9ce7de;--accent2:#123435;--accentInk:#032629;--warn:#ffd08b;--bad:#ffaaaa;--good:#9aeac1;--chip:#1d292c;--shadow:none; }',
      ':root[data-theme="oled"]{--bg:#000;--shadow:none}',
      'paleta OLED Evolutio');
    out=replaceRequired(out,
      ':root[data-theme="oled"] .site-header,:root[data-theme="oled"] .site-footer{border-color:#303b3d}',
      '', 'borde OLED Evolutio');
    return replaceRequired(out,
      ':root[data-theme="oled"] .brand-symbol{background:#135458;color:#fff}',
      '', 'marca OLED Evolutio');
  });
}
