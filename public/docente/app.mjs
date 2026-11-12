// El HTML es público: solo la Edge Function determina si existe acceso docente.
// Nunca se almacenan aquí contraseñas, claves privilegiadas ni datos de alumnos.
const el=id=>document.getElementById(id);
const sections=['unavailable','login','enroll','verify','teacher'];
const CLIENT_VERSION='2.119.0';
const SCRIPT_URL='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@'+CLIENT_VERSION;
let config,client,enrollment=null,busy=false;
const isSixDigits=value=>/^\d{6}$/.test(value.trim());
function state(section,message=''){
  for(const id of sections)el(id).hidden=id!==section;
  el('logout').hidden=section==='login'||section==='unavailable';
  el('status').textContent=message;
}
function setBusy(value){
  busy=value;
  for(const button of document.querySelectorAll('button'))button.disabled=value;
}
function showError(error){
  // No mostrar mensajes con tokens ni cuerpos de respuesta del servidor.
  console.warn('Acceso docente: operación no completada',error?.name||'error');
  el('status').textContent='No se ha podido completar la operación. Comprueba los datos, la conexión y vuelve a intentarlo.';
}
async function safely(operation){
  if(busy)return;
  setBusy(true);
  try{await operation()}catch(error){showError(error)}
  finally{setBusy(false)}
}
function validConfig(value){
  return value?.enabled===true&&/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(value.url||'')&&
    typeof value.publishableKey==='string'&&value.publishableKey.length>20&&
    typeof value.email==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)&&
    value.username==='MagisterArchaios'&&value.origin===location.origin&&
    location.hostname!=='archaiosmagister.github.io'&&
    (location.protocol==='https:'||['localhost','127.0.0.1'].includes(location.hostname));
}
async function loadSDK(){
  if(window.supabase?.createClient)return;
  await new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src=SCRIPT_URL;
    script.crossOrigin='anonymous';
    script.onload=resolve;
    script.onerror=()=>reject(Error('No ha podido cargarse la biblioteca de autenticación'));
    document.head.append(script);
  });
  if(!window.supabase?.createClient)throw Error('Biblioteca no disponible');
}
async function checkSession(){
  const {data:{session},error}=await client.auth.getSession();
  if(error)throw error;
  if(!session){state('login','');return}
  // Comprobar que sigue existiendo una sesión válida en Auth.
  const verifiedUser=await client.auth.getUser();
  if(verifiedUser.error||!verifiedUser.data?.user){await client.auth.signOut({scope:'local'});state('login','');return}
  const assurance=await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if(assurance.error)throw assurance.error;
  if(assurance.data.currentLevel==='aal2'){
    // La comprobación del servidor es imprescindible, incluso con 2FA.
    await fetchNotices();
    return;
  }
  const factors=await client.auth.mfa.listFactors();
  if(factors.error)throw factors.error;
  if(factors.data.totp?.some(f=>f.status==='verified')){
    state('verify','Segundo factor pendiente');
  }else{
    state('enroll','Debes activar la verificación en dos pasos');
  }
}
async function fetchNotices(){
  state('teacher','Verificando permisos en el servidor…');
  el('notices').replaceChildren();
  el('notices-state').textContent='Consultando los servicios de origen…';
  const response=await client.functions.invoke('schola-inbox',{method:'POST',body:{}});
  if(response.error||response.data?.error||!response.data?.authorized){
    el('notices-state').textContent='No se ha autorizado la consulta. La información privada permanece bloqueada.';
    state('unavailable','Acceso docente no autorizado por el servidor');
    return;
  }
  const notices=Array.isArray(response.data.items)?response.data.items:[];
  el('notices-state').textContent=notices.length?
    notices.length+' avisos pendientes':'No hay avisos pendientes en las fuentes conectadas';
  for(const item of notices){
    if(!['vocabula','palabra'].includes(item.source))continue;
    const article=document.createElement('article');article.className='notice';
    const heading=document.createElement('h3');heading.textContent=item.title||'Aviso sin título';
    const origin=document.createElement('small');
    origin.textContent=(item.source==='vocabula'?'Vocabula':'Palabra del día')+
      ' · '+(item.course||'Sin curso')+' · '+(item.created_at?new Date(item.created_at).toLocaleDateString('es-ES'):'Sin fecha');
    const detail=document.createElement('p');detail.textContent=item.summary||'';
    const link=document.createElement('a');
    link.href=item.source==='vocabula'
      ?'https://archaiosmagister.github.io/VocabulaLatinaGraecaque/'
      :(item.course?.includes('4.º')?'https://archaiosmagister.github.io/Palabra-del-dia/4eso/':'https://archaiosmagister.github.io/Palabra-del-dia/');
    link.target='_blank';link.rel='noopener noreferrer';link.textContent='Abrir aplicación original';
    article.append(heading,origin,detail,link);el('notices').append(article);
  }
  state('teacher','Sesión docente verificada con TOTP y autorizada por el servidor');
}
el('login-form').addEventListener('submit',event=>{
  event.preventDefault();
  void safely(async()=>{
    const username=el('username').value.trim();
    const password=el('password').value;
    el('password').value='';
    if(username!==config.username||!password){state('login','Credenciales incorrectas');return}
    const response=await client.auth.signInWithPassword({email:config.email,password});
    if(response.error){state('login','Credenciales incorrectas o acceso no disponible');return}
    await checkSession();
  });
});
el('enroll-start').addEventListener('click',()=>void safely(async()=>{
  const result=await client.auth.mfa.enroll({factorType:'totp',friendlyName:'ScholaClassica'});
  if(result.error)throw result.error;
  const {id,totp}=result.data;
  if(!id||!totp?.qr_code||!totp?.secret)throw Error('Registro de TOTP incompleto');
  enrollment=id;
  // Supabase proporciona el QR como data URL; no renderizar HTML arbitrario.
  if(!totp.qr_code.startsWith('data:image/svg+xml;'))throw Error('Formato QR no admitido');
  el('totp-qr').src=totp.qr_code;
  el('totp-secret').value=totp.secret;
  el('enroll-setup').hidden=false;
  el('enroll-start').hidden=true;
  el('status').textContent='Introduce el código generado por Contraseñas de Apple';
}));
async function verify(factorId,code){
  if(!factorId||!isSixDigits(code))throw Error('Código no válido');
  const result=await client.auth.mfa.challengeAndVerify({factorId,code});
  if(result.error)throw result.error;
  el('enroll-code').value='';el('verify-code').value='';
  el('totp-secret').value='';el('totp-qr').removeAttribute('src');
  enrollment=null;
  await checkSession();
}
el('enroll-form').addEventListener('submit',event=>{
  event.preventDefault();
  void safely(async()=>await verify(enrollment,el('enroll-code').value));
});
el('verify-form').addEventListener('submit',event=>{
  event.preventDefault();
  void safely(async()=>{
    const factors=await client.auth.mfa.listFactors();
    if(factors.error)throw factors.error;
    const factor=factors.data.totp?.find(f=>f.status==='verified');
    await verify(factor?.id,el('verify-code').value);
  });
});
el('logout').addEventListener('click',()=>void safely(async()=>{
  const result=await client.auth.signOut({scope:'global'});
  if(result.error)throw result.error;
  enrollment=null;el('totp-secret').value='';el('totp-qr').removeAttribute('src');
  state('login','Sesión cerrada');
}));
async function init(){
  try{
    const response=await fetch('./auth-config.json',{cache:'no-store'});
    config=await response.json();
    if(!validConfig(config)){state('unavailable','Configuración docente no activada');return}
    el('username').value=config.username;
    await loadSDK();
    client=window.supabase.createClient(config.url,config.publishableKey,{
      auth:{persistSession:false,autoRefreshToken:true,detectSessionInUrl:false}
    });
    await checkSession();
    // En cambios de token, comprobar de nuevo los permisos; no asumir que sigue habiendo 2FA.
    client.auth.onAuthStateChange(event=>{
      if(event==='SIGNED_OUT')state('login','Sesión cerrada')
    });
  }catch(error){
    console.warn('Inicio docente no disponible',error?.name||'error');
    state('unavailable','Servicio de autenticación no disponible');
  }
}
void init();
