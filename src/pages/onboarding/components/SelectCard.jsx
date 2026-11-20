// 대출 형태 선택 카드. 2열로 배치하고 선택되면 라디오가 채워진다.
import radioSelected from '../../../assets/onboarding/radio-selected.svg'

export default function SelectCard({ label, icon, selected, onSelect, name }) {
  return <label className={`ob-select-card${selected ? ' selected' : ''}`}>
    <input type="radio" name={name} checked={selected} onChange={onSelect} />
    <span className="ob-select-icon"><img src={icon} alt="" width="24" height="24" /></span>
    <span className="ob-select-label">{label}</span>
    {selected ? <img className="ob-radio" src={radioSelected} alt="" width="22" height="22" /> : <span className="ob-radio" aria-hidden="true" />}
  </label>
}
