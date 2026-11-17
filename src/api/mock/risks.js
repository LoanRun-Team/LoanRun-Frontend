// 위험 분석 mock. 응답 필드는 Notion 명세(재정 위험 분석 조회)와 같다.
// 값은 월별 예산 mock(monthView)과 등록한 대출에서 명세의 산식대로 계산한다. 계산식은 화면 확인용이며 실제 값은 서버 엔진이 만든다.
// PRO 여부는 sessionStorage 'loanrun-mock-plan' 이 'FREE' 일 때만 403 PRO_REQUIRED 로 돌려준다(기본 PRO).
import { listLoans } from './loans.js'
import { getProfile } from './plans.js'
import { isMonth, monthView } from './budgets.js'

const pad = n => String(n).padStart(2, '0')
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const round = (n, digits = 2) => Math.round(n * 10 ** digits) / 10 ** digits
const startOfToday = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()) }
const daysBetween = (from, to) => Math.round((new Date(to) - from) / 86400000)
const shiftMonth = (ym, delta) => { const d = new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1 + delta, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}` }
const lastDayOf = ym => ymd(new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 0))

export const isFreePlan = () => { try { return sessionStorage.getItem('loanrun-mock-plan') === 'FREE' } catch { return false } }
export const hasProfile = () => getProfile() != null

// 4개 점검 기준(명세 "처리 규칙")과 종합 위험도(추가 로직 결정: 안건 2·3)
const surplusLevel = ratio => (ratio == null || ratio < 3 ? 'DANGER' : ratio < 8 ? 'CAUTION' : 'STABLE')
const limitLevel = (ratio, limit, used) => (limit === 0 ? (used > 0 ? 'DANGER' : 'STABLE') : ratio < 90 ? 'STABLE' : ratio <= 100 ? 'CAUTION' : 'DANGER')
const serviceLevel = ratio => (ratio == null ? 'DANGER' : ratio < 30 ? 'STABLE' : ratio < 40 ? 'CAUTION' : 'DANGER')
// 변동금리 위험: 변동금리 대출에만 +1%p 를 적용했을 때 기본 상환이 안 되면 위험, 추가 상환이 줄어야 하면 주의. 변동금리 대출이 없으면 안정.
const rateRiskLevel = (variablePrincipal, cash, extra) => {
  if (!variablePrincipal) return 'STABLE'
  const after = cash - Math.round(variablePrincipal / 1200)
  return after < 0 ? 'DANGER' : after < extra ? 'CAUTION' : 'STABLE'
}
// 종합: 안정 0 · 주의 50 · 위험 100 점을 가중평균(여유자금 40 · 기본 상환 30 · 선택 지출 15 · 변동금리 15)하고 25 미만 안정, 60 미만 주의, 그 이상 위험.
// 우선 규칙: 기본 상환을 못 하면 위험, 추가 상환 유지가 안 되거나 +1%p 에 기본 상환이 무너지면 최소 주의.
const POINTS = { STABLE: 0, CAUTION: 50, DANGER: 100 }
const RANK = { STABLE: 0, CAUTION: 1, DANGER: 2 }
function overallLevel({ surplus, service, limit, rate }, cash, extra, rateAfter) {
  if (cash < 0) return 'DANGER'
  const score = 0.4 * POINTS[surplus] + 0.3 * POINTS[service] + 0.15 * POINTS[limit] + 0.15 * POINTS[rate]
  const base = score < 25 ? 'STABLE' : score < 60 ? 'CAUTION' : 'DANGER'
  const atLeastCaution = cash < extra || rateAfter < 0
  return atLeastCaution && RANK[base] < 1 ? 'CAUTION' : base
}

const EVENT_WINDOW_DAYS = 800

// 대출별 다가오는 이벤트. 월 납부일은 화면이 "이번 달 상환"에서 보여 주므로 여기서는 재설정·거치 종료·만기만 만든다.
function upcomingEvents(loans) {
  const today = startOfToday()
  const events = []
  const push = (type, loan, date) => {
    if (!date || date < ymd(today)) return
    const days = daysBetween(today, date)
    if (days > EVENT_WINDOW_DAYS) return
    events.push({ type, loan_id: loan.loan_id, event_date: date, days_until: days, d_day: days, is_imminent: days >= 0 && days <= 30 })
  }
  for (const loan of loans) {
    if (loan.rate_type === 'VARIABLE') push('RATE_RESET', loan, loan.next_rate_reset_date)
    if (loan.repayment_method === 'GRACE_INSTALLMENT' && loan.grace_months > 0) {
      const end = new Date(loan.start_date); end.setMonth(end.getMonth() + loan.grace_months)
      push('GRACE_END', loan, ymd(end))
    }
    if (loan.repayment_method === 'BULLET') push('MATURITY', loan, loan.maturity_date)
  }
  return events.sort((a, b) => a.event_date.localeCompare(b.event_date))
}

// 변동금리가 오를 때 추가 상환 축소·기본 상환 부족이 처음 생기는 가산금리(%p). 0~5%p, 0.01%p 간격.
function rateThresholds(available, extraPlanned, variablePrincipal) {
  if (!variablePrincipal) return { reduce_extra_from: null, basic_at_risk_from: null }
  const firstBelow = target => {
    if (available < target) return 0
    const r = ((available - target) * 1200) / variablePrincipal
    const up = Math.ceil(r * 100 + 1e-9) / 100
    return up <= 5 ? round(up) : null
  }
  return { reduce_extra_from: extraPlanned > 0 ? firstBelow(extraPlanned) : null, basic_at_risk_from: firstBelow(0) }
}

// 최근 6개월 변화: 이전 달과 비교한 선택 지출·소득의 변화. 입력이 없어 비교할 수 없으면 비어 있다(가상 이력 만들지 않음).
function sixMonthChanges(ym) {
  const changes = []
  for (let i = 5; i >= 0; i--) {
    const month = shiftMonth(ym, -i)
    if (month >= ym && i !== 0) continue
    const now = monthView(month)
    const before = monthView(shiftMonth(month, -1))
    if (now.source !== 'INPUT' && before.source !== 'INPUT') continue
    const push = (reason, delta, base, value) => {
      if (delta === 0) return
      changes.push({
        year_month: month, direction: delta > 0 ? 'INCREASE' : 'DECREASE', reason, amount_delta: delta,
        event_date: lastDayOf(month), change_value: base ? round((Math.abs(value) / base) * 100, 1) * Math.sign(value) : null, change_unit: 'PCT',
      })
    }
    const exp = now.discretionary_expenses - before.discretionary_expenses
    push('EXPENSE', exp, before.discretionary_expenses, exp) // 지출이 늘면 부담 증가
    const inc = now.monthly_income - before.monthly_income
    push('INCOME', -inc, before.monthly_income, inc) // 소득이 늘면 부담 감소
  }
  return changes.sort((a, b) => b.event_date.localeCompare(a.event_date)).slice(0, 6)
}

export function riskView({ month, loanId }) {
  const ym = month ?? ymd(new Date()).slice(0, 7)
  const view = monthView(ym)
  const allLoans = listLoans()
  const loans = loanId ? allLoans.filter(l => l.loan_id === loanId) : allLoans
  const income = view.monthly_income
  const scheduled = loans.reduce((s, l) => s + l.estimated_monthly_payment, 0)
  const surplus = income - scheduled - view.essential_expenses - view.discretionary_expenses - view.savings
  const surplusRatio = income > 0 ? round((100 * surplus) / income) : null
  const limitAmount = Math.max(income - view.essential_expenses - view.savings - scheduled, 0)
  const limitRatio = limitAmount > 0 ? round((100 * view.discretionary_expenses) / limitAmount) : (view.discretionary_expenses > 0 ? null : 0)
  const balanceOf = l => l.remaining_principal ?? 0
  const principal = loans.reduce((s, l) => s + balanceOf(l), 0)
  const variablePrincipal = loans.filter(l => l.rate_type === 'VARIABLE').reduce((s, l) => s + balanceOf(l), 0)
  const exposure = principal > 0 ? round((100 * variablePrincipal) / principal) : 0
  const rateRise = Math.round(variablePrincipal / 1200)
  const serviceRatio = income > 0 ? round((100 * scheduled) / income) : null
  const extraPlanned = view.allocation.allocations.reduce((s, a) => s + a.amount, 0)
  const levels = {
    surplus: surplusLevel(surplusRatio), service: serviceLevel(serviceRatio),
    limit: limitLevel(limitRatio, limitAmount, view.discretionary_expenses), rate: rateRiskLevel(variablePrincipal, surplus, extraPlanned),
  }
  const changes = sixMonthChanges(ym)
  const delta = changes.reduce((s, c) => s + c.amount_delta, 0)
  const count = reason => changes.filter(c => c.reason === reason).length

  return {
    level: overallLevel(levels, surplus, extraPlanned, surplus - rateRise),
    indicators: {
      surplus_ratio_percent: surplusRatio,
      debt_service_ratio_percent: serviceRatio,
      available_cash: surplus,
      variable_rate_exposure: exposure,
      discretionary_expenses: view.discretionary_expenses,
      discretionary_limit_amount: limitAmount,
      discretionary_limit_usage_pct: limitRatio,
    },
    upcoming_events: upcomingEvents(loans),
    history: changes.map(c => ({ event_date: c.event_date, type: 'BUDGET_CHANGE', level: c.direction === 'INCREASE' ? 'CAUTION' : 'STABLE', description: c.reason === 'EXPENSE' ? '월별 재정정보 변동으로 선택 지출이 달라졌습니다.' : '월별 재정정보 변동으로 소득이 달라졌습니다.' })),
    data_status: income > 0 && principal > 0 ? 'SUFFICIENT' : 'INSUFFICIENT',
    checks: [
      { code: 'SURPLUS_RATIO', label: '여유자금 비율', ratio_pct: surplusRatio, level: levels.surplus },
      { code: 'DISCRETIONARY_LIMIT', label: '선택 지출 한도', ratio_pct: limitRatio, level: levels.limit },
      { code: 'VARIABLE_EXPOSURE', label: '변동금리 노출', ratio_pct: exposure, level: levels.rate },
      { code: 'BASIC_DEBT_SERVICE', label: '소득 대비 기본 상환', ratio_pct: serviceRatio, level: levels.service },
    ],
    rate_thresholds: rateThresholds(surplus, extraPlanned, variablePrincipal),
    six_month_changes: changes,
    strategy_link_available: true,
    six_month_summary: {
      net_monthly_burden_delta: changes.length ? delta : null,
      rate_change_count: count('RATE'), income_change_count: count('INCOME'), expense_change_count: count('EXPENSE'),
    },
  }
}

// 쿼리 검증. 통과하면 { month, loanId } , 아니면 errors.
export function parseRiskQuery(query) {
  const errors = {}
  const month = query.get('month') || undefined
  const rawLoan = query.get('loan_id')
  if (month && !isMonth(month)) errors.month = ['YYYY-MM 형식이어야 합니다.']
  const loanId = rawLoan == null || rawLoan === '' ? undefined : Number(rawLoan)
  if (loanId !== undefined && !(Number.isInteger(loanId) && loanId > 0)) errors.loan_id = ['입력값이 올바르지 않습니다.']
  return { errors, value: { month, loanId } }
}
export const loanExists = id => listLoans().some(l => l.loan_id === id)

// ── POST /api/risks/simulate/ ───────────────────────────────────────────
// 요청: loan_ids(선택), rate_increase_pp(0~5), income_change_pct(-100~100). 변동금리 대출 잔액에만 금리 상승분이 월 이자로 붙는다.
export function validateSimulation(b) {
  const errors = {}
  const body = b ?? {}
  if (body.loan_ids != null && !(Array.isArray(body.loan_ids) && body.loan_ids.every(id => Number.isInteger(id) && id > 0))) errors.loan_ids = ['대출 ID 배열이어야 합니다.']
  if (body.rate_increase_pp != null && !(typeof body.rate_increase_pp === 'number' && body.rate_increase_pp >= 0 && body.rate_increase_pp <= 5)) errors.rate_increase_pp = ['0~5 사이여야 합니다.']
  if (body.income_change_pct != null && !(typeof body.income_change_pct === 'number' && body.income_change_pct >= -100 && body.income_change_pct <= 100)) errors.income_change_pct = ['-100~100 사이여야 합니다.']
  return errors
}

export function simulateRisk(b) {
  const ym = ymd(new Date()).slice(0, 7)
  const view = monthView(ym)
  const all = listLoans()
  const loans = b.loan_ids?.length ? all.filter(l => b.loan_ids.includes(l.loan_id)) : all
  const income = view.monthly_income
  const pp = b.rate_increase_pp ?? 0
  const payment = loans.reduce((s, l) => s + l.estimated_monthly_payment, 0)
  const variable = loans.filter(l => l.rate_type === 'VARIABLE')
  const rateUp = Math.round(variable.reduce((s, l) => s + ((l.remaining_principal ?? 0) * pp) / 1200, 0))
  const fixedCost = view.essential_expenses + view.discretionary_expenses + view.savings
  const scenarioIncome = Math.round(income * (1 + (b.income_change_pct ?? 0) / 100))
  const baselineCash = income - payment - fixedCost
  const scenarioCash = scenarioIncome - (payment + rateUp) - fixedCost
  const extra = view.allocation.allocations.reduce((s, a) => s + a.amount, 0)
  const variablePrincipal = variable.reduce((s, l) => s + (l.remaining_principal ?? 0), 0)
  const limitOf = inc => Math.max(inc - view.essential_expenses - view.savings - payment - rateUp, 0)
  // 시나리오 안에서도 같은 기준으로 4개 점검을 다시 계산해 종합 등급을 만든다.
  const levelOf = (cash, inc, pay, bound) => {
    const levels = {
      surplus: surplusLevel(inc > 0 ? (100 * cash) / inc : null), service: serviceLevel(inc > 0 ? (100 * pay) / inc : null),
      limit: limitLevel(bound > 0 ? (100 * view.discretionary_expenses) / bound : null, bound, view.discretionary_expenses), rate: rateRiskLevel(variablePrincipal, cash, extra),
    }
    return overallLevel(levels, cash, extra, cash - Math.round(variablePrincipal / 1200))
  }
  const warnings = []
  if (pp > 0 && variable.length === 0) warnings.push('고정금리 대출에는 금리 상승폭이 적용되지 않습니다.')
  return {
    baseline: { income, monthly_payment: payment, available_cash: baselineCash, level: levelOf(baselineCash, income, payment, Math.max(income - view.essential_expenses - view.savings - payment, 0)) },
    scenario: { income: scenarioIncome, monthly_payment: payment + rateUp, available_cash: scenarioCash, level: levelOf(scenarioCash, scenarioIncome, payment + rateUp, limitOf(scenarioIncome)), payoff_feasibility: scenarioCash >= extra ? 'HIGH' : scenarioCash >= 0 ? 'MEDIUM' : 'LOW' },
    delta: { income: scenarioIncome - income, monthly_payment: rateUp, available_cash: scenarioCash - baselineCash },
    warnings,
    rate_thresholds: riskView({ month: ym }).rate_thresholds,
  }
}
