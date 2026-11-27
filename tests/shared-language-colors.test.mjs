import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
const out=resolve(import.meta.dirname,'../dist');
const read=p=>readFileSync(join(out,p),'utf8');
test('Portada distingue recursos grecolatinos, latinos y griegos',()=>{
 const html=read('index.html'),css=read('style.css');
 assert.equal((html.match(/class="card mixed"/g)||[]).length,4);
 assert.equal((html.match(/class="mixed" href=/g)||[]).length,4);
 assert.match(html,/class="card latin">\s*<p class="overline">Evolución fonética/);
 assert.match(html,/class="card greek">\s*<p class="overline">Etimología/);
 assert.ok(css.includes('linear-gradient(90deg, var(--mixed-green), var(--mixed-blue))'));
 assert.ok(css.includes('--mixed-blue-surface: #101b23'));
});
test('Las portadas de Appendix comparten paleta sin cambiar capítulos',()=>{
 const css=read('apps/gramatica/assets/language-colors.css');
 assert.ok(css.includes(':root:has(#home-language)[data-theme=oled]{--paper:#000}'));
 for(const page of ['index.html','val/index.html'])assert.ok(read('apps/gramatica/'+page).includes('id="home-language"'));
 for(const page of ['morfologia.html','griego-morfologia.html'])assert.ok(!read('apps/gramatica/'+page).includes('id="home-language"'));
});
test('Los módulos mixtos tienen cabeceras grecolatinas en sus CSS compilados',()=>{
 for(const mod of ['vocabulario','repaso-gramatica']){
  const css=read('apps/'+mod+'/style.css');
  assert.ok(css.includes('linear-gradient(90deg,var(--shared-latin),var(--shared-greek))'));
  assert.ok(css.includes('--shared-blue-wash:#101b23'));
 }
 const css=read('apps/morfologia/style.css');
 assert.ok(css.includes('linear-gradient(115deg,#1d4136,#174861)'));
 assert.ok(css.includes('html[data-theme="oled"] .site-header'));
});
