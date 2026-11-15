'use strict';
// Exclusivo del vocabulario integrado en ScholaClassica. Nunca añade
// credenciales ni captura respuestas: el progreso sigue en classics-progress-v1.
(()=>{
 const WORDS_KEY='schola-vocabula-public-words-v1';
 const REPORTS_KEY='schola-vocabula-reports-pending-v1';
 const subjects=['lat1','lat2','lat4','gr1'];
 const modes=['general','examen'];
 const kinds=['translation','missing','units','other'];
 const MAX_WORDS=2000,MAX_REPORTS=15;
 let flushing=null;
 const read=key=>{try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):null}catch{return null}};
 const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}};
 const strings=(a,max,count)=>Array.isArray(a)&&a.length<=count&&
   a.every(x=>typeof x==='string'&&x.length>0&&x.length<=max);
 function validateWords(words){
   return Array.isArray(words)&&words.length<=MAX_WORDS&&words.every(w=>
     w&&typeof w==='object'&&typeof w.id==='string'&&w.id.length<=100&&
     subjects.includes(w.subject)&&typeof w.form==='string'&&w.form.length<=300&&
     typeof w.meaning==='string'&&w.meaning.length<=1000&&
     strings(w.answers,150,30)&&strings(w.units,150,30)&&
     typeof w.active==='boolean'&&typeof w.in_exam==='boolean');
 }
 function loadWords(){
   const data=read(WORDS_KEY);
   return data?.schema===1&&validateWords(data.words)?data.words:null;
 }
 function saveWords(words){
   if(!validateWords(words))return false;
   return write(WORDS_KEY,{schema:1,words});
 }
 function validReport(r){
   return r&&typeof r==='object'&&
     kinds.includes(r.kind)&&subjects.includes(r.subject)&&modes.includes(r.mode)&&
     strings(r.units,150,30)&&typeof r.entry_id==='string'&&r.entry_id.length<=100&&
     typeof r.entry_form==='string'&&r.entry_form.length<=300&&
     typeof r.message==='string'&&r.message.trim().length>=5&&r.message.length<=2000;
 }
 function queue(){
   const data=read(REPORTS_KEY);
   if(!data)return [];
   if(data.schema!==1||!Array.isArray(data.items)||data.items.length>MAX_REPORTS||
      !data.items.every(x=>x&&typeof x.id==='string'&&validReport(x.payload)))
     throw Error('No se puede leer la cola anterior de avisos. Exporta o revisa el almacenamiento.');
   return data.items;
 }
 function pendingCount(){
   try{return queue().length}catch{return -1}
 }
 function queueReport(report){
   if(!validReport(report))throw Error('El aviso contiene campos no válidos.');
   const items=queue();
   if(items.length>=MAX_REPORTS)throw Error('Hay demasiados avisos pendientes. Vuelve a conectarte para enviarlos.');
   const payload={
     subject:report.subject,mode:report.mode,units:[...report.units],
     entry_id:report.entry_id,entry_form:report.entry_form,
     kind:report.kind,message:report.message
   };
   const id=typeof crypto?.randomUUID==='function'?crypto.randomUUID():
     Date.now()+'-'+Math.random().toString(36).slice(2);
   if(!write(REPORTS_KEY,{schema:1,items:[...items,{id,payload}]}))
     throw Error('El navegador no permite conservar el aviso. No se ha enviado.');
   return items.length+1;
 }
 async function flushReports(send){
   if(flushing)return flushing;
   flushing=(async()=>{
     let sent=0,error=null;
     try{
       if(typeof send!=='function')throw Error('No hay canal disponible para enviar avisos.');
       while(navigator.onLine){
         const items=queue();
         if(!items.length)break;
         const current=items[0];
         try{await send(current.payload)}catch(e){error=e;break}
         // No borrar avisos distintos almacenados por otra pestaña.
         const latest=queue();
         if(latest[0]?.id!==current.id){error=Error('La cola cambió en otra pestaña.');break}
         if(!write(REPORTS_KEY,{schema:1,items:latest.slice(1)})){
           error=Error('No se puede confirmar el borrado del aviso enviado.');break;
         }
         sent++;
       }
     }catch(e){error=e}
     return {sent,pending:pendingCount(),error};
   })();
   try{return await flushing}finally{flushing=null}
 }
 if('serviceWorker' in navigator){
   window.addEventListener('load',()=>{
     navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});
   });
 }
 window.scholaVocabulaOffline=Object.freeze({
   validateWords,loadWords,saveWords,queueReport,pendingCount,flushReports
 });
})();
