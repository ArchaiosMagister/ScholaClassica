import { RULES, FIXED_RULE, ruleName } from './rules.mjs';
import { findStudyWords, studyWordsForRule, studyRuleCounts, studySubtypes, studyHighlight, shuffleStudyWords } from './study.mjs';
import { DIFFICULTY_LEVELS, difficultyErrors, difficultyLabel, filterWordsByDifficultyLevels } from './difficulty.mjs';
import { chars, availableWords, chooseFromPool, availableFocusedWords, assessedChanges, coverage, validationErrors, newCardState, checkResult, checkAllChanges, revealCard, requiredRules, optionRuleIds } from './engine.mjs';
import { checkForWebappUpdates } from './update.mjs';
const app=document.querySelector('#app');
const esc = value => String(value ?? '').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const themePicker=document.querySelector('#theme-select');
const themeValues=new Set(['light','dark','oled']);
const storedTheme=localStorage.getItem('ev_theme');
const initialTheme=themeValues.has(storedTheme)?storedTheme:(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');
function theme(value){
 const mode=themeValues.has(value)?value:'light';
 document.documentElement.dataset.theme=mode;
 themePicker.value=mode;
 document.querySelector('meta[name="theme-color"]')?.setAttribute('content',mode==='oled'?'#000000':mode==='dark'?'#101b1d':'#0a555b');
 localStorage.setItem('ev_theme',mode);
}
theme(initialTheme);
themePicker.addEventListener('change',event=>theme(event.target.value));
const allDifficultyLevels=()=>new Set(DIFFICULTY_LEVELS.map(x=>x.level));
let words=[], difficultyAssignments={}, practiceDifficulty=allDifficultyLevels(), studyDifficulty=allDifficultyLevels(),
 selected=new Set(RULES.map(r=>r.id)), practiceScope='general', focusRule='PALAT', mode='guided', requested=10, session=null, cardState=null, feedback='';
const wordDifficulty=word=>difficultyLabel(difficultyAssignments[word.id]?.level);
const isFocused = () => practiceScope === 'focus';
const eligiblePool = () => filterWordsByDifficultyLevels(
 isFocused()?availableFocusedWords(words,focusRule):availableWords(words,selected),
 difficultyAssignments,practiceDifficulty
);
const focusedName = () => ruleName(focusRule);
let drafts=[], draftSerial=0, batchFeedback='', focusHintShown=false;
let blindSpans=[], pendingStart=null, insertion=null;
const phaseTitle={1:'Fase 1 · Resultado castellano',2:'Fase 2 · Identifica los cambios',3:'Explicación de la evolución'};
const MAX_PRACTICE_ATTEMPTS=3;
const attemptsLeft=used=>Math.max(0,MAX_PRACTICE_ATTEMPTS-used);
const revealButton=()=>'<button type="button" class="button-secondary practice-reveal-button" data-action="reveal">No lo sé · Ver solución</button>';
const currentWord=()=>session?.cards[session.index];
const progress=()=>session? Math.round((session.index/session.cards.length)*100):0;
// Indica la vía de transmisión sin presentar una adaptación culta como evolución patrimonial.
function transmissionNote(w){
 if(w.source?.transmission==='ADAPTACION_CULTA')return '<p class="transmission-note"><strong>Adaptación culta.</strong> Se estudian correspondencias gráficas, no una evolución patrimonial completa.</p>';
 if(w.source?.transmission==='REGIONAL_HISTORICA')return '<p class="transmission-note"><strong>Voz regional o histórica.</strong> Su significado y uso pueden ser específicos.</p>';
 if(w.source?.generatorId)return '<p class="transmission-note">Ficha importada de GeneradorExamenes: anotación posicional comprobada, pendiente de certificación filológica individual.</p>';
 return '';
}
function wordSourceNote(w){
 return w.source?.generatorId
  ? `Fuente: GeneradorExamenes · ${esc(w.source.generatorId)} · fila ${esc(w.source.row)}. Estado de origen: APTO_PROPUESTO (preselección didáctica, no certificación filológica).`
  : `Fuente: Excel docente · Banco, fila ${esc(w.source.row)} · Lote ${esc(w.source.lot)}.`;
}
const labelFragment=(word,t)=>t.anchor!==undefined?`Inserción ${t.anchor===0?'antes de '+chars(word.latin)[0]??'':'tras la letra '+chars(word.latin)[t.anchor-1]}`:t.spans.map(([s,e])=>chars(word.latin).slice(s,e).join('')).join(' + ');
function setupHTML(){
 const pool=eligiblePool();const count=Math.min(requested,pool.length);
 const focusCounts=Object.fromEntries(RULES.map(r=>[r.id,filterWordsByDifficultyLevels(availableFocusedWords(words,r.id),difficultyAssignments,practiceDifficulty).length]));
 return `<section class="hero"><p class="eyebrow">Laboratorio de lengua histórica</p><h1>Del latín al <em>castellano</em>.</h1><p class="intro">Descubre la palabra resultante y demuestra qué transformaciones explican su evolución. Primero la respuesta; después, las normas. En las palabras latinas se utiliza <strong>u</strong> también con valor consonántico (<em>uitam</em> → vida).</p><div class="details-steps"><span class="step-pill"><b>01</b> Resuelve</span><span class="step-pill"><b>02</b> Analiza</span><span class="step-pill"><b>03</b> Comprueba</span></div></section>
 <section class="setup-grid"><div class="panel"><div class="panel-header"><div><h2>Qué quieres practicar</h2><p>Elige entre el repaso completo o concentrarte en una sola norma.</p></div></div>
 <fieldset class="scope-choice" aria-label="Tipo de repaso"><legend class="sr-only">Tipo de repaso</legend>
 <label class="scope-option"><input type="radio" name="practice-scope" value="general" ${!isFocused()?'checked':''}><span><strong>Repaso general</strong><small>Todas las normas necesarias de cada palabra</small></span></label>
 <label class="scope-option"><input type="radio" name="practice-scope" value="focus" ${isFocused()?'checked':''}><span><strong>Una sola norma</strong><small>Solo se evalúa el fenómeno seleccionado</small></span></label></fieldset>
 ${isFocused()?`<div class="focus-picker"><label class="field-label" for="focus-rule">Norma que quieres reforzar</label><select id="focus-rule">${RULES.map((r,i)=>`<option value="${r.id}" ${r.id===focusRule?'selected':''}>${String(i+1).padStart(2,'0')}. ${esc(r.name)} · ${focusCounts[r.id]} ${focusCounts[r.id]===1?'palabra':'palabras'}</option>`).join('')}</select><p class="helper" id="focus-description">${esc(RULES.find(r=>r.id===focusRule)?.description||'')}</p><p class="focus-explanation">Se incluyen todas las palabras que contienen esta norma, aunque también intervengan otras. Al terminar verás la explicación completa; solo se corrige el fenómeno elegido.</p></div>`
 :`<div class="panel-header rules-heading"><div><h3>Normas fonéticas</h3><p>Selecciona solo las que has estudiado.</p></div><div class="rule-actions"><button class="text-button" data-action="select-all">Todas</button><button class="text-button" data-action="select-none">Ninguna</button></div></div><div class="rules">${RULES.map((r,i)=>`<label class="rule-option" title="${esc(r.description)}"><input type="checkbox" data-rule="${r.id}" ${selected.has(r.id)?'checked':''}><span class="rule-num">${String(i+1).padStart(2,'0')}</span><span>${esc(r.name)}</span></label>`).join('')}</div>`}</div>
 <aside class="panel side-panel"><h2>Tu sesión</h2><div class="field">${difficultyButtons('practice')}</div><div class="field"><div class="field-label">Modalidad de análisis</div><div class="choice-row"><label class="choice-label"><input type="radio" name="mode" value="guided" ${mode==='guided'?'checked':''}> Guiado</label><label class="choice-label"><input type="radio" name="mode" value="blind" ${mode==='blind'?'checked':''}> A ciegas</label></div><p class="helper">${mode==='guided'?'Se destacan los grupos que debes analizar.':'Descubre tú mismo las letras o puntos de inserción.'}</p></div>
 <div class="field"><label class="field-label" for="requested">Número de tarjetas</label><input id="requested" type="number" min="1" max="${Math.max(pool.length,1)}" value="${count||1}" inputmode="numeric"><p class="helper" id="eligible-count">${pool.length} ${pool.length===1?'palabra elegible':'palabras elegibles'} ${isFocused()?'para '+esc(focusedName()):'con las normas seleccionadas'}.${pool.length<requested?' Se ajustará la cantidad a las disponibles.':''}</p></div>
 <button type="button" class="button-primary full" data-action="start" ${!pool.length?'disabled':''}>Empezar práctica <span aria-hidden="true">→</span></button>${!pool.length?`<p class="feedback error">${isFocused()?'Esta combinación de norma y dificultad no tiene palabras disponibles.':'No hay palabras compatibles con las normas y la dificultad seleccionadas. Modifica los filtros; nunca se ampliarán automáticamente.'}</p>`:''}
 <details class="rule-reference"><summary>Consultar las 20 normas oficiales</summary><div class="reference-list">${RULES.map((r,i)=>`<p><strong>${i+1}. ${esc(r.name)}.</strong> ${esc(r.description)}<br><em>${esc(r.examples.join('; '))}</em></p>`).join('')}<p><strong>Normas fijas.</strong> Los sustantivos y adjetivos castellanos se explican desde el acusativo latino según el criterio didáctico oficial. La -m final del acusativo se pierde y no se marca como apócope.</p></div></details>
 </aside></section>`;
}
function setUp(){session=null;cardState=null;feedback='';resultDraft='';app.innerHTML=setupHTML();app.setAttribute('aria-busy','false');}
function updateAvailable(){const pool=eligiblePool();const countEl=document.querySelector('#eligible-count');if(countEl)countEl.textContent=`${pool.length} ${pool.length===1?'palabra elegible':'palabras elegibles'} ${isFocused()?'para '+focusedName():'con las normas seleccionadas'}.${pool.length<requested?' Si solicitas más, se ajustará a las disponibles.':''}`;const start=document.querySelector('[data-action="start"]');if(start)start.disabled=!pool.length;const num=document.querySelector('#requested');if(num){num.max=String(Math.max(1,pool.length));num.value=String(pool.length?Math.min(requested,pool.length):1);}}
function startSession(){
 const pool=eligiblePool();if(!pool.length){setUp();return;}
 const n=Math.max(1,Math.min(requested,pool.length));
 session={cards:chooseFromPool(pool,n),index:0,done:[],selected:[...selected],mode,scope:practiceScope,focusRule:isFocused()?focusRule:null,difficulty:[...practiceDifficulty]};
 initCard();
}
function initCard(){
 resultDraft='';cardState=newCardState(currentWord(),session.focusRule);feedback='';batchFeedback='';draftSerial=0;focusHintShown=false;
 const w=currentWord();
 drafts=session.mode==='guided'?assessedChanges(w,session.focusRule).map(t=>({id:`g-${t.id}`,targetId:t.id,spans:t.spans.map(r=>[...r]),anchor:t.anchor,rule:'',status:null})):[];
 blindSpans=[];pendingStart=null;insertion=null;renderCard();
}
function renderCard(){
 const w=currentWord();if(!w){renderFinal();return;}
 const stage=cardState.phase;
 app.innerHTML=`<div class="practice-shell"><div class="topline"><button type="button" class="back-button" data-action="back">← Cambiar normas</button><span class="tiny">Tarjeta ${session.index+1} de ${session.cards.length} · ${session.focusRule?'Una norma: '+esc(ruleName(session.focusRule))+' · ':''}${session.mode==='guided'?'Guiado':'A ciegas'} · ${esc(wordDifficulty(w))}</span></div><div class="progress-track" role="progressbar" aria-valuenow="${progress()}" aria-valuemin="0" aria-valuemax="100" aria-label="Progreso"><div class="progress-value" style="width:${progress()}%"></div></div><article class="panel practice-card"><p class="eyebrow">${phaseTitle[stage]}</p>${stage===1?renderFirst(w):stage===2?renderSecond(w):renderComplete(w)}</article></div>`;
 app.setAttribute('aria-busy','false');
}
function renderFirst(w){return `<h1 class="latin-word" lang="la">${esc(w.latin)}</h1>${transmissionNote(w)}<p class="prompt">¿Cuál es el resultado de esta palabra latina en castellano?</p><form class="question-form" id="result-form"><label for="castellano">Resultado castellano</label><input id="castellano" class="answer-input" type="text" value="${esc(resultDraft)}" placeholder="Escribe la palabra…" autocomplete="off" autocapitalize="off" spellcheck="false" required><div class="answer-actions"><button class="button-primary full" type="submit">Comprobar respuesta →</button>${revealButton()}</div>
 <p class="practice-attempts">Resultado castellano · ${attemptsLeft(cardState.attempts)} de ${MAX_PRACTICE_ATTEMPTS} intentos disponibles</p>${feedback?`<div class="feedback ${feedback.startsWith('Incorrect')?'error':'success'}" role="status">${esc(feedback)}</div>`:''}${session.focusRule?`<div class="focus-hint-box"><button type="button" class="text-button" data-action="focus-hint" aria-controls="focus-hint" aria-expanded="${focusHintShown}">${focusHintShown?'Ocultar pista':'Pista: otras normas de esta palabra'}</button>${focusHintShown?`<p id="focus-hint" class="helper" role="status">${(()=>{const others=[...new Set(w.changes.filter(t=>t.rule!==session.focusRule&&t.rule!==FIXED_RULE.id).map(t=>ruleName(t.rule)))];const fixed=w.changes.some(t=>t.rule===FIXED_RULE.id);return esc([...(others.length?others:['No hay otras normas seleccionables']),...(fixed?['Pérdida fija de -m final']:[])].join(' · '));})()}</p>`:''}</div>`:''}<p class="helper">Puedes intentarlo hasta tres veces o consultar la solución cuando lo necesites. Las soluciones mostradas no cuentan como aciertos.</p></form>`;}
function renderGuidedWord(word){
 const targets=assessedChanges(word,session.focusRule);
 const set=new Set(targets.flatMap(x=>x.spans.flatMap(([s,e])=>Array.from({length:e-s},(_,j)=>s+j))));
 const anchors=new Set(targets.filter(t=>Number.isInteger(t.anchor)).map(t=>t.anchor));
 let html='';const letters=chars(word.latin);
 for(let i=0;i<=letters.length;i++){
  if(anchors.has(i))html+='<span class="guided-insertion" role="img" aria-label="Punto de inserción">＋</span>';
  if(i<letters.length)html+=`<span class="guided-char" ${set.has(i)?'data-mark="true"':''}>${esc(letters[i])}</span>`;
 }
 return `<div class="guided-word" lang="la" aria-label="${esc(word.latin)}">${html}</div>`;
}
function renderDraft(word,draft,index) {
 const status=draft.status||'';
 const stateLabel={correct:'✓ Correcto',incorrect:'Revisar',missing:'Sin respuesta'}[status]||'Sin comprobar';
 const label=labelFragment(word,draft);
 const fragment=draft.anchor!==undefined?`<span class="analysis-fragment-small">${esc(label)}</span>`:`<mark>${esc(label)}</mark>`;
 return `<div class="analysis-item ${status==='correct'?'is-correct':status==='incorrect'?'is-wrong':status==='missing'?'is-missing':''}" data-draft-card="${esc(draft.id)}">
  <div class="analysis-item-head"><span class="analysis-number">Cambio ${index+1}</span><span class="analysis-status">${stateLabel}</span></div>
  <div class="analysis-fragment" lang="la">${fragment}</div>
  <label for="draft-${esc(draft.id)}">¿Qué norma corresponde?</label>
  <select id="draft-${esc(draft.id)}" data-draft-rule="${esc(draft.id)}"><option value="">Selecciona una norma…</option>${choiceOptions(word,draft.rule)}</select>
  ${status==='incorrect'?'<p class="analysis-feedback">Revisa esta asociación de fragmento y norma.</p>':status==='missing'?'<p class="analysis-feedback">Selecciona una norma antes de comprobar.</p>':''}
  ${session.mode==='blind'?`<button type="button" class="analysis-remove" data-remove-draft="${esc(draft.id)}" aria-label="Eliminar cambio ${index+1}">Quitar este cambio</button>`:''}
 </div>`;
}
function blindWord(word){
 const letters=chars(word.latin);let pieces='';
 for(let i=0;i<=letters.length;i++){
  const active=insertion===i;
  pieces+=`<button type="button" class="insertion-button ${active?'chosen':''}" data-insert="${i}" title="Marcar inserción en este punto" aria-label="Marcar inserción en el punto ${i}" aria-pressed="${active}">+</button>`;
  if(i<letters.length) {const activeRange=blindSpans.some(([s,e])=>i>=s&&i<e);pieces+=`<button type="button" class="symbol-button ${activeRange?'chosen':''} ${pendingStart===i?'pending':''}" data-letter="${i}" aria-label="Letra ${letters[i]}, posición ${i+1}" aria-pressed="${activeRange||pendingStart===i}">${esc(letters[i])}</button>`;}
 }
 return `<div class="latin-interactive" lang="la" aria-label="Selecciona los fragmentos en ${esc(word.latin)}">${pieces}</div>
 <p class="selection-summary">${pendingStart!==null?'Ahora pulsa la última letra del grupo (puede ser la misma).':blindSpans.length?`Grupos: ${esc(blindSpans.map(([s,e])=>letters.slice(s,e).join('')).join(' + '))}`:insertion!==null?`Inserción en el punto ${insertion}`:'Selecciona un fragmento o el símbolo + de inserción.'}</p>
 `;
}
function choiceOptions(word,value=''){
 // La norma fija aparece primero SOLO en las palabras a las que corresponde.
 const eligible=session.focusRule?[session.focusRule]:optionRuleIds(word,session.selected);
 return eligible.map(id=>`<option value="${id}" ${value===id?'selected':''}>${esc(ruleName(id))}${id==='FIX_M'?' (fija)':''}</option>`).join('');
}
function renderSecond(w){
 const guided=session.mode==='guided',count=drafts.length,targets=assessedChanges(w,session.focusRule);
 const description=guided
   ? 'Los fragmentos están señalados. Elige la norma en el desplegable de cada tarjeta; puedes cambiar cualquier respuesta antes de comprobar.'
   : 'Marca la primera y la última letra de un grupo y pulsa «Añadir cambio». Puedes seleccionar varios grupos separados. Usa + para indicar un sonido añadido.';
 const builder=guided?renderGuidedWord(w):`<div class="analysis-builder"><h3>1 · Selecciona las letras</h3><p>Pulsa dos letras para señalar un tramo; repite para añadir otro tramo del mismo fenómeno. También puedes usar + para una inserción. Desliza la palabra horizontalmente si no cabe.</p>
 ${blindWord(w)}<div class="builder-actions"><button type="button" class="button-primary" data-action="add-selection" ${!blindSpans.length && insertion===null?'disabled':''}>Añadir cambio +</button><button type="button" class="button-secondary" data-action="clear-selection">Borrar selección</button></div></div>`;
 return `<h2 class="latin-word" style="font-size:clamp(36px,7vw,63px)" lang="la">${esc(w.latin)}</h2>${transmissionNote(w)}
  <p class="prompt">Resultado correcto: <strong>${esc(w.answers[0])}</strong>. ${session.focusRule?'Localiza todas las apariciones de la norma que estás practicando.':'Identifica los fenómenos y asócialos con sus letras o puntos de inserción.'}</p>
  ${session.focusRule?`<p class="focus-session-note"><strong>Repaso: ${esc(ruleName(session.focusRule))}.</strong> Solo se evalúan sus ${targets.length} ${targets.length===1?'transformación':'transformaciones'} en esta palabra. Las demás normas, incluida la pérdida fija de -m si procede, se explicarán al completar la tarjeta.</p>`:''}
  <p class="hint-box"><strong>${guided?'Modo guiado':'Modo a ciegas'}.</strong> ${esc(description)}<br>Las respuestas se guardan y sólo se corrigen al pulsar <strong>«Comprobar todo»</strong>.</p>
  ${builder}
  <p class="analysis-help">${guided?'Asigna una norma a cada fragmento. Si dos cambios se superponen, aparecen como tarjetas independientes.':'2 · Asigna una norma a cada cambio añadido. Puedes añadir, modificar o quitar tarjetas antes de comprobar.'}</p>
  ${count?`<div class="analysis-grid">${drafts.map((d,i)=>renderDraft(w,d,i)).join('')}</div>`:'<p class="helper" style="text-align:center">Todavía no has añadido ningún cambio.</p>'}
  <div class="analysis-footer"><button type="button" class="button-primary" data-action="check-all">Comprobar todo <span aria-hidden="true">→</span></button>
   ${revealButton()}
   <p class="practice-attempts">Normas fonéticas · ${attemptsLeft(cardState.analysisAttempts)} de ${MAX_PRACTICE_ATTEMPTS} comprobaciones disponibles</p>
  <p class="analysis-progress">${count} ${count===1?'elección guardada':'elecciones guardadas'} · ${cardState.solved.size} de ${targets.length} cambios evaluables identificados en la última comprobación</p>
  ${batchFeedback?`<div class="feedback ${batchFeedback.startsWith('Todos')?'success':'error'}" role="status">${esc(batchFeedback)}</div>`:''}
  </div>`;
}
function renderComplete(w){
 const revealed=cardState.revealed;
 const targets=assessedChanges(w,session.focusRule);
 const banner=revealed
  ? `<div class="reveal-banner" role="status"><span class="reveal-symbol" aria-hidden="true">✕</span><strong>Solución mostrada · Ficha pendiente de aprender</strong><p>${cardState.revealReason==='limit'?'Has agotado los tres intentos de esta fase.':'Has elegido consultar la solución.'} No se contabiliza como acierto.</p></div>`
  : `<div class="success-banner" role="status"><span class="success-check" aria-hidden="true">✓</span><strong>¡Todas las normas correctas!</strong></div>`;
 const evaluated=cardState.revealPhase===1?0:cardState.solved.size;
 const focusStatus=session.focusRule
  ? `<p class="focus-session-note"><strong>Norma practicada: ${esc(ruleName(session.focusRule))}.</strong> ${revealed
    ? `Se habían evaluado ${targets.length} ${targets.length===1?'transformación':'transformaciones'}; ${evaluated} identificadas correctamente antes de mostrar la solución.`
    : `Identificaste ${targets.length} ${targets.length===1?'transformación':'transformaciones'}.`} Las demás normas aparecen como explicación.</p>`
  : '';
 const statusForChange=t=>{
  if(session.focusRule&&t.rule!==session.focusRule)return 'Solo explicación';
  if(!revealed)return session.focusRule?'✓ Norma identificada':'';
  return cardState.revealPhase===1?'Solución mostrada'
   :cardState.solved.has(t.id)?'✓ Identificada':'Solución mostrada';
 };
 return `<div class="completion">${banner}<p class="card-kicker" style="text-align:center">Tarjeta ${revealed?'no resuelta por el alumno':'completada'} · ${cardState.mistakes===0?'Sin errores registrados':'Con '+cardState.mistakes+' errores'}</p><div class="completed-word" lang="la">${esc(w.latin)} <span class="result-arrow" aria-hidden="true">→</span> ${esc(w.answers.join(' / '))}</div>${transmissionNote(w)}<h3>Explicación completa de la evolución</h3>
  ${focusStatus}
  ${w.changes.map(t=>`<div class="change-detail ${session.focusRule&&t.rule===session.focusRule?'focus-change-detail':''}">${statusForChange(t)?`<span class="change-eval-status">${statusForChange(t)}</span>`:''}<span class="change-tag ${t.rule==='FIX_M'?'fixed-tag':''}">${esc(ruleName(t.rule))}${t.subtype?' · '+esc(t.subtype):''}</span><strong>${esc(labelFragment(w,t))} → ${esc(t.output||'∅')}</strong><p>${esc(t.note)}</p>${t.stages?`<p>Etapas: ${esc(t.stages.join(' · '))}</p>`:''}</div>`).join('')}
  ${w.changes.some(t=>t.rule==='FIX_M')?'<p class="review-note">Normas fijas: según el criterio didáctico oficial, las formas nominales se estudian desde el acusativo. La -m final del acusativo se pierde; no es la apócope seleccionable.</p>':''}
  <p class="review-note">${wordSourceNote(w)} Se respeta la terminología de las normas PAU.</p>
  <button class="button-primary full" data-action="next">${session.index+1===session.cards.length?'Ver resumen':'Siguiente palabra →'}</button></div>`;
}
// Celebración breve, sin dependencias ni bloqueo de la navegación. Se ejecuta
// solamente después de que «Comprobar todo» haya validado todos los cambios.
function celebrateCompletion(){
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const previous=document.querySelector('.celebration-layer');
 previous?.remove();
 const layer=document.createElement('div');
 layer.className='celebration-layer';
 layer.setAttribute('aria-hidden','true');
 const palette=['#36c7a1','#d8a34e','#6dbbe7','#c6a6ed','#ef8d8d'];
 for(let i=0;i<24;i++){
  const piece=document.createElement('span');
  piece.className='celebration-piece';
  const angle=(2*Math.PI*i/24)+((Math.random()-.5)*.20);
  const distance=95+Math.random()*200;
  piece.style.setProperty('--dx',`${Math.cos(angle)*distance}px`);
  piece.style.setProperty('--dy',`${Math.sin(angle)*distance+75}px`);
  piece.style.setProperty('--rot',`${Math.round(Math.random()*960-480)}deg`);
  piece.style.setProperty('--delay',`${Math.round(Math.random()*120)}ms`);
  piece.style.backgroundColor=palette[i%palette.length];
  layer.appendChild(piece);
 }
 document.body.appendChild(layer);
 window.setTimeout(()=>layer.remove(),1550);
}
function next(){
 if(cardState.phase!==3)return;
 session.done.push({latin:currentWord().latin,spanish:currentWord().answers[0],
  mistakes:cardState.mistakes,attempts:cardState.attempts,analysisAttempts:cardState.analysisAttempts,
  revealed:cardState.revealed,revealPhase:cardState.revealPhase});
 session.index++;if(session.index<session.cards.length)initCard();else renderFinal();
}
function renderFinal(){
 const done=session.done,total=done.length;
 const revealed=done.filter(d=>d.revealed).length;
 const perfect=done.filter(d=>!d.revealed&&d.mistakes===0&&d.analysisAttempts<=1).length;
 const withErrors=total-revealed-perfect;
 const mistakes=done.reduce((n,d)=>n+d.mistakes,0);
 const label=d=>d.revealed?'↯ Solución consultada':d.mistakes===0&&d.analysisAttempts<=1?'✓ Sin errores':'Resuelta tras intentos';
 app.innerHTML=`<div class="practice-shell"><section class="panel practice-card"><p class="eyebrow">Sesión terminada</p><h1 class="hero" style="font-family:var(--serif);font-weight:500;font-size:clamp(33px,6vw,50px);margin:0 0 12px">${session.focusRule?'Repaso de '+esc(ruleName(session.focusRule))+' completado':'Repaso completado'}</h1><div class="summary-figure">${perfect}<span style="font-size:24px;color:var(--muted)"> / ${total}</span></div><p class="prompt">Fichas resueltas sin errores. ${withErrors} resueltas tras intentos · ${revealed} con solución consultada · ${mistakes} errores registrados.</p><div class="summary-list">${done.map(d=>`<div class="summary-line ${d.revealed?'summary-revealed':''}"><strong>${esc(d.latin)} → ${esc(d.spanish)}</strong><span>${label(d)}</span></div>`).join('')}</div><button type="button" class="button-primary full" style="margin-top:20px" data-action="home">Nueva práctica</button></section></div>`;
}
// ===== Estudio: búsqueda, catálogo y explicaciones, sin puntuación ni filtros de práctica. =====
const study={screen:'home',query:'',visible:8,ruleId:null,subtype:'',wordId:null,changeIndex:0,origin:'home',contextIds:[]};
let studyDeck=[], shuffleSearchResults=false;
// Un único selector sirve para ambos modos; las colecciones elegidas son independientes.
function difficultyButtons(scope){
 const levels=scope==='practice'?practiceDifficulty:studyDifficulty;
 const allSelected=levels.size===DIFFICULTY_LEVELS.length;
 return `<div class="study-difficulty-filter ${scope==='practice'?'practice-difficulty-filter':''}" role="group" aria-label="Seleccionar niveles de dificultad para ${scope==='practice'?'practicar':'estudiar'}">
  <div class="study-difficulty-heading"><span class="field-label">Dificultad</span>
   <span class="study-difficulty-actions">
    <button type="button" class="text-button" data-${scope}-difficulty-all="true" ${allSelected?'disabled':''}>Todas</button>
    <button type="button" class="text-button" data-${scope}-difficulty-none="true" ${levels.size===0?'disabled':''}>Ninguna</button>
   </span></div>
  <div class="study-difficulty-buttons">${DIFFICULTY_LEVELS.map(x=>`<button type="button"
    class="study-difficulty-button ${levels.has(x.level)?'is-selected':''}"
    data-${scope}-difficulty-level="${x.level}" aria-pressed="${levels.has(x.level)}">
    <span class="study-difficulty-number">${x.level}</span>
    <span class="study-difficulty-name">${esc(x.label)}</span>
    <span class="difficulty-tick ${levels.has(x.level)?'':'is-empty'}" aria-hidden="true">✓</span>
   </button>`).join('')}</div>
  <p class="helper">${levels.size===0?'No hay niveles seleccionados.': 'Selecciona uno o varios niveles; la ✓ indica cuáles están activos.'}</p>
 </div>`;
}
function studyDifficultyButtons(){return difficultyButtons('study');}
// Actualiza solo la colección del modo pulsado y conserva la selección del otro.
function changeDifficulty(button,scope){
 const raw=button.dataset[scope+'DifficultyLevel'];
 const all=button.dataset[scope+'DifficultyAll']!==undefined;
 const none=button.dataset[scope+'DifficultyNone']!==undefined;
 if(raw===undefined&&!all&&!none)return false;
 let levels=scope==='practice'?practiceDifficulty:studyDifficulty;
 if(raw!==undefined){
  const level=Number(raw);
  if(!DIFFICULTY_LEVELS.some(x=>x.level===level))return true;
  if(levels.has(level))levels.delete(level);else levels.add(level);
 }else if(all){
  levels=allDifficultyLevels();
 }else levels=new Set();
 if(scope==='practice')practiceDifficulty=levels;else studyDifficulty=levels;
 const selector=raw!==undefined
  ? '[data-'+scope+'-difficulty-level="'+raw+'"]'
  : all?'[data-'+scope+'-difficulty-all]':'[data-'+scope+'-difficulty-none]';
 if(scope==='practice')setUp();
 else {study.visible=study.screen==='rule'?24:8;renderStudy();}
 app.querySelector(selector)?.focus({preventScroll:true});
 return true;
}
// La consulta vacía y el catálogo de normas utilizan el orden aleatorio estable.
// Una búsqueda escrita conserva la prioridad de coincidencias exactas, salvo
// cuando el usuario decide barajar explícitamente sus resultados.
function studyPool(){
 const found=study.screen==='rule'
  ? studyWordsForRule(words,study.ruleId,study.subtype)
  : (!study.query.trim()?studyDeck:findStudyWords(words,study.query));
 const filtered=filterWordsByDifficultyLevels(found,difficultyAssignments,studyDifficulty);
 if(study.screen!=='rule'&&study.query.trim()&&!shuffleSearchResults)return filtered;
 const allowed=new Set(filtered.map(w=>w.id));
 return studyDeck.filter(w=>allowed.has(w.id));
}
let section='practice',resultDraft='';
const practiceTab=document.querySelector('#nav-practice');
const studyTab=document.querySelector('#nav-study');
function showSection(next){
 section=next==='study'?'study':'practice';
 for(const [button,selectedView] of [[practiceTab,'practice'],[studyTab,'study']]){
  button.classList.toggle('is-current',section===selectedView);
  button.setAttribute('aria-pressed',String(section===selectedView));
 }
 if(section==='study')renderStudy();
 else if(session && session.index>=session.cards.length)renderFinal();
 else if(session && cardState)renderCard();
 else setUp();
 window.scrollTo({top:0,behavior:'instant'});
}
practiceTab.addEventListener('click',()=>showSection('practice'));
studyTab.addEventListener('click',()=>showSection('study'));

function studyWordButton(w){
 const meaning=w.answers.join(' / ');
 return `<button type="button" class="study-word-button" data-study-word="${esc(w.id)}"><span class="study-word-names"><strong lang="la">${esc(w.latin)}</strong><span aria-hidden="true">→</span><span>${esc(meaning)}</span></span><span class="study-word-meta">${esc(wordDifficulty(w))} · ${w.changes.length} cambios <span aria-hidden="true">›</span></span></button>`;
}
function studyList(wordsList,visible){
 const subset=wordsList.slice(0,visible);
 return wordsList.length ? `<p class="study-counter">${wordsList.length} ${wordsList.length===1?'ficha encontrada':'fichas encontradas'} · mostrando ${subset.length}</p>
 <div class="study-word-list">${subset.map(studyWordButton).join('')}</div>
 ${visible<wordsList.length?'<button type="button" class="button-secondary study-more" data-study-more="true">Mostrar 24 más</button>':''}`
 : '<p class="study-empty">No hay fichas compatibles con la búsqueda, la norma y la dificultad seleccionadas. Modifica los filtros.</p>';
}
function studyHome(){
 const counts=studyRuleCounts(filterWordsByDifficultyLevels(words,difficultyAssignments,studyDifficulty));
 return `<div class="study-shell"><header class="study-hero"><p class="eyebrow">Biblioteca de evolución fonética</p><h1>Estudia cada palabra, <em>paso a paso</em>.</h1><p class="intro">Consulta las palabras revisadas o una de las 20 normas oficiales. Las soluciones y explicaciones se muestran directamente, sin ejercicios ni puntuación. Se escribe <strong>u</strong> también en posición consonántica: <em>uitam</em> → vida.</p></header>
 <section class="panel study-panel" aria-labelledby="study-search-title"><div class="study-panel-heading"><div><p class="eyebrow">01 · Palabras</p><h2 id="study-search-title">Buscar en el banco</h2></div><span class="tiny">${words.length} fichas revisadas</span><button type="button" class="text-button" data-study-shuffle="true">↻ Barajar tarjetas</button></div>
 ${studyDifficultyButtons()}
  <label for="study-search" class="field-label">Forma latina o resultado castellano</label><input id="study-search" class="study-search" type="search" value="${esc(study.query)}" autocomplete="off" spellcheck="false" placeholder="Ej.: poenam, pœnam, noche, milagro…"><p class="helper">Admite variantes æ/ae, œ/oe, mayúsculas y vocales latinas con diacríticos.</p>
 <div id="study-results" aria-live="polite">${studyList(studyPool(),study.visible)}</div></section>
 <section class="study-catalog" aria-labelledby="study-rules-title"><div class="study-section-heading"><p class="eyebrow">02 · Normas fonéticas</p><h2 id="study-rules-title">Catálogo de las 20 normas</h2><p class="intro">Abre una norma para consultar su definición oficial, sus ejemplos y todas las fichas en las que interviene, aunque contengan otras transformaciones.</p></div>
 <div class="study-rules-grid">${RULES.map((r,i)=>`<button type="button" class="study-rule-button" data-study-rule="${esc(r.id)}"><span class="study-rule-number">${String(i+1).padStart(2,'0')}</span><strong>${esc(r.name)}</strong><span class="study-rule-count">${counts[r.id]} ${counts[r.id]===1?'palabra':'palabras'}</span><span class="study-rule-chevron" aria-hidden="true">›</span></button>`).join('')}</div>
 <p class="study-note">Normas fijas: el acusativo latino es la referencia didáctica para sustantivos y adjetivos. La pérdida de <em>-m</em> final se muestra dentro de cada ficha a la que corresponde, pero no forma parte de las 20 normas seleccionables.</p></section></div>`;
}
function studyRule(){
 const r=RULES.find(item=>item.id===study.ruleId);
 if(!r){study.screen='home';return studyHome();}
 const all=studyWordsForRule(words,r.id);
 const filtered=studyPool();
 const variants=studySubtypes(filterWordsByDifficultyLevels(words,difficultyAssignments,studyDifficulty),r.id);
 return `<div class="study-shell"><button type="button" class="back-button" data-study-back="home">← Todas las normas y buscador</button>
 <div class="panel study-panel"><p class="eyebrow">Norma oficial de las PAU</p><h1 class="study-title">${esc(r.name)}</h1><p class="study-rule-description">${esc(r.description)}</p>
 <h2 class="study-small-title">Ejemplos oficiales</h2><p class="study-official-examples">${r.examples.map(v=>`<span>${esc(v)}</span>`).join('')}</p>
 <p class="study-note">Los ejemplos oficiales se presentan como referencia didáctica; solo las palabras ya incorporadas al banco pueden abrirse como tarjetas.</p><button type="button" class="button-secondary study-start-practice" data-study-practice="${esc(r.id)}">Practicar esta norma →</button></div>
 <section class="panel study-panel" aria-labelledby="study-rule-words"><div class="study-panel-heading"><div><p class="eyebrow">Fichas que contienen esta norma</p><h2 id="study-rule-words">${filtered.length} ${filtered.length===1?'ficha':'fichas'} según filtros <small class="study-count-total">de ${all.length} en esta norma</small></h2></div><button type="button" class="text-button" data-study-shuffle="true">↻ Barajar tarjetas</button></div>
  ${studyDifficultyButtons()}
 ${variants.length?`<div class="study-subtypes" aria-label="Filtrar subtipos documentados"><button type="button" class="study-subtype ${study.subtype===''?'is-selected':''}" aria-pressed="${study.subtype===''}" data-study-subtype="">Todos (${all.length})</button>${variants.map(v=>`<button type="button" class="study-subtype ${study.subtype===v.name?'is-selected':''}" aria-pressed="${study.subtype===v.name}" data-study-subtype="${esc(v.name)}">${esc(v.name)} (${v.count})</button>`).join('')}</div>`:''}
 <div id="study-rule-results">${studyList(filtered,study.visible)}</div></section></div>`;
}
function studyVisual(word,change){
 const letters=chars(word.latin);
 const {indices,anchor}=studyHighlight(word,change);
 let html='';
 for(let i=0;i<=letters.length;i++){
  if(anchor===i)html+='<span class="study-insertion" aria-label="Punto de inserción de sonido">＋</span>';
  if(i<letters.length)html+=`<span class="study-letter ${indices.has(i)?'is-marked':''}">${esc(letters[i])}</span>`;
 }
 return `<div class="study-word-visual" lang="la" aria-label="${esc(word.latin)}: ${esc(labelFragment(word,change))}">${html}</div>`;
}
function studyWord(){
 const w=words.find(w=>w.id===study.wordId);
 if(!w){study.screen='home';return studyHome();}
 study.changeIndex=Math.max(0,Math.min(study.changeIndex,w.changes.length-1));
 const t=w.changes[study.changeIndex],rule=RULES.find(r=>r.id===t.rule);
 const contextIndex=study.contextIds.indexOf(w.id);
 const fixed=w.changes.some(c=>c.rule===FIXED_RULE.id);
 const stages=Array.isArray(t.stages)&&t.stages.length ? `<p class="study-stages"><strong>Etapas documentadas:</strong> ${t.stages.map(esc).join(' · ')}</p>`:'';
 return `<div class="study-shell study-detail-shell"><div class="study-detail-nav"><button type="button" class="back-button" data-study-back="${study.origin}">← ${study.origin==='rule'?'Volver a la norma':'Volver al buscador'}</button><span class="tiny">Consulta libre · Sin puntuación</span></div>
 <article class="panel study-word-card"><p class="eyebrow">${w.source?.generatorId?'Ficha importada · GeneradorExamenes':'Ficha filológica · Banco revisado'} · ${esc(wordDifficulty(w))}</p><div class="study-word-pair"><h1 lang="la">${esc(w.latin)}</h1><span aria-hidden="true">→</span><h2>${esc(w.answers.join(' / '))}</h2></div>${transmissionNote(w)}
 <p class="study-word-intro">Pulsa cada fenómeno para ver qué letras o grupos intervienen. Los cambios se muestran según las anotaciones didácticas verificadas, sin reconstruir etapas que no figuren en el banco.</p>
 <div class="study-change-tabs" role="group" aria-label="Fenómenos de ${esc(w.latin)}">${w.changes.map((change,i)=>`<button type="button" class="study-change-tab ${i===study.changeIndex?'is-active':''}" data-study-change="${i}" aria-pressed="${i===study.changeIndex}"><span class="study-change-index">${i+1}</span><span>${esc(ruleName(change.rule))}${change.subtype?`<small>${esc(change.subtype)}</small>`:''}</span></button>`).join('')}</div>
 <div class="study-change-detail" aria-live="polite"><p class="eyebrow">Cambio ${study.changeIndex+1} de ${w.changes.length}</p>${studyVisual(w,t)}
 <div class="study-change-label"><strong>${esc(ruleName(t.rule))}${t.subtype?` · ${esc(t.subtype)}`:''}</strong>${t.rule===FIXED_RULE.id?'<span class="study-fixed-label">Norma fija</span>':''}</div>
 <p class="study-fragment-result">${esc(labelFragment(w,t))} <span aria-hidden="true">→</span> ${esc(t.output||'∅')}</p>
 <p class="study-change-explanation">${esc(t.note)}</p>${stages}
 ${rule?`<p class="study-rule-definition"><strong>Definición PAU:</strong> ${esc(rule.description)}</p>`:`<p class="study-rule-definition"><strong>Norma fija:</strong> ${esc(FIXED_RULE.description)}</p>`}</div>
 <div class="study-step-nav"><button type="button" class="button-secondary" data-study-step="-1" ${study.changeIndex===0?'disabled':''}>← Cambio anterior</button><button type="button" class="button-secondary" data-study-step="1" ${study.changeIndex===w.changes.length-1?'disabled':''}>Siguiente cambio →</button></div>
 <section class="study-word-summary"><h3>Explicación de la evolución</h3><p>${esc(w.explanation||'La ficha recoge las transformaciones anotadas en el banco.')}</p>
 ${fixed?'<p class="study-note">Normas fijas: los sustantivos y adjetivos se estudian a partir del acusativo según el criterio didáctico oficial. La -m final desaparece, pero no se contabiliza como apócope seleccionable.</p>':''}
 <p class="study-source">${wordSourceNote(w)}</p></section>
 ${contextIndex>=0&&study.contextIds.length>1?`<div class="study-word-navigation"><button class="button-secondary" type="button" data-study-neighbor="-1" ${contextIndex===0?'disabled':''}>← Palabra anterior</button><span class="tiny">${contextIndex+1} de ${study.contextIds.length}</span><button class="button-secondary" type="button" data-study-neighbor="1" ${contextIndex===study.contextIds.length-1?'disabled':''}>Siguiente palabra →</button></div>`:''}
 </article></div>`;
}
function renderStudy(){
 app.innerHTML=study.screen==='word'?studyWord():study.screen==='rule'?studyRule():studyHome();
 app.setAttribute('aria-busy','false');
}
function renderStudyResults(){
 const node=app.querySelector(study.screen==='rule'?'#study-rule-results':'#study-results');
 if(!node)return;
 node.innerHTML=studyList(studyPool(),study.visible);
}
function handleStudyClick(button){
 if(changeDifficulty(button,'study'))return;
 if(button.dataset.studyShuffle!==undefined){
  studyDeck=shuffleStudyWords(words);shuffleSearchResults=true;
  study.visible=study.screen==='rule'?24:8;renderStudyResults();return;
 }
 if(button.dataset.studyPractice!==undefined){
  const chosen=button.dataset.studyPractice;
  if(!RULES.some(r=>r.id===chosen))return;
  if(session && cardState && !window.confirm('Iniciar una práctica nueva sustituirá la sesión anterior. ¿Continuar?'))return;
  practiceScope='focus';focusRule=chosen;session=null;cardState=null;showSection('practice');return;
 }
 if(button.dataset.studyRule!==undefined){
  study.ruleId=button.dataset.studyRule;study.subtype='';study.screen='rule';study.visible=24;renderStudy();window.scrollTo({top:0,behavior:'instant'});return;
 }
 if(button.dataset.studySubtype!==undefined){study.subtype=button.dataset.studySubtype;study.visible=24;renderStudy();return;}
 if(button.dataset.studyWord!==undefined){
  study.origin=study.screen==='rule'?'rule':'home';
  const pool=studyPool();
  study.contextIds=pool.map(w=>w.id);study.wordId=button.dataset.studyWord;
  study.changeIndex=0;study.screen='word';renderStudy();window.scrollTo({top:0,behavior:'instant'});return;
 }
 if(button.dataset.studyBack!==undefined){
  study.screen=button.dataset.studyBack==='rule'?'rule':'home';
  renderStudy();window.scrollTo({top:0,behavior:'instant'});return;
 }
 if(button.dataset.studyChange!==undefined){study.changeIndex=Number(button.dataset.studyChange);renderStudy();return;}
 if(button.dataset.studyStep!==undefined){study.changeIndex+=Number(button.dataset.studyStep);renderStudy();return;}
 if(button.dataset.studyMore!==undefined){study.visible+=24;renderStudyResults();return;}
 if(button.dataset.studyNeighbor!==undefined){
  const i=study.contextIds.indexOf(study.wordId)+Number(button.dataset.studyNeighbor);
  if(i>=0 && i<study.contextIds.length){study.wordId=study.contextIds[i];study.changeIndex=0;renderStudy();window.scrollTo({top:0,behavior:'instant'});}
 }
}

app.addEventListener('change',event=>{
 const e=event.target;
 if(e.matches('input[name="practice-scope"]')){practiceScope=e.value==='focus'?'focus':'general';setUp();return;}
 if(e.id==='focus-rule'){if(RULES.some(r=>r.id===e.value)){focusRule=e.value;updateAvailable();const description=document.querySelector('#focus-description');if(description)description.textContent=RULES.find(r=>r.id===focusRule).description;}return;}
 if(e.matches('[data-rule]')){if(e.checked)selected.add(e.dataset.rule);else selected.delete(e.dataset.rule);updateAvailable();}
 if(e.matches('input[name="mode"]')){mode=e.value;const hint=e.closest('.field').querySelector('.helper');if(hint)hint.textContent=mode==='guided'?'Se destacan los grupos que debes analizar.':'Descubre tú mismo las letras o puntos de inserción.';}
 if(e.matches('[data-draft-rule]')){
   const draft=drafts.find(d=>d.id===e.dataset.draftRule);
   if(draft){draft.rule=e.value;drafts.forEach(d=>d.status=null);batchFeedback='';
    app.querySelectorAll('.analysis-item').forEach(node=>{node.classList.remove('is-correct','is-wrong','is-missing');node.querySelector('.analysis-status').textContent='Sin comprobar';node.querySelector('.analysis-feedback')?.remove();});
    const previous=app.querySelector('.analysis-footer .feedback');if(previous)previous.remove();
   }
 }
});
app.addEventListener('input',event=>{if(section==='study'&&event.target.id==='study-search'){study.query=event.target.value;shuffleSearchResults=false;study.visible=24;renderStudyResults();return;}if(event.target.id==='castellano'){resultDraft=event.target.value;}if(event.target.id==='requested'){const val=Number(event.target.value);if(Number.isFinite(val)&&val>0)requested=Math.floor(val);updateAvailable();}});
app.addEventListener('submit',event=>{
 if(event.target.id!=='result-form')return;
 event.preventDefault();
 if(cardState?.phase!==1)return;
 const answer=document.querySelector('#castellano').value;resultDraft=answer;
 if(checkResult(cardState,answer)){resultDraft='';feedback='';renderCard();return;}
 if(cardState.attempts>=MAX_PRACTICE_ATTEMPTS){revealCard(cardState,'limit');renderCard();return;}
 feedback='Incorrecto. Quedan '+attemptsLeft(cardState.attempts)+' intentos para el resultado castellano.';
 renderCard();document.querySelector('#castellano')?.focus();
});
app.addEventListener('click',event=>{
 const t=event.target.closest('button');if(!t)return;
 if(section==='study'){handleStudyClick(t);return;}
 if(changeDifficulty(t,'practice'))return;
 if(t.dataset.action==='select-all'){selected=new Set(RULES.map(r=>r.id));setUp();return;}
 if(t.dataset.action==='select-none'){selected.clear();setUp();return;}
 if(t.dataset.action==='start'){requested=Number(document.querySelector('#requested')?.value)||10;startSession();return;}
 if(t.dataset.action==='focus-hint' && session?.focusRule && cardState?.phase===1){focusHintShown=!focusHintShown;renderCard();return;}
 if(t.dataset.action==='back'||t.dataset.action==='home'){setUp();return;}
 if(t.dataset.action==='next'){next();return;}
 if(t.dataset.action==='reveal' && cardState && [1,2].includes(cardState.phase)){
  revealCard(cardState,'manual');renderCard();return;
 }
 if(!cardState || cardState.phase!==2)return;
 if(t.dataset.action==='clear-selection'){blindSpans=[];pendingStart=null;insertion=null;renderCard();return;}
 if(t.dataset.letter!==undefined){
  const i=Number(t.dataset.letter);insertion=null;
  if(pendingStart===null){pendingStart=i;}else{const start=Math.min(pendingStart,i),end=Math.max(pendingStart,i)+1;blindSpans.push([start,end]);pendingStart=null;}
  renderCard();return;
 }
 if(t.dataset.insert!==undefined){insertion=Number(t.dataset.insert);pendingStart=null;blindSpans=[];renderCard();return;}
 if(t.dataset.action==='add-selection'){
  if(pendingStart!==null || (!blindSpans.length && insertion===null))return;
  drafts.push({id:`b-${++draftSerial}`,spans:blindSpans.map(span=>[...span]),anchor:insertion??undefined,rule:'',status:null});
  drafts.forEach(d=>d.status=null);batchFeedback='';blindSpans=[];pendingStart=null;insertion=null;renderCard();
  app.querySelector(`[data-draft-rule="b-${draftSerial}"]`)?.focus();return;
 }
 if(t.dataset.removeDraft){drafts=drafts.filter(d=>d.id!==t.dataset.removeDraft);drafts.forEach(d=>d.status=null);batchFeedback='';renderCard();return;}
 if(t.dataset.action==='check-all'){
  if(!drafts.some(d=>d.rule)){
   batchFeedback='Elige una norma para comprobar o pulsa «No lo sé · Ver solución». No se descuenta ningún intento.';
   renderCard();return;
  }
  const checked=checkAllChanges(cardState,drafts);
  const byId=new Map(checked.results.map(x=>[x.id,x.status]));
  drafts.forEach(d=>{d.status=byId.get(d.id)||null});
  batchFeedback=checked.message;
  if(checked.complete){renderCard();celebrateCompletion();return;}
  if(cardState.analysisAttempts>=MAX_PRACTICE_ATTEMPTS){revealCard(cardState,'limit');renderCard();return;}
  batchFeedback+=' Quedan '+attemptsLeft(cardState.analysisAttempts)+' comprobaciones.';
  renderCard();
  app.querySelector('.analysis-footer .feedback')?.scrollIntoView({block:'nearest',behavior:'smooth'});
 }
});
async function load(){try{
 const [response,difficultyResponse]=await Promise.all([
  fetch('./data/pilot.json',{cache:'no-cache'}),
  fetch('./data/difficulty.json',{cache:'no-cache'})
 ]);
 if(!response.ok)throw new Error('No se pudo obtener el banco de palabras.');
 if(!difficultyResponse.ok)throw new Error('No se pudo obtener la clasificación de dificultad.');
 const [data,difficulty]=await Promise.all([response.json(),difficultyResponse.json()]);
 const errors=validationErrors(data);
 if(errors.length)throw new Error('El banco no supera la validación: '+errors.slice(0,3).join(' · '));
 const difficultyProblems=difficultyErrors(data.words,difficulty);
 if(difficultyProblems.length)throw new Error('La dificultad no supera la validación: '+difficultyProblems.slice(0,3).join(' · '));
 words=data.words;difficultyAssignments=difficulty.assignments;
 studyDeck=shuffleStudyWords(words);const report=coverage(words);if(RULES.some(r=>report[r.id]===0))throw new Error('El piloto no cubre todas las normas.');setUp();}catch(error){app.innerHTML=`<div class="fatal"><h1>No ha sido posible iniciar la práctica</h1><p>${esc(error.message)}</p><button class="button-secondary" onclick="location.reload()">Reintentar</button></div>`;app.setAttribute('aria-busy','false');}}
// Acción voluntaria: comprobar la actualización del SW y después recargar.
const updateAppButton=document.querySelector('#refresh-app');
const updateAppStatus=document.querySelector('#refresh-app-status');
updateAppButton?.addEventListener('click',async()=>{
 if(session && cardState && session.index<session.cards.length
    && !window.confirm('Actualizar recargará Evolutio y se perderá la práctica actual. ¿Continuar?'))return;
 if(navigator.onLine===false){
  if(updateAppStatus)updateAppStatus.textContent='Sin conexión: conéctate a Internet para buscar actualizaciones.';
  return;
 }
 updateAppButton.disabled=true;
 updateAppButton.setAttribute('aria-busy','true');
 if(updateAppStatus)updateAppStatus.textContent='Buscando actualizaciones…';
 try{
  await checkForWebappUpdates(navigator.serviceWorker);
  if(updateAppStatus)updateAppStatus.textContent='Comprobación terminada. Recargando Evolutio…';
  window.location.reload();
 }catch(error){
  console.error('No se pudo comprobar la actualización de Evolutio.',error);
  if(updateAppStatus)updateAppStatus.textContent='No se ha podido actualizar. Comprueba la conexión e inténtalo otra vez.';
  updateAppButton.disabled=false;
  updateAppButton.removeAttribute('aria-busy');
 }
});
load();
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
