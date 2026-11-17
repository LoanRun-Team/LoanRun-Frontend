import { useCallback, useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar/Sidebar.jsx'
import { onboardingApi, reportApi } from '../../api/index.js'
import ReportHeader from './components/ReportHeader.jsx'
import SummaryCard from './components/SummaryCard.jsx'
import PaceCard from './components/PaceCard.jsx'
import WaysCard from './components/WaysCard.jsx'
import PayoffCard from './components/PayoffCard.jsx'
import StrategySection from './components/StrategySection.jsx'
import Suggestions from './components/Suggestions.jsx'
import PreviewCard from './components/PreviewCard.jsx'
import { CompareDialog, ConfirmDialog, RecalcDialog } from './components/Dialogs.jsx'
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
  const [loans, setLoans] = useState([])
  const [strategy, setStrategy] = useState({ key: null, data: null, error: null })
  const [strategyReload, setStrategyReload] = useState(0)
  const [selected, setSelected] = useState(null)
  const [preview, setPreview] = useState({ key: null, data: null, error: null })
  const [dialog, setDialog] = useState(null) // 'confirm' | 'recalc' | 'compare' | null
  const [applying, setApplying] = useState(false)
  const [applyError, setApplyError] = useState(null)
  const [notice, setNotice] = useState('')
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
  useEffect(() => {
    const controller = new AbortController()
    onboardingApi.listLoans({ signal: controller.signal }).then(data => setLoans(data.loans), () => {})
    return () => controller.abort()
  }, [])

  // 전략 후보·현재 전략은 리포트가 준비된 뒤에 조회한다. 결과에 조회 키를 붙여 두고, 키가 다르면 불러오는 중으로 본다.
  const reportId = state.status === 'ready' ? state.report.report_id : null
  const strategyKey = `${reportId}:${strategyReload}`
  useEffect(() => {
    if (reportId == null) return
    const controller = new AbortController()
    reportApi.getStrategy({ reportId }, { signal: controller.signal }).then(
      data => setStrategy({ key: strategyKey, data, error: null }),
      error => { if (!controller.signal.aborted) setStrategy({ key: strategyKey, data: null, error }) },
    )
    return () => controller.abort()
  }, [reportId, strategyKey])
  const strategyView = strategy.key !== strategyKey ? { status: 'loading', data: null, error: null } : strategy.error ? { status: 'error', data: null, error: strategy.error } : { status: 'ready', data: strategy.data, error: null }

  // 후보를 고르면 반영 미리보기를 계산한다(저장 없음). 전략 버전이 바뀌면 다시 계산한다.
  const picked = strategyView.data?.candidates.find(c => c.strategy_code === selected) ?? null
  const strategyCode = picked?.strategy_code ?? null
  const strategyVersion = strategyView.data?.strategy_version ?? null
  const previewKey = strategyCode ? `${strategyCode}:${strategyVersion}` : null
  useEffect(() => {
    if (!previewKey) return
    const controller = new AbortController()
    reportApi.previewStrategy({ reportId, strategyCode, strategyVersion }, { signal: controller.signal }).then(
      data => setPreview({ key: previewKey, data, error: null }),
      error => {
        if (controller.signal.aborted) return
        setPreview({ key: previewKey, data: null, error })
        if (error?.code === 'STRATEGY_STALE') setDialog('recalc')
      },
    )
    return () => controller.abort()
  }, [previewKey, reportId, strategyCode, strategyVersion])
  const previewView = preview.key !== previewKey ? { status: 'loading', data: null, error: null } : preview.error ? { status: 'error', data: null, error: preview.error } : { status: 'ready', data: preview.data, error: null }
  useEffect(() => { document.title = '론런 | 상환 리포트' }, [])
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(''), 3000); return () => clearTimeout(t) }, [notice])

  // 전략 반영(PUT). 미리보기의 preview_version·data_revision 을 그대로 보낸다. 409 STRATEGY_STALE 이면 다시 계산하게 한다.
  async function apply() {
    const data = previewView.data
    setApplying(true)
    setApplyError(null)
    try {
      await reportApi.applyStrategy({ reportId, strategyCode: data.strategy_code, strategyVersion: data.strategy_version, previewVersion: data.preview_version, dataRevision: data.data_revision })
      setDialog(null)
      setSelected(null)
      setNotice('상환 계획에 전략을 반영했어요')
      reload(false) // 계획이 바뀌면 리포트도 stale 이 되므로 새 리포트를 받는다.
    } catch (error) {
      if (error?.code === 'STRATEGY_STALE') setDialog('recalc')
      else setApplyError(error)
    } finally { setApplying(false) }
  }
  function recalc() { setDialog(null); setApplyError(null); reload(false) }

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
      <ReportHeader report={status === 'ready' ? report : null} onCompare={() => setDialog('compare')} />
      {status === 'loading' && <p className="rp-loading" role="status">불러오는 중…</p>}
      {status === 'generating' && <Generating />}
      {status === 'failed' && <Failed message={error?.message} onRetry={() => reload(true)} onHome={() => navigate('/')} />}
      {status === 'error' && <p className="rp-banner danger" role="alert"><span>{error?.message || '상환 리포트를 불러오지 못했어요.'}</span><button type="button" className="rp-button outline small" onClick={() => reload(false)}>다시 시도</button></p>}
      {status === 'ready' && <>
        <SummaryCard report={report} />
        <PaceCard report={report} onCompare={() => setDialog('compare')} />
        <div className={`rp-pair${report.comparison?.status === 'DEMO' ? '' : ' single'}`}>
          {report.comparison?.status === 'DEMO' && <WaysCard comparison={report.comparison} />}
          <PayoffCard report={report} />
        </div>
        <StrategySection strategy={strategyView} loans={loans} selected={selected} onSelect={code => setSelected(prev => (prev === code ? null : code))} onReload={() => setStrategyReload(k => k + 1)} onRefresh={() => reload(false)} navigate={navigate} />
        {picked && <PreviewCard candidate={picked} preview={previewView} loans={loans} currentCode={strategyView.data.current_strategy.strategy_code} onApply={() => { setApplyError(null); setDialog('confirm') }} applying={applying} />}
        <Suggestions suggestions={report.suggestions} navigate={navigate} />
        <p className="rp-footnote">{report.comparison?.status === 'DEMO' ? '또래 비교 기준은 예시 데이터예요 · ' : ''}투자·대출 권유가 아니에요</p>
      </>}
    </main>
    {dialog === 'confirm' && picked && previewView.status === 'ready' && <ConfirmDialog candidate={picked} preview={previewView.data} loans={loans} currentCode={strategyView.data.current_strategy.strategy_code} busy={applying} error={applyError} onCancel={() => setDialog(null)} onConfirm={apply} />}
    {dialog === 'recalc' && <RecalcDialog onRecalc={recalc} onClose={() => setDialog(null)} />}
    {dialog === 'compare' && <CompareDialog onClose={() => setDialog(null)} onSaved={() => { setDialog(null); setSelected(null); setNotice('비교 기준을 바꿨어요'); reload(false) }} />}
    {notice && <div className="rp-toast" role="status">{notice}</div>}
  </div>
}
