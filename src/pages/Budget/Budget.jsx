import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar/Sidebar.jsx'
import { onboardingApi } from '../../api/index.js'
import MonthSwitcher from './components/MonthSwitcher.jsx'
import RepaymentCard from './components/RepaymentCard.jsx'
import IncomeFlowCard from './components/IncomeFlowCard.jsx'
import AmountDialog from './components/AmountDialog.jsx'
import { baseSchedule, baseTotal, currentYM, defaultMonth, lastDayOf, loadMonths, paidSoFar, saveMonths, shiftYM, todayDay } from './budgetModel.js'
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

  const schedule = baseSchedule(loans, ym)
  const repayment = baseTotal(schedule)
  const month = months[ym]

  function openAmount() {
    const base = month ?? defaultMonth(profile)
    const needsRow = base.income_type === 'IRREGULAR' && base.receipts.length === 0
    setDialog({ initial: needsRow ? { ...base, receipts: [{ day: Math.min(lastDayOf(ym), todayDay()), amount: null }] } : base })
  }
  function saveMonth(next) {
    const all = { ...months, [ym]: next }
    setMonths(all)
    saveMonths(all)
    setDialog(null)
    setNotice('이번 달 금액을 저장했어요')
  }

  return <div className="budget-shell">
    <Sidebar active="budget" onNavigate={onNavigate} />
    <main className="bd-content" id="main-content">
      <header className="bd-header">
        <h1>예산·지출</h1>
        <MonthSwitcher ym={ym} canPrev={false} canNext={ym < thisMonth} onPrev={() => setYm(shiftYM(ym, -1))} onNext={() => setYm(shiftYM(ym, 1))} />
      </header>
      <RepaymentCard planned={repayment} paid={paidSoFar(schedule, todayDay())} />
      <div className="bd-columns">
        <IncomeFlowCard ym={ym} month={month} repayment={repayment} onEnter={openAmount} />
      </div>
      <p className="bd-footnote">{footnote}</p>
    </main>
    {notice && <div className="bd-toast" role="status">{notice}</div>}
    {dialog && <AmountDialog ym={ym} initial={dialog.initial} repayment={repayment} lastDay={lastDayOf(ym)} onSave={saveMonth} onClose={() => setDialog(null)} />}
  </div>
}
