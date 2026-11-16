import info from '../../../assets/onboarding/icon-info.svg'

// Figma: Banner (Info) — primary-light 배경 + 아이콘 + 안내 문구
export default function Banner({ children }) {
  return <p className="ob-banner" role="note"><img src={info} alt="" width="20" height="20" /><span>{children}</span></p>
}
