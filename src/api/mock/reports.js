// 상환 리포트 mock. 응답 필드는 Notion 명세(최종본 2026.11.16)의 reports 계열과 같다.
// 값은 등록한 대출·월별 예산 mock 에서 계산한다. 계산식은 화면 확인용 근사치이며 실제 값은 서버 엔진이 만든다.
// 확인용 스위치(sessionStorage): 'loanrun-mock-plan'='FREE' → 403 PRO_REQUIRED, 'loanrun-mock-report-fail'='1' → 생성 실패.
import { listLoans } from './loans.js'
import { getProfile } from './plans.js'
import { monthView } from './budgets.js'
import { isFreePlan, riskView } from './risks.js'

const KEY = 'loanrun-mock-report'
const read = () => { try { return JSON.parse(sessionStorage.getItem(KEY)) ?? {} } catch { return {} } }
const write = patch => { try { sessionStorage.setItem(KEY, JSON.stringify({ ...read(), ...patch })) } catch { /* mock 저장 실패는 무시 */ } }
const flag = name => { try { return sessionStorage.getItem(name) } catch { return null } }

const pad = n => String(n).padStart(2, '0')
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const round = (n, digits = 2) => Math.round(n * 10 ** digits) / 10 ** digits
const nowIso = () => new Date().toISOString().replace(/\.\d+Z$/, '+00:00')
const currentYM = () => ymd(new Date()).slice(0, 7)
const hash = text => { let h = 0; for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h).toString(36) }

export const isPro = () => !isFreePlan()
export const proRequired = () => ({ status: 403, body: { success: false, code: 'PRO_REQUIRED', message: 'PRO 이용자만 사용할 수 있습니다.', errors: {} } })

const balanceOf = l => (l.loan_form === 'CREDIT_LINE' ? l.used_amount : l.remaining_principal) ?? 0
const isBullet = l => l.repayment_method === 'BULLET'

// ── 데이터 버전: 대출·재정·적용한 전략이 바뀌면 달라진다(리포트 stale, 전략 STALE 판단에 쓴다) ──
export function dataRevision() {
  const loans = listLoans().map(l => [l.loan_id, balanceOf(l), l.annual_rate, l.estimated_monthly_payment])
  const view = monthView(currentYM())
  return `rev-${hash(JSON.stringify([loans, view.monthly_income, view.discretionary_expenses, view.allocation.total_allocated, read().strategy?.code ?? null]))}`
}

// ── 월 단위 시뮬레이션: 추가 상환 배분(loanId → 원)을 넣으면 대출별 완납일·총 이자를 돌려준다 ──
function simulate(loan, extra) {
  const r = loan.annual_rate / 1200
  let balance = balanceOf(loan)
  const base = isBullet(loan) ? Math.round(balance * r) : loan.estimated_monthly_payment
  let interest = 0
  const start = new Date()
  let months = 0
  while (balance > 0 && months < 600) {
    const i = balance * r
    interest += i
    balance -= Math.max(0, base + extra - i)
    months += 1
    if (isBullet(loan) && loan.maturity_date && ymd(new Date(start.getFullYear(), start.getMonth() + months, start.getDate())) >= loan.maturity_date) break
  }
  const payoff = new Date(start.getFullYear(), start.getMonth() + months, Math.min(loan.payment_day ?? 25, 28))
  return { payoff_date: ymd(payoff), interest: Math.round(interest) }
}

