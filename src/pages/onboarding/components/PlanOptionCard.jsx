// Figma: SelectCard(가로형) — 아이콘 박스 40 + 제목 + 설명. selected 는 primary 2px + primary-light, 아이콘 박스 흰색.
export default function PlanOptionCard({ icon, title, description, selected, onSelect, name }) {
  return <button type="button" role="radio" aria-checked={selected} name={name} className={`ob-plan-option${selected ? ' selected' : ''}`} onClick={onSelect}>
    <span className="ob-plan-option-icon"><img src={icon} alt="" width="20" height="20" /></span>
    <span className="ob-plan-option-text"><strong>{title}</strong><span>{description}</span></span>
  </button>
}
