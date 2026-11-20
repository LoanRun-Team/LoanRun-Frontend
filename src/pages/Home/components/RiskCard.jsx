import { clampPercent } from '../../../components/Charts/chartGeometry.js'
import lockIcon from '../../../assets/home/pro-lock.svg'
import { homeRiskView } from '../../../api/homeRiskView.js'
import { errorMessage } from '../../../api/ApiError.js'

export default function RiskCard({ plan = 'Pro', showPro = true, onNavigate, markerPercent = null, riskLabel = '자료 부족', risk,status='success',error }) {
  const locked = plan === 'Free'
  const view=homeRiskView(risk),label=risk?view.label:riskLabel,marker=risk?view.markerPercent:markerPercent
  return <section className="card risk-card" aria-labelledby="risk-title">
    <header className="card-header"><h2 id="risk-title">재정 위험도</h2>{!locked && <button className="text-button push-right" onClick={() => onNavigate('위험 분석')}>위험 분석 →</button>}{showPro && <span className="pro-chip">PRO</span>}</header>
    {locked ? <div className="risk-locked">
      <div className="risk-preview" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="locked-content"><span className="lock-circle"><img src={lockIcon} alt="" /></span><strong>PRO에서 확인할 수 있어요</strong><button className="primary-button" onClick={() => onNavigate('PRO 시작하기')}>PRO 시작하기</button></div>
    </div> : <div className="risk-body" data-status={risk?.data_status}>
      <div className="risk-gauge" role="img" aria-label={`재정 위험도: ${label}`}><div className="gauge-track" data-known={marker!=null} style={{'--risk-marker':clampPercent(marker)+'%'}}><span /><span /><span /></div><div className="gauge-labels" data-risk={label}>{['안정','주의','위험'].map(text=><span key={text} className={text===label?'is-current':''}>{text}</span>)}</div></div>
      <p className="risk-caption" role={error?'alert':status==='loading'?'status':undefined}>{error?errorMessage(error):status==='loading'?'불러오는 중…':'버틸 수 있는 폭 (기본 상환 / 추가 상환 유지)'}</p>
      <dl className="risk-values">{view.rows.map(row=><div key={row.key}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>
    </div>}
  </section>
}

