// 명세에 있는 엔드포인트만 등록한다. 경로·메서드·응답 envelope·코드는 Notion 명세 그대로.
// 인증(Bearer)은 mock 에서 검사하지 않는다.
import { institutions, loanTypes, products } from './loanProducts.js'
import { createLoan, deleteLoan, listLoans, previewLoan, validateLoanBody } from './loans.js'
import { createIncomeEntry, isMonth, monthView, saveAllocation, saveMonth, validateAllocation, validateIncomeEntry, validateMonthBody } from './budgets.js'
import { hasProfile, isFreePlan, loanExists, parseRiskQuery, riskView } from './risks.js'
import { completeOnboarding, getProfile, onboardingState, previewPlans, previewVersion, saveProfile, savePlans, validatePlans, validateProfile } from './plans.js'

const ok = (code, message, data, status = 200) => ({ status, body: { success: true, code, message, data } })
const validationError = errors => ({ status: 400, body: { success: false, code: 'VALIDATION_ERROR', message: '입력값을 확인해 주세요.', errors } })

function validateFilters(query) {
  const errors = {}
  const loanType = query.get('loan_type')
  const loanForm = query.get('loan_form')
  if (loanType && !loanTypes.some(t => t.code === loanType)) errors.loan_type = ['지원하지 않는 유형입니다.']
  if (loanForm && loanForm !== 'GENERAL') errors.loan_form = ['GENERAL 만 가능합니다.']
  return errors
}

const notFound = (code, message) => ({ status: 404, body: { success: false, code, message, errors: {} } })

