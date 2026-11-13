// Validación de un artefacto docente activable; NO publica, llama APIs ni modifica cuentas.
// Usar después de compilar de forma protegida (no se ejecuta con secretos en CI).
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,join,relative,sep} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'..');
const output=resolve(root,process.env.SCHOLA_DOCENTE_OUTPUT||'dist-docente');
const fail=message=>{throw Error('Zona docente no preparada: '+message)};
if(!output.startsWith(root+sep)||!existsSync(output))fail('directorio de construcción inexistente');
let config;
try{config=JSON.parse(readFileSync(join(output,'auth-config.json'),'utf8'))}
catch{fail('configuración ausente o ilegible')}
if(config.enabled!==true)fail('la cuenta docente está desactivada: esto es correcto hasta terminar el aprovisionamiento');
const expectedFields=['enabled','origin','url','publishableKey','turnstileSiteKey','username'];
if(Object.keys(config).sort().join('|')!==expectedFields.sort().join('|'))
  fail('campos inesperados en la configuración pública');
if(config.username!=='MagisterArchaios')fail('usuario inesperado');
if(typeof config.origin!=='string'||!/^https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)*\.pages\.dev$/.test(config.origin))
  fail('se necesita un origen real de Pages, HTTPS y separado');
if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url))
  fail('URL de Supabase Auth inválida');
if(!/^sb_publishable_[A-Za-z0-9_-]{12,}$/.test(config.publishableKey))
  fail('clave incorrecta: jamás service_role ni sb_secret en el navegador');
if(!/^0x[A-Za-z0-9_-]{16,64}$/.test(config.turnstileSiteKey))
  fail('falta la clave pública real de Turnstile');
const allowed=new Set(['index.html','404.html','robots.txt','portal.css','style.css',
  'app.mjs','auth-config.json','_headers','vendor/supabase.js']);
for(const entry of readdirSync(output,{recursive:true,withFileTypes:true})){
  if(entry.isDirectory())continue;
  if(!entry.isFile())fail('nodo no admitido');
  const p=relative(output,join(entry.parentPath,entry.name)).split(sep).join('/');
  if(!allowed.has(p))fail('archivo imprevisto: '+p);
}
for(const p of allowed)if(!existsSync(join(output,p)))fail('falta '+p);
const html=readFileSync(join(output,'index.html'),'utf8');
const js=readFileSync(join(output,'app.mjs'),'utf8');
const headers=readFileSync(join(output,'_headers'),'utf8');
const hash=createHash('sha256').update(readFileSync(join(output,'vendor/supabase.js'))).digest('hex');
const expectedHash=process.env.SCHOLA_SUPABASE_SDK_SHA256;
if(!expectedHash||!(/^[a-f0-9]{64}$/).test(expectedHash)||hash!==expectedHash)
  fail('el SDK no coincide con su huella SHA-256 revisada');
if(!js.includes("SCRIPT_URL='./vendor/supabase.js'")||js.includes('cdn.jsdelivr.net'))
  fail('SDK no local o carga externa de código');
if(!js.includes('persistSession:false'))fail('los tokens no pueden persistirse en storage');
if(js.includes('config.email'))fail('la web no debe conocer el correo del profesor');
for(const x of ['Content-Security-Policy:','frame-ancestors \'none\'',
  'X-Frame-Options: DENY','Referrer-Policy: no-referrer',
  'X-Robots-Tag: noindex','Cache-Control: no-store'])
  if(!headers.includes(x))fail('cabecera ausente: '+x);
if(!headers.includes(config.url))fail('Supabase Auth no está incluido en connect-src');
if(!html.includes('turnstile-widget')||!js.includes("'schola-login'"))
  fail('faltan controles de acceso y CAPTCHA');
const publicFiles=[config,html,js,headers].map(x=>typeof x==='string'?x:JSON.stringify(x)).join('\n');
if(/sb_secret_|service_role_key|SUPABASE_SERVICE_ROLE_KEY|SCHOLA_AUTH_LOGIN_EMAIL|SCHOLA_TEACHER_USER_ID/i.test(publicFiles))
  fail('la web contiene referencias a secretos administrativos');
console.log('Preflight estático correcto. NO demuestra que Cloudflare, Supabase Auth o TOTP funcionen realmente.');
console.log('SHA-256 del SDK: '+hash);
console.log('Solo tras pruebas reales del servidor y autorización expresa podrá publicarse.');
