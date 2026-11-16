// 예산·지출에서 쓰는 API. 경로·메서드는 URL 명세서(2026-11-15 3차 확정) 그대로이며, 마지막 슬래시를 유지한다.
// 요청/응답 필드는 Notion 상세 페이지(월별 예산·재정정보 조회, 입력·수정, 여유자금 분배 반영, 소득 입금 추가)를 확인한 뒤 화면에 연결한다.
// TODO: 필드 확인 후 mock 핸들러와 pages/Budget 의 localStorage 저장(budgetModel.js)을 이 함수들로 바꾼다.
//
// 사용: const budgetApi = createBudgetApi(api)  // api = createApi(...) 가 반환한 클라이언트
export function createBudgetApi({ request }) {
  const month = ym => `/api/budgets/${encodeURIComponent(ym)}/` // ym: 'YYYY-MM'
  return {
    // 월별 예산·재정정보 조회 / 월별 재정정보 입력·수정
    getMonth: (ym, opts) => request(month(ym), opts),
    saveMonth: (ym, body, opts) => request(month(ym), { method: 'PUT', body, ...opts }),
    // 여유자금 분배 반영
    applyAllocation: (ym, body, opts) => request(`${month(ym)}allocation/`, { method: 'PUT', body, ...opts }),
    // 월별 소득 입금 추가 기록(추가 수령, 비정기 입금)
    createIncomeEntry: (body, opts) => request('/api/income-entries/', { method: 'POST', body, ...opts }),
  }
}
