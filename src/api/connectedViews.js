
// Presentation only: preserve unknown amounts; never infer monthly completion.
export function monthlyRecords(monthly) {
  const rows = monthly.months.map(m => ({
    id: m.year_month,
    month: m.year_month,
    label: m.year_month,
    actual: m.actual_amount,
    principal: m.principal_amount,
    interest: m.interest_amount,
    extra: m.extra_amount,
    target: m.target_amount,
    observed: m.observed,
    paymentCount: m.payment_count
  }))

  return {
    rows,
    target: null,
    message: '현재까지 기록된 납부액이에요. 월 전체 실적의 확정을 의미하지 않으며, 기록이 없는 미확인 월은 —로 표시해요.',
    periodLabel: '조회 기간 합계'
  }
}

// Ledger totals describe recorded payments only, never completion of a month.
export async function withRecordedPayments(api, monthly, loan_id, signal) {
  if (
    !monthly.months.length ||
    monthly.months.every(row => row.observed === true || !row.payment_count)
  ) return monthly

  const months = monthly.months.map(row => row.year_month).sort()
  const last = months.at(-1)
  const [year, month] = last.split('-').map(Number)

  const records = []
  let page = 1

  do {
    const batch = await api.payments({
      loan_id,
      from: months[0] + '-01',
      to: last + '-' + new Date(Date.UTC(year, month, 0)).getUTCDate(),
      page,
      page_size: 100
    }, signal)

    records.push(...batch.results)
    page = batch.next_page
  } while (page)

  const grouped = new Map()

  for (const row of records) {
    const key = row.paid_at.slice(0, 7)

    if (!grouped.has(key)) {
      grouped.set(key, {
        actual_amount: 0,
        principal_amount: 0,
        extra_amount: 0,
        interest_amount: 0,
        fee_amount: 0
      })
    }

    const totals = grouped.get(key)

    for (const field of Object.keys(totals)) {
      totals[field] += field === 'actual_amount'
        ? row.amount
        : row[field]
    }
  }

  return {
    ...monthly,
    months: monthly.months.map(row => {
      const recorded = grouped.get(row.year_month)

      if (!recorded) return row

      return {
        ...row,
        ...Object.fromEntries(
          Object.entries(recorded).map(
            ([key, value]) => [key, row[key] ?? value]
          )
        ),
        recorded_payments: true
      }
    })
  }
}

export function homeLoanSummary(list) {
  const original = list.loans.reduce(
    (sum, l) => sum + l.original_principal, 0
  )

  const paid = list.loans.reduce(
    (sum, l) => sum + l.paid_principal, 0
  )

  const next = list.loans
    .filter(loan =>
      loan.status !== 'PAID' && loan.next_due_date
    )
    .sort((a, b) =>
      a.next_due_date.localeCompare(b.next_due_date) ||
      a.loan_id - b.loan_id
    )[0]

  return {
    loans: list.loans,

    total_remaining_principal:
      list.total_remaining_principal,

    total_monthly_due:
      list.total_monthly_due ?? null,

    overall_progress_percent:
      original > 0 ? paid / original * 100 : null,

    estimated_payoff_date:
      list.estimated_payoff_date ?? null,

    next_payment: next ? {
      loan_id: next.loan_id,
      product_name: next.product_name,
      due_date: next.next_due_date,
      required_amount: next.estimated_monthly_payment ?? null,
      principal_amount: next.estimated_monthly_principal ?? null,
      interest_amount: next.estimated_monthly_interest ?? null
    } : null
  }
}

export async function monthlyPayments(api, month, loan_id, signal) {
  const [year, number] = month.split('-').map(Number)

  const to = month + '-' +
    new Date(Date.UTC(year, number, 0)).getUTCDate()

  const results = []
  let page = 1

  do {
    const batch = await api.payments({
      loan_id,
      from: month + '-01',
      to,
      page,
      page_size: 100
    }, signal)

    results.push(...batch.results)
    page = batch.next_page
  } while (page)

  return results
}
