// 월별 예산 mock. 요청/응답 필드는 Notion 명세(월별 예산·재정정보 조회, 월별 재정정보 입력·수정, 여유자금 분배 반영)와 같다.
// 월별 입력값은 sessionStorage 에 둔다. 입력하지 않은 달은 온보딩에서 저장한 기본 재정정보(source: DEFAULT)로 채운다.
import { listLoans } from './loans.js'
import { getProfile } from './plans.js'

const KEY = 'loanrun-mock-budgets'
const read = () => { try { return JSON.parse(sessionStorage.getItem(KEY)) ?? { nextEntryId: 1, months: {} } } catch { return { nextEntryId: 1, months: {} } } }
const write = state => { try { sessionStorage.setItem(KEY, JSON.stringify(state)) } catch { /* mock 저장 실패는 무시 */ } }

const pad = n => String(n).padStart(2, '0')
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
export const isMonth = ym => /^\d{4}-(0[1-9]|1[0-2])$/.test(ym ?? '')
const sum = rows => rows.reduce((s, r) => s + r.amount, 0)

// 응답 본문(조회·저장 공통)
export function monthView(ym) {
  const state = read()
  const saved = state.months[ym]
  const profile = getProfile() ?? {}
  const incomeType = profile.income_type ?? 'REGULAR'
  const input = saved ?? { fixed: profile.fixed_essential_expenses ?? 0, variable: profile.variable_essential_expenses ?? 0, discretionary: profile.discretionary_expenses ?? 0, savings: profile.savings ?? 0, entries: [], allocation: null }
  const loans = listLoans()
  const scheduled = loans.reduce((s, l) => s + l.estimated_monthly_payment, 0)
  const isCurrent = ym === today().slice(0, 7)
  const actual = ym > today().slice(0, 7) ? 0 : isCurrent ? loans.filter(l => l.payment_day <= Number(today().slice(8))).reduce((s, l) => s + l.estimated_monthly_payment, 0) : scheduled
  const base = incomeType === 'REGULAR' ? (profile.monthly_income ?? 0) : 0
  const income = base + sum(input.entries)
  const available = income - scheduled - input.fixed - input.variable - input.discretionary - input.savings
  const allocation = input.allocation ?? { allocations: [], reserve_amount: 0, total_allocated: 0 }
  return {
    year_month: ym,
    monthly_income: income,
    income_type: incomeType,
    payday: profile.payday ?? null,
    essential_expenses: input.fixed + input.variable,
    discretionary_expenses: input.discretionary,
    savings: input.savings,
    emergency_fund: profile.emergency_fund ?? null,
    scheduled_repayment: scheduled,
    actual_repayment: actual,
    available_cash: available,
    allocation,
    data_status: saved ? 'ENTERED' : 'NOT_ENTERED',
    updated_at: saved?.updated_at ?? null,
    fixed_essential_expenses: input.fixed,
    variable_essential_expenses: input.variable,
    source: saved ? 'INPUT' : 'DEFAULT',
    planning_monthly_income: income,
    actual_available_cash: available,
    base_income: base,
    income_entries: input.entries.map(e => ({ income_entry_id: e.income_entry_id, entry_type: e.entry_type, received_date: e.received_date, amount: e.amount })),
    allocation_needs_review: Boolean(input.allocation) && allocation.total_allocated !== available,
  }
}

const isInt = n => Number.isInteger(n)

export function validateMonthBody(ym, b) {
  const errors = {}
  for (const key of ['fixed_essential_expenses', 'variable_essential_expenses', 'discretionary_expenses', 'savings']) {
    if (!(isInt(b[key]) && b[key] >= 0)) errors[key] = ['0 이상의 정수여야 합니다.']
  }
  if (b.income_entries !== undefined) {
    if (!Array.isArray(b.income_entries)) errors.income_entries = ['배열이어야 합니다.']
    else b.income_entries.forEach((e, i) => {
      const k = `income_entries[${i}]`
      if (!['EXTRA', 'IRREGULAR'].includes(e.entry_type)) errors[`${k}.entry_type`] = ['EXTRA 또는 IRREGULAR 만 가능합니다.']
      if (!(typeof e.received_date === 'string' && e.received_date.startsWith(ym) && e.received_date <= today())) errors[`${k}.received_date`] = ['해당 월의 오늘 이하 날짜여야 합니다.']
      if (!(isInt(e.amount) && e.amount >= 1)) errors[`${k}.amount`] = ['1원 이상이어야 합니다.']
    })
  }
  return errors
}

