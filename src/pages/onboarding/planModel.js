// S-03 상환 목표: 대출별 목표(draft) → 상환 계획 API 요청(plans[]) 변환과 화면 표시 문장.
// 요청 필드는 Notion 명세(상환 계획 시뮬레이션 / 저장·수정)의 plans[] 와 같다.
import { diffMonths, fmtNumber, toISO, todayISO } from './format.js'
import { loanTypeLabels } from './data.js'

export const isLump = loan => loan.repayment_category === 'LUMP_SUM'

export const PREFERENCE_LABEL = { FAST: '빠른 상환', BALANCED: '균형 있는 상환', STABLE: '생활 안정 우선' }

// draft: 한 대출의 목표 입력 상태. tab 은 화면의 탭, *_override 는 성향 값을 사용자가 직접 바꾼 경우("직접 설정").
export const emptyDraft = {
  direction: null, // 일반 분할상환: 'maturity'(만기까지) | 'early'(일찍)
  tab: 'preference', // 'preference' | 'date' | 'extra'(분할) | 'monthly'(일시)
  preference: null, // FAST | BALANCED | STABLE
  extra_override: null,
  monthly_override: null,
  target_year: null,
  target_month: null,
  extra_monthly_payment: null,
  monthly_amount: null,
  saving_amount: null, // 만기일시 '월 적립액 기준' 탭의 월 적립액
  emergency_fund: null, // 목표 비상자금(선택) — API 필드가 없어 화면에서만 쓴다
}
export const draftOf = (goal, loanId) => ({ ...emptyDraft, ...goal.plans[loanId] })

export const tabsFor = loan => [
  { id: 'preference', label: '상환 성향으로' },
  { id: 'date', label: '완납일 기준' },
  isLump(loan) ? { id: 'monthly', label: '월 적립액 기준' } : { id: 'extra', label: '추가 상환액 기준' },
]

// 희망 완납일(년·월) → 날짜. 오늘 이후 ~ 만기 이전만 유효.
export function targetDateOf(loan, draft) {
  const { target_year: y, target_month: m } = draft
  if (!y || !m) return null
  const iso = toISO(y, m, Math.min(loan.payment_day, new Date(y, m, 0).getDate()))
  return iso > todayISO() && iso < loan.maturity_date ? iso : null
}

// 입력이 완성되면 plans[] 항목을, 아니면 null.
export function planPayload(loan, draft) {
  const base = { loan_id: loan.loan_id }
  const lump = isLump(loan)
  if (!lump && draft.direction === 'maturity') return { ...base, mode: 'MATURITY' }
  if (!lump && draft.direction !== 'early') return null
  switch (draft.tab) {
    case 'preference':
      if (!lump && draft.extra_override != null) return { ...base, mode: 'EXTRA_AMOUNT', extra_monthly_payment: draft.extra_override }
      if (lump && draft.monthly_override > 0) return { ...base, mode: 'MONTHLY_AMOUNT', monthly_amount: draft.monthly_override }
      return draft.preference ? { ...base, mode: 'PREFERENCE', preference: draft.preference } : null
    case 'date': { const target_date = targetDateOf(loan, draft); return target_date ? { ...base, mode: 'TARGET_DATE', target_date } : null }
    case 'extra': return draft.extra_monthly_payment != null ? { ...base, mode: 'EXTRA_AMOUNT', extra_monthly_payment: draft.extra_monthly_payment } : null
    // 만기일시: 월 총 납부액 = 이자 + 월 적립액. planned_saving_amount 는 적립 목표를 직접 정할 때 쓴다.
    case 'monthly': return draft.saving_amount > 0 ? { ...base, mode: 'MONTHLY_AMOUNT', monthly_amount: loan.estimated_monthly_payment + draft.saving_amount, planned_saving_amount: draft.saving_amount } : null
    default: return null
  }
}
export const allPlansReady = form => form.loans.length > 0 && form.loans.every(l => planPayload(l, draftOf(form.goal, l.loan_id)))

// 표시용 문장
export const fmtYM = iso => (iso ? `${Number(iso.slice(0, 4))}년 ${Number(iso.slice(5, 7))}월` : '—')
export function fmtGap(months) {
  const y = Math.floor(months / 12)
  const m = months % 12
  return [y ? `${y}년` : '', m ? `${m}개월` : ''].filter(Boolean).join(' ') || '0개월'
}
export const loanChipLabel = loan => loanTypeLabels[loan.loan_type] ?? loan.loan_type
const METHOD_SHORT = { EQUAL_PAYMENT: '원리금균등', EQUAL_PRINCIPAL: '원금균등', GRACE_INSTALLMENT: '거치 후 분할', BULLET: '만기일시상환' }
export function loanContext(loan) {
  const n = fmtNumber
  const rate = Number(loan.annual_rate).toFixed(1)
  if (isLump(loan)) return `만기일시상환 · 잔액 ${n(loan.remaining_principal)}원 · 연 ${rate}% · 만기 ${fmtYM(loan.maturity_date)} · 이자만 월 ${n(loan.estimated_monthly_payment)}원`
  return `${METHOD_SHORT[loan.repayment_method] ?? ''} · 기본 월 ${n(loan.estimated_monthly_payment)}원 · 만기 ${fmtYM(loan.maturity_date)}`
}

// 등록한 대출 → 대출 등록 요청 본문. 등록 때만 받는 값(initial_savings_balance)을 바꾸려면 지우고 다시 등록해야 해서 쓴다.
const BODY_KEYS = ['loan_form', 'loan_type', 'product_id', 'institution_name', 'product_name', 'repayment_method', 'original_principal', 'remaining_principal', 'annual_rate', 'rate_type', 'rate_reset_months', 'next_rate_reset_date', 'start_date', 'maturity_date', 'payment_day', 'contractual_monthly_payment', 'grace_months', 'post_grace_method', 'prepayment_policy', 'prepayment_fee_method', 'prepayment_fee_rate', 'fee_start_date', 'fee_end_date', 'fee_exempt', 'initial_savings_balance']
export const loanToBody = loan => Object.fromEntries(BODY_KEYS.filter(k => loan[k] !== undefined && !(k === 'grace_months' && !(loan[k] > 0))).map(k => [k, loan[k]]))

// 만기일시 '월 적립액 기준' 칩: 만기까지 필요한 월 적립액을 5만원 단위로 올린 값부터 10만원씩
export function savingChips(loan) {
  const need = Math.max(loan.remaining_principal - (loan.initial_savings_balance ?? 0), 0)
  const months = Math.max(1, diffMonths(todayISO(), loan.maturity_date))
  const base = Math.max(100000, Math.ceil(need / months / 50000) * 50000)
  return [base, base + 100000, base + 200000]
}

// 푸터의 "상환 성향" 문구
export function modeSummary(loan, draft) {
  if (!isLump(loan) && draft.direction === 'maturity') return '기본 상환만'
  if (!isLump(loan) && draft.direction !== 'early') return '—'
  if (draft.tab === 'preference' && draft.extra_override == null && draft.monthly_override == null) return draft.preference ? PREFERENCE_LABEL[draft.preference] : '—'
  return planPayload(loan, draft) ? '직접 설정' : '—'
}
