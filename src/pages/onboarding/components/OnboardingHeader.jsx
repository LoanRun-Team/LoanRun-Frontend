import logo from '../../../assets/onboarding/logo.svg'

// Figma: OnboardingHeader (1440x72) — 로고 + 우측 캡션
export default function OnboardingHeader({ context = '대출 보유자 온보딩' }) {
  return <header className="onboarding-header">
    <img src={logo} alt="론런" width="31.7" height="16.7" />
    <p>{context}</p>
  </header>
}
