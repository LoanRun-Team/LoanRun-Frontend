import { monthLabel, won, loanTypes, trackLabels,seoulToday } from './format.js'

// Calendar months rounded up, with end-of-month anniversaries clamped.
export function remainingCalendarMonths(date,today=seoulToday()) {
  if(!date)return null
  if(date<=today)return 0
  const [year,month,day]=date.split('-').map(Number),[startYear,startMonth,startDay]=today.split('-').map(Number)
  const months=(year-startYear)*12+month-startMonth
  const anniversary=Math.min(startDay,new Date(Date.UTC(year,month,0)).getUTCDate())
  return months+(day>anniversary?1:0)
}

// Presentation mapping only: currency/date labels and chart series.
export function loanView(dto) {
  return {id:String(dto.loan_id),name:dto.product_name,bank:dto.institution_name,product:dto.institution_name+' · '+dto.product_name,balance:dto.remaining_principal,original:dto.original_principal,percent:dto.progress_percent,rate:dto.annual_rate,variable:dto.rate_type==='VARIABLE',interest:won(dto.estimated_remaining_interest),principalPayment:dto.next_payment?.principal_amount??null,interestPayment:dto.next_payment?.interest_amount??null,payment:dto.contractual_monthly_payment??dto.estimated_monthly_payment,day:dto.payment_day,finish:monthLabel(dto.plan?.estimated_payoff_date),nextDate:dto.next_payment?.due_date,type:loanTypes[dto.loan_type],dto}
}
export function paymentView(dto) {
  return {id:dto.payment_id,loanId:String(dto.loan_id),date:dto.paid_at.replaceAll('-','.'),amount:dto.amount,principal:dto.principal_amount+dto.extra_amount,interest:dto.interest_amount,balance:null,type:dto.payment_type==='EXTRA'?'extra':'regular'}
}
export function planView(plans,monthly,totals) {
  const plan=plans.plans[0],aggregate=plans.aggregate
  const rows=monthly.months.filter(m=>m.data_status==='RECORDED'||m.recorded_payments).sort((a,b)=>a.year_month.localeCompare(b.year_month))
  const planned=rows.every(m=>m.target_amount!=null)?rows.map(m=>m.target_amount):rows.map(()=>null)
  return {personality:{FAST:'빠른 상환',BALANCED:'균형 상환',STABLE:'생활 안정 우선'}[plan?.preference]||'직접 설정',finish:monthLabel(aggregate?.target_payoff_date),expected:monthLabel(aggregate?.projected_payoff_date),dday:plan?.d_day??'—',monthly:aggregate?.monthly_total_amount,base:aggregate?.monthly_basic_amount,extra:aggregate?.monthly_extra_amount,paceMessage:trackLabels[plan?.track?.status]||'분석 자료가 부족해요',total:totals.amount,principal:totals.principal_amount+totals.extra_amount,interest:totals.interest_amount,periods:rows.map(m=>m.year_month),principalRows:rows.map(m=>m.principal_amount+m.extra_amount),interestRows:rows.map(m=>m.interest_amount),actual:rows.map(m=>m.actual_amount),planned,paymentDifference:plans.progress.difference,recordedOnly:rows.some(m=>m.recorded_payments&&m.observed!==true),paymentMessage:plans.progress.data_status==='INSUFFICIENT'?'계획 대비 비교 자료가 부족해요':undefined}
}
export function segmentView(monthly) {
  const rows=monthly.months.filter(m=>m.data_status==='RECORDED').map(m=>({id:m.year_month,month:m.year_month,label:m.year_month,actual:m.actual_amount,principal:m.principal_amount,interest:m.interest_amount,extra:m.extra_amount,target:m.target_amount}))
  return {rows,target:rows[0]?.target??0,message:rows.length?'API에 기록된 월별 상환 내역이에요.':'아직 기록된 납부가 없어요.',periodLabel:'조회 기간 합계'}
}

// Display geometry only; financial projections must be supplied by the backend.
export function savingsView(dto,loan,monthly) {
  if(!dto||!loan)return undefined
  const plan=loan.dto.plan||{},target=plan.target_payoff_date||loan.dto.maturity_date
  const targetAmount=dto.planned_saving_amount,actual=dto.actual_saving_amount
  const prepared=dto.savings_balance
  const savingMonths=(monthly?.months||[]).filter(r=>r.planned_saving_amount!=null||r.actual_saving_amount>0).map(r=>({month:r.year_month,target:r.planned_saving_amount,actual:r.actual_saving_amount,ongoing:r.observed===false,difference:r.observed===false||r.planned_saving_amount==null?null:r.actual_saving_amount-r.planned_saving_amount,balance:r.savings_balance??null}))
  return {prepared,remaining:Math.max(0,dto.remaining_principal-prepared),monthlyTarget:targetAmount,monthlyActual:actual,cumulativePercent:dto.saving_progress_pct,monthlyPercent:targetAmount>0?actual/targetAmount*100:null,principalPercent:loan.percent,interest:loan.payment,targetDate:target,monthsLeft:remainingCalendarMonths(loan.dto.maturity_date),shortfall:plan.saving_gap_amount==null?null:Math.max(0,-plan.saving_gap_amount),savingGap:plan.saving_gap_amount??null,savedTotal:plan.cumulative_actual_saving_amount??null,savingMonths,shortfallRows:[],records:dto.results.map(r=>({id:r.saving_id,date:r.saved_at,amount:r.amount,editable:r.editable})),comparisons:{all:{amount:prepared,interestSaving:null,fee:null,net:null},half:{amount:Math.floor(prepared/2),interestSaving:null,fee:null,net:null},custom:{amount:0,interestSaving:null,fee:null,net:null}}}
}
