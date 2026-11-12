import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync,existsSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const output=join(root,'build','.docente-test-'+process.pid);
const script=join(root,'scripts/build-docente.mjs');
const identityKeys=['SCHOLA_DOCENTE_ORIGIN','SCHOLA_AUTH_URL','SCHOLA_AUTH_PUBLISHABLE_KEY','SCHOLA_AUTH_LOGIN_EMAIL'];
const environment=Object.fromEntries(Object.entries(process.env).filter(([name])=>
  !name.startsWith('SCHOLA_AUTH_')&&!name.startsWith('SCHOLA_DOCENTE_')));
const validEnv={
  SCHOLA_DOCENTE_ORIGIN:'https://docente.ejemplo.test',
  SCHOLA_AUTH_URL:'https://wpwlguufpkfnzlbyproe.supabase.co',
  SCHOLA_AUTH_PUBLISHABLE_KEY:'sb_publishable_'+'a'.repeat(24),
  SCHOLA_AUTH_LOGIN_EMAIL:'docente@ejemplo.test'
};
function build(vars={}){
  return spawnSync(process.execPath,[script],{
    cwd:root,encoding:'utf8',env:{...environment,SCHOLA_DOCENTE_OUTPUT:output,...vars}
  });
}
test('sin cuenta activada solo se obtiene un artefacto independiente bloqueado',()=>{
  try{
    const result=build();
    assert.equal(result.status,0,result.stderr);
    assert.equal(JSON.parse(readFileSync(join(output,'auth-config.json'),'utf8')).enabled,false);
    const html=readFileSync(join(output,'index.html'),'utf8');
    assert.ok(html.includes('Content-Security-Policy'));
    assert.ok(html.includes('href="./portal.css"'));
    assert.ok(html.includes('https://archaiosmagister.github.io/ScholaClassica/'));
    for(const file of ['portal.css','style.css','app.mjs','index.html','auth-config.json'])
      assert.equal(existsSync(join(output,file)),true,file);
    for(const file of ['apps/vocabulario/index.html','apps/examenes/index.html'])
      assert.equal(existsSync(join(output,file)),false,file);
  }finally{rmSync(output,{recursive:true,force:true})}
});
test('rechaza el origen compartido, HTTP, clave privada y configuraciones parciales',()=>{
  const bad=[
    {SCHOLA_DOCENTE_ORIGIN:'https://docente.ejemplo.test'},
    {...validEnv,SCHOLA_DOCENTE_ORIGIN:'https://archaiosmagister.github.io'},
    {...validEnv,SCHOLA_DOCENTE_ORIGIN:'http://docente.ejemplo.test'},
    {...validEnv,SCHOLA_DOCENTE_ORIGIN:'https://docente.ejemplo.test/ruta'},
    {...validEnv,SCHOLA_AUTH_PUBLISHABLE_KEY:'sb_secret_clave_incorrecta'}
  ];
  try{
    for(const vars of bad){
      const result=build(vars);
      assert.notEqual(result.status,0,'No debe admitir '+JSON.stringify(vars));
    }
  }finally{rmSync(output,{recursive:true,force:true})}
});
test('genera una configuración activable solo para un origen docente separado',()=>{
  try{
    const result=build(validEnv);
    assert.equal(result.status,0,result.stderr);
    const config=JSON.parse(readFileSync(join(output,'auth-config.json'),'utf8'));
    assert.equal(config.enabled,true);
    assert.equal(config.origin,'https://docente.ejemplo.test');
    assert.equal(config.url,validEnv.SCHOLA_AUTH_URL);
    assert.equal(config.username,'MagisterArchaios');
    assert.equal(config.email,'docente@ejemplo.test');
    const html=readFileSync(join(output,'index.html'),'utf8');
    assert.ok(html.includes('connect-src'));
    assert.ok(html.includes(validEnv.SCHOLA_AUTH_URL));
    assert.equal(readFileSync(join(output,'app.mjs'),'utf8'),
      readFileSync(join(root,'public/docente/app.mjs'),'utf8'));
  }finally{rmSync(output,{recursive:true,force:true})}
});
test('la compilación pública nunca incluye una cuenta docente activada',()=>{
  const publicBuild=readFileSync(join(root,'scripts/build.mjs'),'utf8');
  assert.ok(publicBuild.includes('name.startsWith(\'SCHOLA_AUTH_\')'));
  const config=JSON.parse(readFileSync(join(root,'dist/docente/auth-config.json'),'utf8'));
  assert.deepEqual(config,{enabled:false});
  assert.equal(readFileSync(join(root,'dist/docente/app.mjs'),'utf8')
    .includes('sb_secret_'),false);
});
