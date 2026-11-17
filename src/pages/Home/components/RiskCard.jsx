import { clampPercent } from '../../../components/Charts/chartGeometry.js'
import lockIcon from '../../../assets/home/pro-lock.svg'

export default function RiskCard({ plan = 'Pro', showPro = true, onNavigate, markerPercent = 0, riskLabel = '자료 부족', risk }) {
  const locked = plan === 'Free'
  return <section className="card risk-card" aria-labelledby="risk-title">
    <header className="card-header"><h2 id="risk-title">재정 위험도</h2>{!locked && <button className="text-button push-right" onClick={() => onNavigate('위험 분석')}>위험 분석 →</button>}{showPro && <span className="pro-chip">PRO</span>}</header>
    {locked ? <div className="risk-locked">
      <div className="risk-preview" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="locked-content"><span className="lock-circle"><img src={lockIcon} alt="" /></span><strong>PRO에서 확인할 수 있어요</strong><button className="primary-button" onClick={() => onNavigate('PRO 시작하기')}>PRO 시작하기</button></div>
    </div> : <div className="risk-body" data-status={risk?.data_status}>
      <div className="risk-gauge" role="img" aria-label={`재정 위험도: ${riskLabel}`}><div className="gauge-track" style={{'--risk-marker':clampPercent(markerPercent)+'%'}}><span /><span /><span /></div><div className="gauge-labels" data-risk={riskLabel}>{['안정','주의','위험'].map(label=><span key={label} className={label===riskLabel?'is-current':''}>{label}</span>)}</div></div>
      <p className="risk-caption">버틸 수 있는 폭 (기본 상환 / 추가 상환 유지)</p>
      <dl className="risk-values"><div><dt>금리</dt><dd title="현재 API에는 금리 변화 폭이 제공되지 않습니다.">— / —</dd></div><div><dt>소득</dt><dd title="현재 API에는 소득 변화 폭이 제공되지 않습니다.">— / —</dd></div><div><dt>선택 지출</dt><dd title="현재 API에는 선택 지출 변화 폭이 제공되지 않습니다.">— / —</dd></div></dl>
    </div>}
  </section>
}

