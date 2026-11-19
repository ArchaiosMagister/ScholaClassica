import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync,readFileSync,statSync} from 'node:fs';
import {join,relative,resolve,sep} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const source=join(root,'vendor/appendix');
const target=join(root,'dist/apps/gramatica');
const getFiles=(dir)=>{
 const output=[];
 const visit=folder=>{
  for(const entry of readdirSync(folder,{withFileTypes:true})){
   const path=join(folder,entry.name);
   if(entry.isDirectory())visit(path);
   else if(entry.isFile()&&entry.name.endsWith('.html'))
    output.push(relative(dir,path).split(sep).join('/'));
  }
 };
 visit(dir);
 return output.sort();
};
const htmlFiles=getFiles(source);
const existsAsHTML=rel=>{
 const pathname=join(target,rel),s=statSync(pathname);
 assert.ok(s.isFile()&&s.size>100,'Se perdió la página: '+rel);
 const html=readFileSync(pathname,'utf8');
 assert.match(html,/<html\b/i,'HTML ausente: '+rel);
 assert.match(html,/<\/html>/i,'Documento incompleto: '+rel);
};

test('Las 90 URL históricas de Appendix conservan destino HTML en ScholaClassica',()=>{
 assert.equal(htmlFiles.length,90,'Cambió el inventario de rutas antiguas');
 assert.equal(htmlFiles.filter(x=>x.startsWith('val/')).length,45);
 assert.equal(htmlFiles.filter(x=>!x.startsWith('val/')).length,45);
 const built=getFiles(target);
 const missing=htmlFiles.filter(x=>!built.includes(x));
 assert.deepEqual(missing,[],'El portal deja de ofrecer páginas de gramática antiguas');
 for(const name of htmlFiles)existsAsHTML(name);
});
test('Se mantienen accesos raíz, gramática valenciana, Vocabula y Evolutio',()=>{
 for(const rel of ['index.html','val/index.html','griego-sustantivos.html',
 'val/griego-sustantivos.html','curso.html','val/curso.html'])existsAsHTML(rel);
 for(const rel of ['dist/index.html','dist/apps/vocabulario/index.html',
  'dist/apps/evolucion-fonetica/index.html']){
  const path=join(root,rel);
  assert.ok(statSync(path).isFile(),'Destino del enlace legado ausente '+rel);
  assert.match(readFileSync(path,'utf8'),/<html\b/i);
 }
});
test('La continuidad de URL no depende de los clones externos',()=>{
 const built=readFileSync(join(root,'scripts/build.mjs'),'utf8');
 const ci=readFileSync(join(root,'.github/workflows/integracion.yml'),'utf8');
 for(const key of ['appendix','vocabula','evolutio']){
  assert.ok(built.includes('vendor/'+key),'No se usa el snapshot '+key);
  assert.ok(!ci.includes('repository: ArchaiosMagister/'+({
   appendix:'Appendix-grammaticae',vocabula:'VocabulaLatinaGraecaque',
   evolutio:'EvolucionFonetica'
  })[key]),'Checkout externo reintroducido '+key);
 }
});
