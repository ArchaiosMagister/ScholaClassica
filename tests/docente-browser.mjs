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
const config={enabled:true,url:'https://ejemplo.supabase.co',publishableKey:'sb_publishable_test_mock_1234567890',email:'test-docente@example.com',username:'MagisterArchaios'};
const install=async(page,allow=true)=>{
  await page.route('**/docente/auth-config.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(config)}));
  await page.addInitScript((allow)=>{
    const mock={session:false,aal:'aal1',factor:false,allow};
    window.__teacherMock=mock;
    const success=data=>({data,error:null});
    const auth={
      getSession:async()=>success({session:mock.session?{access_token:'fake'}:null}),
      getUser:async()=>success({user:mock.session?{id:'docente'}:null}),
      signInWithPassword:async({email,password})=>{
        if(email!=='test-docente@example.com'||password!=='clave-correcta')return{data:null,error:new Error('invalid')};
        mock.session=true;return success({user:{id:'docente'}});
      },
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
    const functions={invoke:async()=>mock.allow?
      success({authorized:true,items:[{source:'vocabula',title:'palabra',course:'lat1',
        summary:'<img src=x onerror=alert(1)>',created_at:'2026-11-12T12:00:00Z'}]}):
      {data:{authorized:false},error:null}};
    window.supabase={createClient:()=>({auth,functions})};
  },allow);
};
try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
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
  assert.equal(await good.locator('#teacher').isVisible(),false);
  await good.locator('#username').fill('MagisterArchaios');
  await good.locator('#password').fill('clave-correcta');
  await good.locator('#login-form button').click();
  await good.locator('#enroll').waitFor({state:'visible'});
  assert.equal(await good.locator('#teacher').isVisible(),false,'No se habilita nada tras solo contraseña');
  await good.locator('#enroll-start').click();
  await good.locator('#totp-secret').waitFor({state:'visible'});
  assert.equal(await good.locator('#totp-secret').inputValue(),'ABCDEF123456');
  await good.locator('#enroll-code').fill('123456');
  await good.locator('#enroll-form button').click();
  await good.locator('#teacher').waitFor({state:'visible'});
  assert.equal(await good.locator('.notice').count(),1);
  assert.ok((await good.locator('.notice p').textContent()).includes('<img'));
  assert.equal(await good.locator('.notice img').count(),0,'No se interpreta HTML en avisos');
  assert.equal(await good.locator('#totp-secret').inputValue(),'','El secreto se limpia tras el registro');
  await good.locator('#logout').click();
  await good.locator('#login').waitFor({state:'visible'});
  assert.equal(await good.locator('#teacher').isVisible(),false);
  assert.equal(errorsGood.length,0,errorsGood.join(';'));
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
  assert.equal(await denied.locator('.notice').count(),0,'Denegación del servidor impide datos');
  console.log('Zona docente: bloqueo, segundo factor, autorización y render seguro OK');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
