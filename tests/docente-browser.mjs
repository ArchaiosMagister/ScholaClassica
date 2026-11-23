import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,join,extname,sep} from 'node:path';
import {chromium} from 'playwright';
const root=resolve(import.meta.dirname,'../dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css'};
const server=createServer(async(req,res)=>{
  try{
    const pathname=new URL(req.url,'http://localhost').pathname;
    const filename=resolve(root,decodeURIComponent(pathname.slice(1))+(pathname.endsWith('/')?'index.html':''));
    if(!filename.startsWith(root+sep))throw Error('Fuera de directorio');
    if(!(await stat(filename)).isFile())throw Error('No es archivo');
    res.writeHead(200,{'content-type':mime[extname(filename)]||'application/octet-stream'});
    res.end(await readFile(filename));
  }catch{res.writeHead(404);res.end('No encontrado')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
let browser;
const config={enabled:true,origin:base,url:'https://ejemplo.supabase.co',publishableKey:'sb_publishable_test_mock_1234567890',username:'MagisterArchaios',setupOnly:false};
const install=async(page,allow=true,setupOnly=false,palabraAllow=allow)=>{
  await page.route('**/functions/v1/schola-palabra-inbox',route=>
    route.fulfill({
      status:route.request().method()==='OPTIONS'?204:palabraAllow?200:403,contentType:'application/json',
      headers:{'access-control-allow-origin':'*',
        'access-control-allow-methods':'POST, OPTIONS',
        'access-control-allow-headers':'authorization, apikey, content-type'},
      body:JSON.stringify(palabraAllow
        ?{authorized:true,source:'palabra',items:[{source:'palabra',title:'etimología',
          course:'1.º Bachillerato',summary:'<img src=x onerror=alert(1)> Definición propuesta',
          created_at:'2026-11-12T11:00:00Z'}]}
        :{error:'Acceso no autorizado'})
    })
  );
  await page.route('**/docente/auth-config.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({...config,setupOnly})}));
  await page.addInitScript((allow)=>{
    const mock={session:false,aal:'aal1',factor:false,allow};
    window.__teacherMock=mock;
    const success=data=>({data,error:null});
    const auth={
      setSession:async({access_token,refresh_token})=>{
        if(access_token!=='mock-access'||refresh_token!=='mock-refresh')
          return {data:null,error:new Error('invalid session')};
        mock.session=true;return success({user:{id:'docente'}});
      },
      getSession:async()=>success({session:mock.session?{access_token:'fake'}:null}),
      getUser:async()=>success({user:mock.session?{id:'docente'}:null}),
      mfa:{
        getAuthenticatorAssuranceLevel:async()=>success({currentLevel:mock.aal,nextLevel:mock.factor?'aal2':'aal1'}),
        listFactors:async()=>success({totp:mock.factor?[{id:'factor',status:'verified'}]:[]}),
        enroll:async()=>success({id:'factor',totp:{secret:'ABCDEF123456',qr_code:'data:image/svg+xml;utf8,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22/%3E'}}),
        challengeAndVerify:async({factorId,code})=>{
          if(factorId!=='factor'||code!=='123456')return{data:null,error:new Error('invalid')};
          mock.factor=true;mock.aal='aal2';return success({});
        }
      },
      signOut:async()=>{mock.session=false;mock.aal='aal1';return success({})},
      onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})
    };
    const functions={invoke:async(name,options)=>{
      if(name==='schola-login'){
        mock.loginCalls=(mock.loginCalls||0)+1;
        if(options?.body?.username!=='MagisterArchaios'||
          options.body?.password!=='clave-correcta')
          return {data:null,error:new Error('invalid')};
        return success({access_token:'mock-access',refresh_token:'mock-refresh'});
      }
      if(name==='schola-vocab-admin'){
        mock.vocabCalls=(mock.vocabCalls||0)+1;
        if(mock.aal!=='aal2'||!mock.allow)return {data:null,error:new Error('forbidden')};
        if(options?.body?.action==='words.list')return success({words:[{
          id:'00000000-0000-4000-8000-000000000111',subject:'lat1',
          form:'<img src=x onerror=alert(1)>',meaning:'palabra',
          answers:['palabra'],units:['UD 1'],in_exam:false,active:true
        },{
          id:'00000000-0000-4000-8000-000000000333',subject:'lat1',
          form:'Ephesius, –a, –um',meaning:'de Éfeso, efesio',
          answers:['efesio'],units:['UD 10'],in_exam:false,active:true
        }],hasMore:false});
        if(options?.body?.action==='words.save'){
          mock.savedWords=(mock.savedWords||0)+1;
          return success({saved:true,word:options.body});
        }
        if(options?.body?.action==='reports.list'){
          const vocab={id:'00000000-0000-4000-8000-000000000222',kind:'translation',
            subject:'lat1',mode:'general',entry_id:'lat1:amo',entry_form:'amo',
            message:'Hay otra acepción',status:'pending',teacher_note:''};
          const grammar={id:'00000000-0000-4000-8000-000000000444',kind:'other',
            subject:'gr1',mode:'general',entry_id:'grammar:example',
            entry_form:'Gramática · imperfecto',message:'Esta forma debe revisarse',
            status:'pending',teacher_note:''};
          const area=options.body.area||'all';
          return success({reports:area==='grammar'?[grammar]:
            area==='vocabula'?[vocab]:[vocab,grammar],more:false});
        }
        if(options?.body?.action==='reports.review'){
          mock.savedReports=(mock.savedReports||0)+1;
          return success({saved:true,report:options.body});
        }
        throw new Error('Unexpected admin action');
      }
      if(name!=='schola-inbox')throw new Error('Unexpected endpoint');
      mock.inboxCalls=(mock.inboxCalls||0)+1;
      if(mock.aal!=='aal2')return {data:{authorized:false},error:null};
      return mock.allow?success({authorized:true,source:'vocabula',items:[
        {source:'vocabula',title:'palabra',course:'lat1',summary:'<img src=x onerror=alert(1)>',created_at:'2026-11-12T12:00:00Z'}
      ]}):{data:{authorized:false},error:null};
    }};
    window.supabase={createClient:()=>({auth,functions})};
  },allow);
};
try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.route('**/docente/auth-config.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:false})}));
  let res=await page.goto(base+'/docente/index.html',{waitUntil:'networkidle'});
  assert.equal(res.status(),200);
  await page.locator('#unavailable').waitFor({state:'visible'});
  assert.equal(await page.locator('#teacher').isVisible(),false);
  assert.equal(await page.locator('#login').isVisible(),false);
  assert.equal(errors.length,0,errors.join(';'));
  const good=await browser.newPage();
  const errorsGood=[];good.on('pageerror',err=>errorsGood.push(err.message));
  await install(good,true);
  await good.goto(base+'/docente/index.html',{waitUntil:'networkidle'});
  await good.locator('#login').waitFor({state:'visible'});
  assert.equal(await good.locator('#username').inputValue(),'','El usuario debe escribirse manualmente');
  assert.equal(await good.locator('#teacher').isVisible(),false);
  await good.locator('#username').fill('MagisterArchaios');
  await good.locator('#password').fill('clave-correcta');
  await good.locator('#login-form button').click();
  await good.locator('#enroll').waitFor({state:'visible'});
  assert.equal(await good.locator('#teacher').isVisible(),false,'No se habilita nada tras solo contraseña');
  assert.deepEqual(await good.evaluate(()=>[window.__teacherMock.loginCalls||0,window.__teacherMock.inboxCalls||0]),[1,0]);
  await good.locator('#enroll-start').click();
  await good.locator('#totp-secret').waitFor({state:'visible'});
  assert.equal(await good.locator('#totp-secret').inputValue(),'ABCDEF123456');
  await good.locator('#enroll-code').fill('123456');
  await good.locator('#enroll-form button').click();
  await good.locator('#teacher').waitFor({state:'visible'});
  assert.equal(await good.evaluate(()=>window.__teacherMock.inboxCalls),1);
  await good.waitForFunction(()=>document.querySelectorAll('#notices .notice').length===1,
    null,{timeout:10000});
  assert.equal(await good.locator('#notices .notice').count(),1);
  assert.ok((await good.locator('#notices .notice p').textContent()).includes('<img'));
  assert.equal(await good.locator('.notice img').count(),0,
    'No se interpreta HTML enviado en las propuestas');
  assert.match(await good.locator('#sources-state').textContent(),/Palabra del día: conectada/);
  assert.equal(await good.locator('#notice-source').count(),0);
  assert.equal(await good.locator('#vocab-admin').count(),0);
  assert.equal(await good.locator('#admin-new').count(),0);
  assert.equal(await good.evaluate(()=>window.__teacherMock.vocabCalls||0),0,
    'El frontend ya no debe consultar schola-vocab-admin');
  await good.locator('#notice-refresh').click();
  await good.waitForFunction(()=>document.querySelectorAll('#notices .notice').length===1);
  await good.locator('#grammar-audit-load').click();
  await good.waitForFunction(()=>document.querySelector('#grammar-coverage-list .notice')!==null);
  assert.ok((await good.locator('#grammar-coverage-list').textContent()).includes('Latín I'));
  await good.locator('#grammar-audit-subject').selectOption('lat1');
  await good.locator('#grammar-audit-search').fill('puella');
  await good.locator('#grammar-audit-form button[type=submit]').click();
  await good.waitForFunction(()=>document.querySelectorAll('#grammar-audit-results .notice').length>0);
  assert.ok((await good.locator('#grammar-audit-results').textContent()).includes('Solución:'));
  assert.equal(await good.locator('#grammar-audit-reports').count(),0);
  assert.equal(await good.locator('#totp-secret').inputValue(),'','El secreto se limpia tras el registro');
  await good.locator('#logout').click();
  await good.locator('#login').waitFor({state:'visible'});
  assert.equal(await good.locator('#username').inputValue(),'','Cerrar sesión debe limpiar el usuario');
  assert.equal(await good.locator('#teacher').isVisible(),false);
  assert.equal(errorsGood.length,0,errorsGood.join(';'));
  // La denegación parcial de Palabra del día no autoriza mostrar datos de Vocabula.
  const partial=await browser.newPage();
  const errorsPartial=[];partial.on('pageerror',error=>errorsPartial.push(error.message));
  await install(partial,true,false,false);
  await partial.goto(base+'/docente/index.html',{waitUntil:'networkidle'});
  await partial.locator('#username').fill('MagisterArchaios');
  await partial.locator('#password').fill('clave-correcta');
  await partial.locator('#login-form button').click();
  await partial.locator('#enroll').waitFor({state:'visible'});
  await partial.locator('#enroll-start').click();
  await partial.locator('#enroll-code').fill('123456');
  await partial.locator('#enroll-form button').click();
  await partial.locator('#teacher').waitFor({state:'visible'});
  await partial.waitForFunction(()=>document.querySelector('#sources-state')?.textContent?.includes('Palabra del día: no disponible'));
  assert.equal(await partial.locator('#notices .notice').count(),0,
    'Si Palabra del día falla, no se deben mostrar los avisos Vocabula retirados');
  assert.equal(await partial.locator('#vocab-admin').count(),0);
  assert.equal(await partial.evaluate(()=>window.__teacherMock.vocabCalls||0),0);
  assert.equal(await partial.evaluate(()=>window.__teacherMock.session),true,
    'Un 403 de una fuente secundaria nunca debe cerrar la sesión principal');
  assert.equal(await partial.locator('#unavailable').isVisible(),false);
  assert.deepEqual(errorsPartial,[]);

  const denied=await browser.newPage();
  await install(denied,false);
  await denied.goto(base+'/docente/index.html',{waitUntil:'networkidle'});
  await denied.locator('#username').fill('MagisterArchaios');
  await denied.locator('#password').fill('clave-correcta');
  await denied.locator('#login-form button').click();
  await denied.locator('#enroll').waitFor({state:'visible'});
  await denied.locator('#enroll-start').click();
  await denied.locator('#enroll-code').fill('123456');
  await denied.locator('#enroll-form button').click();
  await denied.locator('#unavailable').waitFor({state:'visible'});
  assert.equal(await denied.locator('#notices .notice').count(),0,'Denegación del servidor impide datos');
  // Alta inicial: aunque se verifique TOTP, nunca consulta avisos ni datos.
  const initial=await browser.newPage();
  await install(initial,true,true);
  await initial.goto(base+'/docente/index.html',{waitUntil:'networkidle'});
  await initial.locator('#login').waitFor({state:'visible'});
  await initial.locator('#username').fill('MagisterArchaios');
  await initial.locator('#password').fill('clave-correcta');
  await initial.locator('#login-form button').click();
  await initial.locator('#enroll').waitFor({state:'visible'});
  await initial.locator('#enroll-start').click();
  await initial.locator('#enroll-code').fill('123456');
  await initial.locator('#enroll-form button').click();
  await initial.locator('#ready').waitFor({state:'visible'});
  assert.equal(await initial.locator('#teacher').isVisible(),false);
  assert.equal(await initial.evaluate(()=>window.__teacherMock.inboxCalls||0),0);
  assert.equal(await initial.evaluate(()=>window.__teacherMock.vocabCalls||0),0);
  await initial.locator('#logout').click();
  await initial.locator('#login').waitFor({state:'visible'});
  assert.equal(await initial.locator('#username').inputValue(),'');
  console.log('Zona docente: bloqueo, segundo factor, autorización y render seguro OK');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
