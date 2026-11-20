// 위험 시나리오 · 버틸 수 있는 한계 · 비상자금 · 한 번에 필요한 돈의 화면 모델.
// 입력: GET /api/risks/(data), 이번 달 예산(budget: GET /api/budgets/{ym}/), 대출 목록, 시뮬레이션 응답(sim: POST /api/risks/simulate/).
import { loanName, won } from '../Budget/budgetModel.js'
import { pct } from './riskModel.js'

export const EXPENSE_SHOCK = 500000
export const SCENARIO_TABS = [
  { key: 'CURRENT', label: '현재', body: null },
  { key: 'RATE_UP', label: '금리 +1%p', body: { scenario_type: 'RATE_UP' } },
  { key: 'INCOME_DOWN', label: '소득 −5%', body: { scenario_type: 'INCOME_DOWN' } },
  { key: 'EXPENSE', label: `예상 못 한 지출 ${EXPENSE_SHOCK / 10000}만 원`, body: null },
]

const signedWon = n => (n < 0 ? `−${won(-n)}` : won(n))
const plannedExtra = budget => (budget.allocation?.allocations ?? []).reduce((s, a) => s + a.amount, 0)
const emergencyOf = budget => budget.emergency_fund ?? 0
export const hasEmergency = budget => budget.emergency_fund != null

// 탭 하나의 세 칸(월 여유자금 / 추가 상환 / 기본 상환). sim 은 그 탭의 시뮬레이션 응답(현재·지출 탭은 null).
// 문구는 디자인의 위험 시나리오 탭 4개를 따른다.
export function scenarioStats(tabKey, data, budget, sim, loans = []) {
  const extra = plannedExtra(budget)
  const baseCash = data.indicators.available_cash
  const income = sim ? sim.scenario.income : budget.monthly_income
  const cash = tabKey === 'EXPENSE' ? baseCash - EXPENSE_SHOCK : sim ? sim.scenario.available_cash : baseCash
  const basic = sim ? sim.scenario.monthly_payment : budget.scheduled_repayment
  const kept = Math.min(extra, Math.max(cash, 0))
  const reserve = emergencyOf(budget)
  const shortfall = Math.max(-cash, 0)
  const pctOfIncome = income > 0 ? pct((100 * cash) / income) : '-'

  const cashSub = { CURRENT: `소득 ${won(income)}의 ${pctOfIncome}`, RATE_UP: `${signedWon(baseCash)}에서 ${won(baseCash - cash)} 줄어요`, INCOME_DOWN: `소득 ${won(income)} 기준`, EXPENSE: '한 번만 생기는 지출이에요' }[tabKey]
  const keepSub = extra === 0 ? '정한 추가 상환이 없어요' : kept >= extra ? '목표만큼 갚을 수 있어요' : kept > 0 ? `목표보다 ${won(extra - kept)} 줄여야 해요` : '추가 상환을 쉬어야 해요'

  let extraStat = { label: '추가 상환', value: kept > 0 ? `월 ${won(kept)}` : won(0), sub: keepSub }
  if (tabKey === 'EXPENSE') extraStat = { label: '추가 상환', value: `이번 달 ${won(Math.min(extra, Math.max(cash, 0)))}`, sub: extra > 0 ? `다음 달부터 ${won(extra)}으로 돌아가요` : '정한 추가 상환이 없어요' }

  let basicStat = { label: '기본 상환', value: `월 ${won(basic)}`, sub: '그대로 낼 수 있어요' }
  if (tabKey === 'RATE_UP') {
    const variable = loans.filter(l => l.rate_type === 'VARIABLE')
    const before = variable.reduce((t, l) => t + l.estimated_monthly_payment, 0)
    const after = before + (sim ? sim.delta.monthly_payment : 0)
    const name = variable.length === 1 ? loanName(variable[0]) : '변동금리 대출'
    basicStat.sub = `${variable.length ? `${name} ${won(before)} → ${won(after)} · ` : ''}${cash >= 0 ? '낼 수 있어요' : `매달 ${won(shortfall)} 부족해요`}`
  } else if (tabKey === 'INCOME_DOWN' && cash < 0) {
    basicStat = { label: '기본 상환', value: `매달 ${won(shortfall)} 부족`, sub: reserve > 0 ? `비상자금으로 약 ${Math.floor(reserve / shortfall)}개월 버틸 수 있어요` : '비상자금을 입력하면 버티는 기간을 알려드려요' }
  } else if (tabKey === 'EXPENSE' && cash < 0) {
    basicStat.sub = reserve >= shortfall ? `비상자금 ${won(shortfall)}으로 낼 수 있어요` : '비상자금으로도 모자라요'
  } else if (cash < 0) {
    basicStat.sub = `매달 ${won(shortfall)} 부족해요`
  }
  return [{ label: tabKey === 'EXPENSE' ? '이번 달 여유자금' : '월 여유자금', value: signedWon(cash), sub: cashSub }, extraStat, basicStat]
}

const ceil1 = n => Math.ceil(n * 10 - 1e-9) / 10
// 어디까지 버틸 수 있나요의 상태 4가지:
// 정상 / 이미 부족(여유자금 < 0) / 이미 1단계(여유자금 < 추가 상환 목표) / 계산 불가(변동금리 대출 없음, 소득 미입력)
export function limitGroups(data, budget, loans) {
  const income = budget.monthly_income
  const cash = data.indicators.available_cash
  const extra = plannedExtra(budget)
  const variable = loans.filter(l => l.rate_type === 'VARIABLE')
  const noIncome = { text: '소득을 입력하면 계산돼요', muted: true }
  const shortage = { text: `이미 매달 ${won(-cash)}이 부족해요`, muted: true }
  const belowGoal = { text: '이미 추가 상환 목표보다 여유자금이 적어요', muted: true }
  const groups = []

  const { reduce_extra_from: reduce, basic_at_risk_from: basic } = data.rate_thresholds
  const rateTitle = variable.length === 1 ? `금리 · ${loanName(variable[0])}(변동)` : variable.length ? '금리 · 변동금리 대출' : '금리'
  let rateLines
  if (!variable.length) rateLines = [{ text: '변동금리 대출이 없어 해당 없어요', muted: true }]
  else if (income <= 0) rateLines = [noIncome]
  else if (cash < 0) rateLines = [shortage]
  else if (reduce == null && basic == null) rateLines = [{ text: '금리가 5%p 올라도 지금 계획을 지킬 수 있어요' }]
  else {
    rateLines = []
    if (extra > 0 && cash < extra) rateLines.push(belowGoal)
    else if (reduce != null) rateLines.push({ bold: reduce === 0 ? '지금도' : `+${reduce}%p부터`, text: ' 추가 상환을 줄여야 해요' })
    if (basic != null) rateLines.push({ bold: basic === 0 ? '지금도' : `+${basic}%p부터`, text: ' 기본 상환이 어려워요' })
  }
  groups.push({ key: 'rate', title: rateTitle, lines: rateLines })

  let incomeLines
  if (income <= 0) incomeLines = [noIncome]
  else if (cash < 0) incomeLines = [shortage]
  else {
    incomeLines = []
    if (extra > 0 && cash < extra) incomeLines.push(belowGoal)
    else if (extra > 0) incomeLines.push({ bold: `${ceil1((Math.max(cash - extra, 0) * 100) / income)}% 줄면`, text: ' 추가 상환을 줄여야 해요' })
    incomeLines.push({ bold: `${ceil1((cash * 100) / income)}% 줄면`, text: ' 기본 상환이 어려워요' })
  }
  groups.push({ key: 'income', title: '소득', lines: incomeLines })

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
