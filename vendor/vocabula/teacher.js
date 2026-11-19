'use strict';
(()=>{
 const original=[...VOCAB];let custom=[],reportContext=null;
 const subjects={lat1:'Latín I',lat2:'Latín II · 2.º Bachillerato',lat4:'Latín 4.º ESO',gr1:'Griego I'};
 const kinds={translation:'Traducción o respuesta',missing:'Palabra que falta',units:'Unidad o examen',other:'Otro problema'};
 const statuses={pending:'Pendiente',reviewing:'En revisión',resolved:'Resuelto',dismissed:'Descartado'};
 const key=s=>s.normalize('NFC').toLocaleLowerCase().trim();
 const options=(map,value)=>Object.entries(map).map(([v,t])=>`<option value="${esc(v)}" ${v===value?'selected':''}>${esc(t)}</option>`).join('');
 function status(id,msg,error=false){const el=$(id);if(el){el.textContent=msg;el.className='form-status '+(error?'error':'success')}}
 async function api(action,data={}){
  if(!['public_words','report'].includes(action))throw Error('Operación no permitida');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{
    const response=await fetch(window.VOCAB_SERVICE,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action,...data}),signal:controller.signal
    });
    const result=await response.json();
    if(!response.ok)throw Error(result.error||'No se pudo completar la solicitud');
    return result;
  }finally{clearTimeout(timer)}
 }
 function applyWords(){let entries=[...original];for(const w of custom){if(!w.active)continue;const matches=entries.filter(e=>e.subject===w.subject&&key(e.form)===key(w.form));entries=entries.filter(e=>!(e.subject===w.subject&&key(e.form)===key(w.form)));for(const mode of w.in_exam?['general','examen']:['general']){const old=matches.find(e=>e.mode===mode);entries.push({id:old?.id||'custom-'+w.id+'-'+mode,subject:w.subject,mode,form:w.form,meaning:w.meaning,answers:w.answers,units:w.units,originals:[w.form+': '+w.meaning]})}}VOCAB.splice(0,VOCAB.length,...entries);const checked=selectedUnits();invalidateSession();setup(checked)}
 async function sync(){try{const r=await api('public_words');custom=r.words;applyWords();$('cloud-status').textContent='Vocabulario actualizado · Las palabras añadidas por el profesor están disponibles.';return true}catch(e){$('cloud-status').innerHTML='No se pudieron cargar las últimas palabras. Puedes practicar con el vocabulario inicial. <button class="text" id="retry-cloud">Reintentar</button>';$('retry-cloud').onclick=sync;return false}}
 function openReport(entry=null){reportContext=entry?{subject:entry.subject,mode:entry.mode,units:[...entry.units],entry_id:entry.id,entry_form:entry.form}:{subject:$('subject').value,mode:$('corpus').value,units:[...$('units').querySelectorAll('input:checked')].map(x=>x.value),entry_id:'',entry_form:''};const c=reportContext;
 $('report-dialog').innerHTML=`<div class="dialoghead"><h2 id="report-title">Avisar de un error</h2><button type="button" data-close="report-dialog" aria-label="Cerrar aviso">Cerrar</button></div><p class="notice">Tu aviso lo leerá el profesor. No escribas nombres, correos ni datos personales.</p><p>${esc(subjects[c.subject])} · ${esc(modeLabel(c.subject,c.mode))}<br>${c.entry_form?'<strong>'+formHTML(c,c.entry_form)+'</strong>':esc(c.units.join(' · ')||'Sin unidad seleccionada')}</p><form id="report-form"><label for="report-kind">¿Qué has encontrado?</label><select id="report-kind">${options(kinds,c.entry_form?'translation':'missing')}</select><label for="report-message">Cuéntanos qué hay que revisar</label><textarea id="report-message" required minlength="5" maxlength="2000" placeholder="Por ejemplo: esta traducción también debería aceptarse…"></textarea><label class="honeypot" aria-hidden="true">No rellenar<input id="report-website" tabindex="-1" autocomplete="off"></label><p id="report-status" class="form-status" role="status"></p><button id="send-report" class="primary">Enviar aviso al profesor</button></form>`;
 $('report-form').onsubmit=async ev=>{ev.preventDefault();if($('report-website').value)return;$('send-report').disabled=true;status('report-status','Enviando…');try{await api('report',{...reportContext,kind:$('report-kind').value,message:$('report-message').value});$('report-form').innerHTML='<p role="status" class="feedback">Aviso enviado. Gracias por ayudar a mejorar el vocabulario.</p><button type="button" data-close="report-dialog">Cerrar</button>'}catch(e){status('report-status',e.message,true);$('send-report').disabled=false}};
 $('report-dialog').showModal();$('report-message').focus();}
 document.addEventListener('click',ev=>{
  const button=ev.target.closest('button');
  if(!button)return;
  if(button.dataset.close){
    document.getElementById(button.dataset.close)?.close();
    return;
  }
  if(button.hasAttribute('data-report-current')){
    openReport(session?.queue[session.i]||null);return;
  }
  if(button.dataset.reportId){
    openReport(VOCAB.find(entry=>entry.id===button.dataset.reportId));
  }
 });
 $('open-report').onclick=()=>openReport();
 sync();window.addEventListener('online',sync);
})();
