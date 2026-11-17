# 온보딩 API 스펙 요약

출처: Notion "API 명세서 (11월 15일 11시 50분 기준)" 상세 페이지 (2026-11-16 확인). 상태는 전부 `BE 구현전`이라 값이 바뀔 수 있다.
엔드포인트 호출 함수는 `onboarding.js`.

## 공통

- 응답 envelope: `{ success, code, message, data }` (기존 `client.js`와 동일). 실패는 `errors` 객체가 추가된다
  (`{ success:false, code:'VALIDATION_ERROR', message, errors:{ 필드:[메시지] } }`).
- JSON 키 snake_case, 금액은 원 단위 정수, 금리는 연 %(6.0 = 6%), 날짜 `YYYY-MM-DD`.
- 인증: `Authorization: Bearer {access_token}` (로그인/회원가입/토큰 갱신 제외 전부 필수). access 15분, refresh 7일.
- 실패 코드: 400 `VALIDATION_ERROR`, 401 `AUTH_REQUIRED`, 404 `INSTITUTION_NOT_FOUND` 등.

## GET /api/loan-products/options/ — S-01a~b

쿼리(모두 선택): `loan_type`, `loan_form`(`GENERAL` | `CREDIT_LINE`).

```json
{ "loan_types": [{ "code": "CREDIT", "label": "신용대출" }],
  "institutions": [{ "institution_id": 1, "name": "예시은행" }] }
```

`loan_type`: CREDIT 신용 / MORTGAGE 주택담보 / JEONSE 전세자금 / STUDENT 학자금 / AUTO 자동차 / OTHER 기타.

## GET /api/loan-products/ — S-01b 상품명 드롭다운

쿼리: `institution_id`(필수), `loan_type`, `loan_form`.

```json
{ "products": [{ "product_id": 11, "institution_id": 1, "name": "예시 신용대출", "loan_type": "CREDIT",
                 "repayment_methods": ["EQUAL_PRINCIPAL", "EQUAL_PAYMENT"], "source": "CATALOG" }] }
```

## POST /api/loans/preview/ — S-01c, POST /api/loans/ — S-01d

두 API는 같은 요청 본문을 쓴다. preview 응답: `estimated_monthly_payment`, `contractual_monthly_payment`,
`estimated_next_principal`, `estimated_next_interest`, `maturity_date`, `remaining_months`, `warnings[]`, `repayment_category`(`INSTALLMENT` | `LUMP_SUM`).
등록 응답은 201, `loan_id` 포함 대출 전체 필드.

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `loan_form` | string | 필수 | `GENERAL` \| `CREDIT_LINE` (S-01a) |
| `loan_type` | string | 필수 | 위 loan_type 코드 |
| `product_id` | int \| null | 선택 | 상품 선택 시 ID, 직접 입력이면 null |
| `institution_name`, `product_name` | string | 직접 입력 시 필수 | 선택 상품이면 서버가 조회 |
| `repayment_method` | string | 필수 | `EQUAL_PAYMENT` `EQUAL_PRINCIPAL` `GRACE_INSTALLMENT` `BULLET` `CREDIT_LINE` |
| `original_principal` | int \| null | 일반대출 | 최초 원금(양수). 한도대출은 null |
| `remaining_principal` | int \| null | 일반대출 | 현재 잔액(0 이상, 최초 원금 이하). 한도대출은 `used_amount` |
| `annual_rate` | number | 필수 | 연 %, 0 이상 30 미만, 소수 2자리 |
| `rate_type` | string | 필수 | `FIXED` \| `VARIABLE` |
| `rate_reset_months` | int \| null | 변동금리 | 3 / 6 / 12, 고정금리는 null |
| `next_rate_reset_date` | date \| null | 선택 | 다음 금리 재설정일 |
| `start_date` | date | 필수 | 실행일, 오늘 이후 불가 |
| `maturity_date` | date | 필수 | 만기일, 실행일 이후 |
| `payment_day` | int | 필수 | 매월 납부일 1~31 |
| `contractual_monthly_payment` | int \| null | 선택 | 은행의 실제 다음 납부 예정액. 미입력 시 추정치 |
| `grace_months` | int | 거치 후 분할 | 1 이상, 전체 기간 미만 |
| `post_grace_method` | string \| null | 거치 후 분할 | `EQUAL_PAYMENT` \| `EQUAL_PRINCIPAL` |
| `credit_limit` | int \| null | 한도대출 | 약정 한도(양수) |
| `used_amount` | int \| null | 한도대출 | 현재 사용액(0 이상, 한도 이하) |