// ── 전략 후보 ──────────────────────────────────────────────────────────
const STRATEGY_COPY = {
  RATE_RISK: { label: '금리 위험 대비', advantages: ['변동금리 대출 노출을 빠르게 줄여요.'], disadvantages: ['고정 고금리 대출의 이자 절감은 늦어질 수 있어요.'], reason: '변동금리 노출을 먼저 줄여요.' },
  INTEREST_SAVING: { label: '이자 절감', advantages: ['높은 이율의 원금을 먼저 줄여요.'], disadvantages: ['변동금리 변동 위험이 오래 남을 수 있어요.'], reason: '높은 금리부터 갚아 예상 이자를 줄여요.' },
  PARALLEL: { label: '병행', advantages: ['여러 대출의 잔액을 동시에 줄여요.'], disadvantages: ['가장 높은 금리 대출을 먼저 줄이는 것보다 이자가 클 수 있어요.'], reason: '여러 대출에 금액을 분산해 갚아요.' },
  FAST: { label: '빠른 상환', advantages: ['가장 빨리 갚아요.'], disadvantages: ['매달 생활비 여유가 줄어요.'], reason: '여유자금의 80%를 추가 상환에 써요.' },
  BALANCED: { label: '균형 상환', advantages: ['상환 속도와 생활 여유를 함께 챙겨요.'], disadvantages: ['가장 빠른 상환보다 이자가 더 나가요.'], reason: '여유자금의 50%를 추가 상환에 써요.' },
  STABLE: { label: '생활 안정 우선', advantages: ['생활비와 예비비를 지켜요.'], disadvantages: ['완납이 가장 늦어요.'], reason: '추가 상환 없이 기본 상환을 지켜요.' },
  SAVINGS: { label: '상환자금 적립', advantages: ['만기 상환자금을 미리 모아요.'], disadvantages: ['적립 중에는 이자가 줄지 않아요.'], reason: '만기까지 필요한 상환자금을 적립해요.' },
}
const orderBy = (loans, code) => {
  if (code === 'RATE_RISK') {
    const variable = loans.filter(l => l.rate_type === 'VARIABLE').sort((a, b) => balanceOf(b) - balanceOf(a) || b.annual_rate - a.annual_rate || a.loan_id - b.loan_id)
    const fixed = loans.filter(l => l.rate_type !== 'VARIABLE').sort((a, b) => b.annual_rate - a.annual_rate || balanceOf(a) - balanceOf(b) || a.loan_id - b.loan_id)
    return [...variable, ...fixed]
  }
  return [...loans].sort((a, b) => b.annual_rate - a.annual_rate || balanceOf(a) - balanceOf(b) || a.loan_id - b.loan_id)
}
function allocationsFor(code, loans, budget) {
  if (code === 'PARALLEL') {
    const total = loans.reduce((s, l) => s + balanceOf(l), 0) || 1
    let left = budget
    return loans.map((l, i) => {
      const amount = i === loans.length - 1 ? left : Math.round((budget * balanceOf(l)) / total)
      left -= amount
      return { loan_id: l.loan_id, amount, priority: 1, allocation_type: 'EXTRA_PAYMENT', actual_amount: 0 }
    })
  }
  return orderBy(loans, code).map((l, i) => ({ loan_id: l.loan_id, amount: i === 0 ? budget : 0, priority: i + 1, allocation_type: 'EXTRA_PAYMENT', actual_amount: 0 }))
}

// 후보 하나의 완납일·총 이자·월 부담. 기준(현재 계획)은 추가 상환 0원.
function metrics(loans, allocations) {
  let payoff = ''
  let interest = 0
  for (const l of loans) {
    const sim = simulate(l, allocations.find(a => a.loan_id === l.loan_id)?.amount ?? 0)
    if (sim.payoff_date > payoff) payoff = sim.payoff_date
    interest += sim.interest
  }
  return { payoff, interest, burden: loans.reduce((s, l) => s + l.estimated_monthly_payment, 0) + allocations.reduce((s, a) => s + a.amount, 0) }
}

const roundHalfUp = n => Math.floor(n + 0.5)
function preferenceFor(surplusRatio, usagePct) {
  if (surplusRatio == null || surplusRatio < 3) return 'STABLE'
  if (surplusRatio < 8 || (usagePct ?? 0) >= 90) return 'BALANCED'
  return 'FAST'
}

