# 위험 분석 API 스펙 요약

출처: Notion "API 명세서 최종본 · 2026.11.16" 의 "재정 위험 분석 조회"·"금리·소득 변화 시뮬레이션" (이슈 #9). 상태는 `BE 구현전`이라 값이 바뀔 수 있다.
호출 함수는 `risk.js`, mock 은 `mock/risks.js`. 공통 규약(envelope·인증·snake_case)은 `ONBOARDING_API.md` 와 같다.

## GET /api/risks/ — 재정 위험 분석 조회

쿼리: `month`(YYYY-MM, 기본 현재 월), `loan_id`(선택, 특정 대출만). 인증 필수 + **PRO 권한**.
실패: 400 `VALIDATION_ERROR`, 401 `AUTH_REQUIRED`, **403 `PRO_REQUIRED`**, 404 `LOAN_NOT_FOUND`, 404 `FINANCE_PROFILE_NOT_FOUND`.

| 필드 | 설명 | 화면 |
|---|---|---|
| `level` | `STABLE`\|`CAUTION`\|`DANGER` — 전체 위험도(여유자금 ÷ 소득 기준) | 재정 위험도 등급·게이지 |
| `checks[]` | `{code, label, ratio_pct, level}` 4개 점검: `SURPLUS_RATIO` `DISCRETIONARY_LIMIT` `VARIABLE_EXPOSURE` `BASIC_DEBT_SERVICE` | 점검 항목 4행과 상태 칩 |
| `rate_thresholds` | `reduce_extra_from`(추가 상환이 흔들리는 최초 가산금리 %p), `basic_at_risk_from`(기본 납부가 부족해지는 최초 가산금리). 미도달·변동대출 없음 = `null` | 위험도 설명 문구 "금리 +0.16%p에 …" |
| `indicators` | `surplus_ratio_percent` `debt_service_ratio_percent` `available_cash` `variable_rate_exposure` `discretionary_expenses` `discretionary_limit_amount` `discretionary_limit_usage_pct` | Free 화면의 "왜 주의일까요?" 값 |
| `upcoming_events[]` | `{type, loan_id, event_date, days_until, d_day, is_imminent}` — `is_imminent` = 0~30일 이내 | 다가오는 위험 카드 |
| `six_month_changes[]` | `{year_month, direction: INCREASE\|DECREASE, reason: RATE\|INCOME\|EXPENSE, amount_delta, event_date, change_value, change_unit: PCT\|PP\|KRW}` | 지난 6개월 변화 카드의 이벤트 |
| `six_month_summary` | `net_monthly_burden_delta`, `rate_change_count`, `income_change_count`, `expense_change_count` | 카드 요약 문구 |
| `history[]` | `{event_date, type, level, description}` | 화면에서 쓰지 않음 |
| `data_status` | `SUFFICIENT`\|`INSUFFICIENT` — 부족하면 값이 `null`/빈 배열 | 입력 안내 상태 |
| `strategy_link_available` | PRO 전략 리포트 진입 가능 | "내게 맞는 상환 전략 보러가기" 링크 |

점검 기준(서비스 표시 기준, 규제 DSR 아님): 여유자금 비율 8%↑ 안정 · 3~8% 주의 · 3%↓ 위험 / 선택 지출 한도 90%↓ 안정 · 90~100% 주의 · 100%↑ 위험 / 변동금리 노출 50%↓ 안정 · 50~90% 주의 · 90%↑ 위험 / 기본 상환 30%↓ 안정 · 30~40% 주의 · 40%↑ 위험.

## POST /api/risks/simulate/ — 금리·소득 변화 시뮬레이션

요청: `loan_ids`(선택, 미지정 시 전체), `rate_increase_pp`(0~5), `income_change_pct`(-100~100). PRO 필요(403 `PRO_REQUIRED`).
응답: `baseline`·`scenario`(`income` `monthly_payment` `available_cash` `level`, scenario 는 `payoff_feasibility` 추가), `delta`, `warnings[]`, `rate_thresholds`.

## 화면 ↔ API

| 화면 | API |
|---|---|
| 위험 분석(PRO) 진입 | `GET /api/risks/`, 대출 이름 표시용 `GET /api/loans/` |
| 위험 시나리오 4탭(현재 / 금리 +1%p / 소득 −5% / 예상 못 한 지출 50만 원) | 금리·소득 탭은 `POST /api/risks/simulate/`, 이번 달 소득·비상자금·배분은 `GET /api/budgets/{ym}/` |
| 위험 분석(Free) | 같은 호출이 403 `PRO_REQUIRED` 로 오면 잠금 오버레이를 보여 준다 |

## mock 동작

- 값은 월별 예산 mock 과 등록한 대출에서 위 기준대로 계산한다. 최근 6개월 변화는 입력한 달끼리 비교한 선택 지출·소득 변화이며, 입력이 없으면 비어 있다(가상 이력을 만들지 않음).
- PRO 기본. Free 화면은 브라우저 콘솔에서 `sessionStorage.setItem('loanrun-mock-plan', 'FREE')` 후 새로고침(되돌리기는 `removeItem`).
- 다가오는 이벤트는 재설정·거치 종료·만기만 만든다(월 납부일은 "이번 달 상환"에서 보여 주므로 제외).

## Figma 와 API 가 맞지 않는 부분 (확인 필요)

- `upcoming_events[].type` 값 목록이 명세에 "공통 규약"으로만 되어 있고 예시는 `PAYMENT_DUE` 하나뿐이다. 화면은 `PAYMENT_DUE` `RATE_RESET` `GRACE_END` `MATURITY` 를 가정한다.
- 다가오는 위험 카드의 설명 문구("변동금리 재산정으로 월 납부가 바뀌어요" 등)와 대출 이름은 API 에 없어 `type` 과 `loan_id`(대출 목록 조회)로 화면에서 만든다.
- 점검 행 라벨은 Figma 에서 "변동금리 노출 · 주택담보대출"이지만 API 의 `checks[].label` 은 "변동금리 노출"이다(대출 이름 없음).
- 위험도 설명 문구("여유자금 소득의 3.4% · 금리 +0.16%p에 추가 상환이 흔들려요")는 `indicators` 와 `rate_thresholds` 로 화면에서 조합한다. 임계값이 `null` 일 때의 문구는 Figma 에 없어 화면에서 정했다.
- 6개월 변화의 이벤트 이름("선택 지출 +1.3%", "금리 · 주택담보대출 +0.08%p")과 "월 부담 ▲10,000원" 은 `reason`, `change_value`, `change_unit`, `amount_delta` 로 만든다. 금리 이벤트의 대출 이름은 API 에 없다.
- "월 이자 ▲10,000원"(금리 변화의 결과 문구)은 `reason: RATE` 일 때만 "월 이자"로 쓰는 것으로 가정했다.
- Free 화면(E2)은 API 로 받을 수 있는 값이 없다(403). 잠금 뒤 흐리게 보이는 화면은 화면에 박아 둔 예시다.

## 이슈 #9 에서 추가한 화면과 가정 (확인 필요)

- 새 카드 4개(위험 시나리오, 어디까지 버틸 수 있나요, 비상자금으로 버티는 기간, 한 번에 필요한 돈)는 `ScenarioCards.jsx`, 값 계산은 `scenarioModel.js`.
- "예상 못 한 지출 50만 원" 탭과 소득 한계(0.3% / 3.5%)는 시뮬레이션 요청 필드가 없어 화면에서 계산한다: 소득 한계 = (여유자금 − 추가 상환) ÷ 소득, 여유자금 ÷ 소득.
- 비상자금 기간 = 비상자금 ÷ (소득 −5% 시나리오의 매달 부족액). 부족하지 않으면 안내 문구만 보인다.
- 만기일시(전세) 대출은 "한 번에 필요한 돈"에 만기 원금을 따로 보여 준다(E1-j).
- 최종 명세가 위험도를 점수 기반으로 바꿨는지, `checks[]` 에 가중치·점수가 있는지는 확인하지 못했다. 지금은 여유자금 비율(8% / 3%)로 등급을 계산한다.
