import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar/Sidebar.jsx'
import { onboardingApi } from '../../api/index.js'
import MonthSwitcher from './components/MonthSwitcher.jsx'
import RepaymentCard from './components/RepaymentCard.jsx'
import { baseSchedule, baseTotal, currentYM, paidSoFar, shiftYM, todayDay } from './budgetModel.js'
import './Budget.scss'

const footnote = '모든 날짜와 금액은 예시 계산이에요 (주담대 연 3.08%, 신용대출 연 5.8% 가정).'

// 예산·지출. 대출 목록은 온보딩에서 등록한 대출(GET /api/loans/)을 쓴다.
export default function Budget({ navigate }) {
  const thisMonth = currentYM()
  const [ym, setYm] = useState(thisMonth)
  const [loans, setLoans] = useState([])

  useEffect(() => {
    const controller = new AbortController()
    onboardingApi.listLoans({ signal: controller.signal }).then(data => setLoans(data.loans), () => {})
    return () => controller.abort()
  }, [])
  useEffect(() => { document.title = '론런 | 예산·지출' }, [])

  function onNavigate(item) {
    if (item.id === 'home') navigate('/')
    else if (item.id === 'loans' || item.parent === 'loans') navigate(item.href)
  }

  const schedule = baseSchedule(loans, ym)
  return <div className="budget-shell">
    <Sidebar active="budget" onNavigate={onNavigate} />
    <main className="bd-content" id="main-content">
      <header className="bd-header">
        <h1>예산·지출</h1>
        <MonthSwitcher ym={ym} canPrev={false} canNext={ym < thisMonth} onPrev={() => setYm(shiftYM(ym, -1))} onNext={() => setYm(shiftYM(ym, 1))} />
      </header>
      <RepaymentCard planned={baseTotal(schedule)} paid={paidSoFar(schedule, todayDay())} />
      <p className="bd-footnote">{footnote}</p>
    </main>
  </div>
}
