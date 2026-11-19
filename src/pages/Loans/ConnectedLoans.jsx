import { useState } from 'react'
import Sidebar from '../../components/Sidebar/Sidebar.jsx'
import ApiState from '../../components/ApiState/ApiState.jsx'
import { services } from '../../api/runtime.js'
import { useApiResource } from '../../api/useApiResource.js'
import { loanView,paymentView } from '../../api/loanView.js'
import { loanFormInput } from '../../api/loanRequest.js'
import { won,loanTypes } from '../../api/format.js'
import { errorMessage } from '../../api/ApiError.js'
import Overview from './components/Overview.jsx'
import PaymentHistory from './components/PaymentHistory.jsx'
import LoanFilter from './components/LoanFilter.jsx'
import LoanDialog from './components/LoanDialog.jsx'
import AddLoanDialog from './components/AddLoanDialog.jsx'
import { decorateLoan } from './loanPresentation.js'

export default function ConnectedLoans({location,navigate}) {
  const history=location.split('?')[0].endsWith('/history'),selected=new URLSearchParams(location.split('?')[1]).get('loan')||'all'
  const [page,setPage]=useState(1),[dialog,setDialog]=useState(null),[pending,setPending]=useState(false),[error,setError]=useState(''),[quote,setQuote]=useState(null)
  const resource=useApiResource('connected:'+history+':'+selected+':'+page,async signal=>{
    const [profile,list,payments]=await Promise.all([services.profile(signal),services.loans(signal,'ALL'),services.payments({loan_id:history&&selected!=='all'?Number(selected):undefined,page:history?page:1,page_size:history?20:3},signal)])
    return {profile,list,payments,loans:list.loans.map(dto=>decorateLoan(loanView(dto)))}
  })
  async function show(type,loan,id){
    const next={type,loan,data:null};setError('');setDialog(next)
    try{const data=await (type==='rate'?services.rates(loan.id):type==='savings'?services.savings(loan.id):services.payment(id));setDialog(current=>current===next?{...next,data}:current)}catch(e){setDialog(current=>current===next?{...next,error:errorMessage(e)}:current)}
  }
  async function calculate(form){setPending(true);setError('');setQuote(null);try{setQuote(await services.previewLoan(loanFormInput(form)))}catch(e){setError(errorMessage(e))}finally{setPending(false)}}
  const data=resource.data
  return <div className="loans-shell loans-v2"><Sidebar active="loans" activeSub="overview" plan={data?.profile.plan_type==='PRO'?'Pro':'Free'} onNavigate={item=>navigate(item.href)}/><main className="loans-content" id="main-content">
    <header className="loans-page-header"><h1>{history?'상환 내역':'내 대출'}</h1>{history&&data&&<LoanFilter loans={data.loans} value={selected} onChange={id=>{setPage(1);navigate('/loans/history?loan='+id)}}/>}</header>
    <aside className="api-example-notice">실제 서버의 대출·납부 내역을 조회해요. 등록·수정·상환 계획은 준비 중이에요.<button onClick={()=>navigate('/loans?source=mock')}>예시 화면 보기</button></aside>
    <ApiState status={resource.status} error={resource.error} onRetry={resource.reload}/>
    {resource.status==='success'&&data&&(history?<PaymentHistory loans={data.loans} history={data.payments.results.map(paymentView)} filter={selected} pagination={data.payments} onPage={setPage} onDetail={id=>show('payment',null,id)}/>:<>
      <div className="v2-actions"><button className="lm-button outline small" onClick={()=>{setError('');setQuote(null);setDialog({type:'calculator'})}}>월 상환액 계산</button></div>
      <Overview loans={data.loans} history={data.payments.results.map(paymentView)} summary={data.list} totals={data.payments.totals} navigate={navigate} canAdd={false} canDelete={false} canPlan={false} onRate={loan=>show('rate',loan)} onSavings={loan=>show('savings',loan)}/>
    </>)}
  </main>
  {dialog?.type==='calculator'&&<AddLoanDialog manualOnly options={{loan_types:Object.entries(loanTypes).map(([code,label])=>({code,label})),institutions:[]}} onClose={()=>!pending&&setDialog(null)} onAdd={calculate} pending={pending} error={error} quote={quote}/>}
  {dialog&&dialog.type!=='calculator'&&<LoanDialog title={{rate:'금리 변경 기록',savings:'적립 내역',payment:'납부 상세'}[dialog.type]} onClose={()=>setDialog(null)}>
    {dialog.error?<p role="alert">{dialog.error}</p>:!dialog.data?<p role="status">불러오는 중…</p>:dialog.type==='rate'?<table className="lm-table"><thead><tr><th>적용일</th><th>이전 금리</th><th>변경 금리</th></tr></thead><tbody>{dialog.data.rates.map(row=><tr key={row.rate_id}><td>{row.effective_date}</td><td>{row.previous_rate==null?'—':row.previous_rate+'%'}</td><td>{row.new_rate}%</td></tr>)}</tbody></table>:dialog.type==='savings'?<><p>현재 적립 잔액 {won(dialog.data.savings_balance)}</p><table className="lm-table"><thead><tr><th>적립일</th><th>금액</th></tr></thead><tbody>{dialog.data.results.map(row=><tr key={row.saving_id}><td>{row.saved_at}</td><td>{won(row.amount)}</td></tr>)}</tbody></table>{!dialog.data.results.length&&<p>적립 기록이 없어요.</p>}</>:<dl className="v2-key-values">{[['납부일',dialog.data.paid_at],['납부액',won(dialog.data.amount)],['원금',won(dialog.data.principal_amount+dialog.data.extra_amount)],['이자',won(dialog.data.interest_amount)],['수수료',won(dialog.data.fee_amount)],['적립금 사용',won(dialog.data.savings_used_amount)]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
  </LoanDialog>}
  </div>
}
