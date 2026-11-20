import ApiState from '../../../components/ApiState/ApiState.jsx'
import { services } from '../../../api/runtime.js'
import { useApiResource } from '../../../api/useApiResource.js'
import { seoulToday } from '../../../api/format.js'
import { homeLoanSummary } from '../../../api/connectedViews.js'
import LoanOverview from './LoanOverview.jsx'
import MonthlyRepayment from './MonthlyRepayment.jsx'

export function ConnectedLoanOverview({navigate}){
  const resource=useApiResource('home:loans',signal=>services.loans(signal))
  return <><ApiState status={resource.status} error={resource.error} onRetry={resource.reload}/>{resource.status==='success'&&<LoanOverview dashboard={homeLoanSummary(resource.data)} loanDetails={resource.data.loans} nextPaymentKnown={false} onViewAll={()=>navigate('/loans')}/>}</>
}

export function ConnectedMonthlyRepayment({navigate}){
  const month=seoulToday().slice(0,7)
  const resource=useApiResource('home:schedule:'+month,signal=>services.schedule({month},signal))
  return <div><ApiState status={resource.status} error={resource.error} onRetry={resource.reload}/>{resource.status==='success'&&<MonthlyRepayment summary={resource.data.monthly_totals} checklist={resource.data.due_items} onRecord={item=>navigate('/loans/monthly?loan='+item.loan_id)} onNavigate={()=>navigate('/loans/monthly')} onBudget={()=>navigate('/budget')}/>}</div>
}
