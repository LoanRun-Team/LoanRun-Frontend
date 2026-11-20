// 위험 분석 API. 경로는 Notion 명세(재정 위험 분석 조회)를 따르고 마지막 슬래시를 유지한다.
// 화면 모델 변환은 pages/Risk/riskModel.js 에 있다.
//
export function createRiskApi({ request }) {
  return {
    // 재정 위험 분석 조회. month: 'YYYY-MM'(기본 현재 월), loanId: 특정 대출만(기본 전체). PRO 가 아니면 403 PRO_REQUIRED.
    getRisks: ({ month, loanId } = {}, opts) => request('/api/risks/', { query: { month, loan_id: loanId }, ...opts }),
    // 금리·소득 변화 시뮬레이션. body: { loan_ids?, rate_increase_pp?(0~5), income_change_pct?(-100~100) }
    simulate: (body, opts) => request('/api/risks/simulate/', { method: 'POST', body, ...opts }),
  }
}
