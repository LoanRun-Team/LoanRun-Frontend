import { useCallback, useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar/Sidebar.jsx'
import { onboardingApi, riskApi } from '../../api/index.js'
import LevelCard from './components/LevelCard.jsx'
import UpcomingCard from './components/UpcomingCard.jsx'
import ChangesCard from './components/ChangesCard.jsx'
import ScenarioCards from './components/ScenarioCards.jsx'
import { LockedOverlay, LockedPreview } from './components/LockedView.jsx'
import './Risk.scss'

const footnote = '모든 날짜와 금액은 예시 계산이에요 (주담대 연 3.08%, 신용대출 연 5.8% 가정).'

// 위험 분석. 위험 지표는 GET /api/risks/, 대출 이름은 GET /api/loans/ 를 쓴다. PRO 가 아니면 403 PRO_REQUIRED 로 온다.
export default function Risk({ navigate }) {
  const [loans, setLoans] = useState([])
  const [budget, setBudget] = useState(null)
  const [state, setState] = useState({ status: 'loading', data: null, error: null })
  const [reloadKey, setReloadKey] = useState(0)
  const [notice, setNotice] = useState('')
  const reload = useCallback(() => { setState({ status: 'loading', data: null, error: null }); setReloadKey(k => k + 1) }, [])

  useEffect(() => {
    const controller = new AbortController()
    onboardingApi.listLoans({ signal: controller.signal }).then(data => setLoans(data.loans), () => {})
    return () => controller.abort()
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    const d = new Date()
    onboardingApi.getBudgetMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, { signal: controller.signal }).then(setBudget, () => {})
    return () => controller.abort()
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    riskApi.getRisks({}, { signal: controller.signal }).then(
      data => setState({ status: 'ready', data, error: null }),
      error => { if (!controller.signal.aborted) setState({ status: error?.code === 'PRO_REQUIRED' ? 'locked' : 'error', data: null, error }) },
    )
    return () => controller.abort()
  }, [reloadKey])
  useEffect(() => { document.title = '론런 | 위험 분석' }, [])
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(''), 3000); return () => clearTimeout(t) }, [notice])

  function onNavigate(item) {
    if (item.id === 'loans' || item.parent === 'loans') navigate(item.href)
    else if (item.id === 'home') navigate('/')
    else if (item.id === 'budget') navigate('/budget')
  }

  return <div className="risk-shell">
    <Sidebar active="risk" plan={state.status === 'locked' ? 'Free' : 'Pro'} onNavigate={onNavigate} />
    <main className={`rk-content${state.status === 'locked' ? ' locked' : ''}`} id="main-content">
      <header className="rk-header"><h1>위험 분석</h1><span className="rk-pro">PRO</span></header>
      {state.status === 'loading' && <p className="rk-loading" role="status">불러오는 중…</p>}
      {state.status === 'error' && <p className="rk-banner danger" role="alert"><span>{state.error?.message || '위험 분석 정보를 불러오지 못했어요.'}</span><button type="button" className="rk-button outline small" onClick={reload}>다시 시도</button></p>}
      {state.status === 'ready' && <div className={`rk-columns${state.data.upcoming_events.length > 1 ? ' even' : ''}`}>
        <LevelCard data={state.data} onStrategy={() => setNotice('상환 전략 화면은 준비 중이에요')} />
        <UpcomingCard data={state.data} loans={loans} />
        <ChangesCard data={state.data} />
      </div>}
      {state.status === 'ready' && budget && <ScenarioCards data={state.data} budget={budget} loans={loans} />}
      {state.status === 'locked' && <LockedPreview />}
      <p className="rk-footnote">{footnote}</p>
      {state.status === 'locked' && <LockedOverlay onUpgrade={() => setNotice('업그레이드 화면은 준비 중이에요')} />}
    </main>
    {notice && <div className="rk-toast" role="status">{notice}</div>}
  </div>
}
