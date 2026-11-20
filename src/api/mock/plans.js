// 상환 계획·재정정보·온보딩 완료 mock. 필드는 Notion 명세와 같다.
// 계산식은 화면 확인용 근사치이고 실제 계산은 서버가 한다.
import { listLoans } from './loans.js'

const KEY = 'loanrun-mock-onboarding'
const read = () => { try { return JSON.parse(sessionStorage.getItem(KEY)) ?? {} } catch { return {} } }
const write = patch => { try { sessionStorage.setItem(KEY, JSON.stringify({ ...read(), ...patch })) } catch { /* mock 저장 실패는 무시 */ } }

const MODES = ['MATURITY', 'PREFERENCE', 'TARGET_DATE', 'EXTRA_AMOUNT', 'MONTHLY_AMOUNT']
const PREFERENCES = ['FAST', 'BALANCED', 'STABLE']

const today = () => new Date().toISOString().slice(0, 10)
const monthsBetween = (a, b) => {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  return (by - ay) * 12 + (bm - am) - (bd < ad ? 1 : 0)
}
function addMonths(iso, n) {
  const [y, m, d] = iso.split('-').map(Number)
  const last = new Date(y, m - 1 + n + 1, 0).getDate()
  const date = new Date(y, m - 1 + n, Math.min(d, last))
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const annuity = (principal, rate, n) => (rate === 0 ? principal / n : (principal * rate) / (1 - (1 + rate) ** -n))
// 월 pmt 를 갚을 때 원금 principal 을 다 갚는 데 걸리는 개월 수
const periods = (principal, rate, pmt) => {
  if (pmt <= principal * rate) return Infinity
  return rate === 0 ? Math.ceil(principal / pmt) : Math.ceil(-Math.log(1 - (principal * rate) / pmt) / Math.log(1 + rate))
}
const round1000 = n => Math.round(n / 1000) * 1000

// 성향 금액 = 가계 반복 월 배분 가능액(여유자금 B, 음수면 0)의 80/50/0%. 원 단위 반올림.
const PREFERENCE_PCT = { FAST: 80, BALANCED: 50, STABLE: 0 }
function householdCap() {
  const p = read().profile
  if (!p) return 0
  const scheduled = listLoans().reduce((sum, l) => sum + l.estimated_monthly_payment, 0)
  return Math.max(0, (p.monthly_income ?? 0) - scheduled - (p.fixed_essential_expenses ?? 0) - (p.variable_essential_expenses ?? 0) - (p.discretionary_expenses ?? 0) - (p.savings ?? 0))
}
// 우선순위는 변동금리 중 잔액이 큰 순, 그다음 고정금리 중 금리가 높은 순이다. 성향 금액은 1순위부터 잔액 한도까지 채운다.
function allocatePreference(loans, preference) {
  let left = Math.round(householdCap() * (PREFERENCE_PCT[preference] ?? 0) / 100)
  const order = loans.filter(l => l.repayment_category !== 'LUMP_SUM').sort((a, b) => (a.rate_type === b.rate_type ? (a.rate_type === 'VARIABLE' ? b.remaining_principal - a.remaining_principal : b.annual_rate - a.annual_rate) : (a.rate_type === 'VARIABLE' ? -1 : 1)))
  return new Map(order.map((l, i) => { const amount = Math.min(left, l.remaining_principal); left -= amount; return [l.loan_id, { amount, priority: i + 1 }] }))
}

function planFor(loan, input) {
  const principal = loan.remaining_principal
  const rate = loan.annual_rate / 1200
  const lump = loan.repayment_category === 'LUMP_SUM'
  const interest = Math.round(principal * rate)
  const base = lump ? interest : loan.estimated_monthly_payment
  const remaining = Math.max(1, monthsBetween(today(), loan.maturity_date))
  const mode = input.mode ?? 'MATURITY'
  let monthly = base
  let months = remaining
  // 만기일시: 목표일까지 상환자금을 적립한다. 필요 월 적립액 = ceil(max(잔액 − 적립 잔액, 0) / 남은 적립 회차)
  const savingsBalance = lump ? (loan.initial_savings_balance ?? 0) : 0
  const need = Math.max(principal - savingsBalance, 0)

  switch (mode) {
    case 'PREFERENCE': {
      if (!lump && input._allocation) { monthly = base + input._allocation.amount; months = Math.min(remaining, periods(principal, rate, monthly)); break }
      const share = { FAST: lump ? 24 : 0.5, BALANCED: lump ? 48 : 0.25, STABLE: lump ? 96 : 0 }[input.preference] ?? 0
      monthly = lump ? interest + Math.round(principal / share / 1000) * 1000 : base + round1000(base * share)
      months = Math.min(remaining, periods(principal, rate, monthly))
      break
    }
    case 'TARGET_DATE': {
      months = Math.max(1, Math.min(remaining, monthsBetween(today(), input.target_date)))
      monthly = lump ? interest + Math.ceil(need / months) : Math.max(base, Math.round(annuity(principal, rate, months)))
      break
    }
    case 'EXTRA_AMOUNT': monthly = base + (input.extra_monthly_payment ?? 0); months = Math.min(remaining, periods(principal, rate, monthly)); break
    case 'MONTHLY_AMOUNT':
      monthly = input.monthly_amount ?? base
      months = lump ? Math.min(remaining, Math.ceil(need / Math.max(1, monthly - interest))) : Math.min(remaining, periods(principal, rate, monthly))
      break
    default: months = remaining
  }
  const payoff = mode === 'MATURITY' ? loan.maturity_date : mode === 'TARGET_DATE' ? input.target_date : addMonths(today(), Number.isFinite(months) ? months : remaining)
  const extra = lump ? Math.max(0, monthly - interest) : Math.max(0, monthly - base)
  const saving = lump ? Math.max(0, monthly - interest) : 0
  return {
    loan_id: loan.loan_id, mode, preference: input.preference ?? null, target_date: input.target_date ?? null, priority: input._allocation?.priority ?? null,
    extra_monthly_payment: extra, monthly_amount: monthly,
    estimated_payoff_date: payoff, estimated_total_interest: Math.round(principal * rate * (months / 2)),
    effective_date: addMonths(today(), 1), target_payoff_date: payoff, projected_payoff_date: payoff,
    repayment_category: loan.repayment_category,
    planned_progress_pct: 0, actual_progress_pct: 0, planned_extra_amount: extra, actual_extra_amount: 0, extra_gap_amount: -extra,
    payoff_delay_months: 0, track: { status: 'ON_TRACK', data_status: 'SUFFICIENT' },
    cumulative_planned_extra_amount: 0, cumulative_actual_extra_amount: 0, cumulative_extra_gap_amount: 0, d_day: null,
    savings_balance: savingsBalance, required_monthly_saving: lump && mode === 'TARGET_DATE' ? saving : 0, planned_saving_amount: input.planned_saving_amount ?? saving, saving_target_amount: lump ? need : null,
    _base: base, _months_saved: Math.max(0, remaining - months),
  }
}

export function validatePlans(body) {
  const errors = {}
  const plans = body?.plans
  if (!Array.isArray(plans) || plans.length === 0) { errors.plans = ['1개 이상의 계획이 필요합니다.']; return errors }
  const loans = listLoans()
  plans.forEach((p, i) => {
    const key = `plans[${i}]`
    if (!loans.some(l => l.loan_id === p.loan_id)) errors[`${key}.loan_id`] = ['활성 대출을 찾을 수 없습니다.']
    if (!MODES.includes(p.mode)) errors[`${key}.mode`] = ['지원하지 않는 모드입니다.']
    if (p.mode === 'PREFERENCE' && !PREFERENCES.includes(p.preference)) errors[`${key}.preference`] = ['FAST, BALANCED, STABLE 중 하나여야 합니다.']
    if (p.mode === 'TARGET_DATE' && !/^\d{4}-\d{2}-\d{2}$/.test(p.target_date ?? '')) errors[`${key}.target_date`] = ['목표 완납일이 필요합니다.']
    if (p.mode === 'EXTRA_AMOUNT' && !(Number.isInteger(p.extra_monthly_payment) && p.extra_monthly_payment >= 0)) errors[`${key}.extra_monthly_payment`] = ['0 이상의 정수여야 합니다.']
    if (p.mode === 'MONTHLY_AMOUNT' && !(Number.isInteger(p.monthly_amount) && p.monthly_amount > 0)) errors[`${key}.monthly_amount`] = ['월 납부액이 필요합니다.']
  })
  return errors
}

function buildResult(plans) {
  const loans = listLoans()
  const byPref = {}
  const proposed = plans.map(p => {
    const loan = loans.find(l => l.loan_id === p.loan_id)
    if (p.mode !== 'PREFERENCE') return planFor(loan, p)
    byPref[p.preference] ??= allocatePreference(loans.filter(l => plans.some(q => q.loan_id === l.loan_id && q.mode === 'PREFERENCE' && q.preference === p.preference)), p.preference)
    return planFor(loan, { ...p, _allocation: byPref[p.preference].get(loan.loan_id) })
  })
  const current = proposed.map(p => ({ ...planFor(loans.find(l => l.loan_id === p.loan_id), { mode: 'MATURITY' }) }))
  const strip = ({ _base, _months_saved, ...rest }) => rest
  return {
    proposed, current,
    totals: {
      estimated_payoff_date: proposed.map(p => p.estimated_payoff_date).sort().at(-1),
      estimated_total_interest: proposed.reduce((s, p) => s + p.estimated_total_interest, 0),
      monthly_burden: proposed.reduce((s, p) => s + p.monthly_amount, 0),
      payoff_months_saved: Math.max(0, ...proposed.map(p => p._months_saved)),
      interest_saving: Math.max(0, current.reduce((s, p) => s + p.estimated_total_interest, 0) - proposed.reduce((s, p) => s + p.estimated_total_interest, 0)),
      monthly_burden_delta: proposed.reduce((s, p) => s + p.monthly_amount, 0) - current.reduce((s, p) => s + p.monthly_amount, 0),
    },
    strip,
  }
}

// 미리보기 버전: 같은 입력이면 같은 값. 저장할 때 다시 계산해 다르면 409 PLAN_PREVIEW_STALE.
export const previewVersion = plans => `plan-v1-${JSON.stringify(plans).length}-${[...JSON.stringify(plans)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36)}`

export function previewPlans(body) {
  const { proposed, current, totals, strip } = buildResult(body.plans)
  return {
    current_plans: current.map(strip),
    proposed_plans: proposed.map(strip),
    estimated_payoff_date: totals.estimated_payoff_date,
    estimated_total_interest: totals.estimated_total_interest,
    monthly_burden: totals.monthly_burden,
    delta: { payoff_months_saved: totals.payoff_months_saved, interest_saving: totals.interest_saving, monthly_burden_delta: totals.monthly_burden_delta },
    warnings: ['중도상환수수료·연체이자 미제공. 실제 계약상 부분상환 가능 여부와 수수료를 확인하세요.'],
    preview_version: previewVersion(body.plans),
    strategy_code: 'NONE', strategy_version: null, current_strategy_code: 'NONE',
    current_allocations: current.map(p => ({ loan_id: p.loan_id, amount: 0, priority: null })),
    proposed_allocations: proposed.map(p => ({ loan_id: p.loan_id, amount: p.extra_monthly_payment, priority: p.priority })),
  }
}

export function savePlans(body) {
  const { proposed, totals, strip } = buildResult(body.plans)
  const saved = { plans: proposed.map(strip), effective_date: proposed[0]?.effective_date, estimated_payoff_date: totals.estimated_payoff_date, estimated_total_interest: totals.estimated_total_interest, monthly_burden: totals.monthly_burden, plan_version: 'plan-v2-mock', data_revision: `rev-${Date.now().toString(36)}`, estimated_total_fee: null, strategy_code: 'NONE', overall_plan_exists: proposed.length > 1, allocations: proposed.map(p => ({ loan_id: p.loan_id, amount: p.extra_monthly_payment, priority: p.priority, allocation_type: p.repayment_category === 'LUMP_SUM' ? 'REPAYMENT_SAVING' : 'EXTRA_PAYMENT', actual_amount: 0 })) }
  write({ plans: saved })
  return saved
}

export function validateProfile(b) {
  const errors = {}
  const money = (key, required = true) => { if (b[key] == null ? required : !(Number.isInteger(b[key]) && b[key] >= 0)) errors[key] = ['0 이상의 정수여야 합니다.'] }
  ;['monthly_income', 'discretionary_expenses', 'savings', 'fixed_essential_expenses', 'variable_essential_expenses'].forEach(k => money(k))
  money('emergency_fund', false)
  if (!['REGULAR', 'IRREGULAR'].includes(b.income_type)) errors.income_type = ['REGULAR 또는 IRREGULAR 만 가능합니다.']
  if (b.income_type === 'REGULAR' && !(Number.isInteger(b.payday) && b.payday >= 1 && b.payday <= 31)) errors.payday = ['정기 소득은 지급일(1~31)이 필요합니다.']
  return errors
}

export function saveProfile(b) {
  const profile = { ...b, payday: b.income_type === 'REGULAR' ? b.payday : null, emergency_fund: b.emergency_fund ?? null, essential_expenses: b.fixed_essential_expenses + b.variable_essential_expenses }
  write({ profile })
  return profile
}
export const getProfile = () => read().profile ?? null

export function completeOnboarding() { write({ completed: true }); return { completed: true, dashboard_ready: true } }
export function onboardingState() {
  const s = read()
  return { completed: Boolean(s.completed), registered_loan_ids: listLoans().map(l => l.loan_id), finance_profile_exists: Boolean(s.profile), goals_configured: Boolean(s.plans), next_step: s.completed ? null : s.plans ? 'COMPLETE' : s.profile ? 'REPAYMENT_GOAL' : listLoans().length ? 'FINANCE_PROFILE' : 'LOAN' }
}
