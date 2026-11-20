
import {
  monthLabel,
  won,
  loanTypes,
  trackLabels,
  seoulToday
} from './format.js'

// New API fields take priority.
// Legacy fields are used only when a field is absent.
function apiValue(dto, key, fallback = null) {
  return dto[key] === undefined
    ? fallback
    : dto[key]
}

function sumAmounts(...values) {
  return values.some(value => value == null)
    ? null
    : values.reduce(
        (sum, value) => sum + Number(value),
        0
      )
}

// Calendar months rounded up.
export function remainingCalendarMonths(
  date,
  today = seoulToday()
) {
  if (!date) return null
  if (date <= today) return 0

  const [year, month, day] =
    date.split('-').map(Number)

  const [startYear, startMonth, startDay] =
    today.split('-').map(Number)

  const months =
    (year - startYear) * 12 +
    month -
    startMonth

  const anniversary = Math.min(
    startDay,
    new Date(Date.UTC(year, month, 0)).getUTCDate()
  )

  return months + (day > anniversary ? 1 : 0)
}

export function loanView(dto) {
  const paid = dto.status === 'PAID'

  const principalPayment = paid
    ? null
    : apiValue(
        dto,
        'estimated_monthly_principal',
        dto.next_payment?.principal_amount ?? null
      )

  const interestPayment = paid
    ? null
    : apiValue(
        dto,
        'estimated_monthly_interest',
        dto.next_payment?.interest_amount ?? null
      )

  const targetPayoffDate = paid
    ? null
    : apiValue(
        dto,
        'target_payoff_date',
        dto.plan?.target_payoff_date ??
          dto.maturity_date ??
          null
      )

  const estimatedPayoffDate = paid
    ? null
    : apiValue(
        dto,
        'estimated_payoff_date',
        dto.plan?.estimated_payoff_date ??
          dto.plan?.projected_payoff_date ??
          null
      )

  return {
    id: String(dto.loan_id),

    name: dto.product_name,
    bank: dto.institution_name,

    product:
      dto.institution_name +
      ' · ' +
      dto.product_name,

    balance: dto.remaining_principal,
    original: dto.original_principal,
    percent: dto.progress_percent,

    rate: dto.annual_rate,
    variable: dto.rate_type === 'VARIABLE',

    interest: won(dto.estimated_remaining_interest),

    principalPayment,
    interestPayment,

    payment: paid
      ? null
      : apiValue(
          dto,
          'estimated_monthly_payment',
          dto.contractual_monthly_payment ?? null
        ),

    day: dto.payment_day,

    finish: monthLabel(estimatedPayoffDate),

    nextDate: paid
      ? null
      : apiValue(
          dto,
          'next_due_date',
          dto.next_payment?.due_date ?? null
        ),

    targetPayoffDate,
    estimatedPayoffDate,

    actualProgress:
      dto.plan?.actual_progress_pct ?? null,

    type: loanTypes[dto.loan_type],

    dto
  }
}

export function paymentView(dto) {
  return {
    id: dto.payment_id,
    loanId: String(dto.loan_id),
    date: dto.paid_at.replaceAll('-', '.'),
    amount: dto.amount,

    principal: sumAmounts(
      dto.principal_amount,
      dto.extra_amount
    ),

    interest: dto.interest_amount,
    balance: null,

    type:
      dto.payment_type === 'EXTRA'
        ? 'extra'
        : 'regular'
  }
}

export function planView(plans, monthly, totals) {
  const plan = plans?.plans?.[0]
  const aggregate = plans?.aggregate

  const rows = (monthly?.months || [])
    .filter(m =>
      m.data_status === 'RECORDED' ||
      m.observed === true ||
      m.recorded_payments
    )
    .sort((a, b) =>
      a.year_month.localeCompare(b.year_month)
    )

  const planned = rows.every(
    m => m.target_amount != null
  )
    ? rows.map(m => m.target_amount)
    : rows.map(() => null)

  return {
    personality: {
      FAST: '빠른 상환',
      BALANCED: '균형 상환',
      STABLE: '생활 안정 우선'
    }[plan?.preference] || '직접 설정',

    finish:
      monthLabel(aggregate?.target_payoff_date),

    expected:
      monthLabel(aggregate?.projected_payoff_date),

    dday: plan?.d_day ?? '—',

    monthly: aggregate?.monthly_total_amount,
    base: aggregate?.monthly_basic_amount,
    extra: aggregate?.monthly_extra_amount,

    paceMessage:
      trackLabels[plan?.track?.status] ||
      '분석 자료가 부족해요',

    total: totals?.amount ?? null,

    principal: sumAmounts(
      totals?.principal_amount,
      totals?.extra_amount
    ),

    interest: totals?.interest_amount ?? null,

    periods: rows.map(m => m.year_month),

    principalRows: rows.map(m =>
      sumAmounts(
        m.principal_amount,
        m.extra_amount
      )
    ),

    interestRows: rows.map(
      m => m.interest_amount ?? null
    ),

    actual: rows.map(
      m => m.actual_amount ?? null
    ),

    planned,

    paymentDifference:
      plans?.progress?.difference ?? null,

    recordedOnly: rows.some(m =>
      m.observed === true ||
      m.recorded_payments
    ),

    paymentMessage:
      plans?.progress?.data_status === 'INSUFFICIENT'
        ? '계획 대비 비교 자료가 부족해요'
        : undefined
  }
}

