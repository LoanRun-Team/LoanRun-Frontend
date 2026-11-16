// Figma: Chip (Neutral, S24). onClick 이 있으면 누르면 바뀌는 칩(고정/변동 전환)으로 쓴다.
export default function Chip({ children, onClick, title }) {
  return onClick
    ? <button type="button" className="ob-chip" onClick={onClick} title={title}>{children}</button>
    : <span className="ob-chip">{children}</span>
}
