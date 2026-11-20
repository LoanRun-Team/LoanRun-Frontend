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
import { services as defaultServices,mockServices,isHybrid,isMock } from '../../api/runtime.js'
import { useApiResource } from '../../api/useApiResource.js'
import { loanView,paymentView,planView,segmentView,savingsView } from '../../api/loanView.js'
import { errorMessage } from '../../api/ApiError.js'
import { seoulToday,won } from '../../api/format.js'
import { designPreview,previewLoan,previewSchedule } from '../../api/mock/loanDesignPreview.js'
import { decorateLoan } from './loanPresentation.js'
import { loanTabs } from './data.js'
import { icons } from './icons.js'
import { v2Icons } from './v2Icons.js'
import { loadLoanWorkspace,paymentInput,regularPaymentDue } from '../../api/loanWorkspace.js'
import { loanFormInput } from '../../api/loanRequest.js'
import { monthlyRecords } from '../../api/connectedViews.js'
import LoanEditDialog from './components/LoanEditDialog.jsx'
import RateRecordDialog from './components/RateRecordDialog.jsx'
import ExampleNotice from '../../components/ApiState/ExampleNotice.jsx'
import './Loans.scss'
import './LoansV2.scss'

export default function Loans(props) {
 const query=new URLSearchParams(props.location.split('?')[1])
 if(!isHybrid)return <LoansContent {...props}/>
 if(!query.has('preview')&&query.get('source')!=='mock')return <LoansContent key="live" {...props} live/>
 return <LoansContent key="example" {...props} services={mockServices} example/>
}
function LoansContent({location,navigate,services=defaultServices,example=false,live=false}) {
  const [dialog,setDialog]=useState(null),[notice,setNotice]=useState(''),[error,setError]=useState(''),[pending,setPending]=useState(false),[fee,setFee]=useState('')
  const [month,setMonth]=useState(seoulToday().slice(0,7)),[historyPage,setHistoryPage]=useState(1)
  const path=location.split('?')[0],query=new URLSearchParams(location.split('?')[1])
  const page=path.includes('/plan/edit')?'edit':path.split('/')[2]||'overview'
  const selected=query.get('loan')||'all',loanId=selected==='all'?undefined:Number(selected)
  const scenario=isMock?query.get('preview')||'':''
  const previewData=isMock?designPreview(scenario):{}
  const resource=useApiResource([page,selected,month,historyPage].join(':'),async signal=>{
    if(live)return loadLoanWorkspace(services,{page,loanId,month,historyPage},signal)
    const [list,paymentData,plans,schedule,monthly,options,profile]=await Promise.all([
      services.loans(signal,'ALL'),services.payments({loan_id:loanId,page:page==='history'?historyPage:1,page_size:page==='history'?20:100},signal),services.plans(loanId,signal),
      services.schedule({loan_id:loanId,month},signal),services.monthly({loan_id:loanId,from_month:'2026-06',to_month:month},signal),services.options(signal),services.profile(signal)])
    const details=await Promise.all(list.loans.map(l=>services.loan(l.loan_id,signal)))
    const savingRows=await Promise.all(details.filter(l=>l.repayment_method==='BULLET').map(l=>services.savings(l.loan_id,signal)))
    return {profile,savings:Object.fromEntries(savingRows.map(s=>[s.loan_id,s])),list,loans:details.map(loanView),history:paymentData.results.map(paymentView),paymentData,plans,schedule,monthly,options}
  })
  const data=resource.data,loans=(data?.loans||[]).map(l=>decorateLoan(previewLoan(l,l.id===(selected==='all'?data.loans[0]?.id:selected)?scenario:''))),filter=selected
  const currentLoan=loans.find(l=>l.id===filter)||loans[0]
  const savings=scenario?previewData.savings:savingsView(data?.savings[currentLoan?.id],currentLoan,data?.monthly)
  const title=loanTabs.find(t=>t.id===page)?.label||(page==='history'?'상환 내역':'계획 수정')
  function go(href){if(example)href+=(href.includes('?')?'&':'?')+'source=mock';if(scenario)href+=(href.includes('?')?'&':'?')+'preview='+encodeURIComponent(scenario);navigate(href)}
  function onFilter(id){setHistoryPage(1);go(path+'?loan='+id)}
  function open(value){setError('');setDialog(value)}
  function record(initial){open({type:'record',initial,idempotencyKey:crypto.randomUUID()})}
  function showSavings(loan,recordData){open({type:recordData==='shortfall'?'shortfall':'savings',idempotencyKey:crypto.randomUUID(),initial:{loanId:loan.id,record:recordData==='shortfall'?undefined:recordData}})}
  async function mutate(action,message){setPending(true);setError('');try{await action();setDialog(null);setNotice(message);resource.reload()}catch(e){setError(errorMessage(e))}finally{setPending(false)}}
  function addLoan(form){
    const body=loanFormInput(form)
    return mutate(async()=>{await services.previewLoan(body);await services.createLoan(body,dialog.idempotencyKey)},'대출을 추가했어요')
  }
  function savePayment(row){
    return mutate(async()=>{
      let dueId=dialog.payment?.due_item_id
      if(row.type==='regular'&&!dueId){
        dueId=live?await regularPaymentDue(services,row.loanId):data.schedule.due_items.filter(d=>String(d.loan_id)===row.loanId&&d.outstanding_amount>0).sort((a,b)=>a.due_date.localeCompare(b.due_date))[0]?.due_item_id
        if(!dueId)throw new Error('납부할 정기 회차를 확인할 수 없어요. 이번 달 상환 일정을 확인해 주세요.')
      }
      const body=paymentInput(row,dueId)
      if(dialog.payment)await services.updatePayment(dialog.payment.payment_id,body,dialog.idempotencyKey)
      else await services.createPayment({...body,loan_id:Number(row.loanId)},dialog.idempotencyKey)
    },'납부 기록을 저장했어요')
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
  return <div className="loans-shell loans-v2" data-page={page}><Sidebar plan={scenario==='overall-free'||data?.profile?.plan_type==='FREE'?'Free':'Pro'} active="loans" activeSub={page==='history'?'overview':page==='edit'?'plan':page} onNavigate={item=>item.parent==='loans'||item.id==='loans'?go(item.href):navigate(item.href)}/>
    <main className="loans-content" id="main-content">
      {['history','edit'].includes(page)&&<button className="lm-text back-link" onClick={()=>go(page==='history'?'/loans':'/loans/plan?loan='+filter)}><img src={v2Icons.back} alt=""/>{page==='history'?'내 대출':'상환 계획'}</button>}
      <header className="loans-page-header"><h1>{title}</h1>{['segments','plan','history','edit'].includes(page)&&<LoanFilter loans={loans} value={filter} onChange={onFilter}/>}</header>
      {example&&<ExampleNotice onExit={()=>navigate('/loans')}>이 화면의 금융정보와 기록은 예시이며, 실제 대출에는 반영되지 않아요.</ExampleNotice>}<ApiState status={resource.status} error={resource.error} onRetry={resource.reload}/>
      {resource.error?.code==='FINANCE_PROFILE_NOT_FOUND'&&<button className="lm-button primary" onClick={()=>navigate('/settings/income')}>기본 재정정보 입력하기</button>}
      {error&&!dialog&&<p className="field-error" role="alert">{error}</p>}
      {resource.status==='success'&&data&&<>
        {page==='overview'&&<Overview onEdit={live?loan=>open({type:'edit-loan',loan}):undefined} loans={loans} history={data.history} summary={data.list} totals={data.paymentData.totals} navigate={go} onAdd={()=>open({type:'add',idempotencyKey:crypto.randomUUID()})} onDelete={loan=>open({type:loan.stage==='paid'?'archive':'delete',loan})} onRate={async loan=>{open({type:'rate',loan,rates:null});try{const rates=await services.rates(loan.id);setDialog(d=>d?.type==='rate'?{...d,rates}:d)}catch(e){setError(errorMessage(e))}}}/>}
        {page==='monthly'&&<MonthlyPayments loans={loans} filter={filter} onFilter={onFilter} month={month} onMonth={setMonth} schedule={previewSchedule(data.schedule,currentLoan,scenario)} payments={live?data.records:data.paymentData.results} confirmations={{}} savings={savings} onRecord={record} onConfirm={item=>open({type:'confirm-payment',item,idempotencyKey:crypto.randomUUID(),loan:loans.find(l=>l.id===String(item.loan_id))})} onSavings={showSavings}/>}
        {page==='segments'&&<SegmentRecords data={live?monthlyRecords(data.monthly):segmentView(data.monthly)}/>}
        {page==='history'&&<PaymentHistory loans={loans} history={data.history} filter={filter} pagination={data.paymentData} onPage={setHistoryPage} onDetail={live?async id=>{open({type:'payment-detail',payment:null});try{const payment=await services.payment(id);setDialog(d=>d?.type==='payment-detail'?{...d,payment}:d)}catch(e){setError(errorMessage(e))}}:undefined}/>}
        {page==='plan'&&<RepaymentPlan api={services} planData={data.plans} loans={loans} filter={filter} navigate={go} data={planView(data.plans,data.monthly,data.paymentData.totals)} savings={savings} scenario={scenario} onRecord={record} onSavings={showSavings} onSavingsEdit={showSavings} onSavingsDelete={deleteSavings} onShortfall={()=>open({type:'shortfall'})} onFee={()=>{setFee('');open({type:'fee'})}}/>}
        {page==='edit'&&<PlanEditor api={services} key={filter+scenario} loanIds={filter==='all'?loans.filter(l=>l.stage!=='paid').map(l=>Number(l.id)):[Number(filter)]} loans={loans} budgetWarning={previewData.warning} scenario={scenario} onCancel={()=>go('/loans/plan?loan='+filter)} onSaved={()=>{go('/loans/plan?loan='+filter);setNotice('상환 계획을 변경했어요')}}/>}
      </>}
    </main>
    {notice&&<div className="loans-toast" role="status">{notice}<button className="lm-icon-button" aria-label="알림 닫기" onClick={()=>setNotice('')}><img src={icons.close} alt=""/></button></div>}
    {dialog?.type==='add'&&<AddLoanDialog manualOnly={live} calculator={false} api={services} options={data.options} onClose={()=>!pending&&setDialog(null)} onAdd={addLoan} pending={pending} error={error}/>}
    {dialog?.type==='record'&&<RecordPaymentDialog api={services} designV2 loans={loans} initial={dialog.initial} onClose={()=>!pending&&setDialog(null)} onSave={savePayment} pending={pending} error={error}/>}
    {dialog?.type==='savings'&&<SavingsRecordDialog loans={loans} initial={dialog.initial} onClose={()=>!pending&&setDialog(null)} onSave={saveSavings} pending={pending} error={error}/>}
    {['delete','archive','confirm-payment'].includes(dialog?.type)&&<LoanConfirmationDialog kind={dialog.type==='confirm-payment'?'payment':dialog.type} loan={dialog.loan} item={dialog.item} pending={pending} error={error} onClose={()=>!pending&&setDialog(null)} onHistory={()=>{setDialog(null);go('/loans/history?loan='+dialog.loan.id)}} onConfirm={dialog.type==='confirm-payment'?confirmPayment:()=>mutate(()=>services.deleteLoan(dialog.loan.id),'대출을 삭제했어요')}/>}
    {dialog?.type==='shortfall'&&<LoanDialog title="미적립 금액" closeIcon={v2Icons.close} onClose={()=>setDialog(null)} className="v2-shortfall-dialog"><dl className="v2-key-values">{savings?.shortfallRows?.map(row=><div key={row.month}><dt>{row.month}</dt><dd>{won(row.amount)}</dd></div>)}<div><dt>합계</dt><dd className="teal">{won(savings?.shortfall)}</dd></div></dl><p>모으지 못한 금액은 이번 달 목표에 더해져요</p><footer><button className="lm-button primary" onClick={()=>setDialog(null)}>닫기</button></footer></LoanDialog>}
    {dialog?.type==='fee'&&<LoanDialog title="중도상환수수료 조건" closeIcon={v2Icons.close} onClose={()=>!pending&&setDialog(null)}><form onSubmit={e=>{e.preventDefault();if(fee!==''&&Number.isFinite(Number(fee))&&Number(fee)>=0)mutate(()=>services.updateLoan(currentLoan.id,{prepayment_fee_method:'FIXED',prepayment_fee_rate:Number(fee),fee_exempt:false}),'수수료 조건을 저장했어요')}}>{error&&<p role="alert">{error}</p>}<label className="lm-field"><span>약정 수수료율 (%)</span><input inputMode="decimal" required value={fee} disabled={pending} onChange={e=>setFee(e.target.value)} pattern="[0-9]+([.][0-9]+)?"/></label><p className="field-helper">고정 수수료율 기준으로 저장해요. 비교 예상액은 API 응답이 제공되면 표시해요.</p><footer><button type="button" className="lm-button outline" disabled={pending} onClick={()=>setDialog(null)}>취소</button><button disabled={pending} className="lm-button primary">확인</button></footer></form></LoanDialog>}
    {dialog?.type==='rate'&&<LoanDialog title="금리 변경 기록" closeIcon={v2Icons.close} onClose={()=>setDialog(null)}>{error&&<p role="alert">{error}</p>}{dialog.rates?<table className="lm-table"><thead><tr><th>적용일</th><th>이전 금리</th><th>변경 금리</th></tr></thead><tbody>{dialog.rates.rates.map(r=><tr key={r.rate_id}><td>{r.effective_date}</td><td>{r.previous_rate==null?'—':r.previous_rate+'%'}</td><td>{r.new_rate}%</td></tr>)}</tbody></table>:<p role="status">불러오는 중…</p>}{live&&<footer><button className="lm-button primary" onClick={()=>open({type:'record-rate',loan:dialog.loan})}>금리 변경 기록하기</button></footer>}</LoanDialog>}
    {dialog?.type==='record-rate'&&<RateRecordDialog loan={dialog.loan} pending={pending} error={error} onClose={()=>!pending&&setDialog(null)} onSave={body=>mutate(()=>services.saveRate(dialog.loan.id,body),'금리 변경을 저장했어요')}/>}
    {dialog?.type==='edit-loan'&&<LoanEditDialog loan={dialog.loan} pending={pending} error={error} onClose={()=>!pending&&setDialog(null)} onSave={body=>mutate(()=>services.updateLoan(dialog.loan.id,body),'대출 정보를 저장했어요')}/>}
    {dialog?.type==='payment-detail'&&<LoanDialog title="납부 상세" onClose={()=>!pending&&setDialog(null)}>{error&&<p role="alert">{error}</p>}{dialog.payment?<><dl className="v2-key-values">{[['납부일',dialog.payment.paid_at],['납부액',won(dialog.payment.amount)],['원금',won(dialog.payment.principal_amount+dialog.payment.extra_amount)],['이자',won(dialog.payment.interest_amount)],['수수료',won(dialog.payment.fee_amount)]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><footer><button className="lm-button outline" disabled={pending||!dialog.payment.editable} onClick={()=>{const p=dialog.payment;open({type:'record',payment:p,idempotencyKey:crypto.randomUUID(),initial:{editing:true,loanId:String(p.loan_id),date:p.paid_at,amount:p.amount,type:p.payment_type==='EXTRA'?'extra':'regular',usedSavings:p.savings_used_amount,breakdown:{principal:p.principal_amount,extra:p.extra_amount,interest:p.interest_amount,fee:p.fee_amount}}})}}>수정</button><button className="lm-button outline" disabled={pending||!dialog.payment.editable} onClick={()=>open({type:'delete-payment',payment:dialog.payment,idempotencyKey:crypto.randomUUID()})}>삭제</button></footer></>:!error&&<p role="status">불러오는 중…</p>}</LoanDialog>}
    {dialog?.type==='delete-payment'&&<LoanDialog title="납부 기록을 삭제할까요?" onClose={()=>!pending&&setDialog(null)}>{error&&<p role="alert">{error}</p>}<p>삭제하면 실제 상환 내역과 잔액이 다시 계산돼요.</p><footer><button disabled={pending} className="lm-button outline" onClick={()=>setDialog(null)}>취소</button><button disabled={pending} className="lm-button primary" onClick={()=>mutate(()=>services.deletePayment(dialog.payment.payment_id,dialog.idempotencyKey),'납부 기록을 삭제했어요')}>삭제</button></footer></LoanDialog>}
    {dialog?.type==='unavailable'&&<LoanDialog title={dialog.title} closeIcon={v2Icons.close} onClose={()=>setDialog(null)}><p>준비 중인 화면이에요.</p></LoanDialog>}
  </div>
}
