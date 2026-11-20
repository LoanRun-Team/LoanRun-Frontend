
// Presentation geometry only.
// Financial projections and repayment amounts come from API data.

export const nonNegative = value =>
  Number.isFinite(Number(value))
    ? Math.max(0, Number(value))
    : 0

export const clampPercent = value =>
  Math.min(100, nonNegative(value))

const nullableAmount = value =>
  value == null || !Number.isFinite(Number(value))
    ? null
    : nonNegative(value)

export function buildChartGeometry({
  rows = [],
  cumulative = false,
  maxValue = 0,
  target,
  width = 1032,
  height = 160,
  left = 56,
  top = 9
}) {
  const plotWidth = width - left
  const count = Math.max(rows.length, 1)

  const totals = {
    principal: 0,
    interest: 0,
    extra: 0,
    plan: 0
  }

  const missing = {
    principal: false,
    interest: false,
    extra: false,
    plan: false
  }

  const values = rows.map(row => {
    const next = {}

    for (const key of Object.keys(totals)) {
      // Extra repayment is optional for charts that
      // already include it in principal.
      const value = nullableAmount(
        key === 'extra' && row[key] === undefined
          ? 0
          : row[key]
      )

      if (value == null) {
        missing[key] = true
        next[key] = null
        continue
      }

      totals[key] += value

      next[key] = cumulative
        ? missing[key] ? null : totals[key]
        : value
    }

    const hasActual = [
      next.principal,
      next.interest,
      next.extra
    ].some(value => value != null)

    const total =
      nonNegative(next.principal) +
      nonNegative(next.interest) +
      nonNegative(next.extra)

    return {
      ...row,
      ...next,
      total,
      hasActual
    }
  })

  const domain = Math.max(
    1,
    nonNegative(maxValue),
    nonNegative(target),
    ...values.map(row =>
      Math.max(row.total, nonNegative(row.plan))
    )
  )

  const y = value =>
    top + height * (1 - nonNegative(value) / domain)

  const columns = values.map((row, index) => ({
    ...row,

    x: left + plotWidth * (index + 0.5) / count,

    principalHeight:
      nonNegative(row.principal) / domain * height,

    interestHeight:
      nonNegative(row.interest) / domain * height,

    extraHeight:
      nonNegative(row.extra) / domain * height,

    planY:
      row.plan == null ? null : y(row.plan)
  }))

  const planSegments = []
  let currentSegment = []

  for (const row of columns) {
    if (row.planY == null) {
      if (currentSegment.length) {
        planSegments.push(currentSegment.join(' '))
      }

      currentSegment = []
    } else {
      currentSegment.push(`${row.x},${row.planY}`)
    }
  }

  if (currentSegment.length) {
    planSegments.push(currentSegment.join(' '))
  }

  return {
    columns,
    domain,
    left,
    top,
    plotWidth,
    height,

    targetY:
      target == null ? null : y(target),

    points: planSegments.join(' '),
    planSegments
  }
}
