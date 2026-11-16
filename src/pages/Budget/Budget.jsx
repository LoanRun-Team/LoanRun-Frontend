import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar/Sidebar.jsx'
import { onboardingApi } from '../../api/index.js'
import MonthSwitcher from './components/MonthSwitcher.jsx'
import RepaymentCard from './components/RepaymentCard.jsx'
import IncomeFlowCard from './components/IncomeFlowCard.jsx'
import AllocationCard from './components/AllocationCard.jsx'
import AmountDialog from './components/AmountDialog.jsx'
import {
  allocationSum, baseSchedule, baseTotal, currentYM, defaultMonth, extraTotal, lastDayOf, loadMonths, nextPayDay, paidSoFar,
  saveMonths, shiftYM, suggestAllocation, surplusOf, todayDay,
} from './budgetModel.js'
import './Budget.scss'

const footnote = '모든 날짜와 금액은 예시 계산이에요 (주담대 연 3.08%, 신용대출 연 5.8% 가정).'

// 예산·지출. 대출 목록은 온보딩에서 등록한 대출(GET /api/loans/), 입력 기본값은 기본 재정정보(GET /api/budgets/profile/)를 쓴다.
export default function Budget({ navigate }) {
  const thisMonth = currentYM()
  const [ym, setYm] = useState(thisMonth)
  const [loans, setLoans] = useState([])
  const [profile, setProfile] = useState(null)
  const [months, setMonths] = useState(loadMonths)
  const [dialog, setDialog] = useState(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    onboardingApi.listLoans({ signal: controller.signal }).then(data => setLoans(data.loans), () => {})
    onboardingApi.getBudgetProfile({ signal: controller.signal }).then(setProfile, () => {})
    return () => controller.abort()
  }, [])
  useEffect(() => { document.title = '론런 | 예산·지출' }, [])
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(''), 3000); return () => clearTimeout(t) }, [notice])

  function onNavigate(item) {
    if (item.id === 'home') navigate('/')
    else if (item.id === 'loans' || item.parent === 'loans') navigate(item.href)
  }

  const today = todayDay()
  const schedule = baseSchedule(loans, ym)
  const repayment = baseTotal(schedule)
  const month = months[ym]
  // 금액을 입력하기 전에는 온보딩에서 저장한 기본 재정정보로 여유자금을 미리 계산한다.
  const basis = month ?? (profile ? defaultMonth(profile) : null)
  const available = basis ? surplusOf(basis, repayment) : 0
  // 저장된 분할이 현재 여유자금과 다른 기준이면(금액을 다시 입력한 경우) 버리고 새로 제안한다.
  const stored = month?.allocation
  const allocation = stored && stored.forAvailable === available ? stored : { ...suggestAllocation(available, loans), forAvailable: available }
  const extra = extraTotal(allocation)
  const mismatch = available > 0 && allocationSum(allocation) !== available

  function update(patch) {
    const all = { ...months, [ym]: { ...(month ?? defaultMonth(profile)), ...patch } }
    setMonths(all)
    saveMonths(all)
  }
  function openAmount() {
    const base = month ?? defaultMonth(profile)
    const needsRow = base.income_type === 'IRREGULAR' && base.receipts.length === 0
    setDialog({ initial: needsRow ? { ...base, receipts: [{ day: Math.min(lastDayOf(ym), today), amount: null }] } : base })
  }
  function saveMonth(next) {
    update(next)
    setDialog(null)
    setNotice('이번 달 금액을 저장했어요')
  }
  const changeAllocation = next => update({ allocation: { ...next, forAvailable: available } })
  const applyAllocation = () => { update({ allocation: { ...allocation, applied: true } }); setNotice('여유자금 분할을 반영했어요') }
  const resetAllocation = () => update({ allocation: { ...suggestAllocation(available, loans), forAvailable: available } })

  const detail = mismatch ? { ym, base: repayment, extra, applied: allocation.applied, schedule, nextDay: nextPayDay(schedule, today), extraLoanIds: Object.entries(allocation.extras).filter(([, v]) => v > 0).map(([id]) => Number(id)) } : null
  return <div className="budget-shell">
    <Sidebar active="budget" onNavigate={onNavigate} />
    <main className="bd-content" id="main-content">
      <header className="bd-header">
        <h1>예산·지출</h1>
        <MonthSwitcher ym={ym} canPrev={false} canNext={ym < thisMonth} onPrev={() => setYm(shiftYM(ym, -1))} onNext={() => setYm(shiftYM(ym, 1))} />
      </header>
      <RepaymentCard planned={repayment + extra} paid={paidSoFar(schedule, today)} detail={detail} />
      <div className="bd-columns">
        <IncomeFlowCard ym={ym} month={month} repayment={repayment} onEnter={openAmount} />
        <AllocationCard ym={ym} available={available} loans={loans} allocation={allocation} onChange={changeAllocation} onReset={resetAllocation} onApply={applyAllocation} />
      </div>
      <p className="bd-footnote">{footnote}</p>
    </main>
    {notice && <div className="bd-toast" role="status">{notice}</div>}
    {dialog && <AmountDialog ym={ym} initial={dialog.initial} repayment={repayment} lastDay={lastDayOf(ym)} onSave={saveMonth} onClose={() => setDialog(null)} />}
  </div>
}
