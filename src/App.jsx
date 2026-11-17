import { useEffect, useState } from 'react'
import Home from './pages/Home/Home.jsx'
import Loans from './pages/Loans/Loans.jsx'
import Settings from './pages/Settings/Settings.jsx'
import Onboarding from './pages/onboarding/Onboarding.jsx'
import Budget from './pages/Budget/Budget.jsx'
import Risk from './pages/Risk/Risk.jsx'
import Reports from './pages/Reports/Reports.jsx'

export default function App() {
  const [location, setLocation] = useState(
    () => window.location.pathname + window.location.search
  )

  useEffect(() => {
    const update = () =>
      setLocation(window.location.pathname + window.location.search)

    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])

  function navigate(href) {
    if (href !== window.location.pathname + window.location.search) {
      window.history.pushState({}, '', href)
    }

    setLocation(window.location.pathname + window.location.search)
    window.scrollTo(0, 0)
  }

  const path = location.split('?')[0]

  if (path.startsWith('/onboarding')) {
    return <Onboarding location={location} navigate={navigate} />
  }
  if (path.startsWith('/settings')) {
    return <Settings location={location} navigate={navigate} />
  }
  if (path.startsWith('/budget')) {
    return <Budget navigate={navigate} />
  }
  if (path.startsWith('/risk')) {
    return <Risk navigate={navigate} />
  }
  if (path.startsWith('/reports')) {
    return <Reports navigate={navigate} />
  }
  if (path.startsWith('/loans')) {
    return <Loans location={location} navigate={navigate} />
  }

  return <Home navigate={navigate} />
}