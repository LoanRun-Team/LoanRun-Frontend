// 예산·지출 API. 경로는 URL 명세서 3차 확정본을 따르고 마지막 슬래시를 유지한다.
// 응답을 화면 모델로 바꾸는 코드는 pages/Budget/budgetModel.js 에 있다.
//
export function createBudgetApi({ request }) {
  const month = ym => `/api/budgets/${encodeURIComponent(ym)}/` // ym: 'YYYY-MM'
  return {
    // 월별 예산 조회, 월별 재정정보 저장
    getMonth: (ym, opts) => request(month(ym), opts),
    saveMonth: (ym, body, opts) => request(month(ym), { method: 'PUT', body, ...opts }),
    // 여유자금 분배 반영
    // Idempotency-Key 헤더가 필수라 호출마다 새로 만들고, 같은 요청을 다시 보낼 때만 같은 키를 쓴다.
    applyAllocation: (ym, body, { idempotencyKey = crypto.randomUUID(), ...opts } = {}) => request(`${month(ym)}allocation/`, { method: 'PUT', body, headers: { 'Idempotency-Key': idempotencyKey }, ...opts }),
    // 추가 수령·비정기 입금 기록. 같은 키로 다시 보내면 같은 응답을 받는다.
    createIncomeEntry: (body, { idempotencyKey = crypto.randomUUID(), ...opts } = {}) => request('/api/income-entries/', { method: 'POST', body, headers: { 'Idempotency-Key': idempotencyKey }, ...opts }),
  }
}
