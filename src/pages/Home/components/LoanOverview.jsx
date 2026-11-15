import { clampPercent } from '../../../components/Charts/chartGeometry.js'
import { defaultLoans, exampleLoans } from '../data.js'
import steadyDot from '../../../assets/home/pace-steady-dot.svg'
import slowDot from '../../../assets/home/pace-slow-dot.svg'
import aheadDot from '../../../assets/home/pace-ahead-dot.svg'
const paces = { steady: { label: '순항 중', dot: steadyDot }, slow: { label: '속도 조절 필요', dot: slowDot }, ahead: { label: '앞서 달리는 중', dot: aheadDot } }

export default function LoanOverview({ example = false, onViewAll, loans: apiLoans }) {
  const loans = apiLoans ?? (example ? exampleLoans : defaultLoans)
  return <section className="card loan-overview" aria-labelledby="loans-title">
    <div className="loan-top">
      <header className="card-header"><h2 id="loans-title">내 대출</h2>{example && <span className="neutral-chip">예시</span>}<button className="text-button push-right" onClick={onViewAll}>전체 보기 →</button></header>
      <div className="loan-metrics">
        <div className="metric"><p>남은 원금</p><strong className="principal">{example ? '198,988,000원' : '137,688,000원'}</strong></div>
        <div className="metric"><p>갚은 원금</p><strong>{example ? '48,412,000원 · 20%' : '30,712,000원 · 18%'}</strong></div>
        <div className="metric"><p>다음 납부일</p><strong>11월 15일 (일)</strong><p>신용대출 · 납부 예정액 200,000원</p></div>
      </div>
    </div>
    <div className="loan-bottom">
      <ul className="loan-list">{loans.map(loan => <li className="loan-row" key={loan.name}>
        <div className="loan-name"><strong>{loan.name}</strong>{loan.example && <span className="neutral-chip">예시</span>}</div>
        {loan.note ? <p className="loan-note">{loan.note}</p> : <>
          <div className="loan-track" role="meter" aria-label={`${loan.name} 상환 진행률`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={loan.percent}><div className="loan-paid" style={{ width: `${clampPercent(loan.percent)}%` }}><span style={{ width: `${loan.percent > 0 ? clampPercent((loan.percent - (loan.before || 0)) / loan.percent * 100) : 0}%` }} /></div></div>
          <strong className="loan-percent">{loan.percent}%</strong>
          <span className={`pace-badge ${loan.pace}`}><img src={paces[loan.pace].dot} alt="" />{paces[loan.pace].label}</span>
        </>}
      </li>)}</ul>
      {example && <button className="text-button extra-loans" onClick={onViewAll}>외 3건 · 전체 보기</button>}
    </div>
  </section>
}

