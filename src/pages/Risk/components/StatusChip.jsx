import { levelClass, levelLabel } from '../riskModel.js'

// Figma: Status chip — 안정(primary-light) / 주의(warning) / 위험(danger).
export default function StatusChip({ level }) {
  return <span className={`rk-chip ${levelClass(level)}`}>{levelLabel(level)}</span>
}
