// El HTML es público: solo la Edge Function determina si existe acceso docente.
// Nunca se almacenan aquí contraseñas, claves privilegiadas ni datos de alumnos.
const el=id=>document.getElementById(id);
const sections=['unavailable','login','enroll','verify','teacher'];
// El bundle local se verifica por SHA-256 en el build docente.
const SCRIPT_URL='./vendor/supabase.js';
let config,client,enrollment=null,busy=false;
let loadedNotices=[];
let vocabWords=[],vocabReports=[],vocabWordOffset=0,vocabReportOffset=0,editingVocabId=null;
const isSixDigits=value=>/^\d{6}$/.test(value.trim());
function state(section,message=''){
  for(const id of sections)el(id).hidden=id!==section;
  el('logout').hidden=section==='login'||section==='unavailable';
  el('status').textContent=message;
  if(section==='login'||section==='unavailable'){
    loadedNotices=[];vocabWords=[];vocabReports=[];editingVocabId=null;
    for(const id of ['notices','vocab-word-list','vocab-report-list'])el(id)?.replaceChildren();
    el('vocab-word-form').hidden=true;
    el('username').value='';
    el('password').value='';
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
    value.username==='MagisterArchaios'&&value.origin===location.origin&&
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
    await client.auth.signOut({scope:'local'});
    el('notices-state').textContent='No se ha autorizado la consulta. La información privada permanece bloqueada.';
    state('unavailable','Acceso docente no autorizado por el servidor');
    return;
  }
  loadedNotices=Array.isArray(response.data.items)?response.data.items:[];
  renderNotices();
  state('teacher','Sesión docente verificada con TOTP y autorizada por el servidor');
}
function renderNotices(){
  const selected=el('notice-source').value;
  const notices=loadedNotices.filter(item=>selected==='all'||item.source===selected);
  el('notices').replaceChildren();
  el('notices-state').textContent=notices.length?
    notices.length+' avisos pendientes'+(selected==='all'?'':' de la aplicación seleccionada'):
    'No hay avisos pendientes de la aplicación seleccionada';
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
}
el('notice-source').addEventListener('change',renderNotices);
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
      // No conservar contraseñas en la interfaz tras el intento.
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

// Gestión docente de Vocabula: todas las peticiones vuelven a autorizarse
// en la Edge Function. Las palabras y notas nunca se guardan en almacenamiento local.
async function vocabAdmin(body){
  const response=await client.functions.invoke('schola-vocab-admin',{method:'POST',body});
  if(response.error||response.data?.error||!response.data)
    throw Error('Operación docente no autorizada o servicio no disponible');
  return response.data;
}
const textElement=(tag,value,className='')=>{
  const node=document.createElement(tag);
  node.textContent=String(value??'');
  if(className)node.className=className;
  return node;
};
function openWordEditor(word=null){
  editingVocabId=word?.id||null;
  el('vocab-form-heading').textContent=word?'Editar palabra':'Nueva palabra';
  el('vocab-word-form').reset();
  el('vocab-subject').value=word?.subject||'lat1';
  el('vocab-form-text').value=word?.form||'';
  el('vocab-meaning').value=word?.meaning||'';
  el('vocab-answers').value=(word?.answers||[]).join('\n');
  el('vocab-units').value=(word?.units||[]).join('; ');
  el('vocab-in-exam').checked=word?.in_exam===true;
  el('vocab-active').checked=word?.active!==false;
  el('vocab-word-form').hidden=false;
  el('vocab-form-text').focus();
}
function renderVocabWords(){
  const list=el('vocab-word-list');
  list.replaceChildren();
  for(const word of vocabWords){
    const card=textElement('article','', 'notice');
    card.append(textElement('h4',word.form),
      textElement('p',word.meaning),
      textElement('small',[word.subject,(word.units||[]).join(' · '),
        word.active?'Disponible':'Retirada'].join(' · ')));
    const edit=textElement('button','Editar');
    edit.type='button';edit.addEventListener('click',()=>openWordEditor(word));
    card.append(edit);list.append(card);
  }
  el('vocab-more').hidden=vocabWords.length===0||vocabWords.length%100!==0;
  el('vocab-admin-status').textContent=vocabWords.length+
    ' palabras cargadas. Para editar otras entradas, carga más resultados.';
}
async function loadVocabWords(append=false){
  if(!append){vocabWordOffset=0;vocabWords=[]}
  const result=await vocabAdmin({action:'words.list',offset:vocabWordOffset});
  const words=Array.isArray(result.words)?result.words:[];
  vocabWords.push(...words);
  vocabWordOffset+=words.length;
  renderVocabWords();
  el('vocab-more').hidden=!result.hasMore;
}
async function saveVocabWord(){
  const split=raw=>[...new Set(raw.split(/[;\n]/).map(x=>x.trim()).filter(Boolean))];
  const body={
    action:'words.save',...(editingVocabId?{id:editingVocabId}:{}),
    subject:el('vocab-subject').value,form:el('vocab-form-text').value,
    meaning:el('vocab-meaning').value,answers:split(el('vocab-answers').value),
    units:split(el('vocab-units').value),in_exam:el('vocab-in-exam').checked,
    active:el('vocab-active').checked
  };
  await vocabAdmin(body);
  el('vocab-word-form').hidden=true;editingVocabId=null;
  await loadVocabWords(false);
  el('vocab-admin-status').textContent='Palabra guardada en Vocabula. La consulta del alumnado se actualizará cuando vuelva a sincronizarse.';
}
const REPORT_STATES=[['pending','Pendiente'],['reviewing','En revisión'],
  ['resolved','Resuelta'],['dismissed','Descartada']];
