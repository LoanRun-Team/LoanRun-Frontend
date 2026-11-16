// 위험 분석 화면 모델. GET /api/risks/ 응답(RISK_API.md)을 화면 문구·표시값으로 바꾼다.
import { loanName, won } from '../Budget/budgetModel.js'

export const LEVELS = [
  { code: 'STABLE', label: '안정' },
  { code: 'CAUTION', label: '주의' },
  { code: 'DANGER', label: '위험' },
]
export const levelLabel = code => LEVELS.find(l => l.code === code)?.label ?? '-'

// 비율(%)은 소수 첫째 자리까지, 값이 없으면 '-'
export const pct = n => (n == null ? '-' : `${Number(n) < 0 ? '−' : ''}${Math.abs(Number(Number(n).toFixed(1)))}%`)

// 재정 위험도 설명 문구. 금리 임계값(rate_thresholds)이 있으면 "금리 +x%p에 추가 상환이 흔들려요"로 이어 붙인다.
export function reasonText(data) {
  const surplus = data.indicators.surplus_ratio_percent
  if (data.data_status === 'INSUFFICIENT' || surplus == null) return '소득과 대출 정보를 입력하면 위험도를 알려드려요'
  const head = `여유자금 소득의 ${pct(surplus)}`
  const { reduce_extra_from: reduce, basic_at_risk_from: basic } = data.rate_thresholds
  if (reduce === 0) return `${head} · 지금도 추가 상환이 흔들리고 있어요`
  if (reduce != null) return `${head} · 금리 +${reduce}%p에 추가 상환이 흔들려요`
  if (basic === 0) return `${head} · 지금도 기본 상환이 빠듯해요`
  if (basic != null) return `${head} · 금리 +${basic}%p에 기본 상환이 부족해져요`
  return data.level === 'STABLE' ? `${head} · 금리가 올라도 지금 계획을 지킬 수 있어요` : `${head} · 작은 변화에도 계획이 흔들릴 수 있어요`
}

// ── 다가오는 위험 ───────────────────────────────────────────────────────
const EVENT_LINE = {
  PAYMENT_DUE: '이번 달 납부일이 다가왔어요',
  RATE_RESET: '변동금리 재산정으로 월 납부가 바뀌어요',
  GRACE_END: '거치가 끝나 다음 달부터 월 납부가 늘어요',
  MATURITY: '만기라 남은 원금을 한 번에 갚아요',
}
const dateLabel = iso => `${iso.slice(0, 4)}.${Number(iso.slice(5, 7))}.${Number(iso.slice(8, 10))}`

export const upcomingOf = (data, loans) => data.upcoming_events.map(e => {
  const loan = loans.find(l => l.loan_id === e.loan_id)
  return {
    key: `${e.type}-${e.loan_id}-${e.event_date}`,
    chip: `${e.d_day === 0 ? 'D-DAY' : `D-${e.d_day}`} · ${dateLabel(e.event_date)}`,
    title: e.type === 'GRACE_END' ? '거치 후 분할 대출' : (loan ? loanName(loan) : '대출'),
    line: EVENT_LINE[e.type] ?? '확인이 필요한 일정이에요',
    imminent: e.is_imminent,
  }
})

// ── 지난 6개월 변화 ─────────────────────────────────────────────────────
const UNIT = { PCT: '%', PP: '%p', KRW: '원' }
const signed = n => `${n < 0 ? '−' : '+'}${Math.abs(n)}`
const REASON = { RATE: '금리', INCOME: '소득', EXPENSE: '선택 지출' }
const md = iso => `${Number(iso.slice(5, 7))}.${Number(iso.slice(8, 10))}`

export const changeOf = c => {
  const up = c.direction === 'INCREASE'
  const what = c.change_value == null ? REASON[c.reason] : `${REASON[c.reason]} ${signed(c.change_value)}${UNIT[c.change_unit] ?? ''}`
  return {
    key: `${c.year_month}-${c.reason}`,
    date: md(c.event_date),
    what,
    result: `${c.reason === 'RATE' ? '월 이자' : '월 부담'} ${up ? '▲' : '▼'}${won(Math.abs(c.amount_delta))}`,
    up,
  }
}

// "월 부담 약 +2만원 · 추가 상환은 유지 중이에요"
export function burdenLine(data) {
  const delta = data.six_month_summary.net_monthly_burden_delta
  if (delta == null) return ''
  const abs = Math.abs(delta)
  const amount = abs >= 10000 ? `${Number((abs / 10000).toFixed(1))}만원` : won(abs)
  const head = delta === 0 ? '월 부담은 그대로예요' : `월 부담 약 ${delta < 0 ? '−' : '+'}${amount}`
  return `${head} · ${data.rate_thresholds.reduce_extra_from === 0 ? '추가 상환이 줄어들 수 있어요' : '추가 상환은 유지 중이에요'}`
}

// "6개월 중 금리 변동 1번 · 선택 지출 증가 2번 · 소득 감소 1번" — 0번인 항목은 뺀다.
export function countsLine(data) {
  const rows = data.six_month_changes
  const parts = [
    [`금리 변동`, data.six_month_summary.rate_change_count],
    [`선택 지출 증가`, rows.filter(c => c.reason === 'EXPENSE' && c.direction === 'INCREASE').length],
    [`소득 감소`, rows.filter(c => c.reason === 'INCOME' && c.direction === 'INCREASE').length],
  ].filter(([, n]) => n > 0)
  return parts.length ? `6개월 중 ${parts.map(([label, n]) => `${label} ${n}번`).join(' · ')}` : ''
}
