/* Exportación e importación reversible del historial de repaso gramatical.
 * Compatible con el sitio antiguo y con el módulo independiente de ScholaClassica.
 * No toca el progreso de Vocabula (classics-progress-v1) ni el de Morfología.
 */
(function(){
 'use strict';
 const KEY='classics-grammar-v1';
 const SCHEMA='schola-grammar-progress/v1';
 const MAX_LENGTH=8*1024*1024,MAX_RECORDS=100000;
 const isRecord=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 function validate(data){
  if(!isRecord(data))throw Error('El archivo no contiene datos de gramática válidos.');
  const entries=Object.entries(data);
  if(entries.length>MAX_RECORDS)throw Error('Demasiadas preguntas en el archivo.');
  const result=Object.create(null);
  for(const [id,value] of entries){
   if(!/^(?:(?:lat1|lat4|gr1)\||(?:import|online)\|(?:lat1|lat4|gr1)\|)/.test(id)||
     id.length>600||['__proto__','constructor','prototype'].includes(id))
    throw Error('Identificador de pregunta no reconocido.');
   if(!isRecord(value)||!Number.isSafeInteger(value.total)||
      !Number.isSafeInteger(value.right)||value.total<0||
      value.right<0||value.right>value.total||typeof value.failed!=='boolean')
    throw Error('Historial de intentos incorrecto.');
   result[id]={total:value.total,right:value.right,failed:value.failed};
  }
  return result;
 }
 function unpack(text){
  if(typeof text!=='string'||text.length>MAX_LENGTH)throw Error('Archivo demasiado grande.');
  const parsed=JSON.parse(text);
  if(!isRecord(parsed)||parsed.schema!==SCHEMA||parsed.version!==1||
    parsed.kind!=='grammar'||parsed.storageKey!==KEY)
   throw Error('Elige un archivo de progreso gramatical, no de vocabulario.');
  return validate(parsed.progress);
 }
 function pack(data){
  const progress=validate(data);
  const serialized=JSON.stringify({schema:SCHEMA,version:1,kind:'grammar',storageKey:KEY,progress},null,2);
  if(serialized.length>MAX_LENGTH)throw Error('El historial excede el tamaño permitido.');
  return serialized;
 }
 function merge(current,incoming){
  const old=validate(current),other=validate(incoming);
  const result=Object.assign(Object.create(null),old);
  for(const [key,value] of Object.entries(other)){
   if(!Object.prototype.hasOwnProperty.call(result,key)||value.total>result[key].total)
    result[key]=value;
  }
  return result;
 }
 const api={KEY,SCHEMA,validate,pack,unpack,merge};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(typeof window==='undefined'||typeof document==='undefined')return;
 window.GrammarProgressTransfer=api;
 function init(){
  if(document.getElementById('grammar-progress-export'))return;
  const holder=document.querySelector('.grammar-help')||document.querySelector('main');
  if(!holder)return;
  const details=document.createElement('details');
  details.className='help';
  details.id='grammar-progress-tools';
  const summary=document.createElement('summary');
  summary.textContent='Guardar o recuperar mi progreso de gramática';
  const description=document.createElement('p');
  description.textContent='Conserva tus respuestas de sintaxis, conceptos y flexiones en un archivo JSON. Puedes trasladarlas desde la web antigua a ScholaClassica sin perder el historial del vocabulario.';
  const actions=document.createElement('div');
  actions.className='grammar-actions';
  const exportButton=document.createElement('button');
  exportButton.id='grammar-progress-export';
  exportButton.type='button';
  exportButton.className='secondary';
  exportButton.textContent='Exportar progreso de gramática';
  const label=document.createElement('label');
  label.className='import';
  label.textContent='Importar progreso de gramática ';
  const input=document.createElement('input');
  input.type='file';
  input.id='grammar-progress-import';
  input.accept='.json,application/json';
  label.append(input);
  const status=document.createElement('p');
  status.id='grammar-progress-status';
  status.setAttribute('role','status');
  status.setAttribute('aria-live','polite');
  actions.append(exportButton,label);
  details.append(summary,description,actions,status);
  holder.prepend(details);
  const report=s=>{status.textContent=s;};
  try{
   const last=sessionStorage.getItem('schola-grammar-last-import');
   if(last){report(last);sessionStorage.removeItem('schola-grammar-last-import');details.open=true;}
  }catch{}
  exportButton.addEventListener('click',()=>{
   try{
    const progress=validate(JSON.parse(localStorage.getItem(KEY)||'{}'));
    const json=pack(progress);
    const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
    const anchor=document.createElement('a');
    anchor.href=url;
    anchor.download='progreso-gramatica.json';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    report('Historial exportado ('+Object.keys(progress).length+' preguntas).');
   }catch(error){report('No se pudo exportar: '+error.message);}
  });
  input.addEventListener('change',async()=>{
   if(!input.files?.length)return;
   try{
    const file=input.files[0];
    if(file.size>MAX_LENGTH)throw Error('Archivo demasiado grande.');
    const imported=unpack(await file.text());
    const current=validate(JSON.parse(localStorage.getItem(KEY)||'{}'));
    const combined=merge(current,imported);
    const serialized=JSON.stringify(combined);
    if(serialized.length>MAX_LENGTH)throw Error('No cabe el historial combinado.');
    // Una única escritura atómica local; la aplicación reabre su motor para
    // que ninguna sesión en memoria sobrescriba el historial recién importado.
    localStorage.setItem(KEY,serialized);
    const message='Historial importado: '+Object.keys(imported).length+
      ' preguntas. Se han conservado los registros más recientes por número de intentos.';
    try{sessionStorage.setItem('schola-grammar-last-import',message)}catch{}
    window.location.reload();
   }catch(error){report('No se ha importado nada: '+error.message);}
   finally{input.value='';}
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
