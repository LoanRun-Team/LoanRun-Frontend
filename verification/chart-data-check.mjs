import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
const server=await createServer({server:{middlewareMode:true},appType:'custom'})
try {
  const {default:Chart}=await server.ssrLoadModule('/src/components/Charts/StackedBarChart.jsx')
  const {default:Ring}=await server.ssrLoadModule('/src/components/Charts/ProgressRing.jsx')
  const {default:Plan}=await server.ssrLoadModule('/src/pages/Loans/components/RepaymentPlan.jsx')
  const {mockLoanViewData}=await server.ssrLoadModule('/src/pages/Loans/mockViewData.js')
  const {initialLoans}=await server.ssrLoadModule('/src/pages/Loans/data.js')
  const a=renderToStaticMarkup(createElement(Chart,{rows:[{label:'A',principal:25,plan:30}],maxValue:100,cumulative:true}))
  const b=renderToStaticMarkup(createElement(Chart,{rows:[{label:'A',principal:75,plan:80},{label:'B',principal:5,plan:5}],maxValue:100,cumulative:true}))
  assert.notEqual(a.match(/<polyline[^>]*points="([^"]+)/)?.[1],b.match(/<polyline[^>]*points="([^"]+)/)?.[1])
  assert.match(a,/height="40"/)
  assert.match(b,/height="120"/)
  assert.match(renderToStaticMarkup(createElement(Ring,{percent:25})),/stroke-dasharray="25 75"/)
  assert.match(renderToStaticMarkup(createElement(Ring,{percent:75})),/stroke-dasharray="75 25"/)
  const plan=renderToStaticMarkup(createElement(Plan,{loans:initialLoans,filter:'mortgage',savedPlan:{},navigate:()=>{},data:{...mockLoanViewData.plans.mortgage,paymentDifference:250000},progressByLoan:{mortgage:{actualPercent:70,plannedPercent:45,principalDifference:200000,goalDate:'2044.12'}}}))
  assert.match(plan,/left:70%/)
  assert.match(plan,/left:45%/)
  assert.match(plan,/plan-difference-chip ahead/)
  assert.match(plan,/250,000/)
  assert.ok(plan.includes('20만 원'),'principal gap reflects API value')
  console.log('PASS: API prop changes update rendered bars, line, ring, runner positions, difference message and badge tone.')
}finally{await server.close()}
