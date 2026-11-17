# 상환 리포트 API 작업 메모 (출시 전 삭제 — 참조하는 주석도 함께 정리)

기준: 백엔드 2026-11-16 확정 API/URL 명세, Figma v2(11/17) 7행.

## 화면 ↔ API
| 화면 | 호출 |
|---|---|
| 진입 | `GET /api/reports/latest/` → NOT_GENERATED·FAILED·stale 이면 `POST /api/reports/`(202) → `GET /api/reports/{id}/` 폴링(PENDING/RUNNING/COMPLETED/FAILED) |
| 전략 후보·현재 전략 | `GET /api/reports/strategy/` (strategy_type: MULTI / SINGLE_PREFERENCE / SAVINGS_ONLY / NONE) |
| 반영 미리보기 | `POST /api/repayment-plans/preview/` `{report_id, strategy_code, strategy_version}` |
| 전략 반영 | `PUT /api/repayment-plans/` + `preview_version`, `data_revision` (409 STRATEGY_STALE → 다시 계산 모달) |
| 비교 기준 변경 | `GET`/`PATCH /api/reports/comparison-settings/` 후 리포트 재생성 |
| PRO 전용 | 403 PRO_REQUIRED → 안내 모달 |

## mock (sessionStorage)
`loanrun-mock-report`(리포트·적용 전략·비교 기준), `loanrun-mock-report-fail=1`(생성 실패 강제), `loanrun-mock-plan=FREE`(403).
계획 반영·비교 기준 변경 시 data_revision 이 바뀌어 리포트가 stale 이 된다.

## 확인이 필요한 점
- `suggestions[].action` 값(REPAYMENT_PLAN 외 BUDGET·RISK)은 추정. 서버 enum 확인 필요.
- 사이드바 라벨 "AI 상환 리포트" vs 디자인 "상환 리포트"(공통 컴포넌트, 팀원 담당).
- PRO 시작하기 결제 화면은 공통(G) 담당이라 안내 토스트만 띄움.
- 비교 기준은 DEMO 소스만 사용(source_type 고정).
- 리포트 PDF 저장은 `window.print()`로 대체.