export function segmentView(monthly) {
  const rows = (monthly?.months || [])
    .map(m => ({
      id: m.year_month,
      month: m.year_month,
      label: m.year_month,

      actual: m.actual_amount ?? null,
      principal: m.principal_amount ?? null,
      interest: m.interest_amount ?? null,
      extra: m.extra_amount ?? null,
      target: m.target_amount ?? null,

      observed: m.observed,
      paymentCount: m.payment_count
    }))

  const firstTarget = rows[0]?.target ?? null

  const commonTarget =
    firstTarget != null &&
    rows.every(row => row.target === firstTarget)
      ? firstTarget
      : null

  return {
    rows,
    target: commonTarget,

    message:
      '현재까지 기록된 납부액이에요. ' +
      '월 전체 실적의 확정을 의미하지 않으며, ' +
      '미확인 금액은 —로 표시해요.',

    periodLabel: '조회 기간 합계'
  }
}

export function savingsView(dto, loan, monthly) {
  if (!dto || !loan) return undefined

  const plan = loan.dto.plan || {}

  const target = loan.targetPayoffDate

  const targetAmount = dto.planned_saving_amount
  const actual = dto.actual_saving_amount
  const prepared = dto.savings_balance

  const remaining =
    dto.remaining_principal == null ||
    prepared == null
      ? null
      : Math.max(
          0,
          dto.remaining_principal - prepared
        )

  const savingMonths = (monthly?.months || [])
    .filter(r =>
      r.planned_saving_amount != null ||
      r.actual_saving_amount != null
    )
    .sort((a, b) =>
      a.year_month.localeCompare(b.year_month)
    )
    .map(r => ({
      month: r.year_month,

      target: r.planned_saving_amount ?? null,
      actual: r.actual_saving_amount ?? null,

      ongoing: r.observed === false,

      difference:
        r.observed === false ||
        r.planned_saving_amount == null ||
        r.actual_saving_amount == null
          ? null
          : r.actual_saving_amount -
            r.planned_saving_amount,

      balance: r.savings_balance ?? null
    }))

  return {
    prepared,
    remaining,

    monthlyTarget: targetAmount,
    monthlyActual: actual,

    cumulativePercent:
      dto.saving_progress_pct ?? null,

    monthlyPercent:
      targetAmount > 0 && actual != null
        ? actual / targetAmount * 100
        : null,

    principalPercent: loan.percent,

    // Interest only, not principal + interest.
    interest: loan.interestPayment,

    targetDate: target,

    estimatedPayoffDate:
      loan.estimatedPayoffDate,

    monthsLeft:
      remainingCalendarMonths(
        loan.dto.maturity_date
      ),

    shortfall:
      plan.saving_gap_amount == null
        ? null
        : Math.max(0, -plan.saving_gap_amount),

    savingGap:
      plan.saving_gap_amount ?? null,

    savedTotal:
      plan.cumulative_actual_saving_amount ?? null,

    savingMonths,
    shortfallRows: [],

    records: (dto.results || []).map(r => ({
      id: r.saving_id,
      date: r.saved_at,
      amount: r.amount,
      editable: r.editable
    })),

    comparisons: {
      all: {
        amount: prepared ?? null,
        interestSaving: null,
        fee: null,
        net: null
      },

      half: {
        amount:
          prepared == null
            ? null
            : Math.floor(prepared / 2),

        interestSaving: null,
        fee: null,
        net: null
      },

      custom: {
        amount: 0,
        interestSaving: null,
        fee: null,
        net: null
      }
    }
  }
}
