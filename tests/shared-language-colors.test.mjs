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
 const portal=css.split('/* Portada: identidad editorial neutra;')[1];
 assert.ok(portal);
 assert.doesNotMatch(portal,/gradient\s*\(/i);
 for(const color of ['#f8f5e7','#fffdf3','#e4d28c','#756019','#1c1b16','#e8d58d','#34752d','#2858a8','#a8dc84','#9fc3ff'])
  assert.ok(portal.includes(color));
 // Contraste WCAG de los textos semánticos sobre sus superficies reales.
 const luminance=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)
  .map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4)
  .reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
 for(const [fg,bg] of [["#34752d","#ffffff"],["#2858a8","#ffffff"],["#a8dc84","#28261e"],["#9fc3ff","#28261e"],["#a8dc84","#12110c"],["#9fc3ff","#12110c"],["#34752d","#fffdf3"],["#2858a8","#fffdf3"]]){
  const [high,low]=[luminance(fg),luminance(bg)].sort((a,b)=>b-a);
  assert.ok((high+.05)/(low+.05)>=4.5, fg+' sobre '+bg);
 }
 assert.match(portal,/--page: #000;/);
 const manifest=JSON.parse(read('manifest.webmanifest'));
 assert.equal(manifest.background_color,'#f8f5e7');
 assert.equal(manifest.theme_color,'#e4d28c');
 assert.ok(html.includes('name="theme-color" content="#e4d28c"'));
 const mixedRule=portal.split('.portal :is(.card.mixed, .resource-links a.mixed) {')[1]?.split('}')[0];
 assert.ok(mixedRule?.includes('background: var(--surface)'));
 assert.ok(mixedRule?.includes('border: 1px solid var(--line)'));
 assert.ok(portal.includes('background: var(--latin-accent)'));
 assert.ok(portal.includes('box-shadow: 1.5rem 0 0 var(--greek-accent)'));
 assert.match(portal,/border-inline-start: 4px solid var\(--accent\);\s*background: var\(--language-button-surface\);/);
 assert.match(portal,/background: var\(--language-button-surface\);\s*color: var\(--accent\);\s*border-color: var\(--accent\);/);
 assert.match(portal,/\.portal :is\(\.card\.latin, \.card\.greek\) \{\s*border-top: 4px solid var\(--accent\);\s*background: var\(--language-button-surface\);/);
 assert.ok(portal.includes('--language-button-surface: #fff;'));
 assert.ok(portal.includes('--language-button-surface: #28261e;'));
 assert.ok(portal.includes('--language-button-surface: #12110c;'));
 assert.ok(portal.includes('--latin-wash: #172611;'));
 assert.ok(portal.includes('--greek-wash: #111d32;'));
 assert.ok(portal.includes('prefers-reduced-motion: reduce'));

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