export function strategyView(reportId) {
  const loans = listLoans()
  const view = monthView(currentYM())
  const risk = riskView({ month: currentYM() })
  const rev = dataRevision()
  const current = read().strategy ?? null
  const installments = loans.filter(l => !isBullet(l))
  const bullets = loans.filter(isBullet)
  const capacity = Math.max(view.available_cash, 0)
  const plannedExtra = view.allocation.allocations.reduce((s, a) => s + a.amount, 0)
  const requiredSaving = bullets.reduce((s, l) => {
    const months = Math.max(1, Math.round((new Date(l.maturity_date) - new Date()) / (30.44 * 86400000)))
    return s + Math.ceil(balanceOf(l) / months / 1000) * 1000
  }, 0)
  const baseBudget = plannedExtra > 0 ? Math.min(plannedExtra, capacity) : roundHalfUp(capacity * 0.5)
  const budget = Math.max(0, baseBudget - requiredSaving)

  let type = 'NONE'
  if (installments.length >= 2) type = 'MULTI'
  else if (installments.length === 1) type = 'SINGLE_PREFERENCE'
  else if (bullets.length > 0) type = 'SAVINGS_ONLY'

  const situation = {
    monthly_extra_budget: budget,
    projected_payoff_date: loans.length ? metrics(loans, []).payoff : null,
    estimated_total_interest: loans.length ? metrics(loans, []).interest : null,
    discretionary_limit_usage_pct: risk.indicators.discretionary_limit_usage_pct,
    surplus_ratio_pct: risk.indicators.surplus_ratio_percent,
    consecutive_extra_on_track_months: 0,
    missed_payment_count_6m: 0,
    variable_rate_exposure_pct: risk.indicators.variable_rate_exposure,
    basic_at_risk_from: risk.rate_thresholds.basic_at_risk_from,
    estimated_total_fee: null,
    required_monthly_saving: requiredSaving,
    recurring_capacity: capacity,
  }
  const base = metrics(loans, [])
  const candidate = (code, allocations) => {
    const m = metrics(loans, allocations)
    return {
      strategy_code: code, label: STRATEGY_COPY[code].label,
      advantages: STRATEGY_COPY[code].advantages, disadvantages: STRATEGY_COPY[code].disadvantages,
      projected_payoff_date: m.payoff, estimated_total_interest: m.interest, interest_saving: base.interest - m.interest,
      monthly_burden: m.burden, allocations, reason: STRATEGY_COPY[code].reason,
      estimated_total_fee: null, net_saving: null, fee_comparison_basis: 'GROSS_INTEREST',
    }
  }

  let candidates = []
  let recommendation = null
  let unavailable = null
  const shortOfSaving = bullets.length > 0 && capacity < requiredSaving
  if (!loans.length) unavailable = 'NO_LOANS'
  else if (type === 'NONE') unavailable = 'NO_ELIGIBLE_LOANS'
  else if (shortOfSaving) recommendation = null // 만기 상환자금 부족 → 추천 보류(F4-v)
  else if (type === 'MULTI') {
    candidates = ['RATE_RISK', 'INTEREST_SAVING', 'PARALLEL'].map(code => candidate(code, allocationsFor(code, installments, budget)))
    const rateRisk = risk.indicators.variable_rate_exposure >= 50 && risk.rate_thresholds.reduce_extra_from != null && risk.rate_thresholds.reduce_extra_from <= 1
    const best = rateRisk ? candidates[0] : [...candidates].sort((a, b) => b.interest_saving - a.interest_saving)[0]
    recommendation = {
      strategy_code: best.strategy_code, type: current?.code === best.strategy_code ? 'KEEP' : 'NEW',
      reason: rateRisk ? '+1%p 상승 시 현재 추가 상환계획 유지가 어려워 변동금리 노출을 먼저 줄입니다.' : best.reason,
    }
  } else if (type === 'SINGLE_PREFERENCE') {
    const loan = installments[0]
    const cap = Math.max(view.available_cash, 0)
    candidates = [['FAST', 0.8], ['BALANCED', 0.5], ['STABLE', 0]].map(([code, ratio]) =>
      candidate(code, [{ loan_id: loan.loan_id, amount: roundHalfUp(cap * ratio), priority: null, allocation_type: 'EXTRA_PAYMENT', actual_amount: 0 }]))
    const pick = preferenceFor(situation.surplus_ratio_pct, situation.discretionary_limit_usage_pct)
    recommendation = { strategy_code: pick, type: current?.code === pick ? 'KEEP' : 'NEW', reason: STRATEGY_COPY[pick].reason }
  } else if (type === 'SAVINGS_ONLY') {
    const loan = bullets[0]
    candidates = [{ ...candidate('SAVINGS', [{ loan_id: loan.loan_id, amount: requiredSaving, priority: null, allocation_type: 'REPAYMENT_SAVING', actual_amount: 0 }]), interest_saving: 0 }]
    recommendation = { strategy_code: 'SAVINGS', type: current?.code === 'SAVINGS' ? 'KEEP' : 'NEW', reason: STRATEGY_COPY.SAVINGS.reason }
  }

  const reportRev = read().report?.data_revision
  const stale = reportRev != null && reportRev !== rev
  if (stale) { candidates = []; recommendation = null; unavailable = 'STALE' }
  return {
    strategy_available: candidates.length > 0 || (shortOfSaving && !stale),
    unavailable_reason: unavailable,
    report_id: reportId,
    strategy_version: candidates.length ? `strategy-${hash(rev + type)}` : null,
    current_strategy: { strategy_code: current?.code ?? 'NONE', applied_at: current?.applied_at ?? null, adherence_rate_3m: null, judgement: current ? 'INSUFFICIENT_HISTORY' : 'FIRST' },
    situation, recommendation, candidates, stale,
    strategy_type: shortOfSaving ? 'SAVINGS_ONLY' : type,
    data_revision: rev, fee_comparison_basis: 'GROSS_INTEREST',
  }
}

