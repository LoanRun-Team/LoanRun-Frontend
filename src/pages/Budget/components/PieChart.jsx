import { won } from '../budgetModel.js'

// Figma: 소득 흐름 원그래프 — 12시 방향부터 시계 방향, 조각마다 선으로 이름·금액을 연결한다. 아래에는 범례.
const W = 560
const H = 330
const CX = W / 2
const CY = 165
const R = 125
const MIN_GAP = 48

const point = (angle, radius) => [CX + radius * Math.cos(angle), CY + radius * Math.sin(angle)]

function layoutLabels(items) {
  // 같은 쪽 라벨끼리 최소 간격을 지키도록 위에서 아래로 밀어낸다.
  for (const side of ['left', 'right']) {
    const group = items.filter(i => i.side === side).sort((a, b) => a.ty - b.ty)
    group.forEach((item, i) => { if (i > 0) item.ty = Math.max(item.ty, group[i - 1].ty + MIN_GAP) })
    const overflow = group.length ? group.at(-1).ty - (H - 20) : 0
    if (overflow > 0) group.forEach(item => { item.ty -= overflow })
  }
  return items
}

export default function PieChart({ slices, label }) {
  const visible = slices.filter(s => s.value > 0)
  const total = visible.reduce((s, x) => s + x.value, 0)
  const arcs = visible.reduce((list, s) => {
    const start = list.length ? list.at(-1).end : -Math.PI / 2
    const sweep = (s.value / total) * Math.PI * 2
    return [...list, { ...s, start, end: start + sweep, mid: start + sweep / 2 }]
  }, [])
  const labels = layoutLabels(arcs.map(a => {
    const [ex, ey] = point(a.mid, R + 14)
    const side = Math.cos(a.mid) >= 0 ? 'right' : 'left'
    return { key: a.key, side, ex, ey, ty: ey }
  }))

  return <figure className="bd-pie">
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {arcs.length === 1
        ? <circle cx={CX} cy={CY} r={R} fill={arcs[0].color} />
        : arcs.map(a => {
          const [x1, y1] = point(a.start, R)
          const [x2, y2] = point(a.end, R)
          const large = a.end - a.start > Math.PI ? 1 : 0
          return <path key={a.key} d={`M${CX} ${CY} L${x1} ${y1} A${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`} fill={a.color} stroke="#fff" strokeWidth="1" />
        })}
      {arcs.map(a => {
        const l = labels.find(x => x.key === a.key)
        const [px, py] = point(a.mid, R - 2)
        const lx = l.side === 'right' ? CX + R + 40 : CX - R - 40
        const anchor = l.side === 'right' ? 'start' : 'end'
        return <g key={a.key}>
          <polyline points={`${px},${py} ${l.ex},${l.ey} ${lx - (l.side === 'right' ? 6 : -6)},${l.ty}`} fill="none" stroke="#9aa9b8" strokeWidth="1" />
          <text x={lx} y={l.ty - 6} textAnchor={anchor} className="bd-pie-name">{a.label}</text>
          <text x={lx} y={l.ty + 16} textAnchor={anchor} className="bd-pie-value">{won(a.value)}</text>
        </g>
      })}
    </svg>
    <figcaption>{slices.map(s => <span key={s.key}><i style={{ background: s.color }} />{s.label}</span>)}</figcaption>
  </figure>
}
