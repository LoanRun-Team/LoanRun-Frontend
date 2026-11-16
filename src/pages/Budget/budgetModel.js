// 예산·지출 화면의 계산과 표시용 값. 날짜는 'YYYY-MM'(월) / 'YYYY-MM-DD'(일) 문자열로 다룬다.
// 대출 목록과 기본 재정정보는 온보딩에서 쓰는 API(mock)에서 받는다.

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
export const baseTotal = schedule => schedule.reduce((s, r) => s + r.amount, 0)
// 오늘까지 납부일이 지난 기본 상환 합계(현재 상환액), 다음 납부일
export const paidSoFar = (schedule, today) => schedule.filter(r => r.day <= today).reduce((s, r) => s + r.amount, 0)
export const nextPayDay = (schedule, today) => schedule.find(r => r.day > today)?.day ?? null

// ── 월별 입력값(소득·지출) ─────────────────────────────────────────────
// month = { entered, income_type: 'REGULAR'|'IRREGULAR', base_income, extras: [{day, amount}], receipts: [{day, amount}], fixed, variable, discretionary, savings }
// TODO: 월별 예산 API(GET·PUT /api/budgets/{year_month}/) 응답 필드를 확인하면 저장소 대신 API 로 바꾼다.
const STORAGE_KEY = 'loanrun-budget-v1'
export const loadMonths = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {} } catch { return {} } }
export const saveMonths = months => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(months)) } catch { /* 저장 공간이 없어도 화면은 계속 쓸 수 있다 */ } }

// 온보딩에서 저장한 기본 재정정보(GET /api/budgets/profile/)로 입력 기본값을 만든다.
export const defaultMonth = profile => ({
  entered: false,
  income_type: profile?.income_type ?? 'REGULAR',
  base_income: profile?.monthly_income ?? null,
  extras: [],
  receipts: [],
  fixed: profile?.fixed_essential_expenses ?? null,
  variable: profile?.variable_essential_expenses ?? null,
  discretionary: profile?.discretionary_expenses ?? null,
  savings: profile?.savings ?? null,
})

const sum = rows => rows.reduce((s, r) => s + (r.amount || 0), 0)
export const incomeTotal = m => (m.income_type === 'REGULAR' ? (m.base_income || 0) + sum(m.extras) : sum(m.receipts))
export const spendTotal = m => (m.fixed || 0) + (m.variable || 0) + (m.discretionary || 0) + (m.savings || 0)
// 여유자금 = 소득 − 정기 상환 − 필수·선택 지출 − 저축 (음수면 지출이 소득보다 큰 것)
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
