import assert from 'node:assert/strict';
import {cp,mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';

// El antiguo Vocabula contiene un segundo motor de gramática que no forma parte
// del vocabulario ni equivale al módulo moderno de morfología de ScholaClassica.
// Lo conservamos como TERCER módulo, exclusivamente desde el snapshot auditado.
const FILES=Object.freeze([
 'gramatica.js','gramatica-contenidos.js','gramatica-enunciados.js',
 'gramatica-paradigmas.js','gramatica-latin-imperfectos.js',
 'gramatica-griego-ampliacion.js','gramatica-importada.js',
 'gramatica-respaldo-online.js','gramatica.css','gramatica-admin.js',
 'style.css','theme.js','config.js'
]);
const exactly=(text,needle,replacement,label)=>{
 assert.equal(text.split(needle).length,2,'Origen de repaso gramatical alterado: '+label);
 return text.replace(needle,replacement);
};
export async function buildGrammarReview({source,destination,vocabulaDestination,root}){
 await mkdir(destination,{recursive:true});
 for(const path of FILES)await cp(join(source,path),join(destination,path));
 await mkdir(join(destination,'icons'),{recursive:true});
 await cp(join(source,'icons/favicon.svg'),join(destination,'icons/favicon.svg'));
 // La copia de vocabulario corregida y verificada es única; el repaso consume
 // el mismo banco sin fusionar el motor académico en Vocabula.
 await cp(join(vocabulaDestination,'data.js'),join(destination,'data.js'));
 await cp(join(source,'data/unimorph-syllabus'),join(destination,'data/unimorph-syllabus'),{recursive:true});
 await cp(join(root,'scripts/grammar-progress-client.js'),join(destination,'grammar-progress.js'));
 await cp(join(root,'scripts/grammar-review-init.js'),join(destination,'grammar-review-init.js'));
 let html=await readFile(join(source,'gramatica.html'),'utf8');
 html=exactly(html,'<meta name="description" content="Ejercicios autocorregibles de gramática de Latín I, Griego I y Latín de 4.º ESO por unidades.">',
  '<meta name="description" content="Repaso de sintaxis, conceptos y flexiones en ScholaClassica."><link rel="manifest" href="manifest.webmanifest">','manifest y descripción');
 html=exactly(html,'<title>Repaso de gramática · Vocabulario clásico</title>',
  '<title>Repaso gramatical · ScholaClassica</title>','título');
 const before='<header><a href="./" class="brand" aria-label="Inicio"><span class="brand-mark" lang="grc">ἀ</span><span class="brand-dash">–</span><span class="brand-latin" lang="la">ā</span></a><a href="./" class="header-title">Vocabulario clásico</a>\n<div class="header-actions"><button id="open-report" type="button">Avisar de un error</button></div>\n<nav class="topnav" aria-label="Secciones de estudio"><a class="study-tab" href="./">Vocabulario</a><a class="study-tab" href="gramatica.html" aria-current="page">Gramática</a></nav></header>';
 const after='<header><a href="../../" class="brand" aria-label="ScholaClassica, inicio"><span class="brand-mark" aria-hidden="true">Σ</span></a><a href="index.html" class="header-title">Repaso gramatical</a>\n<div class="header-actions"><button id="open-report" type="button">Avisar de un error</button></div>\n<nav class="topnav" aria-label="Secciones de estudio"><a class="study-tab" href="../vocabulario/index.html">Vocabulario</a><a class="study-tab" href="../morfologia/index.html">Morfología</a><a class="study-tab" href="index.html" aria-current="page">Repaso gramatical</a></nav></header>';
 html=exactly(html,before,after,'navegación independiente');
 html=exactly(html,'href="morfologia.html"','href="../morfologia/index.html"','enlace de morfología');
 html=exactly(html,'<option value="Morfología" selected>Morfología · nombres y verbos</option>',
  '<option value="Morfología">Morfología · nombres y verbos</option>','morfología heredada');
 html=exactly(html,'<option value="Sintaxis">Sintaxis</option>',
  '<option value="Sintaxis" selected>Sintaxis</option>','sintaxis por defecto');
 html=exactly(html,'<script src="gramatica.js?v=5" defer></script>',
  '<script src="gramatica.js?v=5" defer></script><script src="grammar-progress.js" defer></script><script src="grammar-review-init.js" defer></script>','progreso e itinerario');
 html=exactly(html,'<h1>La gramática se aprende<br>practicándola.</h1>',
  '<h1>Repasa sintaxis y conceptos<br>de latín y griego.</h1>','presentación');
 html=exactly(html,'<p>Selecciona las unidades que has estudiado y repasa sus formas y construcciones.</p>',
  '<p>Practica sintaxis y conceptos de tus unidades. Las flexiones del repaso clásico siguen disponibles; para el análisis y las tablas utiliza el módulo de Morfología.</p>','orientación');
 html=exactly(html,'<p class="notice">Cada unidad se repasa entera, sin dividirla por temas. Puedes elegir solo morfología nominal o verbal.</p>',
  '<p class="notice">Selecciona las unidades estudiadas y después Sintaxis, Conceptos o un repaso mixto. La práctica de morfología tiene su propio módulo.</p>','filtro');
 await writeFile(join(destination,'index.html'),html);
 const result=await readFile(join(destination,'index.html'),'utf8');
 assert.match(result,/grammar-progress.js/);
 assert.match(result,/href="\.\.\/morfologia\/index.html"/);
 assert.doesNotMatch(result,/href="gramatica.html"/);
 console.log('Repaso gramatical independiente: sintaxis, conceptos, flexiones UniMorph y respaldos latinos.');
}
