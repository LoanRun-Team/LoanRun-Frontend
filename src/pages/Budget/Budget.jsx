import { useCallback, useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar/Sidebar.jsx'
import { budgetApi, onboardingApi } from '../../api/index.js'
import MonthSwitcher from './components/MonthSwitcher.jsx'
import RepaymentCard from './components/RepaymentCard.jsx'
import IncomeFlowCard from './components/IncomeFlowCard.jsx'
import AllocationCard from './components/AllocationCard.jsx'
import AmountDialog from './components/AmountDialog.jsx'
import SettlementCard from './components/SettlementCard.jsx'
import info from '../../assets/onboarding/icon-info.svg'
import {
  allocationSum, baseSchedule, currentYM, extraTotal, fromApi, isApplied, lastDayOf, monthName, nextPayDay, pastSlices, settlementOf,
  shiftYM, suggestAllocation, todayDay, toAllocationBody, toSaveBody,
} from './budgetModel.js'
import './Budget.scss'

const footnote = '모든 날짜와 금액은 예시 계산이에요 (주담대 연 3.08%, 신용대출 연 5.8% 가정).'
const HISTORY_MONTHS = 12 // 이전 달로 거슬러 갈 수 있는 개월 수

// 예산·지출. 대출 목록은 GET /api/loans/, 월별 소득·지출·여유자금은 GET /api/budgets/{year_month}/ 를 쓴다.
export default function Budget({ navigate }) {
  const thisMonth = currentYM()
  const [ym, setYm] = useState(thisMonth)
  const [loans, setLoans] = useState([])
  const [state, setState] = useState({ status: 'loading', month: null, error: null })
  const [reloadKey, setReloadKey] = useState(0)
  const [draft, setDraft] = useState(null) // { ym, value } — 아직 반영하지 않은 분할 편집 값
  const [busy, setBusy] = useState(false)
  const [dialog, setDialog] = useState(null)
  const [notice, setNotice] = useState('')
  const reload = useCallback(() => setReloadKey(k => k + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    onboardingApi.listLoans({ signal: controller.signal }).then(data => setLoans(data.loans), () => {})
    return () => controller.abort()
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    budgetApi.getMonth(ym, { signal: controller.signal }).then(
      data => setState({ status: 'ready', month: fromApi(data), error: null }),
      error => { if (!controller.signal.aborted) setState({ status: 'error', month: null, error }) },
    )
    return () => controller.abort()
  }, [ym, reloadKey])
  useEffect(() => { document.title = '론런 | 예산·지출' }, [])
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(''), 3000); return () => clearTimeout(t) }, [notice])

  function onNavigate(item) {
    navigate(item.href)
  }
  const goMonth = next => { setState(s => ({ ...s, status: 'loading' })); setYm(next) }

  const isPast = ym < thisMonth
  const month = state.month?.ym === ym ? state.month : null
  const today = todayDay()
  const schedule = baseSchedule(loans, ym)

  // 여유자금과 분할: 서버에 반영된 분할이 있으면 그것을, 없으면 제안값을 보여주고, 편집 중이면 편집 값을 쓴다.
  const available = month?.capacity ?? 0
  const applied = month ? isApplied(month) : false
  const baseAllocation = month && (applied ? month.allocation : suggestAllocation(available, loans))
  const allocation = draft?.ym === ym ? draft.value : baseAllocation
  const extra = allocation ? extraTotal(allocation) : 0
  const mismatch = Boolean(allocation) && available > 0 && allocationSum(allocation) !== available

  async function saveMonth(next) {
    const data = await budgetApi.saveMonth(ym, toSaveBody(next, ym))
    setState({ status: 'ready', month: fromApi(data), error: null })
    setDraft(null)
    setDialog(null)
    setNotice('이번 달 금액을 저장했어요')
  }
  async function applyAllocation() {
    setBusy(true)
    try {
      await budgetApi.applyAllocation(ym, toAllocationBody(allocation, loans))
      setDraft(null)
      reload()
      setNotice('이번달 여유자금 배분을 반영했어요')
      return true
    } catch (e) {
      setNotice(e?.message || '반영하지 못했어요. 잠시 후 다시 시도해 주세요.')
      return false
    } finally {
      setBusy(false)
    }
  }
  function openAmount() {
    const needsRow = month.income_type === 'IRREGULAR' && month.receipts.length === 0
    setDialog({ initial: needsRow ? { ...month, receipts: [{ day: Math.min(lastDayOf(ym), today), amount: null }] } : month })
  }

  const detail = mismatch && month ? { ym, base: month.repayment, extra, applied, schedule, nextDay: nextPayDay(schedule, today), extraLoanIds: Object.entries(allocation.extras).filter(([, v]) => v > 0).map(([id]) => Number(id)) } : null
  const selectableLastDay = ym === thisMonth ? today : lastDayOf(ym)

  return <div className="budget-shell">
    <Sidebar active="budget" onNavigate={onNavigate} />
    <main className="bd-content" id="main-content">
      <header className="bd-header">
        <h1>예산·지출</h1>
        <MonthSwitcher ym={ym} canPrev={ym > shiftYM(thisMonth, -HISTORY_MONTHS)} canNext={isPast} onPrev={() => goMonth(shiftYM(ym, -1))} onNext={() => goMonth(shiftYM(ym, 1))} />
      </header>
      {state.status === 'error' && <p className="bd-banner danger" role="alert"><span>{state.error?.message || '예산 정보를 불러오지 못했어요.'}</span><button type="button" className="bd-button outline small" onClick={reload}>다시 시도</button></p>}
      {!month && state.status === 'loading' && <p className="bd-loading" role="status">불러오는 중…</p>}
      {month && isPast && <>
        <p className="bd-banner"><img src={info} alt="" width="20" height="20" /><span>지난달 기록이에요 · 수정할 수 없어요</span></p>
        <RepaymentCard title={`${monthName(ym)} 상환`} plannedLabel={`${monthName(ym)} 상환 예정액 총합`} paidLabel={`${monthName(ym)} 상환액`} planned={month.repayment} paid={month.repaid} />
        <div className="bd-columns">
          <IncomeFlowCard ym={ym} month={month} readOnly slices={pastSlices(month)} />
          {month.entered && <SettlementCard ym={ym} settlement={settlementOf(month)} />}
        </div>
      </>}
      {month && !isPast && <>
        <RepaymentCard planned={month.repayment + extra} paid={month.repaid} detail={detail} />
        <div className="bd-columns">
          <IncomeFlowCard ym={ym} month={month} repayment={month.repayment} onEnter={openAmount} />
          <AllocationCard ym={ym} available={available} loans={loans} allocation={allocation} applied={applied && draft?.ym !== ym} busy={busy}
            onChange={value => setDraft({ ym, value })} onReset={() => setDraft(null)} onApply={applyAllocation} />
        </div>
      </>}
      <p className="bd-footnote">{footnote}</p>
    </main>
    {notice && <div className="bd-toast" role="status">{notice}</div>}
    {dialog && <AmountDialog ym={ym} initial={dialog.initial} repayment={month.repayment} lastDay={selectableLastDay} onSave={saveMonth} onClose={() => setDialog(null)} />}
  </div>
}
