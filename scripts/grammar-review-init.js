/* El enlace del itinerario selecciona la asignatura sin mezclar progresos. */
(()=>{'use strict';
 document.addEventListener('DOMContentLoaded',()=>{
  const subject=new URLSearchParams(location.search).get('subject');
  if(!['lat1','lat4','gr1'].includes(subject))return;
  const control=document.getElementById('subject');
  if(!control||control.value===subject)return;
  control.value=subject;
  control.dispatchEvent(new Event('change',{bubbles:true}));
 });
})();
