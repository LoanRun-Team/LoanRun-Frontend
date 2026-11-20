import { levelClass, levelLabel } from '../riskModel.js'

// 상태 칩. 안정, 주의, 위험 세 가지 색을 쓴다.
export default function StatusChip({ level }) {
  return <span className={`rk-chip ${levelClass(level)}`}>{levelLabel(level)}</span>
}
