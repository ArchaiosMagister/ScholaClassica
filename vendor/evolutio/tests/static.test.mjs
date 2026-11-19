import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
const text=p=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
test('GitHub Pages tiene página de inicio, módulos, banco, manifiesto y modo oscuro',()=>{
 const html=text('index.html'),js=text('src/app.mjs'),css=text('style.css'),manifest=JSON.parse(text('manifest.webmanifest'));
 assert.match(html,/lang="es"/);assert.match(html,/src="\.\/src\/app.mjs"/);assert.match(html,/apple-touch-icon/);
 assert.match(js,/\.\/data\/pilot.json/);assert.match(js,/data-insert/);assert.match(js,/data-letter/);assert.match(js,/data-draft-rule/);assert.match(js,/check-all/);assert.match(js,/add-selection/);
 assert.match(css,/data-theme="dark"/);assert.match(css,/data-theme="oled"/);assert.match(html,/id="theme-select"/);assert.match(css,/@media \(max-width:540px\)/);
 assert.equal(manifest.scope,'./');assert.equal(manifest.display,'standalone');
 for(const n of [192,512])assert.ok(statSync(new URL(`../icons/icon-${n}.png`,import.meta.url)).size>100);
});
test('Despliegue condicionado a validación y ámbito offline relativo',()=>{
 const workflow=text('.github/workflows/pages.yml');const sw=text('sw.js');
 assert.match(workflow,/needs: validate/);assert.match(workflow,/npm test/);
 assert.match(sw,/data\/pilot.json/);assert.match(sw,/data\/difficulty.json/);assert.match(sw,/VERSION=/);assert.match(sw,/caches\.match/);
});


