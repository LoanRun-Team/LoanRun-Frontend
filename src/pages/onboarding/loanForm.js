// S-01c 대출 입력 폼의 기본값 규칙·검증·요청 본문 생성. 화면과 "다음" 활성 조건이 같은 규칙을 쓰도록 한 곳에 둔다.
// 요청 필드는 Notion 명세(POST /api/loans/preview/, POST /api/loans/)와 동일하다.
import { addMonths, diffMonths, isValidISO, todayISO } from './format.js'
import { feeLoanTypes } from './data.js'

export const RESET_MONTHS = [3, 6, 12]

// 사용자가 아직 고르지 않은 값은 대출 형태·상품에 따라 기본값을 정한다(저장하지 않고 읽을 때 계산).
export function withDefaults(loan, selection) {
  const catalogMethods = selection.product?.repayment_methods
  const rate_type = loan.rate_type ?? 'FIXED'
  return {
    ...loan,
    repayment_method: loan.repayment_method ?? catalogMethods?.[0] ?? 'EQUAL_PAYMENT',
    rate_type,
    rate_reset_months: rate_type === 'VARIABLE' ? (loan.rate_reset_months ?? 6) : null,
  }
}

export const totalMonths = (loan, selection) => {
  const fromTerm = (selection.term.years || 0) * 12 + (selection.term.months || 0)
  if (fromTerm > 0) return fromTerm
  return loan.start_date && loan.maturity_date ? diffMonths(loan.start_date, loan.maturity_date) : 0
}

const positive = n => Number.isInteger(n) && n > 0
const isPlain = n => Number.isInteger(n) && n >= 0

// 필수값이 모두 유효하면 요청 본문을, 아니면 null 을 돌려준다.
export function buildLoanBody({ loan: rawLoan, selection }) {
  const loan = withDefaults(rawLoan, selection)
  const manual = selection.manual
  if (!loan.loan_type || !loan.repayment_method) return null
  if (manual ? !(loan.institution_name?.trim() && loan.product_name?.trim()) : loan.product_id == null) return null

  const rate = loan.annual_rate
  if (typeof rate !== 'number' || !(rate >= 0 && rate < 30)) return null
  if (loan.rate_type === 'VARIABLE' && !RESET_MONTHS.includes(loan.rate_reset_months)) return null
  if (!isValidISO(loan.start_date) || loan.start_date > todayISO()) return null
  if (!isValidISO(loan.maturity_date) || loan.maturity_date <= loan.start_date) return null
  if (!Number.isInteger(loan.payment_day) || loan.payment_day < 1 || loan.payment_day > 31) return null

  const body = {
    loan_form: 'GENERAL', // 최종 명세: GENERAL 고정(한도대출 제외)
    loan_type: loan.loan_type,
    product_id: loan.product_id ?? null,
    institution_name: loan.institution_name ?? null,
    product_name: loan.product_name ?? null,
    repayment_method: loan.repayment_method,
    annual_rate: rate,
    rate_type: loan.rate_type,
    rate_reset_months: loan.rate_reset_months,
    next_rate_reset_date: null,
    start_date: loan.start_date,
    maturity_date: loan.maturity_date,
    payment_day: loan.payment_day,
    contractual_monthly_payment: null,
  }

  if (!positive(loan.original_principal) || !isPlain(loan.remaining_principal) || loan.remaining_principal > loan.original_principal || loan.remaining_principal === 0) return null
  // 다음 회차 납부 예정액은 분할상환에서만 받는다(만기일시는 이자를 론런이 계산).
  const scheduled = loan.repayment_method === 'BULLET' ? null : loan.contractual_monthly_payment ?? null
  if (scheduled != null && !isPlain(scheduled)) return null
  const result = { ...body, original_principal: loan.original_principal, remaining_principal: loan.remaining_principal, contractual_monthly_payment: scheduled }

  // 추가 상환 후 약정 변경 방식: 분할형은 필수, 만기일시는 null
  if (loan.repayment_method === 'BULLET') result.prepayment_policy = null
  else if (['KEEP_PAYMENT', 'KEEP_MATURITY'].includes(loan.prepayment_policy)) result.prepayment_policy = loan.prepayment_policy
  else return null

  if (loan.repayment_method === 'GRACE_INSTALLMENT') {
    const months = totalMonths(rawLoan, selection)
    if (!Number.isInteger(loan.grace_months) || loan.grace_months < 1 || loan.grace_months >= months) return null
    if (!['EQUAL_PAYMENT', 'EQUAL_PRINCIPAL'].includes(loan.post_grace_method)) return null
    result.grace_months = loan.grace_months
    result.post_grace_method = loan.post_grace_method
  }

  // 중도상환수수료(주택담보·전세자금만): 있음 → 계산 방식·수수료율·적용 기간, 면제, 잘 모르겠어요
  if (feeLoanTypes.includes(loan.loan_type)) {
    const { feeChoice, feeYears } = selection
    if (!feeChoice) return null
    if (feeChoice === 'EXEMPT') Object.assign(result, { prepayment_fee_method: 'NONE', prepayment_fee_rate: null, fee_exempt: true })
    else if (feeChoice === 'UNKNOWN') Object.assign(result, { prepayment_fee_method: 'UNKNOWN', prepayment_fee_rate: null, fee_exempt: null })
    else {
      if (!['FIXED', 'LINEAR'].includes(loan.prepayment_fee_method)) return null
      const feeRate = loan.prepayment_fee_rate
      if (typeof feeRate !== 'number' || !(feeRate > 0 && feeRate < 30) || !positive(feeYears)) return null
      Object.assign(result, { prepayment_fee_method: loan.prepayment_fee_method, prepayment_fee_rate: feeRate, fee_start_date: loan.start_date, fee_end_date: addMonths(loan.start_date, feeYears * 12), fee_exempt: false })
    }
  }
  return result
}
