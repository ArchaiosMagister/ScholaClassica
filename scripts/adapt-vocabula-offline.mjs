import assert from 'node:assert/strict';
import {cp,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';

// Adaptación limitada a dist: el repositorio independiente no se escribe.
function once(text,original,replacement,context){
 assert.equal(text.split(original).length,2,'Cambió Vocabula ('+context+'): revisar antes de publicar');
 return text.replace(original,replacement);
}
export function adaptVocabulaOfflineHtml(html){
 html=once(html,'<link rel="icon" href="icons/favicon.ico?v=1"',
   '<link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icons/favicon.ico?v=1"',
   'manifest');
 html=once(html,
   '<script src="teacher.js?v=20261113-solo-alumnos1" defer></script>',
   '<script src="schola-offline.js" defer></script><script src="teacher.js?v=20261113-solo-alumnos1" defer></script>',
   'scripts');
 html=once(html,'<p id="cloud-status" class="small" role="status">Cargando las últimas palabras…</p>',
   '<div><p id="cloud-status" class="small" role="status">Cargando las últimas palabras…</p><p id="pending-reports" class="small" role="status" aria-live="polite"></p></div>',
   'estado de avisos');
 html=once(html,'Progreso y fallos se guardan en este navegador y dispositivo.',
   'Progreso y fallos se guardan en este navegador y dispositivo. Después de abrir la página con conexión una vez, puedes repasar sin Internet; las palabras añadidas por el profesor se conservarán desde la última actualización. Los avisos redactados sin red se guardan localmente y se reenvían al volver a abrir la página con conexión.',
   'explicación offline');
 return html;
}
export function adaptVocabulaOfflineTeacher(js){
 js=once(js,'let custom=[],reportContext=null;',
   'let custom=scholaVocabulaOffline.loadWords()||[],reportContext=null;',
   'restauración de palabras');
 const originalSync=" async function sync(){try{const r=await api('public_words');custom=r.words;applyWords();$('cloud-status').textContent='Vocabulario actualizado · Las palabras añadidas por el profesor están disponibles.';return true}catch(e){$('cloud-status').innerHTML='No se pudieron cargar las últimas palabras. Puedes practicar con el vocabulario inicial. <button class=\"text\" id=\"retry-cloud\">Reintentar</button>';$('retry-cloud').onclick=sync;return false}}\n";
 const adaptedSync=String.raw` function pendingStatus(){
   const count=scholaVocabulaOffline.pendingCount();
   const area=$('pending-reports');if(!area)return;
   if(count<0){area.textContent='No se puede leer el almacenamiento de avisos pendientes.';return}
   area.textContent=count?count+' aviso'+(count===1?'':'s')+' pendiente'+(count===1?'':'s')+' de envío. ':'';
   if(count){
     const button=document.createElement('button');
     button.className='text';button.type='button';button.textContent='Reenviar avisos';
     button.onclick=resendReports;area.append(button);
   }
 }
 async function resendReports(){
   const result=await scholaVocabulaOffline.flushReports(data=>api('report',data));
   pendingStatus();
   if(result.sent>0)$('cloud-status').textContent=
     'Se han enviado '+result.sent+' avisos pendientes. Vocabulario disponible.';
   return result;
 }
 async function sync(){
   if(!navigator.onLine){
     $('cloud-status').textContent='Sin conexión · Practica con el vocabulario guardado en este dispositivo.';
     pendingStatus();return false;
   }
   try{
     const r=await api('public_words');
     if(!scholaVocabulaOffline.validateWords(r.words))throw Error('Respuesta de vocabulario inválida');
     custom=r.words;scholaVocabulaOffline.saveWords(custom);applyWords();
     $('cloud-status').textContent='Vocabulario actualizado · Las palabras añadidas por el profesor están disponibles.';
     pendingStatus();await resendReports();return true;
   }catch(e){
     $('cloud-status').innerHTML=
       'No se pudieron cargar las últimas palabras. Puedes practicar con el vocabulario guardado. <button class="text" id="retry-cloud">Reintentar</button>';
     $('retry-cloud').onclick=sync;pendingStatus();return false;
   }
 }
`;
 js=once(js,originalSync,adaptedSync,'sincronización y reenvío');
 const originalReport="try{await api('report',{...reportContext,kind:$('report-kind').value,message:$('report-message').value});$('report-form').innerHTML='<p role=\"status\" class=\"feedback\">Aviso enviado. Gracias por ayudar a mejorar el vocabulario.</p><button type=\"button\" data-close=\"report-dialog\">Cerrar</button>'}catch(e){status('report-status',e.message,true);$('send-report').disabled=false}";
 const adaptedReport=String.raw`try{
   const report={...reportContext,kind:$('report-kind').value,message:$('report-message').value};
   if(!navigator.onLine)throw new TypeError('Sin conexión');
   await api('report',report);
   $('report-form').innerHTML='<p role="status" class="feedback">Aviso enviado. Gracias por ayudar a mejorar el vocabulario.</p><button type="button" data-close="report-dialog">Cerrar</button>';
 }catch(e){
   if(!navigator.onLine||e instanceof TypeError){
     try{
       scholaVocabulaOffline.queueReport({
         ...reportContext,kind:$('report-kind').value,message:$('report-message').value
       });
       $('report-form').innerHTML='<p role="status" class="feedback">Aviso guardado en este dispositivo. Se enviará al recuperar la conexión y abrir el vocabulario.</p><button type="button" data-close="report-dialog">Cerrar</button>';
       pendingStatus();
     }catch(storageError){
       status('report-status',storageError.message,true);$('send-report').disabled=false;
     }
   }else{status('report-status',e.message,true);$('send-report').disabled=false}
 }`;
 js=once(js,originalReport,adaptedReport,'avisos offline');
 js=once(js," $('open-report').onclick=()=>openReport();\n sync();",
   " $('open-report').onclick=()=>openReport();\n if(custom.length)applyWords();\n pendingStatus();\n sync();",
   'restauración inicial');
 return js;
}
export async function buildVocabulaOffline(destination,root){
 const htmlPath=join(destination,'index.html');
 const teacherPath=join(destination,'teacher.js');
 await writeFile(htmlPath,adaptVocabulaOfflineHtml(await readFile(htmlPath,'utf8')));
 await writeFile(teacherPath,adaptVocabulaOfflineTeacher(await readFile(teacherPath,'utf8')));
 await cp(join(root,'scripts/vocabula-offline-client.js'),join(destination,'schola-offline.js'));
}
