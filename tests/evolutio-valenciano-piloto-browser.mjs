// Prueba funcional del HTML autónomo. Se abre desde file://, sin servidor ni red.
import assert from 'node:assert/strict';
import {stat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const html=join(resolve(import.meta.dirname,'..'),'build/evolutio-valenciano-piloto/index.html');
assert.equal((await stat(html)).isFile(),true);
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:950,height:800}});
 const errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(/^https?:/u.test(r.url()))external.push(r.url());});
 // Shuffle reproducible para comprobar dos fichas seguidas.
 await page.addInitScript(()=>{Math.random=()=>0.999999;});
 await page.goto(pathToFileURL(html).href,{waitUntil:'load'});
 assert.match(await page.title(),/EVOLVTIO/);
 assert.equal(await page.locator('#start-session').count(),1);
 await page.locator('#tab-study').click();
 assert.equal(await page.locator('.study-item').count(),7);
 assert.equal(await page.getByText('matrem').count(),0);
 assert.equal(await page.getByText('caelum').count(),0);
 await page.locator('#tab-practice').click();
 await page.locator('#session-count').fill('2');
 await page.locator('#start-session').click();
 assert.match(await page.locator('.latin').first().textContent(),/uitam/u);
 await page.locator('#result-input').fill('vida');
 await page.locator('#check-result').click();
 assert.equal(await page.locator('#rules-form').count(),1);
 await page.locator('#rule-0').selectOption('SONOR');
 await page.locator('#check-rules').click();
 assert.match(await page.locator('.feedback.good').first().textContent(),/completada/u);
 await page.locator('#next-card').click();
 assert.match(await page.locator('.latin').first().textContent(),/buccam/u);
 await page.locator('#result-input').fill('boca');
 await page.locator('#check-result').click();
 assert.equal(await page.locator('.change').count(),2);
 await page.locator('#rule-0').selectOption('ABER');
 await page.locator('#rule-1').selectOption('SIMPL');
 await page.locator('#check-rules').click();
 await page.locator('#next-card').click();
 assert.match(await page.locator('h2').first().textContent(),/Resum/u);
 assert.equal(await page.locator('.stat strong').nth(1).textContent(),'2');
 await page.locator('#restart-session').click();
 await page.locator('#session-count').fill('1');
 await page.locator('#start-session').click();
 for(let i=0;i<3;i++){
  await page.locator('#result-input').fill('equivocada');
  await page.locator('#check-result').click();
 }
 assert.match(await page.locator('.feedback.error').first().textContent(),/no compta/u);
 await page.locator('#next-card').click();
 assert.equal(await page.locator('.stat strong').nth(1).textContent(),'0');
 // El modo OLED conserva los controles con color; no se guarda configuración.
 await page.locator('#theme').selectOption('oled');
 assert.equal(await page.locator('html').getAttribute('data-theme'),'oled');
 assert.deepEqual(errors,[]);
 assert.deepEqual(external,[]);
 console.log('OK: HTML file://, 7 fitxes, dues fases, 3 intents, revelació, OLED, zero xarxa');
}finally{await browser.close();}
