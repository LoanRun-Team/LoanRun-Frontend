// 상환 리포트 화면 모델. GET /api/reports/latest/ · /strategy/ 응답(REPORT_API.md)을 화면 문구·표시값으로 바꾼다.
import { loanName, won } from '../Budget/budgetModel.js'

export const AGE_GROUPS = [
  { code: 'AGE_20S', label: '20대' },
  { code: 'AGE_30S', label: '30대' },
  { code: 'AGE_40S', label: '40대' },
  { code: 'AGE_50_PLUS', label: '50대 이상' },
]
export const DECILES = [1, 2, 3, 4, 5]
export const ageLabel = code => AGE_GROUPS.find(a => a.code === code)?.label ?? ''
// 비교 기준 칩: "30대 · 소득 3분위". 기준을 아직 고르지 않았으면 빈 문자열.
export const compareLabel = c => (c?.age_group && c?.income_decile ? `${ageLabel(c.age_group)} · 소득 ${c.income_decile}분위` : '')

const md = iso => `${Number(iso.slice(5, 7))}.${Number(iso.slice(8, 10))}`
export const updatedLabel = report => (report.updated_at ? `최근 업데이트 ${md(report.updated_at.slice(0, 10))}` : '')
export const periodLabel = report => {
  const n = report.pace_analysis?.observed_month_count ?? 0
  return `분석 기간 최근 ${n >= 6 || n === 0 ? 6 : n}개월`
}

// "2045.03" — 전략 카드·미리보기 표에 쓰는 완납 예상일
export const ymDot = iso => (iso ? `${iso.slice(0, 4)}.${iso.slice(5, 7)}` : '-')
// "2045년 3월"
export const ymKo = iso => (iso ? `${iso.slice(0, 4)}년 ${Number(iso.slice(5, 7))}월` : '-')

// 비율(%)은 소수 첫째 자리까지
export const pct1 = n => (n == null ? '-' : `${Number(Number(n).toFixed(1))}%`)
// 만 원 단위 금액: 17,000,000 → "1,700만 원"
export const manWon = n => (n == null ? '-' : Math.abs(n) >= 10000 ? `${Math.round(n / 10000).toLocaleString('ko-KR')}만 원` : won(n))
export const signedWon = n => `${n < 0 ? '−' : '+'}${won(Math.abs(n))}`
export const signedMan = n => `${n < 0 ? '−' : '+'}${manWon(Math.abs(n))}`

// ── 완납 가능성 ─────────────────────────────────────────────────────────
export const GRADES = [
  { code: 'LOW', label: '낮음' },
  { code: 'MEDIUM', label: '보통' },
  { code: 'HIGH', label: '높음' },
]
export const gradeLabel = code => GRADES.find(g => g.code === code)?.label ?? '-'
const SCENARIO_LABEL = { CURRENT: '현재 속도', RATE_UP: '금리 +1%p', INCOME_DOWN: '소득 −5%' }
// 화면에 보이는 시나리오는 디자인의 3행. EXPENSE_UP 은 디자인에 없어 그리지 않는다.
export const scenarioRows = report => (report.payoff_scenarios ?? [])
  .filter(s => SCENARIO_LABEL[s.type])
  .map(s => ({
    key: s.type,
    label: SCENARIO_LABEL[s.type],
    level: s.level,
    text: s.estimated_payoff_date ? `예상 완납 ${ymKo(s.estimated_payoff_date)}` : '완납일을 계산하지 못했어요',
  }))
export const payoffHeadline = report => {
  const current = (report.payoff_scenarios ?? []).find(s => s.type === 'CURRENT')
  return current?.estimated_payoff_date ? `지금 속도면 ${ymKo(current.estimated_payoff_date)}에 모두 갚을 수 있어요` : '완납일을 계산하지 못했어요'
}

// ── 상환 전략 ───────────────────────────────────────────────────────────
// 대출 이름: 종류 이름이 겹치면 은행 이름을 붙인다.
export function loanLabel(loans, id) {
  const loan = loans.find(l => l.loan_id === id)
  if (!loan) return '대출'
  const name = loanName(loan)
  return loans.filter(l => loanName(l) === name).length > 1 ? `${name} · ${loan.institution_name}` : name
}

// 배분 한 줄: "주택담보대출 113,000원 · 신용대출 0원" (적립이면 "월 적립 521,740원")
export const allocationLine = (candidate, loans) => candidate.allocations
  .map(a => (a.allocation_type === 'REPAYMENT_SAVING' ? `월 적립 ${won(a.amount)}` : `${loanLabel(loans, a.loan_id)} ${won(a.amount)}`))
  .join(' · ')