// ── 반영 미리보기·저장(상환 계획 시뮬레이션·저장 API 의 전략 분기) ─────────────
export const isStrategyBody = body => body && body.report_id != null

export function validateStrategyBody(body, withPreview) {
  const errors = {}
  if (!Number.isInteger(body.report_id)) errors.report_id = ['리포트 ID가 필요합니다.']
  if (typeof body.strategy_code !== 'string') errors.strategy_code = ['전략 코드가 필요합니다.']
  if (typeof body.strategy_version !== 'string') errors.strategy_version = ['전략 버전이 필요합니다.']
  if (withPreview && typeof body.preview_version !== 'string') errors.preview_version = ['미리보기 버전이 필요합니다.']
  return errors
}

const previewVersionOf = (strategy, code) => `plan-${hash(`${strategy.data_revision}:${code}`)}`

function planRows(loans, allocations) {
  return loans.map(l => {
    const extra = allocations.find(a => a.loan_id === l.loan_id)?.amount ?? 0
    const sim = simulate(l, extra)
    return { loan_id: l.loan_id, mode: 'EXTRA_AMOUNT', preference: null, target_date: null, extra_monthly_payment: extra, monthly_amount: l.estimated_monthly_payment + extra, estimated_payoff_date: sim.payoff_date, estimated_total_interest: sim.interest, estimated_total_fee: null, priority: allocations.find(a => a.loan_id === l.loan_id)?.priority ?? null }
  })
}

export function previewStrategy(body) {
  const strategy = strategyView(body.report_id)
  if (strategy.stale || strategy.strategy_version !== body.strategy_version) return { error: 'STRATEGY_STALE' }
  const picked = strategy.candidates.find(c => c.strategy_code === body.strategy_code)
  if (!picked) return { error: 'STRATEGY_NOT_FOUND' }
  const loans = listLoans()
  const currentAllocations = loans.map(l => ({ loan_id: l.loan_id, amount: monthView(currentYM()).allocation.allocations.find(a => a.loan_id === l.loan_id)?.amount ?? 0, priority: null, allocation_type: 'EXTRA_PAYMENT', actual_amount: 0 }))
  const now = metrics(loans, currentAllocations)
  return {
    data: {
      current_plans: planRows(loans, currentAllocations),
      proposed_plans: planRows(loans, picked.allocations),
      estimated_payoff_date: picked.projected_payoff_date,
      estimated_total_interest: picked.estimated_total_interest,
      monthly_burden: picked.monthly_burden,
      delta: { payoff_months_saved: Math.round((new Date(now.payoff) - new Date(picked.projected_payoff_date)) / (30.44 * 86400000)), interest_saving: now.interest - picked.estimated_total_interest, monthly_burden_delta: picked.monthly_burden - now.burden },
      warnings: ['중도상환수수료·연체이자 미제공. 실제 계약상 부분상환 가능 여부와 수수료를 확인하세요.'],
      preview_version: previewVersionOf(strategy, body.strategy_code),
      strategy_code: body.strategy_code, strategy_version: strategy.strategy_version, current_strategy_code: strategy.current_strategy.strategy_code,
      current_allocations: currentAllocations, proposed_allocations: picked.allocations,
      estimated_total_fee: null, data_revision: strategy.data_revision,
    },
  }
}

