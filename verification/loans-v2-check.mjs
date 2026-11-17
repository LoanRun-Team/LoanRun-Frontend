import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import fixtures from '../src/api/mock/specFixtures.js'
const sample=key=>structuredClone(fixtures[key].data)
const base=sample('GET /api/loans/{loan_id}/')
const loans=[{...structuredClone(base),loan_id:1,product_name:'신용대출',payment_day:15,contractual_monthly_payment:199954,estimated_monthly_payment:199954},{...structuredClone(base),loan_id:2,product_name:'주택담보대출',loan_type:'MORTGAGE',payment_day:25,contractual_monthly_payment:699179,estimated_monthly_payment:699179,rate_type:'VARIABLE'}]
const seed={version:2,data:{profile:sample('GET /api/users/me/'),finance:sample('GET /api/budgets/profile/'),notifications:sample('GET /api/settings/notifications/'),loans,plans:loans.map(l=>({...structuredClone(base.plan),loan_id:l.loan_id,priority:l.loan_id,monthly_amount:l.contractual_monthly_payment+100000})),payments:['2026-06-15','2026-07-15','2026-08-15','2026-09-15','2026-10-15'].map((paid_at,i)=>({payment_id:51+i,loan_id:1,paid_at,amount:299954,payment_type:'REGULAR',due_item_id:21,principal_amount:169954,interest_amount:30000,extra_amount:100000,created_at:paid_at+'T10:00:00+09:00'}))}}
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--hide-scrollbars','--remote-debugging-port=9229','--user-data-dir='+fileURLToPath(new URL('./loan-chrome-profile',import.meta.url)),'--no-first-run','about:blank'],{windowsHide:true,stdio:'ignore'})
let ws,evaluate,backup
try{
  let pages
  for(let i=0;i<50;i++){try{pages=await(await fetch('http://127.0.0.1:9229/json')).json();break}catch{await new Promise(r=>setTimeout(r,200))}}
  ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl)
  await new Promise(r=>ws.addEventListener('open',r,{once:true}))
  let id=0;const pending=new Map(),errors=[],checks=[]
  ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(m.error);else p.resolve(m.result)}})
  const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}))})
  evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
  const pause=()=>new Promise(r=>setTimeout(r,950))
  const navigate=async path=>{await call('Page.navigate',{url:'http://127.0.0.1:5173'+path});await pause();for(let i=0;i<40;i++){if(await evaluate('document.querySelector(".loans-content")&&!document.querySelector(".loans-content > .api-state[role=status]")'))break;await new Promise(r=>setTimeout(r,250))}await evaluate('document.fonts.ready')}
  const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`)
  const text=()=>evaluate('document.querySelector("main")?.innerText||document.body.innerText')
  const input=async(selector,value)=>{await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.focus();el.select()})()`);await call('Input.insertText',{text:value})}
  const nativeInput=(selector,value)=>evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))})()`)
  const shot=async name=>{const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(new URL('./loans-v2-'+name+'.png',import.meta.url),Buffer.from(r.data,'base64'))}
  const assets=()=>evaluate(`([...document.querySelectorAll('img')].filter(i=>i.getClientRects().length).map(i=>({src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0,width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight})))`)
  await call('Page.enable');await call('Runtime.enable')
  await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false})
  await navigate('/loans');backup=await evaluate("Object.fromEntries(['loanrun.mock-api.v2','loanrun.design-v2-drafts'].map(k=>[k,localStorage.getItem(k)]))")
  await evaluate(`localStorage.setItem('loanrun.mock-api.v2',${JSON.stringify(JSON.stringify(seed))});localStorage.removeItem('loanrun.design-v2-drafts')`)
  await navigate('/loans/monthly?loan=2')
  assert.equal(await evaluate('document.querySelectorAll(".v2-schedule-row").length'),1,JSON.stringify({text:await text(),errors}))
  await shot('monthly');await click('.monthly-schedule-heading .lm-button')
  await pause();assert.equal(await evaluate('document.querySelector("dialog input[name=amount]").type'),'text')
  await shot('payment')
  await input('dialog input[name=amount]','150000');await pause()
  assert.ok(await evaluate("document.querySelector('dialog').innerText.includes('세부 금액의 합이 총 납부액과 같아야 해요')"))
  assert.equal(await evaluate('document.querySelector("dialog footer button:last-child").disabled'),true)
  await shot('payment-error')
  await input('dialog input[name=detail-principal]','120000');await input('dialog input[name=detail-interest]','30000')
  await click('dialog footer button:last-child');await pause();assert.equal(await evaluate('document.querySelector("dialog")'),null)
  assert.equal(await evaluate('document.querySelector(".v2-schedule-row").dataset.status'),'partial')
  await shot('partial')
  await navigate('/loans/monthly?loan=1');await click('.v2-payment-right .lm-text')
  await shot('payment-confirm');await click('dialog footer button:first-child');await pause()
  assert.equal(await evaluate('document.querySelector(".v2-schedule-row").dataset.status'),'unpaid')
  await navigate('/loans');await click('.owned-loans-section > header button');await shot('add-type')
  await click('dialog footer button:last-child');await pause();await shot('add-product')
  await click('dialog footer button:last-child');await shot('add-terms');await click('dialog [aria-label=닫기]')
  await click('.owned-loans-section > header button');await click('dialog footer button:last-child');await pause();await click('.manual-link');await shot('add-manual')
  for(const [name,value] of [['product','새 대출'],['original','10000000'],['balance','7000000'],['rate','5']])await input('dialog input[name='+name+']',value)
  await nativeInput('dialog input[name=maturity]','2030-10-25')
  await click('dialog footer button:last-child');await pause();assert.equal(await evaluate('document.querySelector("dialog")'),null)
  assert.equal(await evaluate('document.querySelectorAll(".owned-loan").length'),3)
  await navigate('/loans/plan?loan=1');await shot('plan');assert.ok(await evaluate('document.querySelectorAll("[data-chart-column]").length>0'))
  const planAssets=await assets();assert.ok(planAssets.every(a=>a.loaded&&Math.abs(a.width-a.naturalWidth)<1&&Math.abs(a.height-a.naturalHeight)<1),JSON.stringify(planAssets))
  await navigate('/loans/plan');assert.doesNotMatch(await text(),/NaN|undefined/)
  await navigate('/loans/plan/edit?loan=1');await pause();await shot('edit')
  await evaluate("(()=>{const el=document.querySelector('[aria-label=\"희망 완납 연도\"]');el.value='2033';el.dispatchEvent(new Event('change',{bubbles:true}))})()")
  await pause();assert.equal(await evaluate('document.querySelector(".plan-comparison footer button:last-child").disabled'),true);await shot('edit-invalid')
  await navigate('/loans/plan/edit?loan=1&preview=plan-warning');await pause();assert.ok(await evaluate('document.querySelector(".v2-plan-warning")!==null'));await shot('edit-warning')
  const routes=[['/loans/monthly?loan=1&preview=bullet','monthly-bullet'],['/loans/monthly?loan=1&preview=grace','monthly-grace'],['/loans/plan?loan=1&preview=grace','grace'],['/loans/plan?loan=1&preview=paid','complete'],['/loans/plan?loan=1&preview=bullet','bullet'],['/loans/plan?loan=1&preview=bullet-loss','bullet-loss'],['/loans/plan?loan=1&preview=bullet-fee-unknown','bullet-fee-unknown'],['/loans/plan?loan=1&preview=bullet-shortfall','bullet-shortfall']]
  for(const [path,name] of routes){await navigate(path);assert.doesNotMatch(await text(),/NaN|undefined|서버 응답을 읽을/);assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false,path);const found=await assets();assert.ok(found.every(a=>a.loaded&&Math.abs(a.width-a.naturalWidth)<1&&Math.abs(a.height-a.naturalHeight)<1),JSON.stringify(found));await shot(name);checks.push({path,assetCount:found.length})}
  await click('.v2-shortfall-link');await shot('shortfall-dialog');await click('dialog [aria-label=닫기]')
  const bulletId=await evaluate("(async()=>{const {services}=await import('/src/api/runtime.js');const base=await services.loan(1);const loan=await services.createLoan({...base,repayment_method:'BULLET',product_name:'적립 테스트',prepayment_policy:null,initial_savings_balance:200000,contractual_monthly_payment:30000});return loan.loan_id})()")
  await navigate('/loans/plan?loan='+bulletId)
  await click('.savings-page-actions button:last-child');await input('dialog input[name=savings-amount]','100000');await shot('savings-record');await click('dialog footer button:last-child');await pause()
  assert.ok(await evaluate("document.querySelector('.v2-savings-history').innerText.includes('100,000원')"))
  await navigate('/loans?preview=paid');await click('.owned-loan.is-complete .loan-delete-link');assert.match(await evaluate('document.querySelector("dialog").innerText'),/완납으로 보관/);await shot('archive');await click('dialog [aria-label=닫기]')
  for(const width of [1024,390]){await call('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:false});for(const path of ['/loans','/loans/monthly?loan=1','/loans/plan?loan=1','/loans/plan/edit?loan=1','/loans/plan?loan=1&preview=bullet']){await navigate(path);assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false,path+' overflow '+width)}await shot(String(width))}
  assert.deepEqual(errors,[])
  await writeFile(new URL('./loans-v2-checks.json',import.meta.url),JSON.stringify({checks,planAssets,runtimeErrors:errors,responsiveWidths:[1024,390]},null,2))
  console.log('PASS: revised loans screens, original assets and geometry, three-step/manual loan add, split payment validation and save, confirmation, plan warnings/errors, grace/complete/bullet variants, savings record, archive, responsive overflow, no runtime errors.')
}finally{
  if(evaluate&&backup)await evaluate(`(()=>{const values=${JSON.stringify(backup)};for(const [k,v] of Object.entries(values))if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)})()`).catch(()=>{})
  ws?.close();chrome.kill()
}
