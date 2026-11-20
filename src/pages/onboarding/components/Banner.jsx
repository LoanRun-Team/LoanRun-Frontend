import info from '../../../assets/onboarding/icon-info.svg'

// 안내 배너. 연한 강조색 배경에 아이콘과 안내 문구를 보여 준다.
export default function Banner({ children }) {
  return <p className="ob-banner" role="note"><img src={info} alt="" width="20" height="20" /><span>{children}</span></p>
}
