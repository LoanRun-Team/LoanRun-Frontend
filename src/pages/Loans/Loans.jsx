import { useState } from 'react'
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
import SavingsRecordDialog from './components/SavingsRecordDialog.jsx'
import LoanConfirmationDialog from './components/LoanConfirmationDialog.jsx'
import LoanDialog from './components/LoanDialog.jsx'
import ApiState from '../../components/ApiState/ApiState.jsx'
import { services,isMock } from '../../api/runtime.js'
import { useApiResource } from '../../api/useApiResource.js'
import { loanView,paymentView,planView,segmentView,savingsView } from '../../api/loanView.js'
import { errorMessage } from '../../api/ApiError.js'
import { seoulToday,won } from '../../api/format.js'
import { designPreview,previewLoan,previewSchedule } from '../../api/mock/loanDesignPreview.js'
import { decorateLoan } from './loanPresentation.js'
import { loanTabs } from './data.js'
import { icons } from './icons.js'
import { v2Icons } from './v2Icons.js'
import wordmark from '../../assets/home/loanrun-wordmark.svg'
import './Loans.scss'
import './LoansV2.scss'

export default function Loans({location,navigate}) {
  const [dialog,setDialog]=useState(null),[notice,setNotice]=useState(''),[error,setError]=useState(''),[pending,setPending]=useState(false),[fee,setFee]=useState('')
  const [month,setMonth]=useState(seoulToday().slice(0,7)),[historyPage,setHistoryPage]=useState(1)
  const path=location.split('?')[0],query=new URLSearchParams(location.split('?')[1])
  const page=path.includes('/plan/edit')?'edit':path.split('/')[2]||'overview'
  const selected=query.get('loan')||'all',loanId=selected==='all'?undefined:Number(selected)
  const scenario=isMock?query.get('preview')||'':''
  const previewData=isMock?designPreview(scenario):{}
  const resource=useApiResource([page,selected,month,historyPage].join(':'),async signal=>{
    const [list,paymentData,plans,schedule,monthly,options]=await Promise.all([
      services.loans(signal,'ALL'),services.payments({loan_id:loanId,page:page==='history'?historyPage:1,page_size:page==='history'?20:100},signal),services.plans(loanId,signal),
      services.schedule({loan_id:loanId,month},signal),services.monthly({loan_id:loanId,from_month:'2026-06',to_month:month},signal),services.options(signal)])
    const details=await Promise.all(list.loans.map(l=>services.loan(l.loan_id,signal)))
    const savingRows=await Promise.all(details.filter(l=>l.repayment_method==='BULLET').map(l=>services.savings(l.loan_id,signal)))
    return {savings:Object.fromEntries(savingRows.map(s=>[s.loan_id,s])),list,loans:details.map(loanView),history:paymentData.results.map(paymentView),paymentData,plans,schedule,monthly,options}
  })
  const data=resource.data,loans=(data?.loans||[]).map(l=>decorateLoan(previewLoan(l,l.id===(selected==='all'?data.loans[0]?.id:selected)?scenario:''))),filter=selected
  const currentLoan=loans.find(l=>l.id===filter)||loans[0]
  const savings=scenario?previewData.savings:savingsView(data?.savings[currentLoan?.id],currentLoan)
  const title=loanTabs.find(t=>t.id===page)?.label||(page==='history'?'상환 내역':'계획 수정')
  function go(href){if(scenario)href+=(href.includes('?')?'&':'?')+'preview='+encodeURIComponent(scenario);navigate(href)}
  function onFilter(id){setHistoryPage(1);go(path+'?loan='+id)}
  function open(value){setError('');setDialog(value)}
  function record(initial){open({type:'record',initial,idempotencyKey:crypto.randomUUID()})}
  function showSavings(loan,recordData){open({type:recordData==='shortfall'?'shortfall':'savings',idempotencyKey:crypto.randomUUID(),initial:{loanId:loan.id,record:recordData==='shortfall'?undefined:recordData}})}
  async function mutate(action,message){setPending(true);setError('');try{await action();setDialog(null);setNotice(message);resource.reload()}catch(e){setError(errorMessage(e))}finally{setPending(false)}}
  function addLoan(form){
    const body={loan_form:'GENERAL',loan_type:form.loan_type,product_id:form.product_id,institution_name:form.bank,product_name:form.product,repayment_method:form.method,original_principal:Number(form.original),remaining_principal:Number(form.balance),annual_rate:Number(form.rate),rate_type:form.variable?'VARIABLE':'FIXED',rate_reset_months:form.variable?6:null,start_date:form.start,maturity_date:form.maturity,payment_day:Number(form.day),contractual_monthly_payment:form.payment===''?null:Number(form.payment),grace_months:form.method==='GRACE_INSTALLMENT'?Number(form.graceMonths):0,post_grace_method:form.method==='GRACE_INSTALLMENT'?form.postGraceMethod:null,prepayment_policy:form.method==='BULLET'?null:form.changeMode==='payment'?'KEEP_MATURITY':'KEEP_PAYMENT',prepayment_fee_method:form.feeStatus==='exempt'?'NONE':form.feeStatus==='yes'?'FIXED':'UNKNOWN',prepayment_fee_rate:form.feeStatus==='yes'?Number(form.feeRate):null,fee_exempt:form.feeStatus==='exempt'?true:null}
    return mutate(async()=>{await services.previewLoan(body);await services.createLoan(body)},'대출을 추가했어요')
  }
  function savePayment(row){
    const due=data.schedule.due_items.find(d=>String(d.loan_id)===row.loanId)
    const breakdown=row.breakdown?{principal_amount:row.breakdown.principal,extra_amount:row.breakdown.extra,interest_amount:row.breakdown.interest,fee_amount:row.breakdown.fee}:{}
    return mutate(()=>services.createPayment({loan_id:Number(row.loanId),paid_at:row.date,amount:row.amount,payment_type:row.type==='regular'?'REGULAR':'EXTRA',due_item_id:row.type==='regular'?(due?.due_item_id??null):null,...breakdown,savings_used_amount:row.usedSavings||0},dialog.idempotencyKey),'납부 기록을 저장했어요')
  }
  function saveSavings(row){
    const body={saved_at:row.date,amount:row.amount}
    return mutate(()=>dialog.initial.record?services.updateSaving(row.id,body,dialog.idempotencyKey):services.createSaving({...body,loan_id:Number(row.loanId)},dialog.idempotencyKey),'상환자금 적립 기록을 저장했어요')
  }
  function deleteSavings(row){
    return mutate(()=>services.deleteSaving(row.id,crypto.randomUUID()),'적립 기록을 삭제했어요')
  }
  function confirmPayment(paid){
    if(paid){record({type:'regular',loanId:String(dialog.item.loan_id)});return}
    return mutate(()=>services.confirmDue(dialog.item.due_item_id,true,dialog.idempotencyKey),'이번 회차를 미납으로 표시했어요')
  }
  return <div className="loans-shell loans-v2" data-page={page}><Sidebar active="loans" activeSub={page==='history'?'overview':page==='edit'?'plan':page} logoSrc={wordmark} onNavigate={item=>item.parent==='loans'||['home','loans','settings'].includes(item.id)?go(item.href):open({type:'unavailable',title:item.label})}/>
    <main className="loans-content" id="main-content">
      {['history','edit'].includes(page)&&<button className="lm-text back-link" onClick={()=>go(page==='history'?'/loans':'/loans/plan?loan='+filter)}><img src={v2Icons.back} alt=""/>{page==='history'?'내 대출':'상환 계획'}</button>}
      <header className="loans-page-header"><h1>{title}</h1>{['segments','plan','history','edit'].includes(page)&&<LoanFilter loans={loans} value={filter} onChange={onFilter}/>}</header>
      <ApiState status={resource.status} error={resource.error} onRetry={resource.reload}/>
      {error&&!dialog&&<p className="field-error" role="alert">{error}</p>}
      {resource.status==='success'&&data&&<>
        {page==='overview'&&<Overview loans={loans} history={data.history} summary={data.list} totals={data.paymentData.totals} navigate={go} onAdd={()=>open({type:'add'})} onDelete={loan=>open({type:loan.stage==='paid'?'archive':'delete',loan})} onRate={async loan=>{open({type:'rate',loan,rates:null});try{const rates=await services.rates(loan.id);setDialog(d=>d?.type==='rate'?{...d,rates}:d)}catch(e){setError(errorMessage(e))}}}/>}
        {page==='monthly'&&<MonthlyPayments loans={loans} filter={filter} onFilter={onFilter} month={month} onMonth={setMonth} schedule={previewSchedule(data.schedule,currentLoan,scenario)} payments={data.paymentData.results} confirmations={{}} savings={savings} onRecord={record} onConfirm={item=>open({type:'confirm-payment',item,idempotencyKey:crypto.randomUUID(),loan:loans.find(l=>l.id===String(item.loan_id))})} onSavings={showSavings}/>}
        {page==='segments'&&<SegmentRecords data={segmentView(data.monthly)}/>}
        {page==='history'&&<PaymentHistory loans={loans} history={data.history} filter={filter} pagination={data.paymentData} onPage={setHistoryPage}/>}
        {page==='plan'&&<RepaymentPlan planData={data.plans} loans={loans} filter={filter} navigate={go} data={planView(data.plans,data.monthly,data.paymentData.totals)} savings={savings} scenario={scenario} onRecord={record} onSavings={showSavings} onSavingsEdit={showSavings} onSavingsDelete={deleteSavings} onShortfall={()=>open({type:'shortfall'})} onFee={()=>{setFee('');open({type:'fee'})}}/>}
        {page==='edit'&&<PlanEditor key={filter+scenario} loanIds={filter==='all'?loans.map(l=>Number(l.id)):[Number(filter)]} loans={loans} budgetWarning={previewData.warning} scenario={scenario} onCancel={()=>go('/loans/plan?loan='+filter)} onSaved={()=>{go('/loans/plan?loan='+filter);setNotice('상환 계획을 변경했어요')}}/>}
      </>}
    </main>
    {notice&&<div className="loans-toast" role="status">{notice}<button className="lm-icon-button" aria-label="알림 닫기" onClick={()=>setNotice('')}><img src={icons.close} alt=""/></button></div>}
    {dialog?.type==='add'&&<AddLoanDialog options={data.options} onClose={()=>!pending&&setDialog(null)} onAdd={addLoan} pending={pending} error={error}/>}
    {dialog?.type==='record'&&<RecordPaymentDialog designV2 loans={loans} initial={dialog.initial} onClose={()=>!pending&&setDialog(null)} onSave={savePayment} pending={pending} error={error}/>}
    {dialog?.type==='savings'&&<SavingsRecordDialog loans={loans} initial={dialog.initial} onClose={()=>!pending&&setDialog(null)} onSave={saveSavings} pending={pending} error={error}/>}
    {['delete','archive','confirm-payment'].includes(dialog?.type)&&<LoanConfirmationDialog kind={dialog.type==='confirm-payment'?'payment':dialog.type} loan={dialog.loan} item={dialog.item} pending={pending} error={error} onClose={()=>!pending&&setDialog(null)} onHistory={()=>{setDialog(null);go('/loans/history?loan='+dialog.loan.id)}} onConfirm={dialog.type==='confirm-payment'?confirmPayment:()=>mutate(()=>services.deleteLoan(dialog.loan.id),'대출을 삭제했어요')}/>}
    {dialog?.type==='shortfall'&&<LoanDialog title="미적립 금액" closeIcon={v2Icons.close} onClose={()=>setDialog(null)} className="v2-shortfall-dialog"><dl className="v2-key-values">{savings?.shortfallRows?.map(row=><div key={row.month}><dt>{row.month}</dt><dd>{won(row.amount)}</dd></div>)}<div><dt>합계</dt><dd className="teal">{won(savings?.shortfall)}</dd></div></dl><p>모으지 못한 금액은 이번 달 목표에 더해져요</p><footer><button className="lm-button primary" onClick={()=>setDialog(null)}>닫기</button></footer></LoanDialog>}
    {dialog?.type==='fee'&&<LoanDialog title="중도상환수수료 조건" closeIcon={v2Icons.close} onClose={()=>!pending&&setDialog(null)}><form onSubmit={e=>{e.preventDefault();if(fee!==''&&Number.isFinite(Number(fee))&&Number(fee)>=0)mutate(()=>services.updateLoan(currentLoan.id,{prepayment_fee_method:'FIXED',prepayment_fee_rate:Number(fee),fee_exempt:false}),'수수료 조건을 저장했어요')}}>{error&&<p role="alert">{error}</p>}<label className="lm-field"><span>약정 수수료율 (%)</span><input inputMode="decimal" required value={fee} disabled={pending} onChange={e=>setFee(e.target.value)} pattern="[0-9]+([.][0-9]+)?"/></label><p className="field-helper">고정 수수료율 기준으로 저장해요. 비교 예상액은 API 응답이 제공되면 표시해요.</p><footer><button type="button" className="lm-button outline" disabled={pending} onClick={()=>setDialog(null)}>취소</button><button disabled={pending} className="lm-button primary">확인</button></footer></form></LoanDialog>}
    {dialog?.type==='rate'&&<LoanDialog title="금리 변경 기록" closeIcon={v2Icons.close} onClose={()=>setDialog(null)}>{error&&<p role="alert">{error}</p>}{dialog.rates?<table className="lm-table"><thead><tr><th>적용일</th><th>이전 금리</th><th>변경 금리</th></tr></thead><tbody>{dialog.rates.rates.map(r=><tr key={r.rate_id}><td>{r.effective_date}</td><td>{r.previous_rate}%</td><td>{r.new_rate}%</td></tr>)}</tbody></table>:<p role="status">불러오는 중…</p>}</LoanDialog>}
    {dialog?.type==='unavailable'&&<LoanDialog title={dialog.title} closeIcon={v2Icons.close} onClose={()=>setDialog(null)}><p>준비 중인 화면이에요.</p></LoanDialog>}
  </div>
}
