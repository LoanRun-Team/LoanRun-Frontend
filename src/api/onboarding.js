// 온보딩에서 쓰는 API. 경로·메서드는 URL 명세서(2026-11-15 3차 확정) 그대로이며, 마지막 슬래시를 유지한다.
// 요청/응답 필드는 ONBOARDING_API.md 참고. 화면 폼 값이 API snake_case 와 같은 키라서 여기서는 가공하지 않고 그대로 주고받는다.
// 아직 상세 스펙을 읽지 않은 엔드포인트(온보딩 진행/완료, 재정정보, 상환 계획)는 해당 화면을 구현할 때 확인한다.
//
// 사용: const onboardingApi = createOnboardingApi(api)  // api = createApi(...) 가 반환한 클라이언트
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
    createIncomeEntry: (body, opts) => request('/api/income-entries/', { method: 'POST', body, ...opts }),

    // S-03: 상환 계획 미리보기(DB 저장 없음) / 초기 목표 저장
    previewRepaymentPlan: (body, opts) => request('/api/repayment-plans/preview/', { method: 'POST', body, ...opts }),
    saveRepaymentPlan: (body, opts) => request('/api/repayment-plans/', { method: 'PUT', body, ...opts }),
  }
}
