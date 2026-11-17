// 상환 리포트에서 쓰는 API. 경로·메서드는 Notion 명세(최종본 2026.11.16)의 reports 계열과 상환 계획 시뮬레이션·저장의 전략 분기 그대로이며,
// 마지막 슬래시를 유지한다. 요청/응답 필드는 REPORT_API.md 참고. 화면 모델과의 변환은 pages/Reports/reportModel.js.
//
// 흐름: 최신 리포트 조회(GET latest) → NOT_GENERATED·stale 이면 생성(POST) → 상태 확인(GET {id}) → 전략 후보(GET strategy)
//       → 후보 선택 → 반영 미리보기(POST preview, 전략 분기) → 계획에 반영(PUT, 전략 분기 + preview_version).
export function createReportApi({ request }) {
  return {
    // 최신 상환 리포트. loanId 를 생략하면 전체 대출. PRO 가 아니면 403 PRO_REQUIRED.
    getLatest: ({ loanId } = {}, opts) => request('/api/reports/latest/', { query: { loan_id: loanId }, ...opts }),
    // 리포트 생성·재시도. 202 로 접수되며 이후 getReport(report_id) 로 상태를 확인한다. force 는 FAILED 재시도에만 true.
    generate: ({ loanId = null, force = false } = {}, opts) => request('/api/reports/', { method: 'POST', body: { loan_id: loanId, force }, ...opts }),
    getReport: (reportId, opts) => request(`/api/reports/${reportId}/`, opts),
    // 상환 전략 후보와 현재 전략. reportId 를 생략하면 최신 완료 리포트 기준.
    getStrategy: ({ reportId } = {}, opts) => request('/api/reports/strategy/', { query: { report_id: reportId }, ...opts }),
    getComparisonSettings: opts => request('/api/reports/comparison-settings/', opts),
    updateComparisonSettings: (body, opts) => request('/api/reports/comparison-settings/', { method: 'PATCH', body, ...opts }),
    // 전략 반영 미리보기(저장 없음). 상환 계획 시뮬레이션 API 의 전략 분기를 쓴다.
    previewStrategy: ({ reportId, strategyCode, strategyVersion }, opts) =>
      request('/api/repayment-plans/preview/', { method: 'POST', body: { report_id: reportId, strategy_code: strategyCode, strategy_version: strategyVersion }, ...opts }),
    // 전략을 계획에 반영(원자적 저장). preview 응답의 preview_version·data_revision 을 그대로 돌려보낸다. 최신이 아니면 409 STRATEGY_STALE.
    // 저장 요청은 헤더 Idempotency-Key 가 필수라 호출마다 새로 만든다(같은 요청을 다시 보낼 때만 같은 키를 넘긴다).
    applyStrategy: ({ reportId, strategyCode, strategyVersion, previewVersion, dataRevision, idempotencyKey = crypto.randomUUID() }, opts) =>
      request('/api/repayment-plans/', {
        method: 'PUT',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: { report_id: reportId, strategy_code: strategyCode, strategy_version: strategyVersion, preview_version: previewVersion, data_revision: dataRevision },
        ...opts,
      }),
  }
}
