import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
try {
 for(const width of [1440,390]) {
  const page=await browser.newPage({viewport:{width,height:950}});
  let signed=false, current=null, uploaded=false, reviewed=false;
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/v1/**',async route=>{
   const req=route.request(),path=new URL(req.url()).pathname.replace('/api/v1/','');
   let body={},status=200;
   if(path==='capabilities')body={mode:'live'};
   else if(path==='session'){
    if(req.method()==='POST'){signed=true;body={username:'reviewer',csrf_token:'test-csrf'};}
    else if(req.method()==='DELETE'){signed=false;status=204;}
    else if(signed)body={username:'reviewer',csrf_token:'test-csrf'};
    else{status=401;body={detail:'Sign in to the live workspace'};}
   } else {
    assert(signed);
    if(req.method()==='POST')assert.equal(req.headers()['x-csrf-token'],'test-csrf');
    if(path==='contracts')body={contracts:[{contract_id:'CTR-1',supplier_id:'SUP-1',purchase_order:'PO-1',currency:'EUR',valid_from:'2026-01-01'}]};
    else if(path==='cases')body={cases:current?[current]:[]};
    else if(path==='requests'){
     assert.equal(req.postDataJSON().contract_id,'CTR-1');
     current={case_id:'CASE-1',supplier_id:'SUP-1',contract_id:'CTR-1',status:'Requested',revision:0,failed_rules:[],verified_findings:[],model_execution:'scripted',model_usage:[]};body=current;
    } else if(path.endsWith('/events'))body={events:[{seq:1,label:'Request <script>window.injected=true</script>',kind:'collection.requested',recorded_at:'2026-10-22',detail:'Test evidence'}]};
    else if(path.endsWith('/submissions')){
     assert.match(req.postData(),/name="revision"\r\n\r\n0/);
     uploaded=true;current={...current,status:'Awaiting_reviewer',revision:1,hitl_pending:true,submission:{invoice_id:'INV-1',version:1,total:'100'}};body=current;
    } else if(path.endsWith('/review')){
     assert.equal(req.postDataJSON().revision,1);assert.equal(req.postDataJSON().action,'approve');reviewed=true;
     current={...current,status:'Archived',hitl_pending:false,revision:2};body=current;
    } else if(path==='cases/CASE-1')body=current;
    else throw Error('Unexpected API path '+path);
   }
   await route.fulfill({status,contentType:'application/json',body:status===204?'':JSON.stringify(body)});
  });
  await page.goto((process.env.TEST_ORIGIN||'http://127.0.0.1:8765')+'/live.html');
  await page.getByLabel('Reviewer ID').fill('reviewer');await page.getByLabel('Password',{exact:true}).fill('test-password');await page.getByRole('button',{name:'Sign in securely'}).click();
  await page.getByLabel('Due date').fill('2026-12-31');await page.getByRole('button',{name:'Create request'}).click();
  await page.getByRole('button',{name:'Download JSON starting template'}).waitFor();
  await page.screenshot({path:`live-workspace-${width}.png`,fullPage:true});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.getByLabel('Supplier invoice',{exact:true}).setInputFiles({name:'invoice.json',mimeType:'application/json',buffer:Buffer.from('{}')});
  await page.getByRole('button',{name:'Upload and validate'}).click();
  await page.getByLabel('Disposition').selectOption('approve');await page.getByLabel('Evidence-based rationale').fill('Reviewed the invoice and verified all evidence.');
  await page.getByRole('button',{name:'Record decision'}).click();await page.getByRole('heading',{name:'SUP-1 / Archived'}).waitFor();
  assert(uploaded&&reviewed);assert.equal(await page.evaluate(()=>window.injected),undefined);
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.getByRole('heading',{name:'Sign in to your workspace'}).waitFor();
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('Live UI contract checks passed at desktop and phone widths (mock service).');
} finally {await browser.close();}