export function applyStrategy(body) {
  const strategy = strategyView(body.report_id)
  if (strategy.stale || strategy.strategy_version !== body.strategy_version || body.data_revision !== strategy.data_revision || body.preview_version !== previewVersionOf(strategy, body.strategy_code)) return { error: 'STRATEGY_STALE' }
  const picked = strategy.candidates.find(c => c.strategy_code === body.strategy_code)
  if (!picked) return { error: 'STRATEGY_NOT_FOUND' }
  const appliedAt = nowIso()
  write({ strategy: { code: body.strategy_code, applied_at: appliedAt } })
  return {
    data: {
      plans: planRows(listLoans(), picked.allocations), effective_date: ymd(new Date()), estimated_payoff_date: picked.projected_payoff_date,
      estimated_total_interest: picked.estimated_total_interest, monthly_burden: picked.monthly_burden, plan_version: `plan-${hash(appliedAt)}`,
      strategy_code: body.strategy_code, strategy_version: body.strategy_version, overall_plan_exists: strategy.strategy_type === 'MULTI',
      allocations: picked.allocations, data_revision: dataRevision(),
    },
  }
}

// ── 또래 비교 기준·동의 ────────────────────────────────────────────────
const AGE_GROUPS = ['AGE_20S', 'AGE_30S', 'AGE_40S', 'AGE_50S_PLUS']
export const comparisonSettings = () => ({ consented: true, age_group: 'AGE_30S', source_type: 'DEMO', income_decile: 3, ...read().comparison })
export function validateComparisonBody(b) {
  const errors = {}
  if (b.consented !== undefined && typeof b.consented !== 'boolean') errors.consented = ['true 또는 false 여야 합니다.']
  if (b.age_group !== undefined && b.age_group !== null && !AGE_GROUPS.includes(b.age_group)) errors.age_group = ['지원하지 않는 연령대입니다.']
  if (b.income_decile !== undefined && b.income_decile !== null && !(Number.isInteger(b.income_decile) && b.income_decile >= 1 && b.income_decile <= 5)) errors.income_decile = ['1~5 사이의 정수여야 합니다.']
  return errors
}
export function saveComparison(b) {
  const next = { ...comparisonSettings(), ...Object.fromEntries(Object.entries(b).filter(([k]) => ['consented', 'age_group', 'income_decile'].includes(k))) }
  const report = read().report
  write(report ? { comparison: next, report: { ...report, data_revision: 'stale-by-comparison' } } : { comparison: next })
  return comparisonSettings()
}

// ── 리포트 본문 ────────────────────────────────────────────────────────
function monthsSinceStart(loans) {
  const earliest = loans.map(l => l.start_date).filter(Boolean).sort()[0]
  if (!earliest) return 0
  const [y, m] = earliest.split('-').map(Number)
  const now = new Date()
  return Math.max(0, (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m))
}

function paceAnalysis(loans) {
  const observed = Math.min(6, monthsSinceStart(loans))
  if (!loans.length || observed === 0) return { monthly_principal_repayment_rate: null, principal_repaid_last_6_months: null, data_status: 'INSUFFICIENT', principal_reduction_pct_6m: null, observed_month_count: 0, savings_deposited_6m: null, savings_used_6m: null }
  const balance = loans.reduce((s, l) => s + balanceOf(l), 0) || 1
  const monthlyPrincipal = loans.reduce((s, l) => s + (isBullet(l) ? 0 : Math.max(0, l.estimated_monthly_payment - (balanceOf(l) * l.annual_rate) / 1200)), 0)
  return {
    monthly_principal_repayment_rate: String(round((100 * monthlyPrincipal) / balance)),
    principal_repaid_last_6_months: Math.round(monthlyPrincipal * observed), data_status: 'SUFFICIENT',
    principal_reduction_pct_6m: round((100 * monthlyPrincipal * observed) / (balance + monthlyPrincipal * observed)),
    observed_month_count: observed, savings_deposited_6m: 0, savings_used_6m: 0,
  }
}