export const mockHandlers = [
  {
    method: 'GET', path: '/api/onboarding/',
    respond: () => ok('ONBOARDING_DETAIL_SUCCESS', '온보딩 진행 정보를 조회했습니다.', onboardingState()),
  },
  {
    method: 'POST', path: '/api/onboarding/complete/',
    respond: () => ok('ONBOARDING_COMPLETE_SUCCESS', '온보딩을 완료했습니다.', completeOnboarding()),
  },
  {
    method: 'GET', path: '/api/budgets/profile/',
    respond: () => { const profile = getProfile(); return profile ? ok('FINANCE_PROFILE_SUCCESS', '기본 재정정보를 조회했습니다.', profile) : notFound('FINANCE_PROFILE_NOT_FOUND', '기본 재정정보가 없습니다.') },
  },
  {
    method: 'PUT', path: '/api/budgets/profile/',
    respond: ({ body }) => {
      const errors = validateProfile(body ?? {})
      return Object.keys(errors).length ? validationError(errors) : ok('FINANCE_PROFILE_SAVE_SUCCESS', '기본 재정정보 등록·수정 처리를 완료했습니다.', saveProfile(body))
    },
  },
  // 월별 예산 — 경로가 겹치지 않게 /api/budgets/profile/ 핸들러 뒤에 둔다.
  {
    method: 'GET', path: '/api/budgets/{year_month}/',
    respond: ({ params }) => isMonth(params.year_month)
      ? ok('MONTHLY_BUDGET_DETAIL_SUCCESS', '월별 예산·재정정보 정보를 조회했습니다.', monthView(params.year_month))
      : { status: 400, body: { success: false, code: 'INVALID_MONTH', message: '월 형식을 확인해 주세요.', errors: {} } },
  },
  {
    method: 'PUT', path: '/api/budgets/{year_month}/',
    respond: ({ params, body }) => {
      if (!isMonth(params.year_month)) return { status: 400, body: { success: false, code: 'INVALID_MONTH', message: '월 형식을 확인해 주세요.', errors: {} } }
      const errors = validateMonthBody(params.year_month, body ?? {})
      return Object.keys(errors).length ? validationError(errors) : ok('MONTHLY_BUDGET_SAVE_SUCCESS', '월별 재정정보를 저장했습니다.', saveMonth(params.year_month, body))
    },
  },
  {
    method: 'PUT', path: '/api/budgets/{year_month}/allocation/',
    respond: ({ params, body }) => {
      if (!isMonth(params.year_month)) return { status: 400, body: { success: false, code: 'INVALID_MONTH', message: '월 형식을 확인해 주세요.', errors: {} } }
      const errors = validateAllocation(params.year_month, body ?? {})
      return Object.keys(errors).length ? validationError(errors) : ok('BUDGET_ALLOCATION_SUCCESS', '여유자금 배분을 저장했습니다.', saveAllocation(params.year_month, body))
    },
  },
  {
    method: 'POST', path: '/api/income-entries/',
    respond: ({ body }) => {
      const errors = validateIncomeEntry(body)
      return Object.keys(errors).length ? validationError(errors) : ok('INCOME_ENTRY_CREATE_SUCCESS', '소득 입금 기록을 저장했습니다.', createIncomeEntry(body), 201)
    },
  },
  // 위험 분석
  {
    method: 'GET', path: '/api/risks/',
    respond: ({ query }) => {
      const { errors, value } = parseRiskQuery(query)
      if (Object.keys(errors).length) return validationError(errors)
      if (isFreePlan()) return { status: 403, body: { success: false, code: 'PRO_REQUIRED', message: 'PRO 이용자만 사용할 수 있습니다.', errors: {} } }
      if (value.loanId !== undefined && !loanExists(value.loanId)) return notFound('LOAN_NOT_FOUND', '대출을 찾을 수 없습니다.')
      if (!hasProfile()) return notFound('FINANCE_PROFILE_NOT_FOUND', '기본 재정정보를 찾을 수 없습니다.')
      return ok('RISK_DETAIL_SUCCESS', '재정 위험 분석 정보를 조회했습니다.', riskView(value))
    },
  },
  {
    method: 'POST', path: '/api/repayment-plans/preview/',
    respond: ({ body }) => {
      const errors = validatePlans(body)
      return Object.keys(errors).length ? validationError(errors) : ok('REPAYMENT_PLAN_PREVIEW_SUCCESS', '상환 계획을 계산했습니다.', previewPlans(body))
    },
  },
  {
    method: 'PUT', path: '/api/repayment-plans/',
    respond: ({ body, headers }) => {
      const errors = validatePlans(body)
      if (!headers.get('Idempotency-Key')) errors['header.Idempotency-Key'] = ['저장 요청에는 Idempotency-Key 헤더가 필요합니다.']
      if (!body?.preview_version) errors.preview_version = ['미리보기의 preview_version 이 필요합니다.']
      if (Object.keys(errors).length) return validationError(errors)
      if (body.preview_version !== previewVersion(body.plans)) return { status: 409, body: { success: false, code: 'PLAN_PREVIEW_STALE', message: '미리보기 이후 정보가 바뀌었습니다. 다시 계산해 주세요.', errors: {} } }
      return ok('REPAYMENT_PLAN_SAVE_SUCCESS', '상환 계획을 저장했습니다.', savePlans(body))
    },
  },
  {
    method: 'POST',
    path: '/api/loans/preview/',
    respond: ({ body }) => {
      const errors = validateLoanBody(body ?? {})
      return Object.keys(errors).length ? validationError(errors) : ok('LOAN_PREVIEW_SUCCESS', '기본 월 상환액을 계산했습니다.', previewLoan(body))
    },
  },
  {
    method: 'POST',
    path: '/api/loans/',
    respond: ({ body }) => {
      const errors = validateLoanBody(body ?? {})
      return Object.keys(errors).length ? validationError(errors) : ok('LOAN_CREATE_SUCCESS', '대출 정보를 등록했습니다.', createLoan(body), 201)
    },
  },
  {
    method: 'GET',
    path: '/api/loans/',
    respond: () => {
      const loans = listLoans()
      return ok('LOAN_LIST_SUCCESS', '보유 대출 목록 정보를 조회했습니다.', {
        loans,
        total_remaining_principal: loans.reduce((s, l) => s + l.remaining_principal, 0),
        total_monthly_due: loans.reduce((s, l) => s + l.estimated_monthly_payment, 0),
        estimated_payoff_date: loans.map(l => l.maturity_date).sort().at(-1) ?? null,
        count: loans.length,
      })
    },
  },
  {
    method: 'DELETE',
    path: '/api/loans/{loan_id}/',
    respond: ({ params }) => deleteLoan(params.loan_id)
      ? ok('LOAN_DELETE_SUCCESS', '대출 정보를 삭제했습니다.', { loan_id: Number(params.loan_id) })
      : notFound('LOAN_NOT_FOUND', '대출을 찾을 수 없습니다.'),
  },
  {
    method: 'GET',
    path: '/api/loan-products/options/',
    respond: ({ query }) => {
      const errors = validateFilters(query)
      if (Object.keys(errors).length) return validationError(errors)
      return ok('LOAN_PRODUCT_OPTIONS_SUCCESS', '대출 종류·은행 목록 정보를 조회했습니다.', { loan_types: loanTypes, institutions })
    },
  },
  {
    method: 'GET',
    path: '/api/loan-products/',
    respond: ({ query }) => {
      const errors = validateFilters(query)
      const rawInstitution = query.get('institution_id')
      if (!rawInstitution) errors.institution_id = ['은행을 선택해 주세요.']
      if (Object.keys(errors).length) return validationError(errors)
      const institutionId = Number(rawInstitution)
      if (!institutions.some(i => i.institution_id === institutionId)) {
        return { status: 404, body: { success: false, code: 'INSTITUTION_NOT_FOUND', message: '은행을 찾을 수 없습니다.', errors: {} } }
      }
      const loanType = query.get('loan_type')
      const loanForm = query.get('loan_form')
      const list = products
        .filter(p => p.institution_id === institutionId && (!loanType || p.loan_type === loanType) && (!loanForm || p.loan_form === loanForm))
        .map(({ loan_form: _form, ...product }) => product) // 응답 필드는 명세의 products[] 항목만
      return ok('LOAN_PRODUCT_LIST_SUCCESS', '은행별 대출상품 목록 정보를 조회했습니다.', { products: list })
    },
  },
]
