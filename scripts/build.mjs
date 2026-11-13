import {cp,rm,mkdir,readFile,writeFile,stat,realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
import {buildEtymologicon} from './build-etymologicon.mjs';
import {buildPortalPwa} from './build-portal-pwa.mjs';
import {buildMorphology} from './build-morphology.mjs';
import {buildMorphologyPwa} from './build-morphology-pwa.mjs';
import {adaptEvolutioDifficulty} from './adapt-evolutio-difficulty.mjs';
import {adaptAppendixOled,adaptEvolutioOled,adaptVocabulaOled} from './adapt-integrated-oled.mjs';
const root=resolve(import.meta.dirname,'..');
const source=resolve(process.env.APPENDIX_SOURCE||join(root,'.sources/appendix'));
const out=join(root,'dist');
const lock=JSON.parse(await readFile(join(root,'config/sources.lock.json'),'utf8'));
if(lock.sources.appendix.integrated!==true||lock.sources.appendix.target!=='apps/gramatica')throw Error('Lock incompatible: Appendix');
const head=execFileSync('git',['-C',source,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(head!==lock.sources.appendix.sha)throw Error('Appendix sin fijar: esperado '+lock.sources.appendix.sha+'; recibido '+head);
await stat(join(source,'assets/curriculum.json'));
await stat(join(source,'val/curriculum.json'));
await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
await cp(join(root,'public'),out,{recursive:true,force:true});

// GitHub Pages es un origen público compartido. Jamás incrustar secretos en
// archivos estáticos: solo la clave publicable y el hostname público son admitidos.
// Sin activación explícita, la identidad queda BLOQUEADA en cada compilación.
if(Object.keys(process.env).some(name=>name.startsWith('SCHOLA_AUTH_')||name==='SCHOLA_DOCENTE_ORIGIN'))
  throw Error('No se admiten secretos de identidad ni configuraciones del antiguo alojamiento');
const docenteVars=['SCHOLA_DOCENTE_SUPABASE_URL','SCHOLA_DOCENTE_PUBLISHABLE_KEY',
  'SCHOLA_DOCENTE_SDK_FILE','SCHOLA_DOCENTE_SDK_SHA256'];
const docenteEnabled=process.env.SCHOLA_DOCENTE_ENABLE==='confirmed';
if(!docenteEnabled&&docenteVars.some(name=>process.env[name]?.trim()))
  throw Error('Hay variables docentes, pero SCHOLA_DOCENTE_ENABLE no se ha confirmado');
if(process.env.SCHOLA_DOCENTE_ENABLE&&!docenteEnabled)
  throw Error('Valor de activación docente no reconocido');
let docenteConfig={enabled:false},docenteConnect='';
if(docenteEnabled){
  const url=process.env.SCHOLA_DOCENTE_SUPABASE_URL?.trim();
  const publishableKey=process.env.SCHOLA_DOCENTE_PUBLISHABLE_KEY?.trim();
  const sdkFile=process.env.SCHOLA_DOCENTE_SDK_FILE?.trim();
  const sdkHash=process.env.SCHOLA_DOCENTE_SDK_SHA256?.trim()?.toLowerCase();
  if(url!=='https://wpwlguufpkfnzlbyproe.supabase.co')
    throw Error('El proyecto docente de identidad no es el aprobado');
  if(!/^sb_publishable_[A-Za-z0-9_-]{12,}$/.test(publishableKey||''))
    throw Error('La web docente solo admite claves publicables de Supabase');
  if(!sdkFile||!/^[a-f0-9]{64}$/.test(sdkHash||''))
    throw Error('Falta el SDK local y su SHA-256 comprobado');
  const sdkSource=await realpath(resolve(root,sdkFile));
  if(!sdkSource.startsWith(root+sep)||sdkSource.startsWith(out+sep))
    throw Error('El SDK docente debe estar dentro del repositorio, fuera de dist');
  const sdkStat=await stat(sdkSource);
  if(!sdkStat.isFile()||sdkStat.size<10000||sdkStat.size>5000000)
    throw Error('Tamaño del SDK docente incorrecto');
  const sdk=await readFile(sdkSource);
  if(createHash('sha256').update(sdk).digest('hex')!==sdkHash)
    throw Error('No coincide el SHA-256 del SDK docente');
  await mkdir(join(out,'docente/vendor'),{recursive:true});
  await writeFile(join(out,'docente/vendor/supabase.js'),sdk);
  docenteConfig={enabled:true,origin:'https://archaiosmagister.github.io',
    url,publishableKey,username:'MagisterArchaios'};
  docenteConnect=url;
}
await writeFile(join(out,'docente/auth-config.json'),JSON.stringify(docenteConfig)+'\n');
// GitHub Pages no aplica _headers de Cloudflare. Una CSP en meta reduce el
// impacto de inyecciones en ESTA página; jamás sustituye la autorización AAL2.
const docenteCsp=[
  "default-src 'none'","base-uri 'none'","object-src 'none'",
  "form-action 'self'","script-src 'self'","style-src 'self'",
  "img-src 'self' data:","connect-src 'self' "+docenteConnect
].join('; ');
const docenteHtmlPath=join(out,'docente/index.html');
const docenteHtml=await readFile(docenteHtmlPath,'utf8');
if(!docenteHtml.includes('<head>'))throw Error('Falta la cabecera de la web docente');
await writeFile(docenteHtmlPath,docenteHtml.replace('<head>',
  '<head>\n  <meta http-equiv="Content-Security-Policy" content="'+docenteCsp+'">'));

const destination=join(out,'apps/gramatica');
await mkdir(join(out,'apps'),{recursive:true});
await cp(source,destination,{recursive:true,force:true,filter:path=>{
  const relative=path.slice(source.length).split(sep).filter(Boolean);
  return !relative.some(piece=>piece==='.git'||piece==='.github');
}});
await adaptAppendixOled(destination);
const phonetics=resolve(process.env.EVOLUTIO_SOURCE||join(root,'.sources/evolutio'));
const phoneticsLock=lock.sources.evolutio;
if(!phoneticsLock.integrated||phoneticsLock.target!=='apps/evolucion-fonetica')throw Error('Lock incompatible: Evolutio');
const phoneticsHead=execFileSync('git',['-C',phonetics,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(phoneticsHead!==phoneticsLock.sha)throw Error('Evolutio sin fijar: esperado '+phoneticsLock.sha+'; recibido '+phoneticsHead);
await stat(join(phonetics,'data/pilot.json'));
const phoneticsDestination=join(out,'apps/evolucion-fonetica');
await cp(phonetics,phoneticsDestination,{recursive:true,force:true,filter:path=>{
  const relative=path.slice(phonetics.length).split(sep).filter(Boolean);
  return !relative.some(piece=>piece==='.git'||piece==='.github');
}});
await adaptEvolutioOled(phoneticsDestination);
// Dificultad ajustada SOLO en el artefacto de ScholaClassica. La fuente fija
// y su banco de palabras no se modifican. Importación y verificación reproducibles.
const levelReport=await adaptEvolutioDifficulty({root,target:phoneticsDestination});
console.log('ScholaClassica: dificultad de Evolutio basada en resultado castellano',levelReport);
// Adaptación local exclusivamente al artefacto integrado: no borrar cachés ajenas del origen.
const swPath=join(phoneticsDestination,'sw.js');
let sw=await readFile(swPath,'utf8');
if(!/const VERSION='[^']+';/.test(sw)||!sw.includes('keys.filter(key=>key!==VERSION)'))
  throw Error('Cambió el service worker original de Evolutio; revisar adaptación antes de publicar');
sw=sw.replace(/const VERSION='([^']+)';/,"const CACHE_PREFIX='schola-evolutio-';\nconst VERSION=CACHE_PREFIX+'$1-resultado-v3';")
  .replace('keys.filter(key=>key!==VERSION)','keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==VERSION)');
const cacheItem="'./src/difficulty.mjs',";
if(!sw.includes(cacheItem)||sw.includes('./src/result-difficulty.mjs'))throw Error('Evolutio cambió la lista precargada de dificultad: revisar');
sw=sw.replace(cacheItem,cacheItem+"'./src/result-difficulty.mjs',");
const fetchOld="if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;";
const fetchNew="if(req.method!=='GET')return; const url=new URL(req.url); const scope=new URL(self.registration.scope); if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;";
if(!sw.includes(fetchOld))throw Error('Evolutio cambió su SW; revisar antes de adaptar');
sw=sw.replace(fetchOld,fetchNew);
await writeFile(swPath,sw);
await buildEtymologicon({root,out});

const vocabulaLock=lock.sources.vocabula;
if(!vocabulaLock?.integrated||vocabulaLock.target!=='apps/vocabulario')throw Error('Lock incompatible: Vocabula');
const vocabulaSource=resolve(process.env.VOCABULA_SOURCE||join(root,'.sources/vocabula'));
const vocabulaHead=execFileSync('git',['-C',vocabulaSource,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(vocabulaHead!==vocabulaLock.sha)throw Error('Vocabula sin fijar: esperado '+vocabulaLock.sha+'; recibido '+vocabulaHead);
const vocabulaDestination=join(out,'apps/vocabulario');
await mkdir(vocabulaDestination,{recursive:true});
const vocabulaFiles=['index.html','app.js','choice.js','config.js','data.js','scope.js','style.css','teacher.js','theme.js'];
for(const file of vocabulaFiles)await cp(join(vocabulaSource,file),join(vocabulaDestination,file));
await cp(join(vocabulaSource,'icons'),join(vocabulaDestination,'icons'),{recursive:true});
await adaptVocabulaOled(vocabulaDestination);
const vocabulaIndex=join(vocabulaDestination,'index.html');
let vocabulaHTML=await readFile(vocabulaIndex,'utf8');
const sourceTab='<a class="study-tab" href="gramatica.html">Gramática</a>';
const sourceScript='<script src="teacher.js?v=20261112" defer></script>';
if(!vocabulaHTML.includes(sourceTab)||!vocabulaHTML.includes(sourceScript))throw Error('Vocabula cambió su navegación o scripts: revisar adaptación');
vocabulaHTML=vocabulaHTML.replace(sourceTab,'<a class="study-tab" href="../gramatica/index.html">Gramática de consulta</a>')
  .replace(sourceScript,sourceScript+'<script src="schola-bridge.js" defer></script>')
  .replace('src="theme.js?v=1"','src="theme.js?v=1-oled1"')
  .replace('href="style.css?v=20261109-tabs1"','href="style.css?v=20261109-tabs1-oled1"');
await writeFile(vocabulaIndex,vocabulaHTML);
await cp(join(root,'scripts/vocabula-bridge.js'),join(vocabulaDestination,'schola-bridge.js'));

// Nuevo módulo de práctica propio, separado del Vocabula original.
const morphologySource=join(root,'public/morfologia');
const morphologyDestination=join(out,'apps/morfologia');
await cp(morphologySource,morphologyDestination,{recursive:true});
await rm(join(out,'morfologia'),{recursive:true,force:true});
await buildMorphology({out,lock});
await buildMorphologyPwa(out,root);
await buildPortalPwa(out,root);
console.log('ScholaClassica: Vocabula conserva su léxico; práctica morfológica independiente compilada desde Appendix');

await writeFile(join(out,'.nojekyll'),'');
console.log('ScholaClassica: Evolutio integrado con caché aislada ('+phoneticsHead.slice(0,12)+')');
console.log('ScholaClassica: Appendix integrado sin modificar la fuente ('+head.slice(0,12)+')');
