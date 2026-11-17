// The current API has no explicit priority-update field. The mock preserves array
// order for the final Figma interaction; real-server ordering needs confirmation.
export const strategyNames={RATE_RISK:'금리 위험 대비',INTEREST_SAVING:'이자 절약',PARALLEL:'나눠 갚기',MANUAL:'직접 조정',NONE:'미적용',SAVINGS:'만기 상환 적립'}
export function allocationRows(overall,loans,budget) {
  const byId=new Map(loans.map(l=>[Number(l.id),l]))
  const rows=(budget?.allocation?.allocations||overall?.allocations||[]).map((a,i)=>{
    const loan=byId.get(a.loan_id),plan=overall?.allocations?.find(p=>p.loan_id===a.loan_id)
    return {...a,loan,name:loan?.name||a.product_name||'대출',balance:loan?.balance??null,bullet:a.allocation_type==='REPAYMENT_SAVING'||loan?.dto.repayment_method==='BULLET',payoff:a.projected_payoff_date||plan?.projected_payoff_date||plan?.target_payoff_date||loan?.dto.plan?.projected_payoff_date||null,priority:budget?i+1:a.priority??plan?.priority??i+1}
  }).filter(r=>r.loan)
  return [...rows.filter(r=>r.bullet),...rows.filter(r=>!r.bullet).sort((a,b)=>a.priority-b.priority)]
}
export function allocationTotals(rows,available) {
  const total=rows.reduce((n,r)=>n+(Number(r.amount)||0),0)
  return {total,reserve:Math.max(0,(available??0)-total),excess:Math.max(0,total-(available??0)),invalid:rows.some(r=>!Number.isSafeInteger(Number(r.amount))||Number(r.amount)<0||(!r.bullet&&r.balance!=null&&Number(r.amount)>r.balance))}
}
export function sameAllocation(a,b){return JSON.stringify(a.map(r=>[r.loan_id,Number(r.amount)||0]))===JSON.stringify(b.map(r=>[r.loan_id,Number(r.amount)||0]))}
