import { compareLabel, manWon, pct1 } from '../reportModel.js'

// Figma F4: Card / 페이스 분석 · 상환 속도. 내 상환 속도(월 원금 상환률·6개월 원금 감소율)를 보여 준다.
// 또래 비교가 DEMO 가 아니면(자료 부족·동의 안 함) F4-n 처럼 안내와 "비교 기준 변경"을 보여 준다.
export default function PaceCard({ report, onCompare }) {
  const pace = report.pace_analysis
  const comparison = report.comparison
  const insufficient = !pace || pace.data_status !== 'SUFFICIENT'
  const label = compareLabel(comparison)
  return <section className="rp-card" aria-labelledby="rp-pace-title">
    <div className="rp-card-head">
      <h2 id="rp-pace-title">페이스 분석 · 상환 속도</h2>
      {comparison?.status === 'DEMO' && <span className="rp-chip neutral">예시 데이터</span>}
    </div>
    {insufficient
      ? <p className="rp-empty">아직 확인된 상환 기록이 없어요. 납부 기록이 쌓이면 상환 속도를 분석해 드려요.</p>
      : <dl className="rp-pace">
        <div><dt>월 원금 상환률</dt><dd className="rp-big">{pct1(pace.monthly_principal_repayment_rate)}</dd><small>확인한 {pace.observed_month_count}개월 평균</small></div>
        <div><dt>6개월 원금 감소율</dt><dd className="rp-big">{pct1(pace.principal_reduction_pct_6m)}</dd><small>시작 잔액 대비</small></div>
        <div><dt>최근 줄인 원금</dt><dd className="rp-big">{manWon(pace.principal_repaid_last_6_months)}</dd><small>{pace.observed_month_count < 6 ? `확인 가능한 ${pace.observed_month_count}개월 기준` : '최근 6개월 합계'}</small></div>
      </dl>}
    {comparison?.status !== 'DEMO' && <div className="rp-notice">
      <p className="rp-notice-title">{comparison?.status === 'DISABLED' ? '또래 비교를 사용하지 않고 있어요' : `${label || '선택한 기준'} 비교 데이터가 아직 부족해요`}</p>
      <p className="rp-notice-sub">{comparison?.status === 'DISABLED' ? '비교 기준을 고르면 또래와 비교해 드려요' : '상환 기록이 쌓이면 또래와 비교해 드려요'}</p>
      <button type="button" className="rp-button outline" onClick={onCompare}>비교 기준 변경</button>
    </div>}
  </section>
}
