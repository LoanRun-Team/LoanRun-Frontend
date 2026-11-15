# API 데이터와 그래프 연결

금융 계산은 API가 담당합니다. 프론트는 응답에 있는 금액·차이·비율을 받아 도형 좌표와 표시 문자열로 바꿉니다. 아래는 프론트의 표시 모델이며 실제 API 응답은 이 모델로 매핑하면 됩니다.

## 전달 위치

```jsx
<App loanData={loanResponse} homeData={homeResponse} />
```

값을 생략하면 기존 Figma 더미데이터를 사용합니다. 대출관리의 기본값은 mockViewData.js에 분리했습니다.

## 대출관리 loanData

- loans: 대출 목록. percent는 API가 계산한 원금 상환율(0~100), balance는 잔액입니다. 카드의 원형 그래프가 percent에 반응합니다.
- progress[대출 ID]: { actualPercent, plannedPercent, principalDifference, goalDate, message? }. 달리기 위치와 원금 차이 문구에 사용합니다. principalDifference는 API가 계산한 원 단위 차이이며 비율 차이로 추정하지 않습니다.
- plans[대출 ID 또는 all]: 아래의 누적 상환 표시 데이터.
- segments[대출 ID 또는 all]: { rows, target, max?, message, periodLabel }. rows의 항목은 { id?, month, label?, principal, interest, extra, actual }입니다.
- comparisons[대출 ID 또는 all]: { current: { monthly, principal, interest }, proposed: { monthly, principal, interest } }. 계획 비교의 원금·이자는 응답값 그대로 표시합니다.
- monthlySummary: { total, completed }. 이번 달 상환 진행 막대에 사용합니다.
- history, records: 내역과 기록 목록을 API 응답으로 대체할 수 있습니다.

### plans 항목

```js
{
  periods: ['6월', '7월', '8월'],
  principalRows: [100000, 150000, 200000],
  interestRows: [50000, 40000, 30000],
  actual: [150000, 190000, 230000],
  planned: [160000, 200000, 240000],
  max: 1000000, // 선택: Y축 기준. 실제 데이터가 더 크면 표시 범위를 확장
  total: 570000,
  principal: 450000,
  interest: 120000,
  paymentDifference: -30000, // API 계산값. 음수/0/양수에 따라 배지 상태 변경
  monthly: 240000,
  base: 200000,
  extra: 40000,
  finish: '2044년 12월',
  expected: '2045.7',
  dday: '6,827',
  paceMessage: '계획보다 7개월 늦어요',
  rateChange: { index: 2, label: '8월 금리 변경' } // 선택
}
```

periods와 월별 배열은 같은 순서·길이로 전달합니다. 기간 수는 5개로 고정되어 있지 않습니다. 누적 막대·누적 계획선은 입력된 월별 금액을 표시용으로 합산합니다. 이자·예상 완납일을 계산하지 않습니다.

## 홈 homeData

- loans: 홈 대출별 트랙에 쓰는 목록(percent, before, pace 등).
- repayment: { total, completed, extra }. 원형 상환 진행률에 사용합니다.
- risk: { markerPercent, label }. 위험도 마커 위치와 활성 라벨에 사용합니다.

## 공용 수치 그래프

- components/Charts/StackedBarChart.jsx: 금액별 막대, 누적 계획선, 목표선, 기간 수, 축 범위.
- components/Charts/ProgressRing.jsx: 전달한 상환율에 따른 원형 그래프.
- components/Charts/chartGeometry.js: 표시 좌표 계산만 담당.

로고·달리기 아이콘 등은 Figma 원본을 유지합니다. 금액을 표현하던 고정 SVG는 데이터 기반 SVG 도형으로 교체했습니다.

## 검증

```sh
node --test verification/chartGeometry.test.mjs
node verification/chart-data-check.mjs
```

금액 비율 변경, 기간 수 변경, 계획선 이동, 비율 0/100, 빈 배열, 축 범위를 넘는 값과 컴포넌트에 새 API props를 전달했을 때의 렌더 결과를 검증합니다.
