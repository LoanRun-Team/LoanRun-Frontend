import { useId } from 'react'
import { buildChartGeometry } from './chartGeometry.js'
import './Charts.scss'

export default function StackedBarChart({ rows = [], cumulative = false, accumulate = cumulative, maxValue, target, event, label = '상환 그래프' }) {
  const titleId = useId()
  const width = 1032
  const plotHeight = cumulative ? 160 : 200
  const top = cumulative ? 9 : 10
  const left = cumulative ? 56 : 44
  const chartHeight = cumulative ? 210 : 250
  const barWidth = cumulative ? 36 : 56
  const chart = buildChartGeometry({ rows, cumulative: accumulate, maxValue, target, width, height: plotHeight, left, top })
  const ticks = cumulative ? [1, .5, 0] : [1, 2 / 3, 1 / 3, 0]
  const axisLabel = value => value === 0 ? '0' : value >= 10000 ? `${Number((value / 10000).toFixed(1)).toLocaleString('ko-KR')}만` : value.toLocaleString('ko-KR')
  const showPlan = rows.some(row => row.plan != null)
  return <div className="data-chart-scroll">
    <svg className="data-bar-chart" viewBox={`0 0 ${width} ${chartHeight}`} role="img" aria-labelledby={titleId} data-domain={chart.domain}>
      <title id={titleId}>{label}</title>
      {ticks.map(fraction => {
        const y = top + plotHeight * (1 - fraction)
        return <g key={fraction}><line className="data-chart-grid" x1={left} x2={width} y1={y} y2={y} /><text className="data-chart-axis" x={left - 8} y={y + 5} textAnchor="end">{axisLabel(chart.domain * fraction)}</text></g>
      })}
      {chart.columns.map((row, index) => {
        const bottom = top + plotHeight
        return <g key={row.id ?? index} data-chart-column={index}>
          <rect className="data-chart-principal" x={row.x - barWidth / 2} y={bottom - row.principalHeight} width={barWidth} height={row.principalHeight} />
          <rect className="data-chart-interest" x={row.x - barWidth / 2} y={bottom - row.principalHeight - row.interestHeight} width={barWidth} height={row.interestHeight} />
          <rect className="data-chart-extra" x={row.x - barWidth / 2} y={bottom - row.principalHeight - row.interestHeight - row.extraHeight} width={barWidth} height={row.extraHeight} />
          <text className="data-chart-axis" x={row.x} y={bottom + (cumulative ? 32 : 36)} textAnchor="middle">{row.label}</text>
        </g>
      })}
      {chart.targetY != null && <line className="data-chart-plan" data-chart-target x1={left} x2={width} y1={chart.targetY} y2={chart.targetY} />}
      {showPlan && chart.columns.length > 0 && <><polyline className="data-chart-plan" data-chart-plan points={chart.points} />{chart.columns.map((row,index)=><circle className="data-chart-point" key={index} cx={row.x} cy={row.planY} r="3" />)}</>}
      {event && rows.length > 0 && (() => {
        const x = left + chart.plotWidth * Math.min(rows.length, Math.max(0, event.index)) / rows.length
        return <g><line className="data-chart-event" x1={x} x2={x} y1={top - 4} y2={top + plotHeight} /><text className="data-chart-event-label" x={x - 4} y={top + 10} textAnchor="end">{event.label}</text></g>
      })()}
      {rows.length === 0 && <text className="data-chart-axis" x={width / 2} y={top + plotHeight / 2} textAnchor="middle">표시할 상환 데이터가 없어요</text>}
    </svg>
  </div>
}
