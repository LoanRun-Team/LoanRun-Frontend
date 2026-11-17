// 명세에 있는 엔드포인트만 등록한다. 경로·메서드·응답 envelope·코드는 Notion 명세 그대로.
// 인증(Bearer)은 mock 에서 검사하지 않는다.
import { institutions, loanTypes, products } from './loanProducts.js'
import { createLoan, deleteLoan, listLoans, previewLoan, validateLoanBody } from './loans.js'
import { createIncomeEntry, isMonth, monthView, saveAllocation, saveMonth, validateAllocation, validateIncomeEntry, validateMonthBody } from './budgets.js'
import { hasProfile, isFreePlan, loanExists, parseRiskQuery, riskView } from './risks.js'
import { applyStrategy, comparisonSettings, generateReport, getReportById, isPro, isStrategyBody, latestReport, loanKnown, previewStrategy, proRequired, saveComparison, strategyView, validateComparisonBody, validateStrategyBody } from './reports.js'
import { completeOnboarding, getProfile, onboardingState, previewPlans, saveProfile, savePlans, validatePlans, validateProfile } from './plans.js'

const ok = (code, message, data, status = 200) => ({ status, body: { success: true, code, message, data } })
const validationError = errors => ({ status: 400, body: { success: false, code: 'VALIDATION_ERROR', message: '입력값을 확인해 주세요.', errors } })

const LOAN_FORMS = ['GENERAL', 'CREDIT_LINE']

function validateFilters(query) {
  const errors = {}
  const loanType = query.get('loan_type')
  const loanForm = query.get('loan_form')
  if (loanType && !loanTypes.some(t => t.code === loanType)) errors.loan_type = ['지원하지 않는 유형입니다.']
  if (loanForm && !LOAN_FORMS.includes(loanForm)) errors.loan_form = ['GENERAL 또는 CREDIT_LINE 만 가능합니다.']
  return errors
}

const notFound = (code, message) => ({ status: 404, body: { success: false, code, message, errors: {} } })

