// Temporary UI response samples from Figma v2, pending the revised API spec.
// These are presentation fixtures, not endpoint definitions or financial rules.
export const savingsPreview={prepared:7043480,remaining:22956520,monthlyTarget:521740,monthlyActual:0,cumulativePercent:23.5,monthlyPercent:0,principalPercent:0,monthsLeft:44,interest:100000,targetDate:'2030-06-25',shortfall:0,shortfallRows:[],records:[{id:'s1',date:'2026-10-25',amount:521740},{id:'s2',date:'2026-09-25',amount:521740}],comparisons:{all:{amount:7043480,interestSaving:1033044,fee:72783,net:960261},half:{amount:3521740,interestSaving:516522,fee:600000,net:-83478},custom:{amount:5000000,interestSaving:733333,fee:51667,net:681666}}}
export function designPreview(scenario) {
  const savings=structuredClone(savingsPreview)
  if(scenario==='bullet-shortfall'){savings.shortfall=365218;savings.shortfallRows=[{month:'9월',amount:52174},{month:'10월',amount:104348},{month:'11월',amount:104348},{month:'12월',amount:104348}]}
  if(scenario==='bullet-first'){savings.prepared=0;savings.cumulativePercent=0;savings.records=[]}
  if(scenario==='bullet-recorded'){savings.monthlyActual=521740;savings.monthlyPercent=100}
  if(scenario==='bullet-fee-unknown')for(const value of Object.values(savings.comparisons)){value.fee=null;value.net=null}
  return {savings,warning:['plan-warning','plan-amount-warning'].includes(scenario)?{amount:120000,message:'현재 재정 상태로는 매달 120,000원이 부족해요. 그래도 이 목표로 저장할 수 있어요.'}:null}
}
export function previewLoan(loan,scenario) {
  if(!scenario)return loan
  const dto={...loan.dto},next={...loan,dto}
  if(scenario.startsWith('bullet')){dto.repayment_method='BULLET';dto.repayment_category='LUMP_SUM';dto.maturity_date='2030-06-25';next.name='전세자금대출';next.type='전세자금대출';dto.loan_type='JEONSE';next.balance=30000000;next.payment=100000;dto.contractual_monthly_payment=100000;next.finish='2030년 6월'}
  if(scenario==='grace'){dto.repayment_method='GRACE_INSTALLMENT';dto.grace_months=18;dto.start_date='2025-09-15';dto.maturity_date='2035-03-15';dto.plan={...dto.plan,target_payoff_date:'2035-03-15',projected_payoff_date:'2035-03-15',estimated_payoff_date:'2035-03-15',d_day:3048};next.payment=96667;dto.contractual_monthly_payment=96667;next.finish='2035년 3월';next.design={postGracePayment:260885,firstPrincipalMonth:'2027.04'}}
  if(scenario==='paid'){dto.status='PAID';dto.remaining_principal=0;dto.plan={...dto.plan,target_payoff_date:'2033-07-15',projected_payoff_date:'2033-07-15',estimated_payoff_date:'2033-07-15'};next.balance=0;next.percent=100}
  return next
}
export function previewSchedule(schedule,loan,scenario) {
  if(!loan||!(scenario.startsWith('bullet')||scenario==='grace'))return schedule
  const next=structuredClone(schedule),sum=key=>next.due_items.reduce((n,d)=>n+(d[key]||0),0)
  const due=next.due_items.find(d=>d.loan_id===Number(loan.id))
  if(due)Object.assign(due,{product_name:loan.name,required_amount:loan.payment,outstanding_amount:loan.payment,total_planned_amount:loan.payment,planned_extra_amount:0,remaining_extra_amount:0,paid_required_amount:0,paid_extra_amount:0,status:'UPCOMING',display_status:'UPCOMING'})
  next.calendar_events=next.calendar_events.map(e=>e.loan_id===Number(loan.id)?{...e,amount:loan.payment}:e)
  Object.assign(next.monthly_totals,{scheduled_repayment:sum('required_amount'),actual_repayment:sum('paid_required_amount'),remaining_required_amount:sum('outstanding_amount'),remaining_amount:sum('outstanding_amount'),planned_extra_amount:sum('planned_extra_amount'),actual_extra_amount:sum('paid_extra_amount'),completed_count:next.due_items.filter(d=>d.status==='PAID').length})
  return next
}
export function readDesignDrafts(storage=globalThis.localStorage) {
  try{return JSON.parse(storage?.getItem('loanrun.design-v2-drafts')||'null')||{confirmations:{},savings:{},contracts:{},payments:{}}}catch{return {confirmations:{},savings:{},contracts:{},payments:{}}}
}
export function saveDesignDrafts(value,storage=globalThis.localStorage) {
  try{storage?.setItem('loanrun.design-v2-drafts',JSON.stringify(value))}catch{/* The current mock session remains usable. */}
}
export function updateSavingsPreview(data,record,remove=false) {
  const next=structuredClone(data),old=next.records.find(r=>r.id===record.id)
  next.records=next.records.filter(r=>r.id!==record.id)
  if(!remove)next.records.unshift(record)
  const difference=(remove?0:record.amount)-(old?.amount||0)
  next.prepared+=difference;next.remaining=Math.max(0,next.remaining-difference)
  next.monthlyActual=Math.max(0,(next.monthlyActual||0)+difference)
  next.monthlyPercent=next.monthlyTarget?Math.min(100,next.monthlyActual/next.monthlyTarget*100):0
  next.comparisons.all.amount=next.prepared
  next.comparisons.half.amount=Math.round(next.prepared/2)
  // New savings totals invalidate the fixed forecast examples.
  // The future backend comparison response will provide fresh forecasts.
  for(const quote of Object.values(next.comparisons)){quote.interestSaving=null;quote.net=null;quote.fee=null}
  return next
}
export function updateFeePreview(data,fee) {
  const next=structuredClone(data)
  for(const value of Object.values(next.comparisons)){value.fee=fee;value.net=value.interestSaving==null?null:value.interestSaving-fee}
  return next
}
