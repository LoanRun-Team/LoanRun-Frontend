import { useEffect, useState } from 'react'
import Home from './pages/Home/Home.jsx'
import Loans from './pages/Loans/Loans.jsx'
import Settings from './pages/Settings/Settings.jsx'

export default function App() {
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
  if (location.split('?')[0].startsWith('/settings')) return <Settings location={location} navigate={navigate} />
  return location.split('?')[0].startsWith('/loans')
    ? <Loans location={location} navigate={navigate} />
    : <Home navigate={navigate} />
}
