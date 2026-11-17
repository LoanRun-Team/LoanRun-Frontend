// 대출 mock: 월 상환액 계산(preview), 등록·목록·삭제. 응답 필드는 Notion 명세(대출 등록 전 기본 월 상환액 계산, 대출 등록)와 동일.
// 계산식은 화면 확인용 근사치이며 실제 계산은 서버 엔진이 한다. 등록한 대출은 새로고침 후에도 보이도록 sessionStorage 에 둔다.
const KEY = 'loanrun-mock-loans'
const TYPES = ['CREDIT', 'MORTGAGE', 'JEONSE', 'STUDENT', 'AUTO', 'OTHER']
const METHODS = ['EQUAL_PAYMENT', 'EQUAL_PRINCIPAL', 'GRACE_INSTALLMENT', 'BULLET', 'CREDIT_LINE']

function read() {
  try { return JSON.parse(sessionStorage.getItem(KEY)) ?? { nextId: 1, loans: [] } } catch { return { nextId: 1, loans: [] } }
}
function write(state) { try { sessionStorage.setItem(KEY, JSON.stringify(state)) } catch { /* mock 저장 실패는 무시 */ } }

const today = () => new Date().toISOString().slice(0, 10)
const monthsBetween = (a, b) => {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  return (by - ay) * 12 + (bm - am) - (bd < ad ? 1 : 0)
}
const annuity = (principal, monthlyRate, n) => (monthlyRate === 0 ? principal / n : (principal * monthlyRate) / (1 - (1 + monthlyRate) ** -n))

export function validateLoanBody(b) {
  const errors = {}
  const need = (key, ok, message) => { if (!ok) errors[key] = [message] }
  need('loan_form', ['GENERAL', 'CREDIT_LINE'].includes(b.loan_form), 'GENERAL 또는 CREDIT_LINE 만 가능합니다.')
  need('loan_type', TYPES.includes(b.loan_type), '지원하지 않는 유형입니다.')
  need('repayment_method', METHODS.includes(b.repayment_method), '지원하지 않는 상환 방법입니다.')
  need('annual_rate', typeof b.annual_rate === 'number' && b.annual_rate >= 0 && b.annual_rate < 30, '금리는 0 이상 30 미만이어야 합니다.')
  need('rate_type', ['FIXED', 'VARIABLE'].includes(b.rate_type), 'FIXED 또는 VARIABLE 만 가능합니다.')
  need('start_date', /^\d{4}-\d{2}-\d{2}$/.test(b.start_date ?? '') && b.start_date <= today(), '실행일은 오늘 이후일 수 없습니다.')
  need('maturity_date', /^\d{4}-\d{2}-\d{2}$/.test(b.maturity_date ?? '') && b.maturity_date > (b.start_date ?? ''), '만기일은 실행일 이후여야 합니다.')
  need('payment_day', Number.isInteger(b.payment_day) && b.payment_day >= 1 && b.payment_day <= 31, '납부일은 1~31 이어야 합니다.')
  if (!b.product_id) { need('institution_name', Boolean(b.institution_name), '직접 입력 시 은행명이 필요합니다.'); need('product_name', Boolean(b.product_name), '직접 입력 시 상품명이 필요합니다.') }
  if (b.loan_form === 'CREDIT_LINE') {
    need('credit_limit', Number.isInteger(b.credit_limit) && b.credit_limit > 0, '약정 한도는 양수여야 합니다.')
    need('used_amount', Number.isInteger(b.used_amount) && b.used_amount >= 0 && b.used_amount <= (b.credit_limit ?? 0), '사용액은 0 이상 한도 이하여야 합니다.')
  } else {
    need('original_principal', Number.isInteger(b.original_principal) && b.original_principal > 0, '최초 원금은 양수여야 합니다.')
    need('remaining_principal', Number.isInteger(b.remaining_principal) && b.remaining_principal >= 0 && b.remaining_principal <= (b.original_principal ?? 0), '현재 잔액은 0 이상 최초 원금 이하여야 합니다.')
  }
  if (b.repayment_method === 'GRACE_INSTALLMENT') need('grace_months', Number.isInteger(b.grace_months) && b.grace_months >= 1, '거치 기간은 1개월 이상이어야 합니다.')
  return errors
}

