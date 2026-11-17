import { spawn } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--remote-debugging-port=9226','--user-data-dir='+process.cwd()+'/verification/settings-chrome-profile','--no-first-run','about:blank'],{windowsHide:true,stdio:'ignore'})
let ws,evaluate,backup
try {
 let pages
 for(let i=0;i<50;i++){try{pages=await(await fetch('http://127.0.0.1:9226/json')).json();break}catch{await new Promise(r=>setTimeout(r,200))}}
 ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl)
 await new Promise(r=>ws.addEventListener('open',r,{once:true}))
 let id=0;const pending=new Map(),errors=[],results=[]
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(m.error);else p.resolve(m.result)}})
 const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}))})
 evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
 const wait=ms=>new Promise(r=>setTimeout(r,ms))
 const ready=async()=>{for(let i=0;i<60;i++){if(await evaluate('!!document.querySelector(".settings-section")')){await evaluate('document.fonts.ready');return}await wait(200)}throw Error(await evaluate('document.body.innerText'))}
 const nav=async tab=>{await call('Page.navigate',{url:'http://127.0.0.1:5173/settings/'+tab});await wait(250);await ready()}
 const click=selector=>evaluate('document.querySelector('+JSON.stringify(selector)+').click()')
 const input=async(selector,value)=>{await evaluate('(()=>{const el=document.querySelector('+JSON.stringify(selector)+');el.focus();el.select()})()');await call('Input.insertText',{text:value})}
 const shot=async name=>{const r=await call('Page.captureScreenshot',{format:'png'});await writeFile('verification/settings-'+name+'.png',Buffer.from(r.data,'base64'))}
 await call('Page.enable');await call('Runtime.enable');await call('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
 await nav('profile');backup=await evaluate("localStorage.getItem('loanrun.mock-api.v2')")
 for(const [tab,labels,y] of [['profile',['이름','직업','소득 유형'],120],['income',['월 실수령액','수령일','불규칙 소득','월 목표 상환액'],112],['plan',['현재 요금제','PRO 요금제'],112],['notifications',['납부 예정일','위험 신호','상환 리포트 업데이트 알림'],112],['account',['지출 입력','데이터 내보내기','로그아웃','회원 탈퇴'],112]]){
  await nav(tab)
  assert.deepEqual(await evaluate('[...document.querySelectorAll(".settings-label")].map(el=>el.textContent)'),labels)
  const geometry=await evaluate('(()=>{const r=document.querySelector(".settings-section").getBoundingClientRect();return {x:r.x,y:r.y,width:r.width}})()')
  assert.deepEqual(geometry,{x:528,y,width:640})
  const assets=await evaluate('[...document.images].map(i=>({src:i.getAttribute("src"),loaded:i.complete&&i.naturalWidth>0,width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight}))')
  assert.ok(assets.every(a=>a.loaded&&Math.abs(a.width-a.naturalWidth)<1&&Math.abs(a.height-a.naturalHeight)<1),JSON.stringify(assets))
  assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false)
  await shot(tab);results.push({tab,...geometry,labels,assets})
 }
 await nav('profile');await click('.settings-row .settings-button');await input('.settings-edit input','디자인 확인');await click('.settings-edit button');await wait(600);await ready();assert.equal(await evaluate('document.querySelector(".settings-value").textContent'),'디자인 확인')
 await nav('income');const before=await evaluate('document.querySelector("[role=switch]").getAttribute("aria-checked")');await click('[role=switch]');await wait(650);await ready();assert.notEqual(await evaluate('document.querySelector("[role=switch]").getAttribute("aria-checked")'),before)
 await nav('notifications');assert.equal(await evaluate('document.querySelectorAll("[role=switch]")[1].disabled'),true)
 const checked=await evaluate('document.querySelector("[role=switch]").getAttribute("aria-checked")');await click('[role=switch]');await wait(650);await ready();assert.notEqual(await evaluate('document.querySelector("[role=switch]").getAttribute("aria-checked")'),checked)
 await nav('plan');await click('.settings-button.primary');await wait(100);assert.equal(await evaluate('document.querySelector(".pro-dialog").open'),true);await shot('pro');await click('.pro-later')
 await nav('account');await click('.settings-row .settings-button');await wait(100);assert.equal(await evaluate('document.querySelector(".settings-expenses-dialog").open'),true)
 await input('.settings-expenses-dialog input','810000');await click('.settings-expenses-dialog footer button:last-child');await wait(650);await ready();assert.equal(await evaluate('document.querySelector(".settings-expenses-dialog")'),null)
 assert.equal(await evaluate("JSON.parse(localStorage.getItem('loanrun.mock-api.v2')).data.finance.fixed_essential_expenses"),810000)
 for(const width of [1024,390]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false})
  for(const tab of ['profile','income','plan','notifications','account']){await nav(tab);assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false,tab+' overflow '+width)}
  await shot(String(width))
 }
 assert.deepEqual(errors,[])
 await writeFile('verification/settings-checks.json',JSON.stringify({results,runtimeErrors:errors,profileSave:true,incomeToggle:true,notificationToggle:true,expensesSave:true,responsiveWidths:[1024,390]},null,2))
 console.log('PASS: five Figma settings tabs, exact row lists and desktop positions, original asset geometry, profile/finance/notification saves, PRO modal, expense editor, responsive overflow and no runtime errors.')
}finally{
 if(evaluate&&backup!==undefined)await evaluate(backup===null?"localStorage.removeItem('loanrun.mock-api.v2')":"localStorage.setItem('loanrun.mock-api.v2',"+JSON.stringify(backup)+")").catch(()=>{})
 ws?.close();chrome.kill()
}
