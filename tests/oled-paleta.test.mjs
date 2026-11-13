import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const read=path=>readFileSync(join(root,'dist',path),'utf8');
const rule=(css,selector)=>{
  const escaped=selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return css.match(new RegExp(escaped+'\\s*\\{([^}]*)\\}'))?.[1]||'';
};

test('portal y zona de profesor heredan los acentos del modo oscuro en OLED',()=>{
  const css=read('style.css');
  assert.match(css,/html:is\(\[data-theme="dark"\],\[data-theme="oled"\]\) \.linkgroup a\{/);
  assert.match(css,/html:is\(\[data-theme="dark"\],\[data-theme="oled"\]\) \.path-links a\{/);
  assert.match(css,/html:is\(\[data-theme="dark"\],\[data-theme="oled"\]\) \.portal-update\{/);
  assert.match(css,/html\[data-theme="oled"\]\{background:#000/);
  for(const selector of ['.linkgroup a','.path-links a','.portal-update','.tabs button[aria-selected="true"]']){
    assert.ok(!css.includes('html[data-theme="oled"] '+selector+'{'),
      'OLED no debe neutralizar '+selector);
  }
  const html=read('docente/index.html');
  const docente=read('docente/style.css');
  assert.match(html,/src="\.\.\/theme\.js"/);
  assert.match(docente,/html:is\(\[data-theme="dark"\],\[data-theme="oled"\]\) \.access-card button\.primary/);
});

test('morfología preserva teclas, aciertos, errores y botones coloreados',()=>{
  const css=read('apps/morfologia/style.css');
  for(const selector of [
    '.answers button','.answers button.correct','.answers button.incorrect',
    '.feedback','.secondary','.greek-key','.greek-key:hover:not(:disabled)',
    '.productive input.cell-correct','.productive input.cell-morphology'
  ]){
    assert.ok(css.includes('html:is([data-theme="dark"],[data-theme="oled"]) '+selector+'{'),
      'El selector oscuro debe compartirse en OLED: '+selector);
    assert.ok(!css.includes('html[data-theme="oled"] '+selector+'{'),
      'OLED no debe sustituir los colores de '+selector);
  }
  assert.match(css,/html\[data-theme="oled"\]\{background:#000/);
});

test('Etymologicon hereda la paleta completa: solo cambia fondos y sombras',()=>{
  const css=read('apps/etymologicon/style.css');
  assert.match(css,/:root:is\(\[data-theme="dark"\],\[data-theme="oled"\]\)\{/);
  const oled=rule(css,':root[data-theme="oled"]');
  assert.match(oled,/--bg:#000/);
  for(const token of ['accent','accent-hover','accent-contrast','success','success-bg','error','error-bg','warning'])
    assert.ok(!oled.includes('--'+token+':'),'No debe cambiar '+token);
  for(const page of ['index.html','practicar.html','estudio.html'])
    assert.match(read('apps/etymologicon/'+page),/style\.css/);
});

test('Appendix en castellano y valenciano mantiene colores latín/griego',()=>{
  const css=read('apps/gramatica/assets/style.css');
  const language=read('apps/gramatica/assets/language-colors.css');
  const theme=read('apps/gramatica/assets/theme.js');
  assert.match(css,/:root:is\(\[data-theme=dark\],\[data-theme=oled\]\)/);
  assert.match(language,/:root\[data-language=latin\]:is\(\[data-theme=dark\],\[data-theme=oled\]\)/);
  assert.match(language,/:root\[data-language=griego\]:is\(\[data-theme=dark\],\[data-theme=oled\]\)/);
  assert.match(language,/:root\[data-language\]\[data-theme=oled\]\{--paper:#000\}/);
  assert.match(theme,/new Option\('OLED','oled'\)/);
  assert.match(theme,/appendix-color-mode/);
  for(const page of ['index.html','curso.html','val/index.html','val/curso.html'])
    assert.match(read('apps/gramatica/'+page),/theme\.js/);
});

test('Vocabula integrado ofrece OLED con acento y botones de oscuro',()=>{
  const css=read('apps/vocabulario/style.css');
  const html=read('apps/vocabulario/index.html');
  const js=read('apps/vocabulario/theme.js');
  assert.match(css,/:root:is\(\[data-theme="dark"\],\[data-theme="oled"\]\)\{/);
  assert.match(css,/:root\[data-theme="oled"\]\{--paper:#000\}/);
  assert.match(html,/<option value="oled">OLED<\/option>/);
  assert.match(js,/valid=\['system','light','dark','oled'\]/);
  assert.match(js,/preference==='oled'\?'oled'/);
});

test('Evolutio usa las variables del oscuro en OLED y renueva caché',()=>{
  const css=read('apps/evolucion-fonetica/style.css');
  const worker=read('apps/evolucion-fonetica/sw.js');
  assert.match(css,/:root:is\(\[data-theme="dark"\],\[data-theme="oled"\]\)\s*\{/);
  const oled=rule(css,':root[data-theme="oled"]');
  assert.match(oled,/--bg:#000/);
  for(const token of ['accent','accent2','accentInk','warn','bad','good','chip','panel','panel2'])
    assert.ok(!oled.includes('--'+token+':'),'La paleta de oscuro debe mantenerse: '+token);
  assert.match(worker,/resultado-v3/);
});