function comparisonOf(loans, pace) {
  const s = comparisonSettings()
  const base = { source_type: 'DEMO', age_group: s.age_group, income_decile: s.income_decile, disclaimer: '또래 수치는 가상 예시이며 실제 통계가 아닙니다.', metric_type: 'DEBT_SERVICE_RATIO' }
  if (!s.consented) return { ...base, status: 'DISABLED', extra_payment_count_6m: null, peer_extra_payment_count_6m: null, monthly_debt_service_ratio_pct: null, peer_monthly_debt_service_ratio_pct: null }
  const income = monthView(currentYM()).monthly_income
  const own = income > 0 && pace.data_status === 'SUFFICIENT' ? round((100 * loans.reduce((a, l) => a + l.estimated_monthly_payment, 0)) / income, 1) : null
  return {
    ...base, status: own == null ? 'INSUFFICIENT' : 'DEMO',
    extra_payment_count_6m: own == null ? null : 0, peer_extra_payment_count_6m: 3,
    monthly_debt_service_ratio_pct: own, peer_monthly_debt_service_ratio_pct: 25,
  }
}

function payoffScenarios(loans) {
  if (!loans.length) return []
  const risk = riskView({ month: currentYM() })
  const view = monthView(currentYM())
  const plan = metrics(loans, view.allocation.allocations.map(a => ({ loan_id: a.loan_id, amount: a.amount })))
  const shift = months => { const d = new Date(plan.payoff); d.setMonth(d.getMonth() + months); return ymd(d) }
  const cash = risk.indicators.available_cash
  const rateUp = risk.rate_thresholds.reduce_extra_from
  const level = (ok, tight) => (ok ? 'HIGH' : tight ? 'MEDIUM' : 'LOW')
  return [
    { type: 'CURRENT', level: level(cash >= 0, cash >= -50000), estimated_payoff_date: plan.payoff },
    { type: 'RATE_UP', level: level(rateUp == null || rateUp > 1, rateUp === 1 || rateUp === 0), estimated_payoff_date: rateUp != null && rateUp <= 1 ? shift(2) : plan.payoff },
    { type: 'INCOME_DOWN', level: level(cash - view.monthly_income * 0.05 >= 0, cash - view.monthly_income * 0.05 >= -100000), estimated_payoff_date: cash - view.monthly_income * 0.05 < 0 ? shift(4) : plan.payoff },
    { type: 'EXPENSE_UP', level: level(cash - view.discretionary_expenses * 0.1 >= 0, true), estimated_payoff_date: shift(1) },
  ]
}

function suggestions(loans) {
  if (!loans.length) return []
  const risk = riskView({ month: currentYM() })
  const cash = Math.max(risk.indicators.available_cash, 0)
  const step = Math.floor(cash / 2 / 10000) * 10000
  return [
    { type: 'EXTRA_PAYMENT', title: step > 0 ? `월 ${step.toLocaleString('ko-KR')}원 더 갚아 목표 맞추기` : '상환 계획 확인', description: step > 0 ? '여유자금 일부를 추가 상환에 넣어 완납일을 앞당겨요.' : '현재 계획을 검토해 보세요.', action: 'REPAYMENT_PLAN' },
    { type: 'RESERVE', title: `${Math.max(step, 20000).toLocaleString('ko-KR')}원은 예비비로 남겨 두기`, description: '추가 상환은 지키고 일부는 예비비로 남겨요.', action: 'BUDGET' },
    { type: 'RISK_CHECK', title: '위험 분석 직접 조절해 보기', description: '변화를 넣어 계획이 버티는지 확인해요.', action: 'RISK' },
  ]
}

