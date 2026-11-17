import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import fixtures from '../src/api/mock/specFixtures.js'
const example=key=>structuredClone(fixtures[key].data)
const ssr=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'})
const {default:PaymentRow}=await ssr.ssrLoadModule('/src/pages/Home/components/PaymentRow.jsx')
const {default:ReportEntry}=await ssr.ssrLoadModule('/src/pages/Home/components/ReportEntry.jsx')
const now=Date.parse('2026-11-17T10:00:00+09:00')
const fresh=renderToStaticMarkup(createElement(ReportEntry,{report:{is_new:true,updated_at:'2026-11-17T09:00:00+09:00'},now}))
const old=renderToStaticMarkup(createElement(ReportEntry,{report:{is_new:true,updated_at:'2026-11-15T09:00:00+09:00'},now}))
assert.match(fresh,/새 리포트/);assert.doesNotMatch(old,/새 리포트/)
const due=example('GET /api/dashboard/').monthly_checklist[0]
const cases=[{...due,due_date:'2026-11-25'},{...due,status:'PAID',paid_required_amount:280000,paid_extra_amount:50000},{...due,status:'PARTIAL',paid_required_amount:100000,outstanding_amount:180000},{...due,due_date:'2026-11-15'},{...due,due_date:'2026-11-15',status:'UNPAID'}]
const rows=cases.map((item,i)=>renderToStaticMarkup(createElement(PaymentRow,{item,today:'2026-11-17',confirmedUnpaid:i===4,onRecord:()=>{}}))).join('')
for(const name of ['납부 예정','납부 완료','부분 납부','납부 미기록','미납'])assert.ok(rows.includes(name))
assert.match(rows,/남은 180,000원/)
const base=example('GET /api/loans/{loan_id}/')
function seed(plan='PRO',count=2){
  const loans=[{...structuredClone(base),loan_id:1,product_name:'신용대출',original_principal:20000000,remaining_principal:16000000,paid_principal:4000000,progress_percent:20,contractual_monthly_payment:199954,estimated_monthly_payment:199954,payment_day:15},{...structuredClone(base),loan_id:2,product_name:'주택담보대출',loan_type:'MORTGAGE',original_principal:148400000,remaining_principal:121688000,paid_principal:26712000,progress_percent:18,contractual_monthly_payment:699179,estimated_monthly_payment:699179,payment_day:25}]
  while(loans.length<count){const id=loans.length+1;loans.push({...structuredClone(base),loan_id:id,product_name:['학자금대출','자동차대출','전세자금대출','대환대출','생활비대출'][id-3],loan_type:id===3?'STUDENT':id===4?'AUTO':id===5?'JEONSE':'CREDIT',remaining_principal:6000000,paid_principal:3000000,progress_percent:33.33})}
  const plans=loans.map((l,i)=>({...structuredClone(base.plan),loan_id:l.loan_id,extra_monthly_payment:i===1?0:100000,track:{status:i===1?'BEHIND':i===3?'AHEAD':'ON_TRACK',data_status:'SUFFICIENT'}}))
  return {version:2,data:{profile:{...example('GET /api/users/me/'),plan_type:plan},finance:example('GET /api/budgets/profile/'),notifications:example('GET /api/settings/notifications/'),loans,plans,payments:[{payment_id:51,loan_id:1,paid_at:'2026-11-15',amount:249954,payment_type:'REGULAR',due_item_id:21,principal_amount:169954,interest_amount:30000,extra_amount:50000,created_at:'2026-11-15T10:00:00+09:00'}]}}
}
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--hide-scrollbars','--remote-debugging-port=9228','--user-data-dir='+fileURLToPath(new URL('./loan-chrome-profile',import.meta.url)),'--no-first-run','about:blank'],{windowsHide:true,stdio:'ignore'})
let ws,backup,evaluate
try{
  let pages
  for(let i=0;i<50;i++){try{pages=await(await fetch('http://127.0.0.1:9228/json')).json();break}catch{await new Promise(r=>setTimeout(r,200))}}
  ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl)
  await new Promise(r=>ws.addEventListener('open',r,{once:true}))
  let id=0;const pending=new Map(),errors=[]
  ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(m.error);else p.resolve(m.result)}})
  const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}))})
  evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
  const pause=()=>new Promise(r=>setTimeout(r,1000))
  const navigate=async()=>{await call('Page.navigate',{url:'http://127.0.0.1:5173/'});await pause();await evaluate('document.fonts.ready')}
  const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`)
  const screenshot=async name=>{const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(new URL('./home-v2-'+name+'.png',import.meta.url),Buffer.from(r.data,'base64'))}
  await call('Page.enable');await call('Runtime.enable')
  await call('Emulation.setDeviceMetricsOverride',{width:1440,height:997,deviceScaleFactor:1,mobile:false})
  await navigate();backup=await evaluate("localStorage.getItem('loanrun.mock-api.v2')")
  await evaluate(`localStorage.setItem('loanrun.mock-api.v2',${JSON.stringify(JSON.stringify(seed()))})`);await navigate()
  assert.ok(await evaluate("document.querySelector('.metric-label').textContent.includes('처음 빌린 금액 기준')"))
  assert.equal(await evaluate("document.querySelectorAll('.home-payment-row').length"),2)
  assert.equal(await evaluate("document.querySelector('.home-payment-row').dataset.status"),'paid')
  assert.equal(await evaluate("document.querySelector('.home-payment-row .unachieved').textContent"),'미달성')
  const rects=await evaluate(`(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};return {loans:rect('.loan-overview'),monthly:rect('.repayment-card'),risk:rect('.risk-card'),report:rect('.report-entry')}})()`)
  assert.equal(rects.loans.x,296);assert.equal(rects.loans.y,94);assert.equal(rects.monthly.y,411);assert.equal(rects.report.y,819)
  await screenshot('pro')
  await click('.home-payment-actions .outline-button')
  assert.ok(await evaluate('document.querySelector("dialog").open'))
  assert.equal(await evaluate('document.querySelector("dialog input[name=amount]").type'),'text')
  await evaluate("document.querySelector('dialog input[name=amount]').focus();document.querySelector('dialog input[name=amount]').select()")
  await call('Input.insertText',{text:'100000'});await click('dialog footer button:last-child');await pause()
  assert.equal(await evaluate('document.querySelector("dialog")'),null)
  assert.equal(await evaluate("document.querySelectorAll('.home-payment-row[data-status=partial]').length"),1)
  const assets=await evaluate(`([...document.querySelectorAll('img')].filter(i=>i.getClientRects().length).map(i=>({src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0,width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight})))`)
  assert.ok(assets.every(i=>i.loaded&&Math.abs(i.width-i.naturalWidth)<1&&Math.abs(i.height-i.naturalHeight)<1),JSON.stringify(assets))
  await evaluate(`document.querySelector('.home-payment-checklist').innerHTML=${JSON.stringify(rows)}`);await pause();await screenshot('statuses')
  await evaluate(`localStorage.setItem('loanrun.mock-api.v2',${JSON.stringify(JSON.stringify(seed('FREE')))})`);await navigate()
  assert.ok(await evaluate("document.querySelector('.risk-locked')!==null"));assert.equal(await evaluate("document.querySelector('.repayment-card').getBoundingClientRect().height"),396)
  await screenshot('free')
  await evaluate(`localStorage.setItem('loanrun.mock-api.v2',${JSON.stringify(JSON.stringify(seed('PRO',7)))})`);await navigate()
  assert.equal(await evaluate('document.querySelectorAll(".loan-row").length'),4)
  assert.ok(await evaluate("document.querySelector('.extra-loans').textContent.includes('외 3건')"))
  await screenshot('seven')
  for(const width of [1024,390]){await call('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:false});await navigate();assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false,'overflow '+width);await screenshot(String(width))}
  assert.deepEqual(errors,[])
  await writeFile(new URL('./home-v2-checks.json',import.meta.url),JSON.stringify({rects,assets,checkedStates:5,responsiveWidths:[1024,390],runtimeErrors:errors},null,2))
  console.log('PASS: home Figma layout, five statuses, independent extra goal, payment modal and save, Free lock, seven-loan truncation, original SVG geometry, N badge expiry, responsive overflow, no runtime exceptions.')
}finally{
  if(evaluate&&backup!==undefined)await evaluate(backup===null?"localStorage.removeItem('loanrun.mock-api.v2')":`localStorage.setItem('loanrun.mock-api.v2',${JSON.stringify(backup)})`).catch(()=>{})
  ws?.close();chrome.kill();await ssr.close()
}
