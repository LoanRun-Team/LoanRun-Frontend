import { loanView } from '../loanView.js'
import fixtures from './specFixtures.js'
// Explicit Figma previews only. These are example backend responses, not forecasts.
export function overallPreview(scenario) {
  if(!scenario?.startsWith('overall-'))return null
  const source=fixtures['GET /api/loans/{loan_id}/'].data
  const configs=[{loan_id:1,product_name:'신용대출',loan_type:'CREDIT',remaining_principal:20000000,annual_rate:5.8,contractual_monthly_payment:199954,repayment_method:'EQUAL_PAYMENT',payoff:'2038-03-25'},
    {loan_id:2,product_name:'주택담보대출',loan_type:'MORTGAGE',remaining_principal:148400000,annual_rate:3.08,rate_type:'VARIABLE',contractual_monthly_payment:699179,repayment_method:'EQUAL_PAYMENT',payoff:'2045-09-25'},
    {loan_id:3,product_name:'전세자금대출',loan_type:'JEONSE',remaining_principal:30000000,savings_balance:27800000,repayment_method:'BULLET',maturity_date:'2030-06-25',payoff:'2030-06-25'}]
  const loans=configs.map(c=>loanView({...source,...c,original_principal:c.remaining_principal,plan:{...source.plan,projected_payoff_date:c.payoff}}))
  const allocations=[{loan_id:3,amount:50000,allocation_type:'REPAYMENT_SAVING',priority:1,projected_payoff_date:'2030-06-25',handoff_message:'2030.6 만기 뒤에는 적립하던 50,000원이 ②로 넘어가요'},
    {loan_id:2,amount:63000,allocation_type:'EXTRA_PAYMENT',priority:2,projected_payoff_date:'2045-09-25',handoff_date:'2038-03-25',handoff_message:'③ 정기 납부로 2038.3 완납 → 이후 월 199,954원이 ②로 넘어가요'},
    {loan_id:1,amount:0,allocation_type:'EXTRA_PAYMENT',priority:3,projected_payoff_date:'2038-03-25'}]
  const overall={state:'AVAILABLE',strategy_code:'RATE_RISK',applied_at:'2026-11-17',projected_payoff_date:'2045-09-25',allocations}
  let current=structuredClone(allocations)
  if(scenario==='overall-manual'){overall.strategy_code='MANUAL';overall.recommended_strategy_code='RATE_RISK';overall.projected_payoff_date='2045-07-25';current=[current[0],{...current[2],amount:50000,priority:2,projected_payoff_date:'2034-05-25',handoff_message:'② 완납 예상 2034.5 → 이후 월 299,954원이 ③로 넘어가요'},{...current[1],amount:13000,priority:3,projected_payoff_date:'2045-07-25',handoff_date:'2034-05-25',handoff_message:null}]}
  if(scenario==='overall-empty')overall.state='EMPTY'
  if(scenario==='overall-free')overall.state='LOCKED'
  if(scenario==='overall-unavailable'){overall.state='UNAVAILABLE';overall.projected_payoff_date='2052-05-25';current=[{...current[0],amount:521740}]}
  return {overall,budget:{available_cash:120000,allocation:{allocations:current,reserve_amount:7000}},loans}
}
