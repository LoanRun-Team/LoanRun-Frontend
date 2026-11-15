import { clampPercent } from './chartGeometry.js'
import './Charts.scss'

export default function ProgressRing({ percent = 0, size = 88, thickness = 7.04, label }) {
  const value = clampPercent(percent)
  const radius = (size - thickness) / 2
  return <svg className="data-progress-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} data-percent={value}>
    <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--primary-light, #e0f4f6)" strokeWidth={thickness} />
    <circle className="data-ring-paid" cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--primary, #229eb1)" strokeWidth={thickness} pathLength="100" strokeDasharray={`${value} ${100 - value}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
  </svg>
}
