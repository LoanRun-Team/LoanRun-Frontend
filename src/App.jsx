import { useEffect, useState } from 'react'
import Home from './pages/Home/Home.jsx'
import Loans from './pages/Loans/Loans.jsx'
import Settings from './pages/Settings/Settings.jsx'
import Onboarding from './pages/onboarding/Onboarding.jsx'
import Budget from './pages/Budget/Budget.jsx'
import Risk from './pages/Risk/Risk.jsx'
import Reports from './pages/Reports/Reports.jsx'
import { onboardingApi } from './api/index.js'
import { parseLiveFeatures } from './api/hybridFetch.js'

// 실서버의 온보딩을 쓰는 배포에서만 첫 방문자를 온보딩으로 보낸다
const env = import.meta.env
const redirectToOnboarding = env.VITE_API_MODE === 'real' || (env.VITE_API_MODE === 'hybrid' && parseLiveFeatures(env.VITE_LIVE_FEATURES).includes('onboarding'))

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
  const inOnboarding = path.startsWith('/onboarding')

  useEffect(() => {
    if (!redirectToOnboarding || inOnboarding) return
    let alive = true
    onboardingApi.getProgress().then(progress => {
      if (alive && progress.completed === false) {
        window.history.replaceState({}, '', '/onboarding')
        setLocation('/onboarding')
      }
    }).catch(() => {})
    return () => { alive = false }
  }, [inOnboarding])

  if (inOnboarding) {
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