// 추가 상환 순서: 우선순위가 있으면 "1 주택담보대출 → 2 신용대출", 모두 같으면 병행, 대출이 하나면 그 이름.
export function orderLine(allocations, loans) {
  const rows = allocations.filter(a => a.allocation_type !== 'REPAYMENT_SAVING')
  if (!rows.length) return '적립'
  if (rows.length === 1) return loanLabel(loans, rows[0].loan_id)
  const priorities = rows.map(a => a.priority)
  if (priorities.some(p => p == null) || new Set(priorities).size === 1) return '남은 원금 비율로 동시에'
  return [...rows].sort((a, b) => a.priority - b.priority).map(a => `${a.priority} ${loanLabel(loans, a.loan_id)}`).join(' → ')
}

// 실질 절감 칸: 수수료까지 알면 순절감, 아니면 이자 절감. 수수료를 모르면 "수수료 미반영".
export const savingOf = c => ({
  value: manWon(c.net_saving ?? c.interest_saving),
  note: c.estimated_total_fee == null ? '수수료 미반영' : `수수료 ${won(c.estimated_total_fee)} 포함`,
})

// 지금 내 상황 3칸(소비 패턴 · 상환 패턴 · 위험 요인)
export function situationCells(s) {
  const risk = s.basic_at_risk_from
  return [
    { key: 'spend', title: '소비 패턴', lead: '선택 지출 한도의', big: s.discretionary_limit_usage_pct == null ? '-' : pct1(s.discretionary_limit_usage_pct), tail: '', sub: s.surplus_ratio_pct == null ? '' : `여유자금은 소득의 ${pct1(s.surplus_ratio_pct)}예요` },
    s.consecutive_extra_on_track_months > 0
      ? { key: 'repay', title: '상환 패턴', lead: '추가 상환', big: `${s.consecutive_extra_on_track_months}개월`, tail: '연속 계획대로', sub: `미납 ${s.missed_payment_count_6m ?? 0}회` }
      : { key: 'repay', title: '상환 패턴', lead: '', big: '', tail: '연속 달성 기록이 아직 없어요', sub: `미납 ${s.missed_payment_count_6m ?? 0}회` },
    { key: 'risk', title: '위험 요인', lead: '변동금리 노출', big: s.variable_rate_exposure_pct == null ? '-' : `${Number(Number(s.variable_rate_exposure_pct).toFixed(0))}%`, tail: '', sub: risk == null ? '금리가 올라도 기본 상환은 지킬 수 있어요' : risk === 0 ? '지금도 기본 상환이 빠듯해요' : `금리 +${risk}%p면 기본 상환이 위험해져요` },
  ]
}

// 현재 적용 중인 전략 이름. 직접 정한 계획(MANUAL)·적용 전(NONE)은 "직접 정한 금액".
export const currentStrategyName = (strategy, code) => strategy?.candidates?.find(c => c.strategy_code === (code ?? strategy.current_strategy?.strategy_code))?.label ?? '직접 정한 금액'

// ── 반영 미리보기 ───────────────────────────────────────────────────────
const monthsBetween = (from, to) => (Number(to.slice(0, 4)) - Number(from.slice(0, 4))) * 12 + Number(to.slice(5, 7)) - Number(from.slice(5, 7))
const latestDate = plans => plans.map(p => p.estimated_payoff_date).filter(Boolean).sort().at(-1) ?? null
const sumOf = (plans, key) => plans.reduce((s, p) => s + (p[key] ?? 0), 0)

// 미리보기 표 행. { key, label, before, after, note } — note 는 변경 폭("2개월 늦어요", "+100,000원").
export function previewRows(preview, loans, currentCode) {
  const manual = !currentCode || currentCode === 'NONE' || currentCode === 'MANUAL'
  const rows = [{
    key: 'order', label: '추가 상환 순서',
    before: manual ? '직접 정한 금액' : orderLine(preview.current_allocations, loans),
    after: orderLine(preview.proposed_allocations, loans), note: '',
  }]
  const before = latestDate(preview.current_plans)
  const after = preview.estimated_payoff_date
  if (before && after) {
    const diff = monthsBetween(before, after)
    rows.push({ key: 'payoff', label: '완납 예상일', before: ymDot(before), after: ymDot(after), note: diff === 0 ? '변화 없어요' : `${Math.abs(diff)}개월 ${diff > 0 ? '늦어요' : '빨라요'}` })
  }
  const interestGap = preview.estimated_total_interest - sumOf(preview.current_plans, 'estimated_total_interest')
  rows.push({ key: 'interest', label: '총 이자', before: `약 ${manWon(sumOf(preview.current_plans, 'estimated_total_interest'))}`, after: `약 ${manWon(preview.estimated_total_interest)}`, note: interestGap === 0 ? '' : `${signedMan(interestGap).replace('+', '+약 ').replace('−', '−약 ')}` })
  for (const plan of preview.proposed_plans) {
    const prev = preview.current_plans.find(p => p.loan_id === plan.loan_id)?.extra_monthly_payment ?? 0
    rows.push({ key: `loan-${plan.loan_id}`, label: `${loanLabel(loans, plan.loan_id)} 월 추가 상환`, before: won(prev), after: won(plan.extra_monthly_payment), note: plan.extra_monthly_payment === prev ? '' : signedWon(plan.extra_monthly_payment - prev) })
  }
  return rows
}
