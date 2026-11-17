import { levelLabel } from '../riskModel.js'

// Figma: Status chip — 안정(primary-light) / 주의(warning) / 위험(danger). 높이 24, 가로 패딩 8.
export default function StatusChip({ level }) {
  return <span className={`rk-chip ${level.toLowerCase()}`}>{levelLabel(level)}</span>
}
