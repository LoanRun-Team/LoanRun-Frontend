# API와 그래프 연결

실제 명세 기반 연결은 [Mock API 안내](../../../docs/MOCK_API.md)를 참고하세요.

기존 `App loanData/homeData` 주입 방식은 사용하지 않습니다. 페이지가 `src/api/services.js`를 통해 조회하고, `src/api/loanView.js`가 응답 필드를 화면 표시 모델로 변환합니다.

- 원형 그래프: 대출 상세 응답의 `progress_percent`.
- 달리기 그래프: 상환 계획 응답의 실제/계획 진행률. 계획 진행률이 null이면 계획 주자를 표시하지 않습니다.
- 월별 막대: `/api/payments/monthly-summary/`의 원금·이자·추가 상환 금액.
- 누적 상환: 월별 응답을 표시 목적으로 누적합니다. 금리·예상 완납일은 계산하지 않습니다.
- 실서버 구간 기록·누적 그래프는 월별 통계의 조회 기간에 맞춰 납부 내역을 모든 페이지까지 조회합니다. 통계 금액이 null이고 실제 납부 기록이 있는 달은 기록된 amount/principal_amount/interest_amount/extra_amount 합계를 표시합니다. observed와 data_status는 변경하지 않으며 미기록 월을 0원으로 간주하지 않습니다. 확정 통계 값은 우선 유지합니다. 누적 그래프 막대는 원금(추가 상환 포함)·이자이며 수수료를 포함하지 않습니다.
- 만기일시의 남은 개월은 계약 maturity_date와 오늘(KST)의 달력 월 차이를 사용하며 남은 일부 개월은 올림합니다. 월말 기준일은 해당 월 말일로 맞춥니다. 만기 경과는 0개월, 만기일 미제공은 —입니다.
- 계획 비교: `/api/repayment-plans/preview/` 응답. 원금·이자별 월 구성은 현재 명세에 없어 `—`로 표시합니다.

`data.js`에는 메뉴와 금액 표시 함수만 유지합니다. 사용하지 않는 이전 대출·상환 내역·구간 기록 샘플은 삭제했습니다. `mockViewData.js`는 현재 존재하지 않습니다.

`src/api/mock/loanDesignPreview.js`와 `overallDesignPreview.js`는 명시적으로 선택하는 디자인 미리보기에서 사용합니다. `server.js`와 `specFixtures.js`는 전체 mock 모드와 홈 리포트 상태 예시, 팀원 API 클라이언트에서 참조하므로 아직 삭제하지 않습니다. 현재 hybrid 모드의 일반 대출관리 화면은 실제 API를 사용하며 서버 오류를 샘플로 대체하지 않습니다.

검증: `node --test verification/chartGeometry.test.mjs verification/mock-api.test.mjs`, 개발 서버 실행 후 `node verification/api-ui-check.mjs`.