export function previewLoan(b) {
  const monthlyRate = b.annual_rate / 1200
  const remainingMonths = Math.max(1, monthsBetween(today() < b.start_date ? b.start_date : today(), b.maturity_date))
  const principal = b.loan_form === 'CREDIT_LINE' ? b.used_amount : b.remaining_principal
  let payment, nextPrincipal, nextInterest
  const interest = Math.round(principal * monthlyRate)
  switch (b.repayment_method) {
    case 'EQUAL_PRINCIPAL': nextPrincipal = Math.round(principal / remainingMonths); nextInterest = interest; break
    case 'GRACE_INSTALLMENT': {
      const after = Math.max(1, remainingMonths - (b.grace_months ?? 0))
      if (b.post_grace_method === 'EQUAL_PRINCIPAL') { nextPrincipal = Math.round(principal / after); nextInterest = interest } else { payment = Math.round(annuity(principal, monthlyRate, after)); nextInterest = interest; nextPrincipal = payment - interest }
      break
    }
    case 'BULLET': case 'CREDIT_LINE': nextPrincipal = 0; nextInterest = interest; break
    default: payment = Math.round(annuity(principal, monthlyRate, remainingMonths)); nextInterest = interest; nextPrincipal = payment - interest
  }
  payment = payment ?? nextPrincipal + nextInterest
  return {
    estimated_monthly_payment: payment,
    contractual_monthly_payment: b.contractual_monthly_payment ?? null,
    estimated_next_principal: nextPrincipal,
    estimated_next_interest: nextInterest,
    maturity_date: b.maturity_date,
    remaining_months: remainingMonths,
    warnings: ['중도상환수수료·연체이자 미제공. 실제 계약상 부분상환 가능 여부와 수수료를 확인하세요.'],
    repayment_category: b.repayment_method === 'BULLET' || b.repayment_method === 'CREDIT_LINE' ? 'LUMP_SUM' : 'INSTALLMENT',
  }
}

export function createLoan(b) {
  const state = read()
  const p = previewLoan(b)
  const original = b.original_principal ?? null
  const paid = original == null ? null : original - (b.remaining_principal ?? 0)
  const loan = {
    loan_id: state.nextId++,
    product_id: b.product_id ?? null,
    institution_name: b.institution_name ?? '예시 은행',
    product_name: b.product_name ?? '',
    loan_type: b.loan_type,
    loan_form: b.loan_form,
    repayment_method: b.repayment_method,
    original_principal: original,
    remaining_principal: b.remaining_principal ?? null,
    annual_rate: b.annual_rate,
    rate_type: b.rate_type,
    rate_reset_months: b.rate_reset_months ?? null,
    next_rate_reset_date: b.next_rate_reset_date ?? null,
    start_date: b.start_date,
    maturity_date: b.maturity_date,
    payment_day: b.payment_day,
    grace_months: b.grace_months ?? 0,
    post_grace_method: b.post_grace_method ?? null,
    credit_limit: b.credit_limit ?? null,
    used_amount: b.used_amount ?? null,
    contractual_monthly_payment: b.contractual_monthly_payment ?? null,
    estimated_monthly_payment: p.estimated_monthly_payment,
    paid_principal: paid,
    progress_percent: original ? Math.round((paid / original) * 10000) / 100 : null,
    status: 'ACTIVE',
    as_of: today(),
    repayment_category: p.repayment_category,
    rate_source: 'MANUAL',
    rate_updated_at: new Date().toISOString(),
    rate_link_consent: false,
    rate_sync_status: 'NOT_APPLICABLE',
  }
  state.loans.push(loan)
  write(state)
  return loan
}

export const listLoans = () => read().loans

export function deleteLoan(id) {
  const state = read()
  const index = state.loans.findIndex(l => l.loan_id === Number(id))
  if (index < 0) return false
  state.loans.splice(index, 1)
  write(state)
  return true
}
