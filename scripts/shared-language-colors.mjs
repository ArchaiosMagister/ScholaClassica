import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';

// Estilos exclusivos del artefacto integrado, antes del hash de la PWA.
// No modificar fuentes vendorizadas ni estados de corrección.
async function append(directory,path,css){
 const file=join(directory,path);
 await writeFile(file,(await readFile(file,'utf8'))+'\n'+css+'\n');
}
export async function styleSharedAppendix(destination){
 await append(destination,'assets/language-colors.css',`
/* Portadas grecolatinas (ES/VAL); no afecta a los capítulos de una lengua. */
@media screen {
 :root:has(#home-language) {
  --paper:#f4f7f2;--green:#265545;--accent:#285e79;
  --language-button:#265545;--language-button-ink:#fff;
  --language-hover:#e5eff5;--language-soft:#e7efe6;
 }
 :root:has(#home-language):is([data-theme=dark],[data-theme=oled]) {
  --paper:#14221e;--ink:#edf6ef;--muted:#b9cec3;--line:#496458;
  --green:#a5dcc3;--accent:#abd7f0;--language-button:#a5dcc3;
  --language-button-ink:#102c21;--language-hover:#192e3b;--language-soft:#233c31;
 }
 :root:has(#home-language)[data-theme=oled]{--paper:#000}
 :root:has(#home-language) .hero {
  border-top:3px solid transparent;
  background:linear-gradient(115deg,#e7efe6,#e5eff5) padding-box,
             linear-gradient(90deg,#265545,#285e79) border-box;
 }
 :root:has(#home-language):is([data-theme=dark],[data-theme=oled]) .hero {
  background:linear-gradient(115deg,#233c31,#192e3b) padding-box,
             linear-gradient(90deg,#a5dcc3,#abd7f0) border-box;
 }
 :root:has(#home-language)[data-theme=oled] .hero {
  background:linear-gradient(115deg,#0c1813,#101b23) padding-box,
             linear-gradient(90deg,#a5dcc3,#abd7f0) border-box;
 }
 :root:has(#home-language) :is(a.path,a[href^="griego-"]):is([href^="griego-"]) {
  --green:#285e79;--accent:#174861;--language-hover:#e5eff5;
 }
 :root:has(#home-language):is([data-theme=dark],[data-theme=oled]) a[href^="griego-"] {
  --green:#abd7f0;--accent:#d7efff;--language-hover:#192e3b;
 }
}`);
}
export async function styleSharedPractice(destination){
 await append(destination,'style.css',`
/* Cabecera común de latín y griego; los controles mantienen su semántica. */
:root{--shared-latin:#265545;--shared-greek:#285e79;--shared-green-wash:#e7efe6;--shared-blue-wash:#e5eff5}
:root:is([data-theme="dark"],[data-theme="oled"]){--shared-latin:#a5dcc3;--shared-greek:#abd7f0;--shared-green-wash:#233c31;--shared-blue-wash:#192e3b}
:root[data-theme="oled"]{--shared-green-wash:#0c1813;--shared-blue-wash:#101b23}
header{
 border-top:3px solid transparent;
 background:linear-gradient(115deg,var(--shared-green-wash),var(--shared-blue-wash)) padding-box,
            linear-gradient(90deg,var(--shared-latin),var(--shared-greek)) border-box;
}
header .header-title{color:var(--ink)}
header .topnav{background:var(--surface)}
header .topnav .study-tab[aria-current="page"]{
 background:linear-gradient(110deg,#265545,#285e79);color:#fff;border-color:#285e79;
}
header .topnav .study-tab[aria-current="page"]:hover{
 background:linear-gradient(110deg,#173f33,#174861);color:#fff;
}
`);
}
