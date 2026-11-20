
import { loanView, paymentView } from './loanView.js'
import { loanTypes } from './format.js'
import {
  monthlyPayments,
  withRecordedPayments
} from './connectedViews.js'

export async function loadLoanWorkspace(
  api,
  { page, loanId, month, historyPage = 1 },
  signal
) {
  const [profile, list] = await Promise.all([
    api.profile(signal),
    api.loans(signal, 'ALL')
  ])

  const needsPlan = ['plan', 'edit'].includes(page)
  const selectedId = loanId == null ? null : Number(loanId)

  const [details, paymentData, plans, schedule, monthly] =
    await Promise.all([
      needsPlan
        ? Promise.all(
            list.loans.map(loan => {
              const selected =
                selectedId == null ||
                Number(loan.loan_id) === selectedId

              return selected
                ? api.loan(loan.loan_id, signal)
                : loan
            })
          )
        : list.loans,

      ['overview', 'history', 'plan'].includes(page)
        ? api.payments(
            {
              loan_id: loanId,
              page: page === 'history' ? historyPage : 1,
              page_size: page === 'history' ? 20 : 3
            },
            signal
          )
        : null,

      needsPlan
        ? api.plans(loanId, signal)
        : null,

      page === 'monthly'
        ? api.schedule({ loan_id: loanId, month }, signal)
        : null,

      ['segments', 'plan'].includes(page)
        ? api.monthly({ loan_id: loanId }, signal)
        : { months: [] }
    ])

  const savings = await Promise.all(
    details
      .filter(
        loan =>
          loan.repayment_method === 'BULLET' &&
          ['monthly', 'plan'].includes(page)
      )
      .map(loan => api.savings(loan.loan_id, signal))
  )

  const records =
    page === 'monthly'
      ? await monthlyPayments(api, month, loanId, signal)
      : paymentData?.results || []

  const chartMonthly =
    ['segments', 'plan'].includes(page)
      ? await withRecordedPayments(
          api,
          monthly,
          loanId,
          signal
        )
      : monthly

  return {
    profile,
    list,
    loans: details.map(loanView),
    history: records.map(paymentView),
    records,
    paymentData,
    plans,
    schedule,
    monthly: chartMonthly,

    savings: Object.fromEntries(
      savings.map(s => [s.loan_id, s])
    ),

    options: {
      loan_types: Object.entries(loanTypes).map(
        ([code, label]) => ({ code, label })
      ),
      institutions: []
    }
  }
}

export function paymentInput(row, dueId) {
  const body = {
    paid_at: row.date,
    amount: row.amount,
    payment_type:
      row.type === 'regular' ? 'REGULAR' : 'EXTRA',
    due_item_id:
      row.type === 'regular' ? dueId : null,
    savings_used_amount: row.usedSavings || 0
  }

  if (row.breakdown) {
    Object.assign(body, {
      principal_amount: row.breakdown.principal,
      extra_amount: row.breakdown.extra,
      interest_amount: row.breakdown.interest,
      fee_amount: row.breakdown.fee
    })
  }

  return body
}

export async function regularPaymentDue(api, loanId) {
  // REGULAR payments are allocated to the oldest
  // unpaid stored due, including earlier months.
  const loan = await api.loan(Number(loanId))
  const due = loan.next_payment

  if (!due?.due_item_id || due.outstanding_amount <= 0) {
    throw new Error(
      '납부할 정기 회차를 확인할 수 없어요. 상환 일정을 확인해 주세요.'
    )
  }

  return due.due_item_id
}