function renderVocabReports(){
  const list=el('vocab-report-list');
  list.replaceChildren();
  for(const report of vocabReports){
    const card=textElement('article','', 'notice');
    card.append(textElement('h4',report.entry_form||report.kind),
      textElement('small',[report.subject,report.mode,
        report.created_at?new Date(report.created_at).toLocaleString('es-ES'):''].join(' · ')),
      textElement('p',report.message));
    const stateLabel=textElement('label','Estado');const select=document.createElement('select');
    for(const [value,label] of REPORT_STATES){
      const option=document.createElement('option');option.value=value;option.textContent=label;
      select.append(option);
    }
    select.value=report.status;
    const noteLabel=textElement('label','Nota privada del profesor');
    const note=document.createElement('textarea');note.value=report.teacher_note||'';
    note.maxLength=2000;note.rows=3;
    const save=textElement('button','Guardar revisión');save.type='button';
    save.addEventListener('click',()=>void safely(async()=>{
      await vocabAdmin({action:'reports.review',id:report.id,status:select.value,teacher_note:note.value});
      await loadVocabReports(false);
      await fetchNotices();
    }));
    card.append(stateLabel,select,noteLabel,note,save);
    list.append(card);
  }
  el('vocab-report-status').textContent=vocabReports.length+
    ' incidencias cargadas (estado seleccionado: '+(el('vocab-report-filter').selectedOptions[0]?.textContent||'')+').';
}
async function loadVocabReports(append=false){
  if(!append){vocabReportOffset=0;vocabReports=[]}
  const result=await vocabAdmin({action:'reports.list',
    status:el('vocab-report-filter').value,offset:vocabReportOffset});
  const reports=Array.isArray(result.reports)?result.reports:[];
  vocabReports.push(...reports);
  vocabReportOffset+=reports.length;
  renderVocabReports();
  el('vocab-report-more').hidden=!result.hasMore;
}
el('vocab-load').addEventListener('click',()=>void safely(()=>loadVocabWords(false)));
el('vocab-more').addEventListener('click',()=>void safely(()=>loadVocabWords(true)));
el('vocab-new').addEventListener('click',()=>openWordEditor());
el('vocab-cancel').addEventListener('click',()=>{editingVocabId=null;el('vocab-word-form').hidden=true});
el('vocab-word-form').addEventListener('submit',event=>{
  event.preventDefault();void safely(saveVocabWord);
});
el('vocab-report-load').addEventListener('click',()=>void safely(()=>loadVocabReports(false)));
el('vocab-report-more').addEventListener('click',()=>void safely(()=>loadVocabReports(true)));
el('vocab-report-filter').addEventListener('change',()=>{
  vocabReports=[];el('vocab-report-list').replaceChildren();el('vocab-report-more').hidden=true;
});

void init();
