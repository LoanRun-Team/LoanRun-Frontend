import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar/Sidebar.jsx'
import Overview from './components/Overview.jsx'
import LoanFilter from './components/LoanFilter.jsx'
import MonthlyPayments from './components/MonthlyPayments.jsx'
import SegmentRecords from './components/SegmentRecords.jsx'
import RepaymentPlan from './components/RepaymentPlan.jsx'
import PlanEditor from './components/PlanEditor.jsx'
import PaymentHistory from './components/PaymentHistory.jsx'
import AddLoanDialog from './components/AddLoanDialog.jsx'
import RecordPaymentDialog from './components/RecordPaymentDialog.jsx'
import LoanDialog from './components/LoanDialog.jsx'
import { initialLoans, initialHistory, loanTabs, footnote } from './data.js'
import { mockLoanViewData } from './mockViewData.js'
import { icons } from './icons.js'
import './Loans.scss'

const storageKey='loanrun-loans-v1'
function readSaved() {try {const value=JSON.parse(localStorage.getItem(storageKey));return value&&Array.isArray(value.loans)&&Array.isArray(value.records)?value:null}catch{return null}}
export default function Loans({ location, navigate, apiData = mockLoanViewData }) {
  const [saved,setSaved]=useState(()=>readSaved()||{loans:initialLoans,records:[],plans:{}})
  const loans = apiData.loans ?? saved.loans
  const records = apiData.records ?? saved.records
  const [dialog,setDialog]=useState(null)
  const [notice,setNotice]=useState('')
  const path=location.split('?')[0]
  const page=path.includes('/plan/edit')?'edit':path.split('/')[2]||'overview'
  const validPage=['overview','monthly','segments','plan','history','edit'].includes(page)?page:'overview'
  const selected=new URLSearchParams(location.split('?')[1]).get('loan')||(validPage==='plan'||validPage==='edit'?'mortgage':'all')
  const filter=['all',...loans.map(l=>l.id)].includes(selected)?selected:'all'
  const history=apiData.history ?? [...records.map(row=>{
    const loan=loans.find(l=>l.id===row.loanId)
    const interest=row.type==='extra'?0:Math.min(row.amount,loan?.interestPayment||0)
    const principal=row.amount-interest
    return {...row,date:row.date.replaceAll('-','.'),principal,interest,balance:Math.max(0,(loan?.balance||0)-principal)}
  }),...initialHistory]
  useEffect(()=>{try{localStorage.setItem(storageKey,JSON.stringify(saved))}catch{/* The current session remains usable if browser storage is full. */}},[saved])
  useEffect(()=>{document.title='론런 | '+(loanTabs.find(t=>t.id===validPage)?.label||(validPage==='history'?'상환 내역':'계획 수정'))},[validPage])
  function onFilter(id) {navigate(path+'?loan='+id)}
  function onNavigate(item) {if(item.id==='home'||item.id==='loans'||item.id==='budget'||item.parent==='loans')navigate(item.href);else setDialog({type:'unavailable',title:item.label})}
  function addLoan(form) {
    const percent=Math.round((1-form.balance/form.original)*100)
    const loan={...form,id:'loan-'+crypto.randomUUID(),custom:true,product:form.bank+' · '+form.product,percent,interest:'입력 조건 기준 예시',principalPayment:Math.max(0,Math.round(form.payment-form.balance*form.rate/1200)),interestPayment:Math.round(form.balance*form.rate/1200),day:Number(form.day),finish:form.maturity.slice(0,4)+'년 '+Number(form.maturity.slice(5,7))+'월'}
    setSaved(prev=>({...prev,loans:[...prev.loans,loan]}));setDialog(null);setNotice('대출을 추가했어요')
  }
  const title=loanTabs.find(t=>t.id===validPage)?.label||(validPage==='history'?'상환 내역':'계획 수정')
  return <div className="loans-shell" data-page={validPage}><Sidebar active="loans" activeSub={validPage==='history'?'overview':validPage==='edit'?'plan':validPage} onNavigate={onNavigate}/>
    <main className="loans-content" id="main-content">
      {(validPage==='history'||validPage==='edit')&&<button className="lm-text back-link" onClick={()=>navigate(validPage==='history'?'/loans':'/loans/plan?loan='+filter)}><img src={validPage==='history'?icons.backLoans:icons.backPlan} alt=""/>{validPage==='history'?'내 대출':'상환 계획'}</button>}
      <header className="loans-page-header"><h1>{title}</h1>{['segments','plan','history','edit'].includes(validPage)&&<LoanFilter loans={loans.filter(l=>!l.custom)} value={filter} onChange={onFilter}/>}</header>
      {validPage==='overview'&&<Overview loans={loans} history={history} navigate={navigate} onAdd={()=>setDialog({type:'add'})} onRate={loan=>setDialog({type:'rate',loan})}/>}
      {validPage==='monthly'&&<MonthlyPayments loans={loans} filter={filter} onFilter={onFilter} records={records} summary={apiData.monthlySummary} onRecord={initial=>setDialog({type:'record',initial})}/>}
      {validPage==='segments'&&<SegmentRecords data={apiData.segments?.[filter] || mockLoanViewData.segments.all}/>}
      {validPage==='history'&&<PaymentHistory loans={loans} history={history} filter={filter}/>}
      {validPage==='plan'&&<RepaymentPlan loans={loans} filter={filter} savedPlan={saved.plans||{}} navigate={navigate} data={apiData.plans?.[filter] || mockLoanViewData.plans.mortgage} progressByLoan={apiData.progress || mockLoanViewData.progress}/>}
      {validPage==='edit'&&<PlanEditor key={filter} filter={filter} comparison={apiData.comparisons?.[filter] || mockLoanViewData.comparisons.mortgage} onCancel={()=>navigate('/loans/plan?loan='+filter)} onSave={plan=>{setSaved(prev=>({...prev,plans:{...prev.plans,[filter]:plan}}));navigate('/loans/plan?loan='+filter);setNotice('상환 계획을 변경했어요')}}/>}
      <p className="loans-footnote">{footnote}</p>
    </main>
    {notice&&<div className="loans-toast" role="status">{notice}<button className="lm-icon-button" aria-label="알림 닫기" onClick={()=>setNotice('')}><img src={icons.close} alt=""/></button></div>}
    {dialog?.type==='add'&&<AddLoanDialog onClose={()=>setDialog(null)} onAdd={addLoan}/>}
    {dialog?.type==='record'&&<RecordPaymentDialog loans={loans} initial={dialog.initial} onClose={()=>setDialog(null)} onSave={row=>{setSaved(prev=>({...prev,records:[{...row,id:crypto.randomUUID()},...prev.records]}));setDialog(null);setNotice('납부 기록을 저장했어요')}}/>}
    {dialog?.type==='rate'&&<LoanDialog title="금리 변경 기록" onClose={()=>setDialog(null)}><p className="lm-caption">대출</p><span className="lm-chip">{dialog.loan.name} · {dialog.loan.bank}</span><table className="lm-table"><thead><tr><th>적용일</th><th>이전 → 이후</th><th>월 납부 변화</th></tr></thead><tbody><tr><td>2026.10</td><td>3.20% → 3.08%</td><td>월 약 −14,800원</td></tr></tbody></table><footer><button className="lm-button outline" onClick={()=>setDialog(null)}>닫기</button></footer></LoanDialog>}
    {dialog?.type==='unavailable'&&<LoanDialog title={dialog.title} onClose={()=>setDialog(null)}><p>{dialog.title} 화면은 준비 중이에요.</p></LoanDialog>}
  </div>
}