function reportBody(state) {
  const loans = listLoans()
  const pace = paceAnalysis(loans)
  const scenarios = payoffScenarios(loans)
  const cur = scenarios.find(s => s.type === 'CURRENT')
  const strategy = strategyView(state.report_id)
  return {
    report_id: state.report_id, status: 'COMPLETED', generated_at: state.generated_at, stale: false,
    summary: cur ? `현재 계획 기준 예상 완납일은 ${cur.estimated_payoff_date.slice(0, 4)}년 ${Number(cur.estimated_payoff_date.slice(5, 7))}월입니다.` : '등록된 대출이 없어 리포트를 만들 수 없어요.',
    pace_analysis: pace, comparison: comparisonOf(loans, pace), payoff_scenarios: scenarios, suggestions: suggestions(loans),
    error: null, updated_at: state.generated_at,
    strategy_available: strategy.strategy_available, strategy_type: strategy.strategy_type,
  }
}

// ── 생성·조회 ──────────────────────────────────────────────────────────
// 상태 전이: POST → PENDING → (조회 1회) RUNNING → (조회 2회) COMPLETED 또는 FAILED. 실패는 'loanrun-mock-report-fail'='1' 일 때.
function advance(state) {
  if (!state.report || state.report.status === 'COMPLETED' || state.report.status === 'FAILED') return
  const polls = (state.report.polls ?? 0) + 1
  if (polls < 2) return write({ report: { ...state.report, status: 'RUNNING', polls } })
  if (flag('loanrun-mock-report-fail') === '1') return write({ report: { ...state.report, status: 'FAILED', polls, failed_at: Date.now() } })
  write({ report: { ...state.report, status: 'COMPLETED', polls, generated_at: nowIso(), data_revision: dataRevision() } })
}

function envelope(state) {
  const r = state.report
  if (!r) return { report_id: null, status: 'NOT_GENERATED', generated_at: null, stale: false, report: null, updated_at: null }
  if (r.status !== 'COMPLETED') {
    const failed = r.status === 'FAILED'
    return { report_id: r.report_id, status: r.status, generated_at: null, stale: false, updated_at: null, report: { report_id: r.report_id, status: r.status, generated_at: null, stale: false, error: failed ? { code: 'REPORT_GENERATION_FAILED', message: '리포트를 만들지 못했어요.' } : null } }
  }
  const stale = r.data_revision !== dataRevision()
  return { report_id: r.report_id, status: 'COMPLETED', generated_at: r.generated_at, stale, report: { ...reportBody(r), stale }, updated_at: r.generated_at }
}

export const latestReport = () => { advance(read()); return envelope(read()) }
export function getReportById(id) {
  const state = read()
  if (!state.report || state.report.report_id !== id) return null
  advance(state)
  return envelope(read())
}
export function generateReport({ force }) {
  const state = read()
  const r = state.report
  const inFlight = r && (r.status === 'PENDING' || r.status === 'RUNNING')
  if (inFlight) return { status: 202, data: { report_id: r.report_id, status: r.status, poll_url: `/api/reports/${r.report_id}/`, generated_at: null, data_revision: dataRevision() } }
  if (r?.status === 'COMPLETED' && r.data_revision === dataRevision()) return { status: 200, data: { report_id: r.report_id, status: 'COMPLETED', poll_url: `/api/reports/${r.report_id}/`, generated_at: r.generated_at, data_revision: r.data_revision } }
  if (r?.status === 'FAILED' && force && Date.now() - (r.failed_at ?? 0) < 60000) return { error: 'RATE_LIMIT_EXCEEDED' }
  if (!listLoans().length || !getProfile()) return { error: 'REPORT_INPUT_INCOMPLETE' }
  const reportId = (r?.report_id ?? 100) + 1
  write({ report: { report_id: reportId, status: 'PENDING', polls: 0 } })
  return { status: 202, data: { report_id: reportId, status: 'PENDING', poll_url: `/api/reports/${reportId}/`, generated_at: null, data_revision: dataRevision() } }
}
export const loanKnown = id => listLoans().some(l => l.loan_id === id)
