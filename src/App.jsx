import { useEffect, useState } from 'react'
import Home from './pages/Home/Home.jsx'
import Loans from './pages/Loans/Loans.jsx'
import Onboarding from './pages/onboarding/Onboarding.jsx'

export default function App({ loanData, homeData }) {
  const [location, setLocation] = useState(() => window.location.pathname + window.location.search)
  useEffect(() => {
    const update = () => setLocation(window.location.pathname + window.location.search)
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])
  function navigate(href) {
    if (href !== window.location.pathname + window.location.search) window.history.pushState({}, '', href)
    setLocation(window.location.pathname + window.location.search)
    window.scrollTo(0, 0)
  }
  const path = location.split('?')[0]
  if (path.startsWith('/onboarding')) return <Onboarding location={location} navigate={navigate} />
  return path.startsWith('/loans')
    ? <Loans location={location} navigate={navigate} apiData={loanData} />
    : <Home navigate={navigate} apiData={homeData} />
}
