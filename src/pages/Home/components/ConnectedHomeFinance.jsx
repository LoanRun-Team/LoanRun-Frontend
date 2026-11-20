import { useMemo,useRef,useState } from 'react'
import ApiState from '../../../components/ApiState/ApiState.jsx'
import { services } from '../../../api/runtime.js'
import { useApiResource } from '../../../api/useApiResource.js'
import { seoulToday } from '../../../api/format.js'
import { homeLoanSummary } from '../../../api/connectedViews.js'
import { createHomePaymentActions } from '../../../api/homePaymentActions.js'
import { errorMessage } from '../../../api/ApiError.js'
import LoanOverview from './LoanOverview.jsx'
import MonthlyRepayment from './MonthlyRepayment.jsx'

export function ConnectedLoanOverview({navigate,revision=0}){
  const resource=useApiResource('home:loans:'+revision,signal=>services.loans(signal))
  return <><ApiState status={resource.status} error={resource.error} onRetry={resource.reload}/>{resource.status==='success'&&<LoanOverview dashboard={homeLoanSummary(resource.data)} loanDetails={resource.data.loans} nextPaymentKnown={false} onViewAll={()=>navigate('/loans')}/>}</>
}

export function ConnectedMonthlyRepayment({navigate,revision=0,onChanged,userId}){
  const month=seoulToday().slice(0,7)
  const resource=useApiResource('home:schedule:'+month+':'+revision,signal=>services.schedule({month},signal))
  const actions=useMemo(()=>createHomePaymentActions(services,{storage:globalThis.sessionStorage,storageKey:userId?'loanrun.quick-payments:'+userId:undefined}),[userId])
  const inFlight=useRef(false)
  const [pending,setPending]=useState(false),[error,setError]=useState('')
  async function toggle(item){
    if(inFlight.current)return
    inFlight.current=true;setPending(true);setError('')
    try{
      const result=await actions.toggle(item)
      if(result.changed){if(onChanged)onChanged();else resource.reload()}
    }catch(cause){setError(errorMessage(cause))}finally{inFlight.current=false;setPending(false)}
  }
  return <div><ApiState status={resource.status} error={resource.error} onRetry={resource.reload}/>{resource.status==='success'&&<MonthlyRepayment readOnly={pending} error={error} summary={resource.data.monthly_totals} checklist={resource.data.due_items} onToggle={toggle} canUndo={actions.canUndo} onRecord={item=>navigate('/loans/monthly?loan='+item.loan_id)} onNavigate={()=>navigate('/loans/monthly')} onBudget={()=>navigate('/budget')}/>}</div>
}
