// 위험 시나리오 · 버틸 수 있는 한계 · 비상자금 · 한 번에 필요한 돈의 화면 모델.
// 입력: GET /api/risks/(data), 이번 달 예산(budget: GET /api/budgets/{ym}/), 대출 목록, 시뮬레이션 응답(sim: POST /api/risks/simulate/).
import { loanName, won } from '../Budget/budgetModel.js'
import { pct } from './riskModel.js'

export const EXPENSE_SHOCK = 500000
export const SCENARIO_TABS = [
  { key: 'CURRENT', label: '현재', body: null },
  { key: 'RATE_UP', label: '금리 +1%p', body: { rate_increase_pp: 1 } },
  { key: 'INCOME_DOWN', label: '소득 −5%', body: { income_change_pct: -5 } },
  { key: 'EXPENSE', label: `예상 못 한 지출 ${EXPENSE_SHOCK / 10000}만 원`, body: null },
]

const plannedExtra = budget => (budget.allocation?.allocations ?? []).reduce((s, a) => s + a.amount, 0)
const emergencyOf = budget => budget.emergency_fund ?? 0
export const hasEmergency = budget => budget.emergency_fund != null

// 탭 하나의 세 칸(월 여유자금 / 추가 상환 / 기본 상환). sim 은 그 탭의 시뮬레이션 응답(현재·지출 탭은 null).
export function scenarioStats(tabKey, data, budget, sim) {
  const extra = plannedExtra(budget)
  const income = sim ? sim.scenario.income : budget.monthly_income
  const cash = sim ? sim.scenario.available_cash : data.indicators.available_cash
  const basic = sim ? sim.scenario.monthly_payment : budget.scheduled_repayment
  const kept = Math.min(extra, Math.max(cash, 0))
  const cashSub = tabKey === 'EXPENSE' ? `이번 달만 ${won(EXPENSE_SHOCK)} 더 써요` : `소득 ${won(income)}의 ${income > 0 ? pct((100 * cash) / income) : '-'}`
  return [
    { label: '월 여유자금', value: won(cash), sub: cashSub },
    { label: '추가 상환', value: `월 ${won(kept)}`, sub: extra === 0 ? '정한 추가 상환이 없어요' : kept >= extra ? '목표만큼 갚을 수 있어요' : kept > 0 ? `목표보다 ${won(extra - kept)} 줄여야 해요` : '추가 상환을 하기 어려워요' },
    { label: '기본 상환', value: `월 ${won(basic)}`, sub: cash >= 0 ? '그대로 낼 수 있어요' : `매달 ${won(-cash)} 부족해요` },
  ]
}

const ceil1 = n => Math.ceil(n * 10 - 1e-9) / 10
// 어디까지 버틸 수 있나요: 금리(변동금리 대출이 있을 때) · 소득 · 예상 못 한 지출
export function limitGroups(data, budget, loans) {
  const income = budget.monthly_income
  const cash = data.indicators.available_cash
  const extra = plannedExtra(budget)
  const groups = []
  const variable = loans.filter(l => l.rate_type === 'VARIABLE')
  if (variable.length) {
    const { reduce_extra_from: reduce, basic_at_risk_from: basic } = data.rate_thresholds
    groups.push({
      key: 'rate', title: `금리 · ${variable.length === 1 ? `${loanName(variable[0])}(변동)` : '변동금리 대출'}`,
      lines: reduce == null && basic == null ? [{ text: '금리가 5%p 올라도 지금 계획을 지킬 수 있어요' }] : [
        reduce != null && { bold: reduce === 0 ? '지금도' : `+${reduce}%p부터`, text: ' 추가 상환을 줄여야 해요' },
        basic != null && { bold: basic === 0 ? '지금도' : `+${basic}%p부터`, text: ' 기본 상환이 어려워요' },
      ].filter(Boolean),
    })
  }
  if (income > 0) {
    const reduce = extra > 0 ? ceil1((Math.max(cash - extra, 0) * 100) / income) : null
    const basic = ceil1((Math.max(cash, 0) * 100) / income)
    groups.push({
      key: 'income', title: '소득',
      lines: [
        reduce != null && { bold: cash < extra ? '지금도' : `${reduce}% 줄면`, text: ' 추가 상환을 줄여야 해요' },
        { bold: cash < 0 ? '지금도' : `${basic}% 줄면`, text: ' 기본 상환이 어려워요' },
      ].filter(Boolean),
    })
  }
  const room = Math.max(cash, 0) + emergencyOf(budget)
  groups.push({
    key: 'expense', title: '예상 못 한 지출',
    lines: [{ bold: won(EXPENSE_SHOCK), text: room >= EXPENSE_SHOCK ? ' · 비상자금으로 대응 가능해요' : ` · 여유자금과 비상자금(${won(room)})으로는 모자라요` }],
  })
  return groups
}

// 비상자금으로 버티는 기간: 소득 −5% 시뮬레이션에서 매달 부족한 금액이 있을 때만 개월 수를 계산한다.
export function emergencyRunway(budget, incomeDownSim) {
  const reserve = emergencyOf(budget)
  const shortfall = incomeDownSim ? Math.max(-incomeDownSim.scenario.available_cash, 0) : 0
  return { reserve, shortfall, months: shortfall > 0 ? Math.floor(reserve / shortfall) : null }
}

// 한 번에 필요한 돈: 예상 못 한 지출과, 만기에 한 번에 갚아야 하는 만기일시 대출의 원금
export function lumpNeeds(data, budget, loans) {
  const fromCash = Math.min(Math.max(data.indicators.available_cash, 0), EXPENSE_SHOCK)
  const bullets = loans.filter(l => l.repayment_method === 'BULLET').map(l => ({
    key: l.loan_id, title: `만기 원금 · ${loanName(l)}`, amount: l.remaining_principal, sub: `${l.maturity_date.slice(0, 4)}.${l.maturity_date.slice(5, 7)} 만기 · 매달 부족액과 따로 준비해요`,
  }))
  return { shock: { amount: EXPENSE_SHOCK, sub: `이번 달 여유자금 ${won(fromCash)} + 비상자금 ${won(EXPENSE_SHOCK - fromCash)}` }, bullets }
}
