// 예산·지출 화면의 계산과 표시용 값. 날짜는 'YYYY-MM'(월) / 'YYYY-MM-DD'(일) 문자열로 다룬다.
// 월별 값은 GET·PUT /api/budgets/{year_month}/ 응답(fromApi)을 화면 모델로 바꿔 쓴다.

export const fmt = n => Number(n).toLocaleString('ko-KR')
export const won = n => `${fmt(n)}원`

const pad = n => String(n).padStart(2, '0')
export const currentYM = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}` }
export const todayDay = () => new Date().getDate()
export const shiftYM = (ym, delta) => {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}
export const labelYM = ym => `${Number(ym.slice(0, 4))}년 ${Number(ym.slice(5, 7))}월`
export const monthName = ym => `${Number(ym.slice(5, 7))}월`
export const lastDayOf = ym => new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 0).getDate()
const WEEK = ['일', '월', '화', '수', '목', '금', '토']
export const dayLabel = (ym, day) => `${Number(ym.slice(5, 7))}.${pad(day)} (${WEEK[new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1, day).getDay()]})`

// 이번 달 기본 상환 일정(대출별 납부일·금액). 납부일이 그 달 말일보다 크면 말일로 맞춘다.
export function baseSchedule(loans, ym) {
  return loans
    .map(loan => ({ loan, day: Math.min(loan.payment_day, lastDayOf(ym)), amount: loan.estimated_monthly_payment }))
    .sort((a, b) => a.day - b.day)
}
export const nextPayDay = (schedule, today) => schedule.find(r => r.day > today)?.day ?? null

// ── 월별 예산 API ↔ 화면 모델 ───────────────────────────────────────────
// month = {
//   ym, entered, income_type: 'REGULAR'|'IRREGULAR', base_income, extras: [{id, day, amount}], receipts: [{id, day, amount}],
//   fixed, variable, discretionary, savings, repayment(정기 상환 예정), repaid(현재 상환액), available(여유자금),
//   allocation: { extras: { [loan_id]: 금액 }, reserve, total }, needsReview
// }
const entryRow = e => ({ id: e.income_entry_id, day: Number(e.received_date.slice(8)), amount: e.amount })
export const fromApi = d => ({
  ym: d.year_month,
  entered: d.source === 'INPUT',
  income_type: d.income_type,
  base_income: d.base_income ?? 0,
  extras: d.income_entries.filter(e => e.entry_type === 'EXTRA').map(entryRow),
  receipts: d.income_entries.filter(e => e.entry_type === 'IRREGULAR').map(entryRow),
  fixed: d.fixed_essential_expenses,
  variable: d.variable_essential_expenses,
  discretionary: d.discretionary_expenses,
  savings: d.savings,
  repayment: d.scheduled_repayment,
  repaid: d.actual_repayment,
  available: d.available_cash,
  allocation: { extras: Object.fromEntries(d.allocation.allocations.map(a => [a.loan_id, a.amount])), reserve: d.allocation.reserve_amount, total: d.allocation.total_allocated },
  needsReview: d.allocation_needs_review,
})

// PUT /api/budgets/{year_month}/ 요청 본문. income_entries 는 그 달 입금 목록 전체를 바꾼다(정기=EXTRA, 비정기=IRREGULAR).
export function toSaveBody(m, ym) {
  const regular = m.income_type === 'REGULAR'
  return {
    fixed_essential_expenses: m.fixed,
    variable_essential_expenses: m.variable,
    discretionary_expenses: m.discretionary,
    savings: m.savings,
    income_entries: (regular ? m.extras : m.receipts).map(r => ({
      ...(r.id ? { income_entry_id: r.id } : {}),
      entry_type: regular ? 'EXTRA' : 'IRREGULAR',
      received_date: `${ym}-${pad(r.day)}`,
      amount: r.amount,
    })),
  }
}
// PUT /api/budgets/{year_month}/allocation/ 요청 본문
export const toAllocationBody = (a, loans) => ({
  allocations: loans.map(l => ({ loan_id: l.loan_id, amount: a.extras[l.loan_id] || 0 })),
  reserve_amount: a.reserve || 0,
})

const sum = rows => rows.reduce((s, r) => s + (r.amount || 0), 0)
export const incomeTotal = m => (m.income_type === 'REGULAR' ? (m.base_income || 0) + sum(m.extras) : sum(m.receipts))
export const spendTotal = m => (m.fixed || 0) + (m.variable || 0) + (m.discretionary || 0) + (m.savings || 0)
// 여유자금 = 소득 − 정기 상환 − 필수·선택 지출 − 저축 (모달에서 입력하는 동안 미리 계산해 보여준다. 확정 값은 서버의 available_cash)
export const surplusOf = (m, repayment) => incomeTotal(m) - repayment - spendTotal(m)

export const SLICE_COLORS = { repay: '#229eb1', savings: '#72d5e3', fixed: '#4a6074', variable: '#647a8e', discretionary: '#9ca7b4', surplus: '#e0f4f6' }
export const pieSlices = (m, repayment) => [
  { key: 'repay', label: '정기 상환', value: repayment },
  { key: 'savings', label: '저축', value: m.savings || 0 },
  { key: 'fixed', label: '고정 필수', value: m.fixed || 0 },
  { key: 'variable', label: '변동 필수', value: m.variable || 0 },
  { key: 'discretionary', label: '선택 지출', value: m.discretionary || 0 },
  { key: 'surplus', label: '여유자금', value: Math.max(0, surplusOf(m, repayment)) },
].map(s => ({ ...s, color: SLICE_COLORS[s.key] }))

// ── 여유자금 분할 ──────────────────────────────────────────────────────
export const STEP = 10000
const TYPE_LABEL = { CREDIT: '신용대출', MORTGAGE: '주택담보대출', JEONSE: '전세자금대출', STUDENT: '학자금대출', AUTO: '자동차대출', OTHER: '기타' }
export const loanName = loan => (loan.loan_form === 'CREDIT_LINE' ? '마이너스통장' : (TYPE_LABEL[loan.loan_type] ?? loan.loan_type))

// 제안: 예비비 20,000원만 남기고, 나머지는 금리가 가장 높은 대출의 추가 상환에 배분한다.
export function suggestAllocation(available, loans) {
  const reserve = Math.min(Math.max(available, 0), 20000)
  const extras = Object.fromEntries(loans.map(l => [l.loan_id, 0]))
  const top = loans.toSorted((a, b) => b.annual_rate - a.annual_rate)[0]
  if (top) extras[top.loan_id] = Math.max(available, 0) - reserve
  return { extras, reserve }
}
export const allocationSum = a => Object.values(a.extras).reduce((s, v) => s + (v || 0), 0) + (a.reserve || 0)
export const extraTotal = a => Object.values(a.extras).reduce((s, v) => s + (v || 0), 0)
// 서버에 저장돼 있고 여유자금과 일치하면 "반영 완료"
export const isApplied = m => m.allocation.total > 0 && !m.needsReview && m.allocation.total === m.available

// 예상 완납 시점(YYYY-MM): 대출별로 월 상환액(+추가 상환)으로 갚는 데 걸리는 기간 중 가장 늦은 것
const periods = (principal, rate, pmt) => {
  if (pmt <= principal * rate) return Infinity
  return rate === 0 ? Math.ceil(principal / pmt) : Math.ceil(-Math.log(1 - (principal * rate) / pmt) / Math.log(1 + rate))
}
export function payoffYM(loans, extras = {}) {
  const now = currentYM()
  const months = loans.map(loan => {
    const principal = loan.loan_form === 'CREDIT_LINE' ? loan.used_amount : loan.remaining_principal
    const toMaturity = Math.max(1, (Number(loan.maturity_date.slice(0, 4)) - Number(now.slice(0, 4))) * 12 + Number(loan.maturity_date.slice(5, 7)) - Number(now.slice(5, 7)))
    if (loan.repayment_category === 'LUMP_SUM') return toMaturity
    return Math.min(toMaturity, periods(principal, loan.annual_rate / 1200, loan.estimated_monthly_payment + (extras[loan.loan_id] || 0)))
  })
  return months.length ? shiftYM(now, Math.max(...months)) : null
}

// ── 지난달(읽기 전용) ───────────────────────────────────────────────────
// 월별 예산 API 가 주는 값만으로 구성한다(상환액·저축·필수·선택 지출·여유자금과 그 배분).
export const pastSlices = m => [
  { key: 'repay', label: '상환', value: m.repaid || m.repayment, color: SLICE_COLORS.repay },
  { key: 'savings', label: '저축', value: m.savings || 0, color: SLICE_COLORS.savings },
  { key: 'essential', label: '필수 생활비', value: (m.fixed || 0) + (m.variable || 0), color: SLICE_COLORS.fixed },
  { key: 'discretionary', label: '선택 지출', value: m.discretionary || 0, color: SLICE_COLORS.discretionary },
  { key: 'leftover', label: '남은 돈', value: Math.max(0, m.available), color: SLICE_COLORS.surplus },
]
// 여유자금 사용 내역: 총 추가 상환, 예비비, 배분하지 않은 금액(이월)
export const settlementOf = m => {
  const extra = extraTotal(m.allocation)
  return { available: Math.max(0, m.available), extra, reserve: m.allocation.reserve, carry: Math.max(0, m.available - m.allocation.total) }
}