## GET /api/loans/ — S-01d (등록한 대출 목록)

쿼리: `status`(`ACTIVE` | `PAID` | `ALL`, 기본 ACTIVE). 응답: `loans[]`(대출 등록 응답과 같은 필드), `total_remaining_principal`, `total_monthly_due`, `estimated_payoff_date`, `count`.
`DELETE /api/loans/{loan_id}/` 는 S-01d 삭제에 쓴다(응답 필드는 아직 확인하지 않음).

## PUT /api/budgets/profile/ — S-02A·S-02B 재정정보

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `monthly_income` | int | 필수 | 정기 실수령액 또는 비정기 예상 월 소득, 0 이상 |
| `income_type` | string | 필수 | `REGULAR` \| `IRREGULAR` |
| `payday` | int \| null | 정기일 때 | 1~31, 비정기는 null |
| `fixed_essential_expenses` | int | 필수 | 월 고정 필수 지출 |
| `variable_essential_expenses` | int | 필수 | 월 변동 필수 지출 |
| `discretionary_expenses` | int | 필수 | 선택 지출 합계 |
| `savings` | int | 필수 | 월 저축액 |
| `emergency_fund` | int \| null | 선택 | 현재 비상자금 잔액 |

응답은 같은 필드 + `essential_expenses`(고정+변동). Figma 의 "소득 형태"(직장인·공무원 등)는 이 API 에 필드가 없어 화면에서만 쓴다.

## POST /api/repayment-plans/preview/, PUT /api/repayment-plans/ — S-03

요청 `plans[]`(대출별): `loan_id`, `mode`(`MATURITY` `PREFERENCE` `TARGET_DATE` `EXTRA_AMOUNT` `MONTHLY_AMOUNT`),
`preference`(`FAST` `BALANCED` `STABLE`), `target_date`, `extra_monthly_payment`, `monthly_amount` + 선택 `effective_date`. 저장(PUT)은 `preview_version` 을 선택으로 받는다.

| 화면 | mode |
|---|---|
| S-03a "만기까지" | `MATURITY` |
| 상환 성향 탭 | `PREFERENCE` (성향 금액을 직접 바꾸면 분할형은 `EXTRA_AMOUNT`, 일시형은 `MONTHLY_AMOUNT`) |
| 완납일 기준 탭 | `TARGET_DATE` |
| 추가 상환액 기준(분할) | `EXTRA_AMOUNT` |
| 월 상환액 기준(일시·한도) | `MONTHLY_AMOUNT` |

미리보기 응답: `proposed_plans[]`(`estimated_payoff_date`, `monthly_amount`, `extra_monthly_payment` …), `estimated_payoff_date`, `monthly_burden`, `delta`, `preview_version`.
저장 응답: `plans[]`, `monthly_burden`, `plan_version`, `overall_plan_exists`, `allocations[]`. "목표 비상자금"은 API 필드가 없어 화면에서만 쓴다.

## POST /api/onboarding/complete/, GET /api/onboarding/

완료: 요청 본문 없음 → `{ completed: true, dashboard_ready: true }`.
진행 조회: `{ completed, registered_loan_ids[], finance_profile_exists, goals_configured, next_step }` (재진입 시 이어서 시작할 때 사용 — 아직 화면에 연결하지 않음).

## 온보딩 호출 순서

S-01c "다음" `POST /api/loans/`(수정 중이면 먼저 `DELETE`) → S-02B "다음" `PUT /api/budgets/profile/` → S-03 "이 계획으로 시작하기" `PUT /api/repayment-plans/` → `POST /api/onboarding/complete/` → 홈(`/`).
미리보기는 S-01c(`/api/loans/preview/`)와 S-03(`/api/repayment-plans/preview/`)에서 입력이 유효할 때마다 호출한다(DB 저장 없음).
