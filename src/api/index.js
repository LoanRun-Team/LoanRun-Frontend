import { createApi } from './createApi.js'
import { createOnboardingApi } from './onboarding.js'
import { mockHandlers } from './mock/handlers.js'

// VITE_API_MODE=mock(기본) | real. real 이면 VITE_API_BASE_URL 필요.
// TODO(auth): 로그인 화면/토큰 저장 방식이 정해지면 getHeaders 로 `Authorization: Bearer {access_token}` 을 붙인다.
export const api = createApi({ env: import.meta.env, handlers: mockHandlers })
export const onboardingApi = createOnboardingApi(api)
