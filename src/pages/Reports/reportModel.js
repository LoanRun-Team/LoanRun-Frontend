// 상환 리포트 화면 모델. GET /api/reports/latest/ · /strategy/ 응답(REPORT_API.md)을 화면 문구·표시값으로 바꾼다.
import { won } from '../Budget/budgetModel.js'

export const AGE_GROUPS = [
  { code: 'AGE_20S', label: '20대' },
  { code: 'AGE_30S', label: '30대' },
  { code: 'AGE_40S', label: '40대' },
  { code: 'AGE_50S_PLUS', label: '50대 이상' },
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
