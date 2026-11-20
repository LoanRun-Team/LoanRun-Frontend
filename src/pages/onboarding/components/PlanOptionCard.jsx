// 가로형 선택 카드(아이콘, 제목, 설명). 선택되면 강조색 테두리와 연한 배경이 된다.
export default function PlanOptionCard({ icon, title, description, selected, onSelect, name }) {
  return <button type="button" role="radio" aria-checked={selected} name={name} className={`ob-plan-option${selected ? ' selected' : ''}`} onClick={onSelect}>
    <span className="ob-plan-option-icon"><img src={icon} alt="" width="20" height="20" /></span>
    <span className="ob-plan-option-text"><strong>{title}</strong><span>{description}</span></span>
  </button>
}
