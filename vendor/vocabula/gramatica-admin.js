(function grammarAdmin(){
 'use strict';
 const $=id=>document.getElementById(id);
 const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const subjects={lat1:'Latín I',lat4:'Latín · 4.º ESO',gr1:'Griego I'};
 function message(id,value,bad=false){
  const el=$(id);if(el){el.textContent=value;el.className='form-status '+(bad?'error':'success')}
 }
 async function api(action,payload={}){
  if(action!=='report')throw Error('Operación no permitida');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{
    const response=await fetch(window.VOCAB_SERVICE,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action,...payload}),signal:controller.signal
    });
    const data=await response.json();
    if(!response.ok)throw Error(data.error||'No se pudo enviar el aviso');
    return data;
  }finally{clearTimeout(timer)}
 }
 function selectedUnits(){
  return [...$('units').querySelectorAll('input:checked')].map(input=>input.value);
 }
 function questionContext(){
  const q=window.GrammarPracticeDebug?.currentQuestion?.()||null;
  return {
   subject:q?.subject||$('subject').value,
   units:q?.unit?[q.unit]:selectedUnits().slice(0,30),
   entry_id:('grammar:'+(q?.id||'general')).slice(0,100),
   entry_form:('Gramática · '+(q?.prompt||'Aviso general')).slice(0,300),
   title:q?.prompt||'Aviso general de gramática',
   unit:q?.unit||selectedUnits().join(' · ')||'Sin unidad seleccionada'
  };
 }
 function openReport(){
  const context=questionContext();
  const dialog=$('report-dialog');
  dialog.innerHTML=`<div class="dialoghead"><h2 id="report-title">Avisar de un error de gramática</h2><button type="button" data-close="report-dialog" aria-label="Cerrar aviso">Cerrar</button></div>
   <p class="notice">El aviso lo recibirá el profesor. No incluyas nombres, correos ni datos personales.</p>
   <p><strong>${esc(subjects[context.subject])}</strong> · ${esc(context.unit)}</p>
   <p class="notice">${esc(context.title)}</p>
   <form id="grammar-report-form">
    <label for="grammar-report-message">¿Qué forma o respuesta habría que corregir?</label>
    <textarea id="grammar-report-message" required minlength="5" maxlength="2000" placeholder="Por ejemplo: esta forma también debería aceptarse…"></textarea>
    <label class="honeypot" aria-hidden="true">No rellenar<input id="grammar-report-website" tabindex="-1" autocomplete="off"></label>
    <p id="grammar-report-status" class="form-status" role="status"></p>
    <button id="grammar-report-send" class="primary" type="submit">Enviar aviso al profesor</button>
   </form>`;
  $('grammar-report-form').onsubmit=async event=>{
   event.preventDefault();
   if($('grammar-report-website').value)return;
   const send=$('grammar-report-send');
   send.disabled=true;
   message('grammar-report-status','Enviando aviso…');
   try{
    await api('report',{kind:'other',mode:'general',subject:context.subject,
     units:context.units,entry_id:context.entry_id,entry_form:context.entry_form,
     message:$('grammar-report-message').value});
    $('grammar-report-form').innerHTML='<p class="feedback" role="status">Aviso de gramática enviado al profesor.</p><button type="button" data-close="report-dialog">Cerrar</button>';
   }catch(error){message('grammar-report-status',error.message,true);send.disabled=false}
  };
  dialog.showModal();
  $('grammar-report-message').focus();
 }
 document.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(button?.dataset.close)document.getElementById(button.dataset.close)?.close();
 });
 $('open-report').addEventListener('click',openReport);
})();
