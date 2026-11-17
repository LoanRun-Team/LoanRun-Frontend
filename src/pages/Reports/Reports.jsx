import { useCallback, useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar/Sidebar.jsx'
import { reportApi } from '../../api/index.js'
import ReportHeader from './components/ReportHeader.jsx'
import SummaryCard from './components/SummaryCard.jsx'
import PaceCard from './components/PaceCard.jsx'
import WaysCard from './components/WaysCard.jsx'
import PayoffCard from './components/PayoffCard.jsx'
import { Failed, Generating } from './components/ReportStates.jsx'
import './Reports.scss'

const POLL_MS = 800
const MAX_POLLS = 40
const wait = (ms, signal) => new Promise((resolve, reject) => {
  const timer = setTimeout(resolve, ms)
  signal.addEventListener('abort', () => { clearTimeout(timer); reject(signal.reason) }, { once: true })
})

// 상환 리포트. 최신 리포트를 조회하고, 없거나(NOT_GENERATED) 데이터가 바뀌었으면(stale) 생성(POST)한 뒤 완료될 때까지 상태를 확인한다.
// 상태: loading → generating → ready | failed | locked(403 PRO_REQUIRED) | error
export default function Reports({ navigate }) {
  const [state, setState] = useState({ status: 'loading', report: null, error: null })
  const [reloadKey, setReloadKey] = useState(0)
  const [force, setForce] = useState(false)
  const reload = useCallback((retry = false) => { setForce(retry); setState(s => ({ ...s, status: 'generating', error: null })); setReloadKey(k => k + 1) }, [])

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    async function run() {
      try {
        let latest = await reportApi.getLatest({}, { signal })
        if (latest.status === 'FAILED' && !force) return setState({ status: 'failed', report: null, error: latest.report?.error ?? null })
        if (latest.status === 'NOT_GENERATED' || latest.status === 'FAILED' || (latest.status === 'COMPLETED' && latest.stale)) {
          setState({ status: 'generating', report: null, error: null })
          const accepted = await reportApi.generate({ force: latest.status === 'FAILED' }, { signal })
          latest = { ...latest, report_id: accepted.report_id, status: accepted.status }
        }
        for (let i = 0; i < MAX_POLLS && (latest.status === 'PENDING' || latest.status === 'RUNNING'); i += 1) {
          setState({ status: 'generating', report: null, error: null })
          await wait(POLL_MS, signal)
          latest = await reportApi.getReport(latest.report_id, { signal })
        }
        if (latest.status === 'COMPLETED') setState({ status: 'ready', report: latest.report, error: null })
        else setState({ status: 'failed', report: null, error: latest.report?.error ?? null })
      } catch (error) {
        if (signal.aborted) return
        setState({ status: error?.code === 'PRO_REQUIRED' ? 'locked' : 'error', report: null, error })
      }
    }
    run()
    return () => controller.abort()
  }, [reloadKey, force])
  useEffect(() => { document.title = '론런 | 상환 리포트' }, [])

  function onNavigate(item) {
    if (item.id === 'loans' || item.parent === 'loans') navigate(item.href)
    else if (item.id === 'home') navigate('/')
    else if (item.id === 'budget') navigate('/budget')
    else if (item.id === 'risk') navigate('/risk')
  }

  const { status, report, error } = state
  return <div className="report-shell">
    <Sidebar active="reports" plan={status === 'locked' ? 'Free' : 'Pro'} onNavigate={onNavigate} />
    <main className="rp-content" id="main-content">
      <ReportHeader report={status === 'ready' ? report : null} />
      {status === 'loading' && <p className="rp-loading" role="status">불러오는 중…</p>}
      {status === 'generating' && <Generating />}
      {status === 'failed' && <Failed message={error?.message} onRetry={() => reload(true)} onHome={() => navigate('/')} />}
      {status === 'error' && <p className="rp-banner danger" role="alert"><span>{error?.message || '상환 리포트를 불러오지 못했어요.'}</span><button type="button" className="rp-button outline small" onClick={() => reload(false)}>다시 시도</button></p>}
      {status === 'ready' && <>
        <SummaryCard report={report} />
        <PaceCard report={report} onCompare={() => {}} />
        <div className={`rp-pair${report.comparison?.status === 'DEMO' ? '' : ' single'}`}>
          {report.comparison?.status === 'DEMO' && <WaysCard comparison={report.comparison} />}
          <PayoffCard report={report} />
        </div>
      </>}
    </main>
  </div>
}
