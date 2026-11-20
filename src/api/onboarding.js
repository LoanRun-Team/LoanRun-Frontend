// 온보딩 API. 경로는 URL 명세서 3차 확정본을 따르고 마지막 슬래시를 유지한다.
// 화면 폼 값이 API 의 snake_case 키와 같아서 가공하지 않고 그대로 주고받는다.
//
export function createOnboardingApi({ request }) {
  return {
    // 온보딩 재진입 및 완료 상태 확인
    getProgress: opts => request('/api/onboarding/', opts),
    // 등록 완료 (각 단계 저장 API 재사용)
    complete: opts => request('/api/onboarding/complete/', { method: 'POST', ...opts }),

    // S-01a~b: 대출 종류·은행 목록 / 은행별 상품명 드롭다운
    getLoanProductOptions: (query, opts) => request('/api/loan-products/options/', { query, ...opts }),
    getLoanProducts: (query, opts) => request('/api/loan-products/', { query, ...opts }),

    // S-01c: 대출 등록 전 기본 월 상환액 계산 / S-01d: 등록·목록·삭제
    previewLoan: (body, opts) => request('/api/loans/preview/', { method: 'POST', body, ...opts }),
    createLoan: (body, opts) => request('/api/loans/', { method: 'POST', body, ...opts }),
    listLoans: opts => request('/api/loans/', opts),
    deleteLoan: (loanId, opts) => request(`/api/loans/${encodeURIComponent(loanId)}/`, { method: 'DELETE', ...opts }),

    // S-02: 기본 재정정보(소득·생활비·저축) / 비정기 소득 입금
    getBudgetProfile: opts => request('/api/budgets/profile/', opts),
    saveBudgetProfile: (body, opts) => request('/api/budgets/profile/', { method: 'PUT', body, ...opts }),
    // S-03: 이번 달 여유자금(상환 성향 금액의 기준). recurring_capacity 가 있으면 그 값, 없으면 available_cash.
    getBudgetMonth: (ym, opts) => request(`/api/budgets/${encodeURIComponent(ym)}/`, opts),
    createIncomeEntry: (body, opts) => request('/api/income-entries/', { method: 'POST', body, ...opts }),

    // S-03: 상환 계획 미리보기(DB 저장 없음) / 초기 목표 저장
    previewRepaymentPlan: (body, opts) => request('/api/repayment-plans/preview/', { method: 'POST', body, ...opts }),
    // 저장은 헤더 Idempotency-Key 와 미리보기에서 받은 preview_version 이 필수다(최신과 다르면 409 PLAN_PREVIEW_STALE).
    saveRepaymentPlan: (body, { idempotencyKey, ...opts } = {}) => request('/api/repayment-plans/', { method: 'PUT', body, headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined, ...opts }),
  }
}