export function saveMonth(ym, b) {
  const state = read()
  const prev = state.months[ym]
  let entries = prev?.entries ?? []
  if (b.income_entries !== undefined) {
    entries = b.income_entries.map(e => {
      const id = e.income_entry_id ?? state.nextEntryId++
      return { income_entry_id: id, entry_type: e.entry_type, received_date: e.received_date, amount: e.amount }
    })
  }
  state.months[ym] = {
    fixed: b.fixed_essential_expenses, variable: b.variable_essential_expenses, discretionary: b.discretionary_expenses, savings: b.savings,
    entries, allocation: prev?.allocation ?? null, updated_at: new Date().toISOString(),
  }
  write(state)
  return monthView(ym)
}

export function validateAllocation(ym, b) {
  const errors = {}
  const loans = listLoans()
  const view = monthView(ym)
  if (!Array.isArray(b?.allocations)) errors.allocations = ['배열이어야 합니다.']
  else {
    const ids = new Set()
    b.allocations.forEach((a, i) => {
      if (!loans.some(l => l.loan_id === a.loan_id)) errors[`allocations[${i}].loan_id`] = ['등록한 대출이 아닙니다.']
      if (ids.has(a.loan_id)) errors[`allocations[${i}].loan_id`] = ['대출 ID가 중복됐습니다.']
      ids.add(a.loan_id)
      if (!(isInt(a.amount) && a.amount >= 0)) errors[`allocations[${i}].amount`] = ['0 이상의 정수여야 합니다.']
    })
  }
  if (!(isInt(b?.reserve_amount) && b.reserve_amount >= 0)) errors.reserve_amount = ['0 이상의 정수여야 합니다.']
  if (!Object.keys(errors).length) {
    const total = sum(b.allocations) + b.reserve_amount
    if (total !== view.available_cash) errors.allocations = [`배분 합계(${total})가 여유자금(${view.available_cash})과 같아야 합니다.`]
  }
  return errors
}

export function saveAllocation(ym, b) {
  const state = read()
  const prev = state.months[ym] ?? (() => { const v = monthView(ym); return { fixed: v.fixed_essential_expenses, variable: v.variable_essential_expenses, discretionary: v.discretionary_expenses, savings: v.savings, entries: [], updated_at: null } })()
  const total = sum(b.allocations) + b.reserve_amount
  state.months[ym] = { ...prev, allocation: { allocations: b.allocations.filter(a => a.amount > 0), reserve_amount: b.reserve_amount, total_allocated: total }, updated_at: new Date().toISOString() }
  write(state)
  const view = monthView(ym)
  return { year_month: ym, available_cash: view.available_cash, allocation: view.allocation, updated_plans: [], strategy_code: 'NONE', overall_plan_exists: false }
}

export function createIncomeEntry(b) {
  const ym = (b.received_date ?? '').slice(0, 7)
  const state = read()
  const view = monthView(ym)
  const prev = state.months[ym] ?? { fixed: view.fixed_essential_expenses, variable: view.variable_essential_expenses, discretionary: view.discretionary_expenses, savings: view.savings, entries: [], allocation: null }
  const entry = { income_entry_id: state.nextEntryId++, entry_type: b.entry_type, received_date: b.received_date, amount: b.amount }
  state.months[ym] = { ...prev, entries: [...prev.entries, entry], updated_at: new Date().toISOString() }
  write(state)
  const next = monthView(ym)
  return { entry, year_month: ym, monthly_income: next.monthly_income, planning_monthly_income: next.planning_monthly_income, available_cash: next.available_cash, actual_available_cash: next.actual_available_cash, allocation_needs_review: next.allocation_needs_review }
}

export function validateIncomeEntry(b) {
  const errors = {}
  if (!['EXTRA', 'IRREGULAR'].includes(b?.entry_type)) errors.entry_type = ['EXTRA 또는 IRREGULAR 만 가능합니다.']
  if (!(typeof b?.received_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.received_date) && b.received_date <= today())) errors.received_date = ['오늘 이하 날짜여야 합니다.']
  if (!(isInt(b?.amount) && b.amount >= 1)) errors.amount = ['1원 이상이어야 합니다.']
  return errors
}
