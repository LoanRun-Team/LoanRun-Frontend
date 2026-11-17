# 최종 API 명세 반영

사용자가 제공한 `8d4f8ce3-1fce-417c-a11a-8bd447f8ded0_ExportBlock-f5f50edf-1c4e-4afc-badc-f59051063aa8.zip`을 `docs/api-spec-v2`에 보관했다. 문서는 API 계약 자료로 사용한다. 기존 JSX·SCSS 화면과 공통 Sidebar 구조는 유지한다.

## 연결한 변경점

| 기능 | 요청·응답 연결 |
| --- | --- |
| 공통 Mock 응답 | 명세의 성공 JSON 예시 53개를 `src/api/mock/specFixtures.js`에 반영. 기존 공통 envelope와 인증 처리는 유지 |
| 납부 기록 | 화면의 원금·추가 원금·이자·수수료를 `principal_amount`, `extra_amount`, `interest_amount`, `fee_amount`로 POST. `savings_used_amount`도 전송 |
| 정기 납부 현황 | 수수료와 추가 원금을 정기 납부 완료 금액에 잘못 포함하지 않도록 Mock 상태 집계 수정 |
| 미납 확인 | `PATCH /api/payments/schedule/{due_item_id}/confirmation/` 연결. Home과 Loans의 공용 상태 판정은 응답의 `unpaid_confirmed` 사용 |
| 적립금 | `/api/repayment-savings/` GET·POST 및 `/{saving_id}/` PATCH·DELETE 연결. 저장·수정·삭제 후 재조회. 적립 자체는 원금을 줄이지 않음 |
| 적립금 사용 | 실제 상환 기록에서만 원금과 사용 적립금을 각각 감소. 이미 사용한 적립금의 과도한 축소·삭제 차단 |
| 대출 등록 | `prepayment_policy`, 수수료율/면제 조건을 기존 요청 본문에 연결. 약정 수수료는 원 단위 금액 대신 % 입력 |
| 완납 대출 | Loans 목록에 `status=ALL` 사용. Home의 기본 활성 대출 조회는 유지 |
| 계획 저장 | Idempotency-Key 추가, Mock에서 입력·데이터 변경에 따른 `preview_version` 검증. 불일치는 `PLAN_PREVIEW_STALE` |
| 중복 요청 | 같은 키·같은 요청은 동일 결과, 다른 요청은 409. 적립과 납부 이중 반영 방지 |

실제 페이지는 이제 적립/납부/확인 값을 `loanrun.design-v2-drafts`에 저장하지 않는다. 기존 Mock 상태 저장소 `loanrun.mock-api.v2`에 명세 기반 리소스로 저장하며, 이전 저장 데이터에 없는 `savings`·`confirmations`는 빈 값으로 보완한다. 기존 임시 draft는 자동 이관하거나 삭제하지 않는다.

`preview` URL 파라미터는 명시적으로 들어간 경우에만 Figma 상태 확인용 예시를 표시한다. 실제 CRUD를 검증할 때는 `preview` 없이 실제 BULLET Mock 대출을 등록해서 사용한다. 원금·이자 예측은 프론트에 구현하지 않는다.

## 명세에서 여전히 확인되지 않은 화면 데이터

- **지금 갚기 vs 계속 모으기**: 이번에 갚을 원금을 넣어 일회성 상환의 이자 절약·수수료·순이득을 반환받는 요청이 없다. 월 추가 상환 계획 시뮬레이션과는 의미가 다르므로 재사용하지 않는다. 일반 화면의 비교 예상 금액은 `—`로 두고, Figma 예시는 명시적인 디자인 미리보기에서만 제공한다.
- **월 납부 원금·이자 비교**: 계획 응답은 월 총액을 제공하지만 현재/변경 후 각각의 월 원금·이자 필드가 없다. 대출 등록 전 계산 응답만으로 장기 계획의 분해 금액을 만들지 않는다.
- **미적립 월별 상세**: 계획의 `saving_gap_amount`로 총 부족액은 표시할 수 있지만 도래 월별 부족액 배열은 없다. 임의로 나눠 상세 목록을 생성하지 않는다.
- **거치 종료 직후의 납부액**, **적립/납부 메모**: 대응 필드가 없어 예측하거나 지원하지 않는 키를 보내지 않는다. 메모 입력은 서버에 저장되지 않는다.
- **수수료 기간별 조건**: 현재 화면은 고정 수수료율·면제·미확인 조건을 지원한다. LINEAR 기간 입력 화면은 추가하지 않았다.

## 검증

```sh
npm run build
npm run lint
node --test verification/api-client.test.mjs verification/chartGeometry.test.mjs verification/mock-api.test.mjs verification/home-status.test.mjs verification/loans-v2.test.mjs verification/api-v2.test.mjs
node verification/loans-v2-check.mjs
```

새 API 테스트는 수동 납부 배분, 적립 CRUD와 원금 분리, 적립금 사용, 중복 요청, 미납 확인 취소, 미리보기 버전 및 완납 필터를 확인한다. 브라우저 검증은 실제 BULLET Mock 리소스를 만들어 적립 저장·재조회를 확인한다.
