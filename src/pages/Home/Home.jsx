import { useState } from 'react'
import DetailDialog from './components/DetailDialog.jsx'
import Sidebar from '../../components/Sidebar/Sidebar.jsx'
import LoanOverview from './components/LoanOverview.jsx'
import MonthlyRepayment from './components/MonthlyRepayment.jsx'
import RiskCard from './components/RiskCard.jsx'
import ReportEntry from './components/ReportEntry.jsx'
import RecordPaymentDialog from '../Loans/components/RecordPaymentDialog.jsx'
import ApiState from '../../components/ApiState/ApiState.jsx'
import { services } from '../../api/runtime.js'
import { useApiResource } from '../../api/useApiResource.js'
import { loanView } from '../../api/loanView.js'
import { errorMessage } from '../../api/ApiError.js'
import wordmark from '../../assets/home/loanrun-wordmark.svg'
import '../Loans/Loans.scss'
import './Home.scss'

export default function Home({navigate}) {
  const [panel,setPanel]=useState(null),[recording,setRecording]=useState(null),[pending,setPending]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
  const resource=useApiResource('home',async signal=>{
    const [profile,dashboard,loanData,planData]=await Promise.all([services.profile(signal),services.dashboard(undefined,signal),services.loans(signal),services.plans(undefined,signal)])
    const risk=dashboard.risk_summary.locked?null:await services.risks(signal)
    return {profile,dashboard,risk,loans:loanData.loans,plans:planData.plans}
  })
  const {profile,dashboard,risk,loans=[],plans=[]}=resource.data||{}
  const plan=dashboard?.plan_type==='FREE'?'Free':'Pro'
  const riskLabels={STABLE:'안정',CAUTION:'주의',DANGER:'위험',WARNING:'주의'}
  function openRecord(item){setError('');setRecording({item,key:crypto.randomUUID()})}
  async function savePayment(row){
    setPending(true);setError('')
    try {
      const due=dashboard.monthly_checklist.find(d=>String(d.loan_id)===row.loanId)
      await services.createPayment({loan_id:Number(row.loanId),paid_at:row.date,amount:row.amount,payment_type:row.type==='regular'?'REGULAR':'EXTRA',due_item_id:row.type==='regular'?due?.due_item_id??null:null},recording.key)
      setRecording(null);setNotice('납부 기록을 저장했어요.');resource.reload()
    }catch(e){setError(errorMessage(e))}finally{setPending(false)}
  }
  return <div className={`app-shell home-v2${plan==='Free'?' is-free':''}`}>
    <Sidebar plan={plan} logoSrc={wordmark} onNavigate={item=>navigate(item.href)}/>
    <main className="home-content" id="main-content"><ApiState status={resource.status} error={resource.error} onRetry={resource.reload}/>
      {resource.status==='success'&&dashboard&&<><h1>안녕하세요, {profile.name}님.</h1>
        <LoanOverview dashboard={dashboard} loanDetails={loans} plans={plans} onViewAll={()=>navigate('/loans')}/>
        <div className="dashboard-row">
          <MonthlyRepayment summary={dashboard.monthly_summary} checklist={dashboard.monthly_checklist} onNavigate={()=>navigate('/loans/monthly')} onBudget={()=>setPanel('예산·지출')} onRecord={openRecord}/>
          <RiskCard plan={plan} riskLabel={riskLabels[dashboard.risk_summary.level]||'자료 부족'} markerPercent={{STABLE:16,CAUTION:50,WARNING:50,DANGER:84}[dashboard.risk_summary.level]??0} risk={risk} onNavigate={setPanel}/>
        </div>
        <ReportEntry report={dashboard.report_status} onOpen={()=>setPanel(dashboard.report_status.locked?'PRO 시작하기':'상환 리포트')}/>
      </>}
    </main>
    {recording&&<div className="loans-shell home-payment-dialog"><RecordPaymentDialog loans={loans.map(loanView)} initial={{type:'regular',loanId:String(recording.item.loan_id)}} pending={pending} error={error} onClose={()=>!pending&&setRecording(null)} onSave={savePayment}/></div>}
    {notice&&<div className="home-toast" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="알림 닫기">닫기</button></div>}
    {panel&&<DetailDialog title={panel} onClose={()=>setPanel(null)} onProStart={()=>navigate('/settings/plan')}/>}
  </div>
}
