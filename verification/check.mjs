import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
const out = fileURLToPath(new URL('./', import.meta.url))
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--remote-debugging-port=9223', '--user-data-dir=' + out + 'chrome-profile', '--no-first-run', 'about:blank'], { windowsHide: true, stdio: 'ignore' })
let ws
try {
  let pages
  for (let i = 0; i < 50; i++) { try { pages = await (await fetch('http://127.0.0.1:9223/json')).json(); break } catch { await new Promise(r => setTimeout(r, 200)) } }
  ws = new WebSocket(pages.find(p => p.type === 'page').webSocketDebuggerUrl)
  await new Promise(r => ws.addEventListener('open', r, { once: true }))
  let id = 0
  const pending = new Map()
  ws.addEventListener('message', e => { const m = JSON.parse(e.data); if(m.id) { const p = pending.get(m.id); pending.delete(m.id); if (m.error) p.reject(m.error); else p.resolve(m.result) } })
  const call = (method, params = {}) => new Promise((resolve, reject) => { const n = ++id; pending.set(n, {resolve,reject}); ws.send(JSON.stringify({id:n, method, params})) })
  const evaluate = async expression => (await call('Runtime.evaluate', {expression, awaitPromise: true, returnByValue: true})).result.value
  await call('Page.enable')
  const checks = []
  for (const screen of ['pro', 'free', 'seven-loans', 'rate-change']) {
    await call('Emulation.setDeviceMetricsOverride', {width:1440,height:({pro:1035,free:1047,'seven-loans':1163,'rate-change':1123})[screen],deviceScaleFactor:1,mobile:false})
    await call('Page.navigate', {url:'http://127.0.0.1:5173/?screen=' + screen})
    await new Promise(r => setTimeout(r, 1000))
    await evaluate('document.fonts.ready')
    const result = await evaluate(`(() => { const rect = s => { const r=document.querySelector(s).getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height} }; return {screen:'${screen}',sidebar:rect('.sidebar'),loans:rect('.loan-overview'),repayment:rect('.repayment-card'),risk:rect('.risk-card'),report:rect('.report-banner'),rows:document.querySelectorAll('.loan-row').length,assets:[...document.images].map(i=>({slot:i.className || i.closest('[class]')?.className,loaded:i.complete&&i.naturalWidth>0,width:i.width,height:i.height})),overflow:document.documentElement.scrollWidth>innerWidth,font:document.fonts.check('16px Pretendard')} })()`)
    if (screen === 'rate-change') { await evaluate("document.querySelector('[aria-label=\"금리 변경 안내 닫기\"]').click()"); result.dismissed = await evaluate("!document.querySelector('.rate-banner')"); await call('Page.reload'); await new Promise(r => setTimeout(r, 500)) }
    if (screen === 'free') { await evaluate("document.querySelector('.primary-button').click()"); result.upgrade = await evaluate("document.querySelector('dialog')?.textContent.includes('PRO 시작하기')"); await evaluate("document.querySelector('dialog button').click()") }
    const shot = await call('Page.captureScreenshot', {format:'png',captureBeyondViewport:true})
    await writeFile(new URL(screen+'.png', import.meta.url), Buffer.from(shot.data,'base64'))
    checks.push(result)
  }
  for(const width of [1024,390]) {
    await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false})
    await call('Page.navigate',{url:'http://127.0.0.1:5173/?screen=seven-loans'})
    await new Promise(r=>setTimeout(r,500))
    checks.push({width,overflow:await evaluate('document.documentElement.scrollWidth>innerWidth')})
  }
  if (checks.some(c => c.overflow || c.assets?.some(a => !a.loaded)) || !checks.find(c => c.screen === 'free').upgrade || !checks.find(c => c.screen === 'rate-change').dismissed) throw new Error('Browser verification failed')
  await writeFile(new URL('checks.json',import.meta.url),JSON.stringify(checks,null,2))
  console.log(JSON.stringify(checks.map(({assets,...rest})=>({...rest,assetCount:assets?.length,assetsLoaded:assets?.every(a=>a.loaded)}))))
} finally { ws?.close(); chrome.kill() }

