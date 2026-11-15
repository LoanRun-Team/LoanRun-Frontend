# API 연결 준비 상태

공통 응답 형식은 백엔드가 제공한 예시를 기준으로 합니다.

```json
{
  "success": true,
  "code": "LOAN_DETAIL_SUCCESS",
  "message": "대출 상세 정보를 조회했습니다.",
  "data": {
    "loan_id": 1,
    "original_principal": 10000000,
    "remaining_principal": 7000000
  }
}
```

현재 Notion 명세에 접근할 수 없어 제품 엔드포인트·메서드·인증 방식·리소스 스키마는 아직 등록하지 않았습니다. 홈과 대출관리는 기존 표시용 더미데이터를 계속 사용합니다. 명세에 맞춘 Mock API 화면 연결은 완료되지 않은 상태입니다.

## 공통 코드

- `client.js`: JSON 요청, 쿼리 파라미터, 응답 envelope 검사 및 `data` 반환
- `ApiError.js`: HTTP 상태·백엔드 오류 코드·메시지 보존
- `mock/createMockFetch.js`: 등록된 핸들러를 native Response로 반환하는 가상 HTTP 전송 계층
- `createApi.js`: `VITE_API_MODE`의 `mock`/`real` 전환. 실서버 사용 시 `VITE_API_BASE_URL` 필수

인증은 명세 확인 후 `getHeaders` 또는 필요한 fetch 옵션으로 연결합니다. 토큰·로그인 방식을 임의로 정하지 않습니다.

Mock 핸들러는 명세의 실제 경로·메서드와 동일한 값을 등록하고 동일한 envelope를 반환해야 합니다. 현재 테스트에 쓰는 `/contract-example`은 응답 처리 검증만을 위한 경로이며 제품 API가 아닙니다.

## 명세 접근 후 남은 작업

1. 홈·대출관리의 API 목록과 요청·응답·오류·인증 규칙 확인
2. 명세와 동일한 Mock 핸들러 및 snake_case 응답 fixture 작성
3. 응답 DTO를 기존 화면·그래프 표시 모델로 변환하는 매퍼 작성
4. 페이지의 직접 더미데이터 참조를 비동기 요청으로 교체
5. 대출 추가·납부 기록·계획 수정 요청 및 로딩·실패·빈 상태 연결
6. 네트워크 요청·화면·그래프·실서버 전환 검증

```sh
node --test verification/api-client.test.mjs
```
