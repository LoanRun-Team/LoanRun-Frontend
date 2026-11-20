// Presentation only: preserve unknown amounts; never infer monthly completion.
export function monthlyRecords(monthly){
  const rows=monthly.months.map(m=>({id:m.year_month,month:m.year_month,label:m.year_month,actual:m.actual_amount,principal:m.principal_amount,interest:m.interest_amount,extra:m.extra_amount,target:m.target_amount,observed:m.observed,paymentCount:m.payment_count}))
  return {rows,target:null,message:'미확인 금액은 —로 표시해요. 납부 기록이 있어도 월 전체 실적이 확정된 것은 아니에요.',periodLabel:'조회 기간 합계'}
}
export function homeLoanSummary(list){
  const original=list.loans.reduce((sum,l)=>sum+l.original_principal,0)
  const paid=list.loans.reduce((sum,l)=>sum+l.paid_principal,0)
  return {loans:list.loans,total_remaining_principal:list.total_remaining_principal,overall_progress_percent:original>0?paid/original*100:null,next_payment:null}
}
export async function monthlyPayments(api,month,loan_id,signal){
  const [year,number]=month.split('-').map(Number)
  const to=month+'-'+new Date(Date.UTC(year,number,0)).getUTCDate()
  const results=[];let page=1
  do{
    const batch=await api.payments({loan_id,from:month+'-01',to,page,page_size:100},signal)
    results.push(...batch.results);page=batch.next_page
  }while(page)
  return results
}
