// S-01c 대출 입력 폼의 기본값 규칙·검증·요청 본문 생성. 화면과 "다음" 활성 조건이 같은 규칙을 쓰도록 한 곳에 둔다.
// 요청 필드는 Notion 명세(POST /api/loans/preview/, POST /api/loans/)와 동일하다.
import { diffMonths, isValidISO, todayISO } from './format.js'

export const RESET_MONTHS = [3, 6, 12]

// 사용자가 아직 고르지 않은 값은 대출 형태·상품에 따라 기본값을 정한다(저장하지 않고 읽을 때 계산).
export function withDefaults(loan, selection) {
  const creditLine = loan.loan_form === 'CREDIT_LINE'
  const catalogMethods = selection.product?.repayment_methods
  const rate_type = loan.rate_type ?? (creditLine ? 'VARIABLE' : 'FIXED')
  return {
    ...loan,
    repayment_method: creditLine ? 'CREDIT_LINE' : (loan.repayment_method ?? catalogMethods?.[0] ?? 'EQUAL_PAYMENT'),
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
const nonNegative = n => Number.isInteger(n) && n >= 0

// 필수값이 모두 유효하면 요청 본문을, 아니면 null 을 돌려준다.
export function buildLoanBody({ loan: rawLoan, selection }) {
  const loan = withDefaults(rawLoan, selection)
  const creditLine = loan.loan_form === 'CREDIT_LINE'
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
    loan_form: loan.loan_form,
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

  if (creditLine) {
    if (!positive(loan.credit_limit) || !nonNegative(loan.used_amount) || loan.used_amount > loan.credit_limit) return null
    return { ...body, original_principal: null, remaining_principal: null, credit_limit: loan.credit_limit, used_amount: loan.used_amount }
  }

  if (!positive(loan.remaining_principal)) return null
  // TODO: Figma 에는 "최초 원금" 입력이 없어서 현재 잔액과 같게 보낸다(진행률 계산은 서버 기준). 입력 필드가 확정되면 교체.
  const original = loan.original_principal ?? loan.remaining_principal
  if (!positive(original) || loan.remaining_principal > original) return null
  const result = { ...body, original_principal: original, remaining_principal: loan.remaining_principal }

  if (loan.repayment_method === 'GRACE_INSTALLMENT') {
    const months = totalMonths(rawLoan, selection)
    if (!Number.isInteger(loan.grace_months) || loan.grace_months < 1 || loan.grace_months >= months) return null
    if (!['EQUAL_PAYMENT', 'EQUAL_PRINCIPAL'].includes(loan.post_grace_method)) return null
    return { ...result, grace_months: loan.grace_months, post_grace_method: loan.post_grace_method }
  }
  return result
}
