import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';

// Última transformación del artefacto integrado, DESPUÉS de los adaptadores
// históricos y ANTES de generar su PWA. Nunca se altera vendor/vocabula.
// Desconectar la interfaz ANTES de desactivar endpoints evita avisos huérfanos.
function once(value,from,to,context){
 assert.equal(value.split(from).length,2,
  'La plantilla cambió ('+context+'): revisar retirada antes de publicar');
 return value.replace(from,to);
}
export function retirePublicVocabulaHtml(html){
 html=once(html,
  '<div class="header-actions"><button id="open-report" type="button">Avisar de un error</button></div>',
  '', 'botón de avisos');
 html=once(html,
  '<dialog id="report-dialog" aria-labelledby="report-title"></dialog>',
  '', 'diálogo de avisos');
 html=once(html,'<script src="config.js" defer></script>','',
  'script del backend público');
 html=once(html,
  '<script src="schola-offline.js" defer></script><script src="teacher.js?v=20261116-schola1" defer></script>',
  '', 'scripts de sincronización/avisos');
 html=once(html,
  '<div><p id="cloud-status" class="small" role="status">Cargando las últimas palabras…</p><p id="pending-reports" class="small" role="status" aria-live="polite"></p></div>',
  '<p id="cloud-status" class="small" role="status">Vocabulario actualizado · Banco integrado disponible sin conexión.</p>',
  'indicador de vocabulario integrado');
 assert.ok(!/id="(?:open-report|report-dialog|pending-reports)"/.test(html));
 assert.ok(!/src="(?:teacher|config|schola-offline)\.js/.test(html));
 return html;
}
export function retirePublicVocabulaApp(js){
 js=once(js,
  '<button class="text" data-report-id="${esc(e.id)}">Señalar un error</button>',
  '', 'aviso en diccionario');
 js=once(js,
  '<div class="actions"><button type="button" data-report-current>Señalar un error en esta palabra</button></div>',
  '', 'aviso en práctica');
 assert.ok(!/data-report-(?:id|current)/.test(js));
 return js;
}
export async function retirePublicVocabulaRemote(destination){
 for(const [name,transform] of [
  ['index.html',retirePublicVocabulaHtml],
  ['app.js',retirePublicVocabulaApp]
 ]){
  const path=join(destination,name);
  await writeFile(path,transform(await readFile(path,'utf8')));
 }
 console.log('Vocabula del alumnado: banco local con altas auditadas; sin editor ni avisos remotos en la interfaz.');
}
