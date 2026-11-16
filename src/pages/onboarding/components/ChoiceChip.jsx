// Figma: RadioCard — 하나만 고르는 선택 칩. large 는 높이 56(소득 유형).
export default function ChoiceChip({ children, selected, onSelect, name, large = false }) {
  return <button type="button" role="radio" aria-checked={selected} name={name} className={`ob-choice${large ? ' large' : ''}${selected ? ' selected' : ''}`} onClick={onSelect}>{children}</button>
}