test('El acierto completo celebra una sola corrección y respeta movimiento reducido',()=>{
 const js=text('src/app.mjs'),css=text('style.css'),engine=text('src/engine.mjs');
 assert.match(js,/if\(checked\.complete\)\{renderCard\(\);celebrateCompletion\(\);return;\}/);
 assert.match(js,/if\(window\.matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.matches\)return/);
 assert.match(js,/¡Todas las normas correctas!/);
 assert.match(js,/aria-hidden','true'/);
 assert.match(css,/\.celebration-layer\{[^}]*pointer-events:none/);
 assert.match(css,/@media \(prefers-reduced-motion:reduce\)\{\.celebration-layer\{display:none!important\}\}/);
 assert.match(engine,/export function optionRuleIds/);
});


test('Estudio tiene navegación independiente, buscador, catálogo, explicaciones y caché offline',()=>{
 const html=text('index.html'),js=text('src/app.mjs'),css=text('style.css'),sw=text('sw.js');
 assert.match(html,/id="nav-practice"/);assert.match(html,/id="nav-study"/);
 assert.match(js,/\.\/study\.mjs/);assert.match(js,/data-study-word/);
 assert.match(js,/data-study-rule/);assert.match(js,/id="study-search"/);
 assert.match(js,/studyWord\(\)/);assert.match(js,/studyVisual\(word,change\)/);
 assert.match(js,/section==='study'/);assert.match(js,/showSection\('practice'\)/);
 assert.match(css,/\.study-word-visual/);assert.match(css,/\.study-rules-grid/);
 assert.match(sw,/\.\/src\/study\.mjs/);
});

test('Repaso focalizado ofrece selector de 20 leyes, sin ocultar Estudiar ni cambiar el repaso general',()=>{
 const js=text('src/app.mjs'),engine=text('src/engine.mjs'),css=text('style.css');
 assert.match(js,/name="practice-scope"/);
 assert.match(js,/id="focus-rule"/);
 assert.match(js,/availableFocusedWords/);
 assert.match(js,/chooseFromPool\(pool,n\)/);
 assert.match(js,/filterWordsByDifficulty/);
 assert.match(js,/assessedChanges/);
 assert.match(js,/renderStudy\(\)/);
 assert.match(js,/data-study-rule/);
 assert.match(js,/data-study-practice/);
 assert.match(js,/check-all/);
 assert.match(js,/data-draft-rule/);
 assert.match(engine,/function checkAllChanges/);
 assert.match(css,/\.focus-session-note/);
 assert.match(css,/\.scope-choice/);
 assert.match(text('sw.js'),/evolutio-latin-u-20261112/);
});

test('Estudiar usa botones accesibles para seleccionar niveles independientes',()=>{
 const js=text('src/app.mjs'),css=text('style.css');
 assert.match(js,/function studyDifficultyButtons\(\)/);
 assert.match(js,/data-\$\{scope\}-difficulty-level/);
 assert.match(js,/aria-pressed/);
 assert.match(js,/data-\$\{scope\}-difficulty-all/);
 assert.match(js,/data-\$\{scope\}-difficulty-none/);
 assert.match(js,/filterWordsByDifficultyLevels/);
 assert.doesNotMatch(js,/id="study-difficulty"/);
 assert.doesNotMatch(js,/id="study-rule-difficulty"/);
 assert.doesNotMatch(js,/id="practice-difficulty"/);
 assert.match(js,/difficultyButtons\('practice'\)/);
 assert.match(js,/changeDifficulty\(t,'practice'\)/);
 assert.match(js,/difficulty-tick/);
 assert.match(js,/difficulty:\[\.\.\.practiceDifficulty\]/);
 assert.match(css,/study-difficulty-button\.is-selected/);
 assert.match(css,/@media\(max-width:620px\)/);
});

test('Actualizar aparece junto al selector de aspecto y comprueba el SW antes de recargar',()=>{
 const html=text('index.html'),js=text('src/app.mjs'),sw=text('sw.js'),css=text('style.css');
 assert.match(html,/<select id="theme-select"/);
 assert.match(html,/id="refresh-app"/);
 assert.match(html,/id="refresh-app-status"/);
 assert.ok(html.indexOf('id="refresh-app"')>html.indexOf('id="theme-select"'));
 assert.match(js,/checkForWebappUpdates\(navigator\.serviceWorker\)/);
 assert.match(js,/window\.location\.reload\(\)/);
 assert.match(js,/window\.confirm\('Actualizar recargará Evolutio/);
 assert.match(js,/navigator\.onLine===false/);
 assert.match(sw,/\.\/src\/update\.mjs/);
 assert.match(css,/\.update-app-button/);
 assert.match(css,/\.difficulty-tick/);
 assert.match(css,/data-theme/);
});

test('Práctica sin bloqueo: tres intentos, solución manual y fallo sin confundir con acierto',()=>{
 const js=text('src/app.mjs'),engine=text('src/engine.mjs'),css=text('style.css');
 assert.match(js,/MAX_PRACTICE_ATTEMPTS=3/);
 assert.match(js,/data-action="reveal"/);
 assert.match(js,/revealCard\(cardState,'manual'\)/);
 assert.match(js,/revealCard\(cardState,'limit'\)/);
 assert.match(js,/cardState\.analysisAttempts>=MAX_PRACTICE_ATTEMPTS/);
 assert.match(js,/cardState\.attempts>=MAX_PRACTICE_ATTEMPTS/);
 assert.match(js,/if\(!drafts\.some\(d=>d\.rule\)\)/);
 assert.match(js,/Ficha pendiente de aprender/);
 assert.match(js,/summary-revealed/);
 assert.match(js,/Solución consultada/);
 assert.match(js,/solución no.*acierto|No se contabiliza como acierto/);
 assert.match(engine,/export function revealCard/);
 assert.match(engine,/state\.analysisAttempts\+\+/);
 assert.match(css,/\.reveal-banner/);
 assert.match(css,/prefers-reduced-motion:reduce\)\{\.reveal-banner\{animation:none\}/);
});

test('La u consonántica se muestra en los dos modos y está disponible offline',()=>{
 const js=text('src/app.mjs'),sw=text('sw.js'),rules=text('src/rules.mjs'),importer=text('tools/import-generador.mjs');
 assert.match(js,/uitam/);
 assert.match(js,/consonántic/);
 assert.match(sw,/\.\/src\/latin\.mjs/);
 assert.match(rules,/clauem → llave/);
 assert.match(importer,/latinU\(item\.latin\)/);
 assert.match(importer,/latinKey\(item\.latin\)/);
});
