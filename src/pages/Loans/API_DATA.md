# API와 그래프 연결

실제 명세 기반 연결은 [Mock API 안내](../../../docs/MOCK_API.md)를 참고하세요.

기존 `App loanData/homeData` 주입 방식은 사용하지 않습니다. 페이지가 `src/api/services.js`를 통해 조회하고, `src/api/loanView.js`가 응답 필드를 화면 표시 모델로 변환합니다.

- 원형 그래프: 대출 상세 응답의 `progress_percent`.
- 달리기 그래프: 상환 계획 응답의 실제/계획 진행률. 계획 진행률이 null이면 계획 주자를 표시하지 않습니다.
- 월별 막대: `/api/payments/monthly-summary/`의 원금·이자·추가 상환 금액.
- 누적 상환: 월별 응답을 표시 목적으로 누적합니다. 금리·예상 완납일은 계산하지 않습니다.
- 계획 비교: `/api/repayment-plans/preview/` 응답. 원금·이자별 월 구성은 현재 명세에 없어 `—`로 표시합니다.

`data.js`, `mockViewData.js`의 이전 Figma 샘플은 참고용입니다. 현재 페이지의 API 응답 대체값으로 사용하지 않습니다.

검증: `node --test verification/chartGeometry.test.mjs verification/mock-api.test.mjs`, 개발 서버 실행 후 `node verification/api-ui-check.mjs`.
