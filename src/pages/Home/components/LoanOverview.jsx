import { clampPercent } from '../../../components/Charts/chartGeometry.js'
import { won } from '../../../api/format.js'
import steadyDot from '../../../assets/home/pace-steady-dot.svg'
import slowDot from '../../../assets/home/pace-slow-dot.svg'
import aheadDot from '../../../assets/home/pace-ahead-dot.svg'
const paces={ON_TRACK:{label:'순항 중',tone:'steady',dot:steadyDot},BEHIND:{label:'속도 조절 필요',tone:'slow',dot:slowDot},AHEAD:{label:'앞서 달리는 중',tone:'ahead',dot:aheadDot}}
function repaymentNote(loan) {
  if(loan.loan_form==='CREDIT_LINE')return loan.used_amount==null?'한도대출': '한도 사용 '+won(loan.used_amount)
  if(loan.repayment_method==='BULLET')return '만기일시상환 · '+(loan.maturity_date||'만기일 미정')
  if(loan.repayment_method==='GRACE_INSTALLMENT'&&loan.grace_months>0){
    const start=new Date(loan.start_date+'T00:00:00Z')
    start.setUTCMonth(start.getUTCMonth()+loan.grace_months)
    if(start>new Date())return '거치 중 · '+start.toISOString().slice(0,7).replace('-','.')+'까지 이자만 납부'
  }
  return null
}
export default function LoanOverview({dashboard,loanDetails=[],plans=[],onViewAll}) {
  const loans=dashboard.loans,visible=loans.slice(0,4),next=dashboard.next_payment
  const date=next?.due_date?new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'long',day:'numeric',weekday:'short'}).format(new Date(next.due_date+'T00:00:00+09:00')):'—'
  return <section className="card loan-overview" aria-labelledby="loans-title"><div className="loan-top">
    <header className="card-header"><h2 id="loans-title">내 대출</h2><button className="text-button push-right" onClick={onViewAll}>전체 보기 →</button></header>
    <div className="loan-metrics">
      <div className="metric"><p>남은 원금</p><strong className="principal">{won(dashboard.total_remaining_principal)}</strong></div>
      <div className="metric"><div className="metric-label"><p>갚은 원금</p><span>처음 빌린 금액 기준</span></div><strong>{won(loans.reduce((sum,l)=>sum+(l.paid_principal||0),0))} · {dashboard.overall_progress_percent==null?'—':Number(dashboard.overall_progress_percent).toLocaleString('ko-KR',{maximumFractionDigits:2})+'%'}</strong></div>
      <div className="metric"><p>다음 납부일</p><strong>{date}</strong><p>{next?next.product_name+' · 납부 예정액 '+won(next.required_amount):'예정된 납부가 없어요'}</p></div>
    </div></div>
    <div className="loan-bottom"><ul className="loan-list">{visible.map(loan=>{
      const detail=loanDetails.find(l=>l.loan_id===loan.loan_id)||{}
      const plan=plans.find(p=>p.loan_id===loan.loan_id)
      const pace=paces[plan?.track?.status],note=repaymentNote(detail),percent=loan.progress_percent
      return <li className="loan-row" key={loan.loan_id}>
        <div className="loan-name"><strong title={loan.product_name}>{loan.product_name}</strong></div>
        {note?<p className="loan-note">{note}</p>:detail.loan_type==='STUDENT'?<p className="loan-note">{percent==null?'—':percent+'%'}{pace?' · '+pace.label:''}</p>:<>
          <div className="loan-track" role="meter" aria-label={loan.product_name+' 상환 진행률'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent??0}><div className="loan-paid" style={{width:clampPercent(percent)+'%'}}/></div>
          <strong className="loan-percent">{percent==null?'—':percent+'%'}</strong>
          {pace&&<span className={'pace-badge '+pace.tone}><img src={pace.dot} alt=""/>{pace.label}</span>}
        </>}
      </li>
    })}</ul>{loans.length>4&&<button className="text-button extra-loans" onClick={onViewAll}>외 {loans.length-4}건 · 전체 보기</button>}{!loans.length&&<p className="home-empty">등록된 대출이 없어요. 대출을 추가해 주세요.</p>}</div>
  </section>
}