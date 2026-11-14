import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync,statSync} from 'node:fs';
import {resolve,join,sep} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'..'),out=join(root,'dist');
const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const locks=JSON.parse(readFileSync(join(root,'config/sources.lock.json'),'utf8'));
test('se integran tres fuentes fijadas; Etymologicon es nativo y los exámenes siguen fuera',()=>{
  assert.deepEqual(Object.entries(locks.sources).filter(([,item])=>item.integrated).map(([key])=>key).sort(),['appendix','evolutio','vocabula']);
  assert.equal(existsSync(join(out,'apps/examenes')),false);
});
function crawl(dir,prefix=''){
  return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.name==='.git'||e.name==='.github'?[]:
    e.isDirectory()?crawl(join(dir,e.name),prefix+e.name+'/'):[prefix+e.name]);
}
function compareApp(source,target,exceptions=[],extras=[]){
  const expected=crawl(source).sort(),actual=crawl(target).sort();
  assert.deepEqual(actual,[...expected,...extras].sort());
  for(const file of expected){
    if(exceptions.includes(file))continue;
    assert.equal(hash(join(source,file)),hash(join(target,file)),'Copia alterada: '+file);
  }
}
test('Appendix castellano y valenciano mantiene originales salvo adaptaciones visuales de dist',()=>{
  const appendixSource=join(root,'.sources/appendix'),appendixTarget=join(out,'apps/gramatica');
  const pages=crawl(appendixSource).filter(path=>path.endsWith('.html'));
  const adapted=['assets/style.css','assets/language-colors.css','assets/theme.js',
    'assets/app.js','val/app.js',...pages];
  const extra=['assets/curriculum-latin4.json','val/curriculum-latin4.json',
    'assets/gramatica-offline.js','sw.js'];
  compareApp(appendixSource,appendixTarget,adapted,extra);
  const curriculumFiles=['assets/curriculum.json','val/curriculum.json'];
  for(const name of curriculumFiles)
    assert.equal(hash(join(appendixSource,name)),hash(join(appendixTarget,name)),
      'Los diez temas de Latín I y los catorce de Griego I no se pueden modificar');
  const coursePages=new Set(['index.html','curso.html','val/index.html','val/curso.html']);
  for(const page of pages){
    const original=readFileSync(join(appendixSource,page),'utf8');
    const expected=original.replace(/(assets\/(?:theme\.js|style\.css|language-colors\.css)\?v=[a-zA-Z0-9-]+)(?=["'])/g,'$1-oled1');
    const actual=readFileSync(join(appendixTarget,page),'utf8');
    if(coursePages.has(page)){
      assert.ok(actual.includes('<option value="4">'),'Falta opción curricular en '+page);
      assert.ok(actual.includes('curso=4&amp;unidad=1')||page.endsWith('curso.html'),
        'Falta el enlace directo a 4.º: '+page);
      // La única edición HTML adicional autorizada es el selector de 4.º
      // y, en la portada, el enlace de consulta. Restaurarlos debe
      // producir los bytes esperados con el ajuste OLED preexistente.
      const withoutOption=actual.replace(/<option value="4">[^<]*<\/option>/u,'')
        .replace(/<script src="(?:\.\.\/)?assets\/gramatica-offline\.js" defer><\/script>/u,'');
      const reverted=page.endsWith('index.html')?withoutOption.replace(
        /<p class="course-note"><a href="curso.html\?lengua=latin&amp;curso=4&amp;unidad=1">[^<]*<\/a><\/p>/u,''):withoutOption;
      assert.equal(reverted,expected,'HTML de Appendix sufrió cambios inesperados: '+page);
    }else assert.equal(actual,expected,'HTML de Appendix: '+page);
  }
  for(const file of ['index.html','curso.html','val/index.html','val/curso.html','assets/curriculum.json','val/curriculum.json'])
    assert.ok(existsSync(join(out,'apps/gramatica',file)),file);
});
test('Evolutio conserva el banco y el motor; ajusta dificultad solo en copia y mantiene SW aislado',()=>{
  const source=join(root,'.sources/evolutio'),target=join(out,'apps/evolucion-fonetica');
  const adapted=['index.html','sw.js','src/app.mjs','src/difficulty.mjs','data/difficulty.json','style.css'];
  compareApp(source,target,adapted,['src/result-difficulty.mjs']);
  for(const file of adapted)assert.notEqual(hash(join(source,file)),hash(join(target,file)),'Adaptación no aplicada: '+file);
  for(const file of ['src/engine.mjs','src/rules.mjs','src/latin.mjs','data/pilot.json','manifest.webmanifest'])
    assert.equal(hash(join(source,file)),hash(join(target,file)),'Original alterado: '+file);
  const sw=readFileSync(join(target,'sw.js'),'utf8');
  assert.match(sw,/const CACHE_PREFIX='schola-evolutio-';/);
  assert.match(sw,/keys\.filter\(key=>key\.startsWith\(CACHE_PREFIX\)&&key!==VERSION\)/);
  assert.match(sw,/src\/result-difficulty\.mjs/);
  assert.match(sw,/resultado-v4/);
  const original=JSON.parse(readFileSync(join(source,'data/difficulty.json'),'utf8'));
  const reclassified=JSON.parse(readFileSync(join(target,'data/difficulty.json'),'utf8'));
  assert.equal(original.method,'criterio-didactico-v1');
  assert.equal(reclassified.method,'criterio-resultado-v2');
  assert.deepEqual(Object.keys(original.assignments),Object.keys(reclassified.assignments));
  assert.ok(Object.keys(reclassified.assignments).some(id=>original.assignments[id].level!==reclassified.assignments[id].level));
});
test('Etymologicon se construye con su pantalla, corrector y banco ampliado y cerrado, sin publicar material docente interno',()=>{
  const dir=join(out,'apps/etymologicon');
  for(const file of ['index.html','practicar.html','portada.css','portada.mjs','style.css','app.mjs','study.mjs','activities-ui.mjs','quiz.mjs','quiz-ui.mjs','decomposition.mjs','decomposition-ui.mjs','greek-keyboard.mjs','corrector/write-two.mjs','data/gr1.json',
    'estudio.html','estudio.mjs','study-update.mjs','estudio.css','data/gr1-study.json',
    'manifest.webmanifest','sw.js','icons/icon.svg','icons/icon-192.png','icons/icon-512.png',
    'icons/icon-maskable-512.png','icons/apple-touch-icon.png'])
    assert.ok(existsSync(join(dir,file)),'Archivo faltante: '+file);
  const learner=JSON.parse(readFileSync(join(dir,'data/gr1.json'),'utf8'));
  assert.equal(learner.schema,'etymologicon-audited-catalog/v1');
  assert.equal(learner.course,'gr1');
  assert.equal(learner.etymons.length,111);
  assert.ok(learner.extension&&learner.extension.newDerivatives>=100);
  assert.equal(learner.derivatives.length,201+learner.extension.newDerivatives);
  assert.equal(learner.relations.length,217+learner.extension.newRelations);
  assert.equal(learner.etymons.filter(x=>x.editorialStatus==='approved_for_documented_derivatives').length,108);
  assert.ok(!('editorialDecisions' in learner));
  assert.ok(!('definitions' in learner.derivatives[0]));
  const study=JSON.parse(readFileSync(join(dir,'data/gr1-study.json'),'utf8'));
  assert.equal(study.schema,'etymologicon-study-catalog/v1');
  assert.equal(study.words.length,487);
  assert.equal(study.etymons.length,111);
  assert.ok(study.words.every(w=>w.definition&&w.components?.length&&w.dleUrl));
  assert.ok(study.words.find(w=>w.form==='filosofía').components.length>=2);
  assert.ok(!('source' in learner.etymons[0]));
  assert.ok(!JSON.stringify(learner).includes('originalWorkbook'));
  const html=readFileSync(join(dir,'index.html'),'utf8');
  assert.match(html,/href="\.\/practicar\.html"/);
  assert.match(html,/href="\.\/estudio\.html"/);
  const practiceHtml=readFileSync(join(dir,'practicar.html'),'utf8');
  assert.ok(practiceHtml.includes('id="answer-1"'));
  assert.ok(practiceHtml.includes('id="answer-2"'));
  assert.ok(practiceHtml.includes('id="result-total"'));
  assert.ok(practiceHtml.includes('id="unit-select"'));
});
test('el portal ofrece dos tipos de navegación y no expone el generador',()=>{
  const html=readFileSync(join(out,'index.html'),'utf8');
  for(const name of ['Por lengua','Por herramienta','Latín I','Latín II','Griego I','Griego II','Evolución fonética','Abrir Evolutio','Etymologicon','Profesorado'])
    assert.ok(html.includes(name),name);
  assert.ok(!/href=["'][^"']*(GeneradorExamenes|apps\/examenes)/i.test(html));
  assert.ok(!html.includes('serviceWorker.register('));
});
test('enlaces y recursos del portal apuntan a ficheros presentes en el artefacto',()=>{
  const html=readFileSync(join(out,'index.html'),'utf8');
  const matches=[...html.matchAll(/\b(?:href|src)="([^"]+)"/g)];
  for(const [,value] of matches){
    if(value.startsWith('#')||/^[a-z]+:\/\//i.test(value))continue;
    const url=new URL(value,'http://localhost/');
    const target=resolve(out,decodeURIComponent(url.pathname.slice(1)));
    assert.ok(target.startsWith(out+sep)||target===out,'Fuera de directorio: '+value);
    const final=existsSync(target)&&statSync(target).isDirectory()?join(target,'index.html'):target;
    assert.ok(existsSync(final),'No existe recurso '+value);
  }
});
