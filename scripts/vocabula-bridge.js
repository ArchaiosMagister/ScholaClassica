'use strict';
// Adaptación del artefacto ScholaClassica: seleccionar asignatura sin modificar el original.
(()=>{
  const value=new URLSearchParams(location.search).get('subject');
  if(!['lat1','lat2','lat4','gr1'].includes(value))return;
  const select=document.getElementById('subject');
  if(!select||!select.querySelector('option[value="'+value+'"]'))return;
  if(select.value!==value){
    select.value=value;
    select.dispatchEvent(new Event('change',{bubbles:true}));
  }
})();
