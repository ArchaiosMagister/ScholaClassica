import {mountVocabulaAdmin,resetVocabulaAdmin} from './admin-vocabula.mjs';
// El HTML es público: solo la Edge Function determina si existe acceso docente.
// Nunca se almacenan aquí contraseñas, claves privilegiadas ni datos de alumnos.
const el=id=>document.getElementById(id);
const sections=['unavailable','login','enroll','verify','ready','teacher'];
// El bundle local se verifica por SHA-256 en el build docente.
const SCRIPT_URL='./vendor/supabase.js';
let config,client,enrollment=null,busy=false;
let loadedNotices=[];
let sourceState={vocabula:'loading',palabra:'loading'};
const PALABRA_INBOX='https://rzjemisvaaqpnvvgfntl.supabase.co/functions/v1/schola-palabra-inbox';
const PALABRA_KEY='sb_publishable_x4KEF3M2CmSXCPG6XhZ0jw_WSmd58YO';
const isSixDigits=value=>/^\d{6}$/.test(value.trim());
function state(section,message=''){
  for(const id of sections)el(id).hidden=id!==section;
  el('logout').hidden=section==='login'||section==='unavailable';
  el('status').textContent=message;
  if(section==='login'||section==='unavailable'){
    el('username').value='';
    el('password').value='';
    el('notices').replaceChildren();
    loadedNotices=[];sourceState={vocabula:'loading',palabra:'loading'};
    resetVocabulaAdmin();
  }
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
    !('email' in value)&&
    value.username==='MagisterArchaios'&&typeof value.setupOnly==='boolean'&&
    value.origin===location.origin&&
    (location.origin==='https://archaiosmagister.github.io'||
      ['localhost','127.0.0.1'].includes(location.hostname));
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
    if(config.setupOnly===true){
      state('ready','Identidad verificada con segundo factor. La bandeja docente aún no está activada.');
      return;
    }
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
  state('teacher','Verificando permisos y consultando avisos…');
  el('notices').replaceChildren();
  el('notices-state').textContent='Consultando Vocabula y Palabra del día…';
  const sessionResult=await client.auth.getSession();
  const token=sessionResult.data?.session?.access_token;
  if(sessionResult.error||!token){
    state('login','Inicia sesión para consultar la bandeja');
    return;
  }
  // Cada una de las dos funciones verifica independently: getUser, UUID docente y AAL2.
  const results=await Promise.allSettled([
    client.functions.invoke('schola-inbox',{method:'POST',body:{}}),
    fetch(PALABRA_INBOX,{
      method:'POST',cache:'no-store',mode:'cors',
      headers:{
        'apikey':PALABRA_KEY,'authorization':'Bearer '+token,
        'content-type':'application/json'
      },
      body:'{}'
    }).then(async response=>{
      if(!response.ok){const failure=Error('Fuente no disponible');failure.status=response.status;throw failure;}
      return response.json();
    })
  ]);
  loadedNotices=[];
  sourceState={vocabula:'unavailable',palabra:'unavailable'};
  const vocab=results[0].status==='fulfilled'?results[0].value:null;
  const vocabData=vocab&&!vocab.error?vocab.data:null;
  const remoteStatus=results[1].status==='rejected'?results[1].reason?.status:null;
  const vocabStatus=vocab?.error?.context?.status;
  if(vocabData?.authorized===false||[401,403].includes(vocabStatus)||
      [401,403].includes(remoteStatus)){
    await client.auth.signOut({scope:'local'});
    state('unavailable','Acceso docente no autorizado por el servidor');
    return;
  }
  if(vocabData?.authorized&&vocabData?.source==='vocabula'&&Array.isArray(vocabData.items)){
    sourceState.vocabula='ok';
    loadedNotices.push(...vocabData.items.filter(item=>item?.source==='vocabula').slice(0,100));
    if(vocabData.hasMore)sourceState.vocabula='limited';
  }
  const palabra=results[1].status==='fulfilled'?results[1].value:null;
  if(palabra?.authorized&&palabra?.source==='palabra'&&Array.isArray(palabra.items)){
    sourceState.palabra='ok';
    loadedNotices.push(...palabra.items.filter(item=>item?.source==='palabra').slice(0,100));
    if(palabra.hasMore)sourceState.palabra='limited';
  }
  loadedNotices.sort((a,b)=>(Date.parse(b.created_at)||0)-(Date.parse(a.created_at)||0));
  renderNotices();
  await mountVocabulaAdmin({client,refreshNotices:fetchNotices});
  el('status').textContent='Sesión docente protegida con TOTP';
}
function renderNotices(){
  const selected=el('notice-source').value;
  const notices=loadedNotices.filter(item=>selected==='all'||item.source===selected);
  el('notices').replaceChildren();
  const stateText=value=>value==='ok'?'conectada':
    value==='limited'?'conectada (más avisos pendientes)':'no disponible';
  el('sources-state').textContent='Vocabula: '+stateText(sourceState.vocabula)+
    ' · Palabra del día: '+stateText(sourceState.palabra);
  const unavailable=selected==='all'
    ?Object.values(sourceState).some(value=>value==='unavailable')
    :sourceState[selected]==='unavailable';
  el('notices-state').textContent=unavailable
    ?notices.length+' avisos recuperados; alguna fuente no está disponible. No se puede confirmar que no haya más avisos.'
    :notices.length+' avisos pendientes'+(selected==='all'?'':' de esta aplicación');
  for(const item of notices){
    if(!['vocabula','palabra'].includes(item.source))continue;
    const article=document.createElement('article');article.className='notice';
    const heading=document.createElement('h3');heading.textContent=String(item.title||'Aviso sin título');
    const origin=document.createElement('small');
    origin.textContent=(item.source==='vocabula'?'Vocabula':'Palabra del día')+
      ' · '+String(item.course||'Sin curso')+
      ' · '+(item.created_at&&Number.isFinite(Date.parse(item.created_at))
        ?new Date(item.created_at).toLocaleDateString('es-ES'):'Sin fecha');
    const detail=document.createElement('p');detail.textContent=String(item.summary||'');
    const link=document.createElement('a');
    link.href=item.source==='vocabula'
      ?'https://archaiosmagister.github.io/VocabulaLatinaGraecaque/'
      :(String(item.course||'').includes('4.º')
        ?'https://archaiosmagister.github.io/Palabra-del-dia/4eso/'
        :'https://archaiosmagister.github.io/Palabra-del-dia/');
    link.target='_blank';link.rel='noopener noreferrer';
    link.textContent='Abrir aplicación original';
    article.append(heading,origin,detail,link);el('notices').append(article);
  }
}
el('notice-source').addEventListener('change',renderNotices);
el('notice-refresh').addEventListener('click',()=>void safely(fetchNotices));
el('login-form').addEventListener('submit',event=>{
  event.preventDefault();
  void safely(async()=>{
    const username=el('username').value.trim();
    const password=el('password').value;
    el('password').value='';
    if(username!==config.username||!password){state('login','Credenciales incorrectas');return}
    try{
      // El correo NO viaja al navegador: el servidor resuelve el usuario.
      const response=await client.functions.invoke('schola-login',{
        method:'POST',body:{username,password}
      });
      if(response.error||!response.data?.access_token||!response.data?.refresh_token){
        state('login','Credenciales incorrectas o acceso no disponible');return;
      }
      const installed=await client.auth.setSession({
        access_token:response.data.access_token,refresh_token:response.data.refresh_token
      });
      if(installed.error)throw installed.error;
      await checkSession();
    }finally{
      el('password').value='';
    }
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
