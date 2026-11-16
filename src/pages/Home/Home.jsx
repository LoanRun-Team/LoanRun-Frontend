import { useState } from 'react'
import DetailDialog from './components/DetailDialog.jsx'
import Sidebar from '../../components/Sidebar/Sidebar.jsx'
import LoanOverview from './components/LoanOverview.jsx'
import MonthlyRepayment from './components/MonthlyRepayment.jsx'
import RiskCard from './components/RiskCard.jsx'
import { homeScreens } from './data.js'
import infoIcon from '../../assets/home/rate-change-info.svg'
import closeIcon from '../../assets/home/close.svg'
import './Home.scss'

function Home({ navigate, apiData }) {
  const screenKey = new URLSearchParams(window.location.search).get('screen') || 'pro'
  const screen = homeScreens[screenKey] || homeScreens.pro
  const [bannerVisible, setBannerVisible] = useState(screen.rateChanged)
  const [panel, setPanel] = useState(null)
  return (
    <div className={`app-shell${screen.plan === 'Free' ? ' is-free' : ''}`}>
      <Sidebar plan={screen.plan} onNavigate={item => item.id === 'loans' ? navigate('/loans') : item.id === 'budget' ? navigate('/budget') : item.id === 'risk' ? navigate('/risk') : setPanel(item.id === 'home' ? null : item.label)} />
      <main className="home-content" id="main-content">
        <h1>안녕하세요, 민준님.</h1>
        {bannerVisible && <div className="rate-banner" role="status">
          <img src={infoIcon} alt="" /><p>이번 달부터 주택담보대출 금리가 3.08%로 바뀌었어요 · 월 납부 약 −14,800원</p>
          <button className="icon-button" aria-label="금리 변경 안내 닫기" onClick={() => setBannerVisible(false)}><img src={closeIcon} alt="" /></button>
        </div>}
        <LoanOverview loans={apiData?.loans} example={screen.example} onViewAll={() => navigate('/loans')} />
        <div className="dashboard-row">
          <MonthlyRepayment summary={apiData?.repayment} onNavigate={label => label === '이번 달 상환' ? navigate('/loans/monthly') : setPanel(label)} />
          <RiskCard markerPercent={apiData?.risk?.markerPercent} riskLabel={apiData?.risk?.label} plan={screen.plan} showPro={!screen.rateChanged} onNavigate={setPanel} />
        </div>
        <section className="card report-banner" aria-label="상환 리포트"><p>상환 리포트 업데이트됨</p><button className="outline-button" onClick={() => setPanel('상환 리포트')}>보기</button></section>
        <p className="footnote">모든 날짜와 금액은 예시 계산이에요 (주담대 연 3.08%, 신용대출 연 5.8% 가정).</p>
      </main>
      {panel && <DetailDialog title={panel} onClose={() => setPanel(null)} />}
    </div>
  )
}
export default Home
