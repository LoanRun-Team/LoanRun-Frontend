# 예산·지출 API 스펙 요약

출처: Notion "API 명세서 (11월 15일 11시 50분 기준)" 상세 페이지 (2026-11-16 확인). 상태는 전부 `BE 구현전`이라 값이 바뀔 수 있다.
호출 함수는 `budget.js`, mock 은 `mock/budgets.js`. 공통 규약(envelope·인증·snake_case)은 `ONBOARDING_API.md` 와 같다.

## GET /api/budgets/{year_month}/ — 월별 예산·재정정보 조회

`year_month` = `YYYY-MM`(형식이 틀리면 400 `INVALID_MONTH`). 응답 주요 필드:

| 필드 | 설명 |
|---|---|
| `monthly_income` | 그 달 소득(정기: 기본 + 추가 수령, 비정기: 입금 합계) |
| `income_type`, `payday`, `base_income` | `REGULAR`\|`IRREGULAR`, 지급일, 정기 기본 소득(비정기 0) |
| `fixed_essential_expenses`, `variable_essential_expenses`, `essential_expenses` | 고정·변동 필수 지출, 합계(읽기 전용) |
| `discretionary_expenses`, `savings`, `emergency_fund` | 선택 지출, 저축, 비상자금 |
| `scheduled_repayment`, `actual_repayment` | 정기 납부 예정액, 그 달 납부 기록 합계 |
| `available_cash` | 여유자금 = 소득 − 정기 상환 − 필수·선택 지출 − 저축 (서버가 계산) |
| `allocation` | `{ allocations: [{loan_id, amount}], reserve_amount, total_allocated }` |
| `allocation_needs_review` | 여유자금이 바뀌어 배분을 다시 확인해야 함 |
| `income_entries[]` | `{ income_entry_id, entry_type: EXTRA\|IRREGULAR, received_date, amount }` |
| `source` | `INPUT`(그 달 입력함) \| `DEFAULT`(기본 재정정보로 채움) — 화면은 이 값으로 "금액 입력 전"을 구분한다 |

## PUT /api/budgets/{year_month}/ — 월별 재정정보 입력·수정

요청: `fixed_essential_expenses`, `variable_essential_expenses`, `discretionary_expenses`, `savings`(모두 필수, 0 이상) +
`income_entries[]`(선택, **그 달 입금 목록 전체 교체**. 생략하면 유지, `[]`이면 전체 삭제).
항목: `income_entry_id`(기존 항목 보존 시), `entry_type`(정기 소득의 추가 수령 = `EXTRA`, 비정기 = `IRREGULAR`), `received_date`(그 달·오늘 이하), `amount`(1원 이상).
응답은 조회와 같은 본문.

## PUT /api/budgets/{year_month}/allocation/ — 여유자금 분배 반영

요청: `allocations[]`(`loan_id`, `amount` 0 이상, 대출 ID 중복 금지), `reserve_amount`(0 이상).
응답: `available_cash`, `allocation`, `updated_plans[]`(상환 계획), `strategy_code`, `overall_plan_exists`.

## POST /api/income-entries/ — 월별 소득 입금 추가 기록

요청: `entry_type`, `received_date`(오늘 이하), `amount`(1원 이상), 헤더 `Idempotency-Key`(권장). 응답 201: `entry`, 갱신된 `monthly_income`·`available_cash` 등.
화면의 "금액 입력" 모달은 입금 목록을 한 번에 저장하므로 PUT `/api/budgets/{year_month}/` 를 쓰고, 이 API 는 호출 함수만 준비해 두었다.

## 화면 ↔ API

| 화면 | API |
|---|---|
| 예산·지출 진입 / 월 이동 | `GET /api/budgets/{year_month}/`, 대출 목록 `GET /api/loans/` |
| 금액 입력 → 저장하기 | `PUT /api/budgets/{year_month}/` |
| 여유자금 분할 → 반영하기 | `PUT /api/budgets/{year_month}/allocation/` 후 다시 조회 |

## Figma 와 API 가 맞지 않는 부분

- 지난달 정산의 "선택 지출 한도·사용·절약" 줄은 API 에 한도/사용 구분이 없어 만들지 않았다(총 추가 상환·예비비·이월만 표시).
- "이월"은 `available_cash − total_allocated` 로 계산한다(별도 필드 없음).
- 여유자금 분할 제안(예비비 20,000원 + 금리 높은 대출에 나머지)은 화면에서 만든 값이다.
