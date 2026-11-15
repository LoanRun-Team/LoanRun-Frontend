import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const profile = fileURLToPath(new URL('./loan-chrome-profile',import.meta.url))
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--hide-scrollbars','--remote-debugging-port=9225','--user-data-dir='+profile,'--no-first-run','about:blank'],{windowsHide:true,stdio:'ignore'})
let ws
try{
  let pages
  for(let i=0;i<50;i++){try{pages=await(await fetch('http://127.0.0.1:9225/json')).json();break}catch{await new Promise(r=>setTimeout(r,200))}}
  ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl)
  await new Promise(r=>ws.addEventListener('open',r,{once:true}))
  let id=0;const pending=new Map();const errors=[]
  ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(m.error);else p.resolve(m.result)}})
  const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}))})
  const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
  const click=async selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`)
  const pause=()=>new Promise(r=>setTimeout(r,500))
  const navigate=async path=>{await call('Page.navigate',{url:'http://127.0.0.1:5173'+path});await pause();await evaluate('document.fonts.ready')}
  await call('Page.enable');await call('Runtime.enable')
  await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1600,deviceScaleFactor:1,mobile:false})
  await navigate('/');await evaluate("localStorage.removeItem('loanrun-loans-v1')")
  await click('a[href="/loans"]');await pause()
  assert.equal(await evaluate('location.pathname'),'/loans')
  assert.equal(await evaluate("document.querySelectorAll('.sidebar-subitem').length"),4)
  const checks=[]
  for(const [path,name,height] of [['/loans','overview',1542],['/loans/monthly','monthly',829],['/loans/segments','segments',1206],['/loans/plan','plan',1586],['/loans/history','history',1205],['/loans/plan/edit','edit',997]]){
    await call('Emulation.setDeviceMetricsOverride',{width:1440,height,deviceScaleFactor:1,mobile:false})
    await navigate(path)
    const result=await evaluate(`(()=>{const rect=s=>{const r=document.querySelector(s)?.getBoundingClientRect();return r?{x:r.x,y:r.y,width:r.width,height:r.height}:null};return {page:'${name}',overflow:document.documentElement.scrollWidth>innerWidth,title:document.querySelector('h1').textContent,sidebar:rect('.sidebar'),card:rect('.lm-card'),cards:[...document.querySelectorAll('.lm-card')].map(n=>({class:n.className,y:n.getBoundingClientRect().y,height:n.getBoundingClientRect().height})),assets:[...document.images].map(i=>({slot:i.className||i.closest('[class]')?.className,loaded:i.complete&&i.naturalWidth>0,width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height}))}})()`)
    assert.equal(result.overflow,false,path+' overflow');assert.ok(result.assets.every(a=>a.loaded),path+' images')
    if(name==='plan'){const style=await evaluate("(()=>{const badge=document.querySelector('.plan-difference-chip');return {weight:getComputedStyle(document.querySelector('.actual-payment-row td')).fontWeight,color:getComputedStyle(badge).color,background:getComputedStyle(badge).backgroundColor,gap:document.querySelector('.goal-principal-message').textContent,points:document.querySelector('[data-chart-plan]').getAttribute('points')}})()");assert.equal(style.weight,'500');assert.equal(style.color,'rgb(154, 91, 0)');assert.equal(style.background,'rgb(255, 255, 255)');assert.ok(style.gap.includes('465'));assert.ok(style.points)}
    if(name==='edit')assert.ok(await evaluate("document.querySelector('.comparison-current small').textContent.includes('400,667') && document.querySelector('.comparison-current small').textContent.includes('312,333')"))
    if(name==='monthly')assert.ok(await evaluate("document.querySelector('.monthly-schedule-heading .lm-button').textContent === '납부 기록하기' && !document.querySelector('.schedule-card > .lm-button')"))
    const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true})
    await writeFile(new URL('loans-'+name+'.png',import.meta.url),Buffer.from(shot.data,'base64'))
    checks.push(result)
  }
  await navigate('/loans/segments')
  await click('.segment-table tbody .lm-icon-button')
  assert.equal(await evaluate("document.querySelectorAll('.segment-detail').length"),1)
  await click('.loan-filter button:nth-child(2)')
  assert.equal(await evaluate("new URLSearchParams(location.search).get('loan')"),'credit')
  await navigate('/loans/monthly')
  await click('[aria-label="11월 25일"]')
  assert.ok(await evaluate("document.querySelector('.day-details').textContent.includes('주택담보대출')"))
  await click('.monthly-schedule-heading .lm-button');assert.ok(await evaluate("document.querySelector('dialog').open"))
  await evaluate("document.querySelector('dialog input[name=amount]').focus();document.querySelector('dialog input[name=amount]').select()"); await call('Input.insertText',{text:'123456'})
  await click('dialog button[type=submit], dialog footer button:last-child')
  assert.equal(await evaluate("document.querySelector('dialog')===null"),true)
  assert.equal(await evaluate("JSON.parse(localStorage.getItem('loanrun-loans-v1')).records[0].amount"),123456)
  await navigate('/loans/plan/edit')
  await click('.plan-comparison footer button:last-child');await pause()
  assert.equal(await evaluate('location.pathname'),'/loans/plan')
  assert.ok(await evaluate("JSON.parse(localStorage.getItem('loanrun-loans-v1')).plans.mortgage"))
  await navigate('/loans')
  await click('.owned-loans-section > header .lm-button')
  const addShot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(new URL('loans-add-dialog.png',import.meta.url),Buffer.from(addShot.data,'base64'))
  assert.ok(await evaluate("[...document.querySelectorAll('dialog img')].every(i=>i.complete&&i.naturalWidth>0)"))
  await click('dialog footer button:last-child');await click('dialog footer button:last-child');await click('dialog button[type=submit]')
  assert.ok(await evaluate("JSON.parse(localStorage.getItem('loanrun-loans-v1')).loans.length===3"))
  await navigate('/loans');assert.equal(await evaluate("document.querySelectorAll('.owned-loan').length"),3)
  await evaluate("localStorage.removeItem('loanrun-loans-v1')")
  for(const width of [1024,390]){
    await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false})
    for(const path of ['/loans','/loans/monthly','/loans/segments','/loans/plan','/loans/history','/loans/plan/edit']){
      await navigate(path)
      assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false,path+' mobile '+width)
    }
    checks.push({width,overflow:false})
  }
  assert.deepEqual(errors,[])
  await writeFile(new URL('loans-checks.json',import.meta.url),JSON.stringify(checks,null,2))
  console.log(JSON.stringify(checks.map(({assets,...rest})=>({...rest,assetCount:assets?.length,assetsLoaded:assets?.every(a=>a.loaded)}))))
  console.log('PASS: home navigation, submenus, filters, calendar, record save, plan save, loan add, reload persistence, mobile overflow, no runtime exceptions.')
}finally{ws?.close();chrome.kill()}

