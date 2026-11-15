// Presentation geometry only. Financial projections and repayment amounts come from API data.
export const nonNegative = value => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0
export const clampPercent = value => Math.min(100, nonNegative(value))
export function buildChartGeometry({ rows = [], cumulative = false, maxValue = 0, target, width = 1032, height = 160, left = 56, top = 9 }) {
  const plotWidth = width - left
  const count = Math.max(rows.length, 1)
  const totals = { principal: 0, interest: 0, extra: 0, plan: 0 }
  const values = rows.map(row => {
    const next = {}
    for (const key of Object.keys(totals)) {
      const value = nonNegative(row[key])
      totals[key] += value
      next[key] = cumulative ? totals[key] : value
    }
    return { ...row, ...next, total: next.principal + next.interest + next.extra }
  })
  const domain = Math.max(1, nonNegative(maxValue), nonNegative(target), ...values.map(row => Math.max(row.total, row.plan)))
  const y = value => top + height * (1 - nonNegative(value) / domain)
  const columns = values.map((row, index) => ({
    ...row,
    x: left + plotWidth * (index + .5) / count,
    principalHeight: row.principal / domain * height,
    interestHeight: row.interest / domain * height,
    extraHeight: row.extra / domain * height,
    planY: y(row.plan),
  }))
  return { columns, domain, left, top, plotWidth, height, targetY: target == null ? null : y(target), points: columns.map(row => `${row.x},${row.planY}`).join(' ') }
}
