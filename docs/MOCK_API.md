# 명세 기반 화면 연결

백엔드 서버 없이 개발할 수 있도록 사용자 제공 Notion ZIP의 응답 구조로 Mock API를 구성했다. JSX는 서비스 함수를 호출하고 서버 응답의 `data`를 표시한다. `specFixtures.js`는 API 목록 화면이 아니라 Mock 서버 내부의 응답 샘플이다.

## 파일 역할

- `src/pages/Home/Home.jsx`: 프로필·대시보드·위험 조회. 잔액, 다음 납부, 월 납부 체크리스트, 리포트 상태를 응답으로 표시.
- `src/pages/Loans/Loans.jsx`: 대출 목록·상세, 납부 일정·내역·월별 기록·계획 조회와 대출 추가·납부 저장 연결.
- `src/pages/Loans/components/PlanEditor.jsx`: 미리보기 POST 응답으로 비교 후 PUT 저장. 금융 예측을 JSX에서 계산하지 않는다.
- `src/pages/Settings/Settings.jsx`: 프로필 PATCH, 소득 PUT, 알림 PATCH, 요금제 조회, CSV 다운로드, 로그아웃·탈퇴 호출.
- `src/api/services.js`: 명세의 경로, HTTP 메서드, 요청 필드.
- `src/api/client.js`: 공통 응답 해제, `errors` 처리, Bearer 헤더, 취소, CSV 처리.
- `src/api/loanView.js`: 날짜·통화 표시와 API 데이터의 차트 시리즈 변환. 금융 예측 없음.
- `src/api/mock/server.js`: 가상 서버. 저장·필터·페이지 처리 및 응답 생성. 브라우저 저장은 여기에서만 수행.
- `src/components/Sidebar/`: 기존 공용 JSX·SCSS 유지.

## 실행 및 실제 서버 전환

기본값은 Mock이다. `npm run dev`로 실행한다. 임의의 금융 수치는 명세 샘플을 바탕으로 제공하며, Mock의 분배·예측은 실제 금융 계산 엔진이 아니다.

실제 서버가 준비되면 `.env.local`에 다음 값을 지정하고 개발 서버를 재시작한다.

```dotenv
VITE_API_MODE=real
VITE_API_BASE_URL=http://localhost:8080
```

주소는 `/api` 없는 서버 origin이다. 서비스 경로에 `/api/`와 마지막 `/`가 포함되어 있다. 실제 모드에서는 Mock과 로컬 Mock 저장소를 사용하지 않는다. 인증 화면은 이번 범위에 포함되지 않으며, 로그인 구현에서 `sessionStorage`의 `loanrun.access_token`, `loanrun.refresh_token`을 설정해야 한다. 토큰 자동 갱신은 아직 연결하지 않았다. 인증 오류는 화면에 표시한다.

Mock 저장 키는 `loanrun.mock-api.v2`. 이 키를 지우고 새로고침하면 초기 샘플로 돌아간다. 과거 화면용 `loanrun-loans-v1`, `loanrun.settings` 값은 사용하지 않는다. 대출별 URL은 `?loan=1`처럼 서버의 정수 ID를 사용한다.

## 명세에 따른 표시

- 홈 월 상환은 비율 링 대신 납부 건수·필수 납부액·추가 납부액을 구분한다(명세의 체크리스트 표시 규칙).
- 누적 비교 자료나 금리 임계값이 `null`이면 임의로 0을 만들지 않는다. 실제 기록이 없는 월은 그래프에서 제외한다.
- 현재 대출 상세·계획 미리보기 응답에는 월별 원금/이자 세부 구성 필드가 없다. 해당 자리에는 `—`를 표시한다. 백엔드가 해당 필드를 제공하면 표시 매핑만 추가하면 된다.
- 알림은 `payment_due`, `rate_reset`, `grace_end`, `report_update` 네 항목이다.
- 요금제는 읽기 전용이고 결제 기능은 응답의 `billing_enabled` 상태를 표시한다. 명세에 없는 업그레이드 API를 만들지 않았다.
- 리포트·위험 분석의 상세 페이지는 기존 준비 중 화면을 유지한다. 홈 요약만 이번 연결 범위다.
- 대출 추가는 일반 대출과 수기 상품 입력을 지원한다. 마이너스통장 입력 및 금리 변경 입력, 납부 수정·삭제 UI는 이번 변경에 포함되지 않는다.

## 검증

```sh
npm run build
npm run lint
node --test verification/api-client.test.mjs verification/chartGeometry.test.mjs verification/mock-api.test.mjs
# 개발 서버 실행 후, 설치된 Chrome으로 JSX 통합 동작 검증
node verification/api-ui-check.mjs
```

기존 `verification/loans-check.mjs`는 이전 Figma 예시 금액과 로컬 저장 형식을 검사하는 스크립트다. 현재 API 연동의 검증에는 `api-ui-check.mjs`를 사용한다.
