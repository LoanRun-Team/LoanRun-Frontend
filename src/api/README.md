# 홈·대출 관리·설정 API 연결

기준: LoanRun-Backend develop `befc6c7` (2026-11-19). Notion 역할 구분 대신 실제 컨트롤러와 서비스 구현을 확인했습니다. 배포 서버와의 통합 검증은 서버 주소를 받은 뒤 진행해야 합니다.

## 실행 설정

`.env.example`을 참고해 Git에서 제외되는 `.env.local`에 설정합니다.

```dotenv
VITE_API_MODE=hybrid
VITE_API_BASE_URL=
VITE_BACKEND_PROXY_TARGET=http://localhost:8080
```

배포 후에는 VITE_BACKEND_PROXY_TARGET을 백엔드 origin으로 바꾸고 개발 서버를 재시작합니다. 경로 /api는 자동으로 붙으므로 target에는 포함하지 않습니다. HTTPS 배포의 Secure 쿠키를 확인할 때는 프런트도 HTTPS에서 테스트해야 합니다. 백엔드의 허용 Origin에도 프런트 주소를 등록해야 합니다.

Vite 프록시는 개발 환경에만 적용됩니다. 프런트 배포 환경에서는 /api 역방향 프록시를 구성하는 방식을 권장합니다. VITE_API_BASE_URL에 백엔드 주소를 직접 쓰면 CORS와 교차 사이트 쿠키 정책을 별도로 맞춰야 합니다.

- mock: 전체 예시 데이터. 서버 없이 디자인을 확인할 때 사용합니다.
- hybrid: 아래 완료된 기능만 실제 서버로 요청합니다. 미완료 기능은 표시한 예시 영역에서만 Mock으로 동작합니다.
- real: 모든 기능을 실서버에 요청하는 향후 전환 모드입니다. 현재 백엔드에는 미완료 API가 있어 사용하지 않습니다.

## 실제로 연결한 기능

| 화면 | 실서버 기능 | 아직 예시인 부분 |
| --- | --- | --- |
| 홈 | 이름·요금제 조회 | 대시보드·월별 상환·위험·리포트 |
| 대출 관리 | 대출 목록, 납부 목록·상세, 금리 기록, 적립 내역, 직접 입력한 대출 조건 계산 | 등록·삭제·납부 기록·상환 계획·구간 기록 |
| 설정 | 프로필 조회·수정, 요금제 조회, 납부·리포트 알림 조회·변경 | 소득·상환, 지출 입력 |

실제 대출에는 구현되지 않은 등록·삭제·계획 버튼을 비활성화합니다. 목록 응답에 없는 상세 조회나 예상 완납·이자 계산을 추가 호출하거나 임의 생성하지 않습니다. 상환 계획 등 예시 화면에는 실제 loan_id를 전달하지 않고 독립된 Mock 저장소를 사용합니다.

GET /api/settings/export/는 경로가 구현되어 있지만 필요한 내부 조회 포트가 미완성이라 503이 날 수 있습니다. 이 경우 서버 오류를 표시하며 가짜 CSV로 바꾸지 않습니다. 요금제 PATCH는 백엔드 DEMO_MODE에서만 가능하며 결제 기능은 아직 연결하지 않았습니다. 로그아웃·회원 탈퇴 API도 없어 hybrid에서는 비활성화합니다.

팀원 영역인 온보딩·예산·위험·리포트는 hybrid에서 기존 Mock 핸들러를 유지합니다.

## 요청 규칙

실제 서버는 JWT 대신 HttpOnly LOANRUN_SESSION 익명 세션 쿠키를 사용합니다. credentials: include로 전송하며, 최초 병렬 요청 전에 프로필 조회 한 번으로 세션을 먼저 만듭니다. 서버 오류를 Mock으로 자동 대체하지 않습니다.

응답은 { success, code, message, data }를 검사하고 data를 반환합니다. 금액은 JSON 숫자, 키는 snake_case입니다. 납부 내역 필터는 from/to/type이며, 계산 요청에는 응답 전용 필드를 제외합니다. 재정 계산은 서버가 반환한 값만 표시합니다.

주요 파일: createRuntime.js(부분 연동·세션), services.js(경로), loanRequest.js(입력), ConnectedLoans.jsx(실제 조회 화면). 기존 디자인 화면은 services 주입으로 Mock 저장소를 분리합니다.

## 검증

```sh
node --test src/api/__tests__/runtime.test.js
npm run build
npm run lint
```

계약 테스트는 병렬 세션 초기화, 쿠키 옵션, 오류 유지, 미완료 요청 차단, 요청 필드·필터를 검증합니다. 실제 배포 DB에 대한 저장·조회 성공을 의미하지 않습니다.
