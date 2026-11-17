import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--hide-scrollbars','--remote-debugging-port=9227','--user-data-dir='+fileURLToPath(new URL('./loan-chrome-profile',import.meta.url)),'--no-first-run','about:blank'],{windowsHide:true,stdio:'ignore'})
let ws
try {
  let pages
  for(let i=0;i<50;i++){try{pages=await(await fetch('http://127.0.0.1:9227/json')).json();break}catch{await new Promise(r=>setTimeout(r,200))}}
  ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl)
  await new Promise(r=>ws.addEventListener('open',r,{once:true}))
  let id=0;const pending=new Map(),errors=[]
  ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(m.error);else p.resolve(m.result)}})
  const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}))})
  const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
  const pause=()=>new Promise(r=>setTimeout(r,900))
  const navigate=async path=>{await call('Page.navigate',{url:'http://127.0.0.1:5173'+path});await pause()}
  const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`)
  const text=()=>evaluate('document.querySelector("main")?.innerText || document.body.innerText')
  await call('Page.enable');await call('Runtime.enable')
  await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1200,deviceScaleFactor:1,mobile:false})
  await navigate('/');await evaluate("localStorage.removeItem('loanrun.mock-api.v2')");await navigate('/')
  const initial=await text();if(!initial.includes('6,000,000원'))console.log(JSON.stringify({initial,errors}));assert.match(initial,/6,000,000원/)
  await navigate('/loans/monthly');await click('.monthly-schedule-heading button')
  assert.equal(await evaluate("document.querySelector('input[name=amount]').type"),'text')
  await click('dialog .edit-tabs button:last-child')
  await evaluate("document.querySelector('input[name=amount]').focus();document.querySelector('input[name=amount]').select()")
  await call('Input.insertText',{text:'100000'})
  await click('dialog footer button:last-child');await pause()
  assert.equal(await evaluate('document.querySelector("dialog")'),null)
  await navigate('/');assert.match(await text(),/5,900,000원/)
  await navigate('/loans/segments');assert.match(await text(),/100,000원/)
  assert.ok(await evaluate('document.querySelectorAll("svg rect").length>0'))
  await navigate('/loans/plan/edit?loan=1');await pause()
  await click('.plan-comparison footer button:last-child');await pause()
  assert.equal(await evaluate('location.pathname'),'/loans/plan')
  await navigate('/settings/profile');await click('.settings-row button')
  await evaluate("document.querySelector('.settings-edit input').focus();document.querySelector('.settings-edit input').select()")
  await call('Input.insertText',{text:'API User'})
  await click('.settings-edit button');await pause()
  await navigate('/');assert.match(await text(),/API User/)
  await navigate('/settings/notifications');const before=await evaluate("document.querySelector('[role=switch]').getAttribute('aria-checked')")
  await click('[role=switch]');await pause();await navigate('/settings/notifications')
  assert.notEqual(await evaluate("document.querySelector('[role=switch]').getAttribute('aria-checked')"),before)
  await navigate('/loans');await click('.owned-loans-section > header button')
  await click('dialog footer button:last-child');await pause()
  assert.ok(await evaluate("document.querySelector('dialog').innerText.includes('예시 신용대출')"))
  await click('dialog footer button:last-child')
  for(const [name,value] of [['original','10000000'],['balance','7000000'],['rate','5'],['maturity','2028-10-25'],['payment','250000']]){
    await evaluate(`(()=>{const el=document.querySelector('dialog input[name=${name}]');const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}))})()`)
  }
  await click('dialog footer button:last-child');await pause()
  assert.equal(await evaluate('document.querySelector("dialog")'),null)
  assert.equal(await evaluate('document.querySelectorAll(".owned-loan").length'),2)
  const routes=['/','/loans','/loans/monthly','/loans/segments','/loans/plan','/loans/history','/loans/plan/edit?loan=1','/settings/profile','/settings/income','/settings/plan','/settings/notifications','/settings/account']
  for(const path of routes){await navigate(path);assert.doesNotMatch(await text(),/NaN|undefined|서버 응답을 읽을|다시 시도/);assert.ok(await evaluate('[...document.images].every(i=>i.complete&&i.naturalWidth>0)'),path+' assets')}
  const screenshot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(new URL('./api-settings.png',import.meta.url),Buffer.from(screenshot.data,'base64'))
  for(const width of [1024,390]){await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});for(const path of ['/','/loans','/loans/monthly','/loans/plan','/settings/profile']){await navigate(path);assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false,path+' overflow '+width)}}
  assert.deepEqual(errors,[])
  await evaluate("localStorage.removeItem('loanrun.mock-api.v2')")
  console.log('PASS: JSX loads API data; payment updates home and graph; plan save; profile and notification persistence; 12 routes; assets; responsive overflow; no runtime errors.')
}finally{ws?.close();chrome.kill()}
