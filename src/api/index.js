import { createApi } from './createApi.js'
import { createOnboardingApi } from './onboarding.js'
import { createBudgetApi } from './budget.js'
import { createRiskApi } from './risk.js'
import { createReportApi } from './report.js'
import { mockHandlers } from './mock/handlers.js'

// VITE_API_MODE=mock(기본) | real. real 이면 VITE_API_BASE_URL 필요.
// 인증: 이 앱은 로그인 화면을 만들지 않아 `Authorization` 헤더를 붙이지 않는다. 명세는 Bearer 토큰을 요구하므로,
// 실서버 연결 시 인증 처리 방식(테스트 토큰·개발용 우회 등)은 백엔드와 정해 `getHeaders` 로 연결한다.
export const api = createApi({ env: import.meta.env, handlers: mockHandlers })
export const onboardingApi = createOnboardingApi(api)
export const budgetApi = createBudgetApi(api)
export const riskApi = createRiskApi(api)
export const reportApi = createReportApi(api)
