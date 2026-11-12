import {cp,mkdir,rm,readFile,writeFile} from 'node:fs/promises';
import {resolve,join,sep} from 'node:path';

// El portal público se construye con npm run build.
// La aplicación docente SEPARADA únicamente puede habilitarse en un origen HTTPS aislado.
const root=resolve(import.meta.dirname,'..');
const output=resolve(root,process.env.SCHOLA_DOCENTE_OUTPUT||'dist-docente');
if(!output.startsWith(root+sep)||output===root)throw Error('Salida docente fuera del repositorio');

const required=['SCHOLA_DOCENTE_ORIGIN','SCHOLA_AUTH_URL','SCHOLA_AUTH_PUBLISHABLE_KEY','SCHOLA_TURNSTILE_SITE_KEY'];
if(process.env.SCHOLA_AUTH_LOGIN_EMAIL)
  throw Error('Nunca debe incluirse el correo docente en un artefacto público: configúralo solo como secreto del servidor');
const present=required.filter(name=>Boolean(process.env[name]?.trim()));
if(present.length!==0&&present.length!==required.length)
  throw Error('Configuración docente incompleta: faltan variables obligatorias');

function httpsOrigin(raw){
  if(typeof raw!=='string')throw Error('Falta el origen docente');
  const url=new URL(raw);
  if(url.protocol!=='https:'||url.username||url.password||url.port||url.pathname!=='/'||url.search||url.hash)
    throw Error('El origen docente debe ser un hostname HTTPS sin ruta ni parámetros');
  if(url.hostname==='archaiosmagister.github.io'||url.hostname==='localhost'||url.hostname==='127.0.0.1')
    throw Error('El origen docente no puede compartir dominio con la zona del alumnado');
  return url.origin;
}
function validatePublicKey(value){
  if(!/^sb_publishable_[A-Za-z0-9_-]{12,}$/.test(value))
    throw Error('Se requiere una clave publicable de Supabase; está prohibido utilizar una clave secreta');
}
const enabled=present.length===required.length;
let config={enabled:false},origin=null,authOrigin=null;
if(enabled){
  origin=httpsOrigin(process.env.SCHOLA_DOCENTE_ORIGIN.trim());
  const rawAuth=process.env.SCHOLA_AUTH_URL.trim();
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(rawAuth))
    throw Error('Proyecto de identidad de Supabase inválido');
  authOrigin=new URL(rawAuth).origin;
  const key=process.env.SCHOLA_AUTH_PUBLISHABLE_KEY.trim();
  validatePublicKey(key);
  const siteKey=process.env.SCHOLA_TURNSTILE_SITE_KEY.trim();
  if(!/^0x[A-Za-z0-9_-]{16,64}$/.test(siteKey))
    throw Error('La clave pública de Turnstile no es válida');
  config={enabled:true,origin,url:authOrigin,publishableKey:key,turnstileSiteKey:siteKey,username:'MagisterArchaios'};
}
const portalUrl=process.env.SCHOLA_PORTAL_URL?.trim()||'https://archaiosmagister.github.io/ScholaClassica/';
if(!/^https:\/\/[a-z0-9.-]+(?:\/[A-Za-z0-9/_-]*)?\/?$/i.test(portalUrl))throw Error('URL del portal no válida');
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
await cp(join(root,'public/style.css'),join(output,'portal.css'));
await cp(join(root,'public/docente/style.css'),join(output,'style.css'));
await cp(join(root,'public/docente/app.mjs'),join(output,'app.mjs'));
let html=await readFile(join(root,'public/docente/index.html'),'utf8');
if(!html.includes('href="../style.css"')||!html.includes('href="../index.html"'))
  throw Error('Cambió la estructura del HTML docente');
html=html.replace('href="../style.css"','href="./portal.css"')
  .replaceAll('href="../index.html"','href="'+portalUrl+'"');
const connect=authOrigin?authOrigin+' wss://'+new URL(authOrigin).host:'';
const csp=[
  "default-src 'none'","base-uri 'none'","object-src 'none'","form-action 'self'",
  "script-src 'self' https://cdn.jsdelivr.net https://challenges.cloudflare.com","style-src 'self'","img-src 'self' data:",
  "connect-src 'self' https://challenges.cloudflare.com "+connect,
  "frame-src https://challenges.cloudflare.com","upgrade-insecure-requests"
].join('; ');
html=html.replace('<head>','<head>\n  <meta http-equiv="Content-Security-Policy" content="'+csp+'">');
await writeFile(join(output,'index.html'),html);
await writeFile(join(output,'auth-config.json'),JSON.stringify(config)+'\n');
const headers=[
  '/*',
  '  Content-Security-Policy: '+csp.replace(/; upgrade-insecure-requests/,'; upgrade-insecure-requests; frame-ancestors \'none\''),
  '  X-Content-Type-Options: nosniff',
  '  Referrer-Policy: no-referrer',
  '  Permissions-Policy: camera=(), microphone=(), geolocation=()',
  '  Cross-Origin-Opener-Policy: same-origin',
  '  Cache-Control: no-store',
  ''
].join('\n');
await writeFile(join(output,'_headers'),headers);
console.log(enabled?'Artefacto docente aislado preparado para revisión; no desplegado':'Artefacto docente aislado desactivado; no desplegado');
