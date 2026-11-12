import {cp,rm,mkdir,readFile,writeFile,stat} from 'node:fs/promises';
import {resolve,join,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
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
const destination=join(out,'apps/gramatica');
await mkdir(join(out,'apps'),{recursive:true});
await cp(source,destination,{recursive:true,force:true,filter:path=>{
  const relative=path.slice(source.length).split(sep).filter(Boolean);
  return !relative.some(piece=>piece==='.git'||piece==='.github');
}});
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
// Adaptación local exclusivamente al artefacto integrado: no borrar cachés ajenas del origen.
const swPath=join(phoneticsDestination,'sw.js');
let sw=await readFile(swPath,'utf8');
if(!/const VERSION='[^']+';/.test(sw)||!sw.includes('keys.filter(key=>key!==VERSION)'))
  throw Error('Cambió el service worker original de Evolutio; revisar adaptación antes de publicar');
sw=sw.replace(/const VERSION='([^']+)';/,"const CACHE_PREFIX='schola-evolutio-';\nconst VERSION=CACHE_PREFIX+'$1';")
  .replace('keys.filter(key=>key!==VERSION)','keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==VERSION)');
await writeFile(swPath,sw);
await writeFile(join(out,'.nojekyll'),'');
console.log('ScholaClassica: Evolutio integrado con caché aislada ('+phoneticsHead.slice(0,12)+')');
console.log('ScholaClassica: Appendix integrado sin modificar la fuente ('+head.slice(0,12)+')');