const failure = (status, code, message) => ({ status, body: { success: false, code, message, errors: {} } })
// 상환 계획 시뮬레이션·저장의 전략 분기(report_id + strategy_code + strategy_version). PRO 만 쓸 수 있다.
function strategyBranch(body, save) {
  if (!isPro()) return proRequired()
  const errors = validateStrategyBody(body, save)
  if (Object.keys(errors).length) return validationError(errors)
  const result = save ? applyStrategy(body) : previewStrategy(body)
  if (result.error === 'STRATEGY_STALE') return failure(409, 'STRATEGY_STALE', '추천 전략 기준 데이터가 변경되었습니다. 다시 조회해 주세요.')
  if (result.error) return notFound('STRATEGY_NOT_FOUND', '전략을 찾을 수 없습니다.')
  return save ? ok('REPAYMENT_PLAN_SAVE_SUCCESS', '상환 계획을 저장했습니다.', result.data) : ok('REPAYMENT_PLAN_PREVIEW_SUCCESS', '상환 계획을 계산했습니다.', result.data)
}

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
  // 상환 리포트. /latest/·/strategy/·/comparison-settings/ 를 /{report_id}/ 보다 먼저 둔다.
  {
    method: 'GET', path: '/api/reports/latest/',
    respond: ({ query }) => {
      if (!isPro()) return proRequired()
      const loanId = query.get('loan_id')
      if (loanId !== null && !/^[1-9]\d*$/.test(loanId)) return validationError({ loan_id: ['입력값이 올바르지 않습니다.'] })
      if (loanId !== null && !loanKnown(Number(loanId))) return notFound('LOAN_NOT_FOUND', '대출을 찾을 수 없습니다.')
      return ok('REPORT_LATEST_SUCCESS', '최신 상환 리포트 정보를 조회했습니다.', latestReport())
    },
  },
  {
    method: 'GET', path: '/api/reports/strategy/',
    respond: ({ query }) => {
      if (!isPro()) return proRequired()
      const reportId = query.get('report_id')
      const latest = latestReport()
      if (reportId !== null && Number(reportId) !== latest.report_id) return notFound('REPORT_NOT_FOUND', '상환 리포트를 찾을 수 없습니다.')
      if (latest.status !== 'COMPLETED') return ok('REPORT_STRATEGY_SUCCESS', '상환 전략 정보를 조회했습니다.', { ...strategyView(latest.report_id), strategy_available: false, unavailable_reason: 'REPORT_NOT_READY', candidates: [], recommendation: null, strategy_version: null })
      return ok('REPORT_STRATEGY_SUCCESS', '상환 전략 정보를 조회했습니다.', strategyView(latest.report_id))
    },
  },
  {
    method: 'GET', path: '/api/reports/comparison-settings/',
    respond: () => isPro() ? ok('REPORT_COMPARISON_SETTINGS_SUCCESS', '또래 비교 기준·동의 정보를 조회했습니다.', comparisonSettings()) : proRequired(),
  },
  {
    method: 'PATCH', path: '/api/reports/comparison-settings/',
    respond: ({ body }) => {
      if (!isPro()) return proRequired()
      const errors = validateComparisonBody(body ?? {})
      return Object.keys(errors).length ? validationError(errors) : ok('REPORT_COMPARISON_SETTINGS_UPDATE_SUCCESS', '또래 비교 기준·동의 정보를 수정했습니다.', saveComparison(body ?? {}))
    },
  },
  {
    method: 'POST', path: '/api/reports/',
    respond: ({ body }) => {
      if (!isPro()) return proRequired()
      const loanId = body?.loan_id ?? null
      if (loanId !== null && !loanKnown(loanId)) return notFound('LOAN_NOT_FOUND', '대출을 찾을 수 없습니다.')
      const result = generateReport({ force: body?.force === true })
      if (result.error === 'RATE_LIMIT_EXCEEDED') return failure(429, 'RATE_LIMIT_EXCEEDED', '잠시 후 다시 시도해 주세요.')
      if (result.error) return failure(400, 'REPORT_INPUT_INCOMPLETE', '리포트를 만들 대출·재정 정보가 부족합니다.')
      return ok(result.status === 200 ? 'REPORT_LATEST_SUCCESS' : 'REPORT_GENERATE_ACCEPTED', result.status === 200 ? '최신 상환 리포트 정보를 조회했습니다.' : '리포트 생성 요청을 접수했습니다.', result.data, result.status)
    },
  },
  {
    method: 'GET', path: '/api/reports/{report_id}/',
    respond: ({ params }) => {
      if (!isPro()) return proRequired()
      const found = /^[1-9]\d*$/.test(params.report_id) ? getReportById(Number(params.report_id)) : null
      return found ? ok('REPORT_DETAIL_SUCCESS', '상환 리포트 결과·상태를 조회했습니다.', found) : notFound('REPORT_NOT_FOUND', '상환 리포트를 찾을 수 없습니다.')
    },
  },
  {
    method: 'POST', path: '/api/repayment-plans/preview/',
    respond: ({ body }) => {
      if (isStrategyBody(body)) return strategyBranch(body, false)
      const errors = validatePlans(body)
      return Object.keys(errors).length ? validationError(errors) : ok('REPAYMENT_PLAN_PREVIEW_SUCCESS', '상환 계획을 계산했습니다.', previewPlans(body))
    },
  },
  {
    method: 'PUT', path: '/api/repayment-plans/',
    respond: ({ body }) => {
      if (isStrategyBody(body)) return strategyBranch(body, true)
      const errors = validatePlans(body)
      return Object.keys(errors).length ? validationError(errors) : ok('REPAYMENT_PLAN_SAVE_SUCCESS', '상환 계획을 저장했습니다.', savePlans(body))
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
        total_remaining_principal: loans.reduce((s, l) => s + (l.remaining_principal ?? l.used_amount ?? 0), 0),
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
