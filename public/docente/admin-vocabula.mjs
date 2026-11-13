// Herramientas docentes de Vocabula; no reutilizan su código privado heredado.
// El servidor verifica de nuevo la UUID y el nivel aal2 en CADA operación.
// Nunca introducir HTML proveniente de palabras o avisos.
const el=id=>document.getElementById(id);
const subjects={lat4:'Latín · 4.º ESO',lat1:'Latín I',lat2:'Latín II',gr1:'Griego I'};
const kinds={translation:'Traducción o respuesta',missing:'Palabra que falta',units:'Unidad o examen',other:'Otro problema'};
const states={pending:'Pendiente',reviewing:'En revisión',resolved:'Resuelta',dismissed:'Descartada'};
const PAGE=50;
const text=(tag,value,cls='')=>{
  const node=document.createElement(tag);node.textContent=String(value??'');
  if(cls)node.className=cls;
  return node;
};
const unique=value=>[...new Set(value.map(s=>s.trim()).filter(Boolean))];
let client,refreshNotices,attached=false,wordOffset=0,reportOffset=0,
  words=[],reports=[],moreWords=false,moreReports=false,editingId=null,requestBusy=false;
function status(id,value,isError=false){
  const node=el(id);node.textContent=value;
  node.classList.toggle('error',isError);
}
async function execute(body){
  if(!client)throw Error('La sesión docente no está disponible');
  const result=await client.functions.invoke('schola-vocab-admin',{method:'POST',body});
  if(result.error||result.data?.error||!result.data){
    const message=result.data?.error;
    throw Error(typeof message==='string'&&message.length<180?message:
      'No se pudo completar la consulta. Comprueba tu sesión y la conexión.');
  }
  return result.data;
}
async function guarded(work){
  if(requestBusy)return;
  requestBusy=true;
  const buttons=[...el('vocab-admin').querySelectorAll('button')];
  buttons.forEach(button=>button.disabled=true);
  try{await work()}catch(error){status('admin-status',error?.message||'Operación no disponible',true)}
  finally{
    requestBusy=false;
    buttons.forEach(button=>button.disabled=false);
    updatePagination();
  }
}
function updatePagination(){
  el('admin-words-prev').disabled=wordOffset<=0||requestBusy;
  el('admin-words-next').disabled=!moreWords||requestBusy;
  el('admin-reports-prev').disabled=reportOffset<=0||requestBusy;
  el('admin-reports-next').disabled=!moreReports||requestBusy;
  el('admin-words-page').textContent='Página '+(Math.floor(wordOffset/PAGE)+1);
  el('admin-reports-page').textContent='Página '+(Math.floor(reportOffset/PAGE)+1);
}
function showTab(tab){
  el('admin-words').hidden=tab!=='words';
  el('admin-reports').hidden=tab!=='reports';
  el('admin-tab-words').setAttribute('aria-pressed',String(tab==='words'));
  el('admin-tab-reports').setAttribute('aria-pressed',String(tab==='reports'));
}
function editWord(word=null){
  editingId=word?.id||null;
  const form=el('admin-word-form');form.reset();
  el('admin-word-heading').textContent=word?'Editar palabra':'Añadir palabra';
  el('admin-word-subject').value=word?.subject||el('admin-subject-filter').value||'lat1';
  el('admin-word-form-text').value=word?.form||'';
  el('admin-word-meaning').value=word?.meaning||'';
  el('admin-word-answers').value=(word?.answers||[]).join('\n');
  el('admin-word-units').value=(word?.units||[]).join('; ');
  el('admin-word-exam').checked=word?.in_exam===true;
  el('admin-word-active').checked=word?.active!==false;
  form.hidden=false;
  el('admin-word-form-text').focus();
}
function renderWords(){
  const container=el('admin-word-list');container.replaceChildren();
  for(const word of words){
    const card=text('article','', 'notice');
    card.append(text('h4',word.form),text('p',word.meaning));
    card.append(text('small',[(subjects[word.subject]||word.subject),
      (word.units||[]).join(' · '),word.in_exam?'General y examen':'General',
      word.active?'Publicada':'Retirada'].join(' · ')));
    const edit=text('button','Editar palabra');edit.type='button';
    edit.addEventListener('click',()=>editWord(word));
    card.append(edit);container.append(card);
  }
  status('admin-word-status',words.length
    ?'Mostrando '+(wordOffset+1)+'–'+(wordOffset+words.length)+' palabras.'
    :'No hay palabras añadidas por el profesor con estos filtros.');
  updatePagination();
}
async function loadWords(){
  const query={action:'words.list',offset:wordOffset,
    subject:el('admin-subject-filter').value,
    search:el('admin-search').value.trim()};
  const data=await execute(query);
  if(!Array.isArray(data.words))throw Error('Respuesta incompleta del catálogo');
  words=data.words;moreWords=data.more===true;
  renderWords();
  status('admin-status','Palabras de Vocabula actualizadas');
}
async function saveWord(){
  const answers=unique(el('admin-word-answers').value.split(/\r?\n/));
  const units=unique(el('admin-word-units').value.split(/[;\n]/));
  if(!answers.length||!units.length)
    throw Error('Indica al menos una respuesta admitida y una unidad.');
  const body={action:'words.save',...(editingId?{id:editingId}:{}),
    subject:el('admin-word-subject').value,
    form:el('admin-word-form-text').value,
    meaning:el('admin-word-meaning').value,
    answers,units,
    in_exam:el('admin-word-exam').checked,
    active:el('admin-word-active').checked};
  if(editingId){
    const old=words.find(word=>word.id===editingId);
    if(old?.active&&body.active===false&&
      !window.confirm('¿Retirar esta aportación del vocabulario del alumnado?'))
      return;
  }
  const result=await execute(body);
  if(result.saved!==true)throw Error('El servidor no confirmó el guardado');
  editingId=null;el('admin-word-form').hidden=true;
  await loadWords();
  status('admin-status','Palabra guardada correctamente en Vocabula.');
}
const option=(value,label)=>{const el=document.createElement('option');el.value=value;el.textContent=label;return el};
function renderReports(){
  const target=el('admin-report-list');target.replaceChildren();
  for(const report of reports){
    const card=text('article','','notice');
    card.append(text('h4',(kinds[report.kind]||report.kind)+' · '+(report.entry_form||'Sin lema')),
      text('small',[(subjects[report.subject]||report.subject),report.mode,
        (report.units||[]).join(' · '),
        report.created_at?new Date(report.created_at).toLocaleString('es-ES'):''].join(' · ')),
      text('p',report.message));
    const label=text('label','Estado');
    const select=document.createElement('select');
    const sid='report-status-'+report.id;select.id=sid;label.htmlFor=sid;
    for(const [value,name] of Object.entries(states))select.append(option(value,name));
    select.value=report.status;
    const noteLabel=text('label','Nota privada del profesor');
    const note=document.createElement('textarea');
    note.rows=3;note.maxLength=2000;note.value=report.teacher_note||'';
    const nid='report-note-'+report.id;note.id=nid;noteLabel.htmlFor=nid;
    const save=text('button','Guardar revisión');save.type='button';save.className='primary';
    save.addEventListener('click',()=>void guarded(async()=>{
      const result=await execute({action:'reports.review',id:report.id,
        status:select.value,teacher_note:note.value});
      if(result.saved!==true)throw Error('No se confirmó la revisión');
      await loadReports();await refreshNotices();
      status('admin-status','Incidencia revisada correctamente');
    }));
    const actions=document.createElement('div');actions.className='admin-actions';
    actions.append(save);
    if(report.kind==='missing'){
      const prepare=text('button','Preparar palabra nueva');prepare.type='button';
      prepare.addEventListener('click',()=>{
        showTab('words');editWord({subject:report.subject,form:report.entry_form,
          meaning:'',answers:[],units:report.units||[],
          in_exam:report.mode==='examen',active:true});
        status('admin-status','Completa y revisa la palabra antes de guardarla');
      });
      actions.append(prepare);
    }
    card.append(label,select,noteLabel,note,actions);target.append(card);
  }
  status('admin-report-status',reports.length
    ?'Mostrando '+(reportOffset+1)+'–'+(reportOffset+reports.length)+' incidencias.'
    :'No hay incidencias en esta categoría.');
  updatePagination();
}
async function loadReports(){
  const data=await execute({action:'reports.list',
    status:el('admin-report-filter').value,offset:reportOffset});
  if(!Array.isArray(data.reports))throw Error('Respuesta incompleta de incidencias');
  reports=data.reports;moreReports=data.more===true;
  renderReports();status('admin-status','Incidencias de Vocabula actualizadas');
}
function attach(){
  if(attached)return;
  attached=true;
  el('admin-tab-words').addEventListener('click',()=>showTab('words'));
  el('admin-tab-reports').addEventListener('click',()=>{showTab('reports');void guarded(loadReports)});
  el('admin-search-form').addEventListener('submit',event=>{
    event.preventDefault();wordOffset=0;void guarded(loadWords)});
  el('admin-subject-filter').addEventListener('change',()=>{wordOffset=0;void guarded(loadWords)});
  el('admin-new').addEventListener('click',()=>editWord());
  el('admin-words-prev').addEventListener('click',()=>{wordOffset=Math.max(0,wordOffset-PAGE);void guarded(loadWords)});
  el('admin-words-next').addEventListener('click',()=>{if(moreWords){wordOffset+=PAGE;void guarded(loadWords)}});
  el('admin-word-form').addEventListener('submit',event=>{event.preventDefault();void guarded(saveWord)});
  el('admin-cancel-word').addEventListener('click',()=>{editingId=null;el('admin-word-form').hidden=true});
  el('admin-report-filter').addEventListener('change',()=>{reportOffset=0;void guarded(loadReports)});
  el('admin-refresh-reports').addEventListener('click',()=>void guarded(loadReports));
  el('admin-reports-prev').addEventListener('click',()=>{reportOffset=Math.max(0,reportOffset-PAGE);void guarded(loadReports)});
  el('admin-reports-next').addEventListener('click',()=>{if(moreReports){reportOffset+=PAGE;void guarded(loadReports)}});
}
export async function mountVocabulaAdmin(settings){
  client=settings.client;refreshNotices=settings.refreshNotices;
  attach();
  if(!el('admin-word-list').hasChildNodes()&&words.length===0)await guarded(loadWords);
}
export function resetVocabulaAdmin(){
  client=null;words=[];reports=[];moreWords=false;moreReports=false;
  wordOffset=0;reportOffset=0;editingId=null;
  el('admin-word-form')?.reset();
  if(el('admin-word-form'))el('admin-word-form').hidden=true;
  for(const id of ['admin-word-list','admin-report-list'])el(id)?.replaceChildren();
  if(el('admin-status'))status('admin-status','');
  if(el('admin-word-status'))status('admin-word-status','');
  if(el('admin-report-status'))status('admin-report-status','');
  if(el('vocab-admin'))showTab('words');
}
