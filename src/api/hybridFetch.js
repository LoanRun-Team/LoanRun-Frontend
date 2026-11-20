// hybrid 모드에서 온보딩·예산·위험·리포트 API 를 영역별로 실서버에 연결한다.
// 백엔드에 컨트롤러가 올라오고 개발 서버가 새 이미지로 바뀐 영역만 VITE_LIVE_FEATURES 에 적는다.
//   예) VITE_LIVE_FEATURES=budget,finance
// 값이 없으면 모두 Mock 이고, 서버 실패를 Mock 데이터로 대신하지 않는다(실패는 그대로 화면에 오류로 보인다).
const FEATURES = {
  // 월 예산 조회·수정, 여유자금 배분, 소득 입금 (대출 목록은 배분 화면이 같이 읽는다)
  budget: [
    ['GET', /^\/api\/budgets\/\d{4}-\d{2}\/$/],
    ['PUT', /^\/api\/budgets\/\d{4}-\d{2}\/$/],
    ['PUT', /^\/api\/budgets\/\d{4}-\d{2}\/allocation\/$/],
    ['POST', /^\/api\/income-entries\/$/],
    ['GET', /^\/api\/loans\/$/],
  ],
  // 기본 재정 프로필(온보딩 재정 정보)
  finance: [
    ['GET', /^\/api\/budgets\/profile\/$/],
    ['PUT', /^\/api\/budgets\/profile\/$/],
  ],
  // 대출 목록·등록·미리보기·삭제
  loans: [
    ['GET', /^\/api\/loans\/$/],
    ['POST', /^\/api\/loans\/$/],
    ['POST', /^\/api\/loans\/preview\/$/],
    ['DELETE', /^\/api\/loans\/\d+\/$/],
  ],
  // 대출 종류·은행·상품 목록
  products: [
    ['GET', /^\/api\/loan-products\/(options\/)?$/],
  ],
  // 온보딩 진행 상태와 완료
  onboarding: [
    ['GET', /^\/api\/onboarding\/$/],
    ['POST', /^\/api\/onboarding\/complete\/$/],
  ],
  // 상환 계획 미리보기·저장(온보딩 목표, 리포트 전략 반영)
  plans: [
    ['POST', /^\/api\/repayment-plans\/preview\/$/],
    ['PUT', /^\/api\/repayment-plans\/$/],
  ],
  // 위험 분석
  risk: [
    ['GET', /^\/api\/risks\/$/],
    ['POST', /^\/api\/risks\/simulate\/$/],
  ],
  // 상환 리포트·전략·또래 비교 설정
  report: [
    ['GET', /^\/api\/reports\/(latest|strategy|comparison-settings|\d+)\/$/],
    ['POST', /^\/api\/reports\/$/],
    ['PATCH', /^\/api\/reports\/comparison-settings\/$/],
  ],
}

export function parseLiveFeatures(value) {
  return String(value || '').split(',').map(s => s.trim()).filter(name => Object.hasOwn(FEATURES, name))
}

export function isLiveEndpoint(features, method, pathname) {
  return features.some(name => FEATURES[name].some(([m, pattern]) => m === method && pattern.test(pathname)))
}

export function createHybridFetch({ mockFetch, liveFetch = (...args) => globalThis.fetch(...args), features = [], baseUrl = '' }) {
  if (!features.length) return mockFetch
  const origin = baseUrl.replace(/\/$/, '')
  let session
  // 첫 실서버 요청 전에 익명 세션 쿠키를 한 번만 받는다(동시에 여러 요청이 와도 하나를 공유).
  const ensureSession = () => (session ??= liveFetch(origin + '/api/users/me/', { credentials: 'include', headers: { Accept: 'application/json' } })
    .then(response => { if (!response.ok) throw new Error('session bootstrap failed') })
    .catch(error => { session = undefined; throw error }))
  return async function hybridFetch(input, init = {}) {
    const url = typeof input === 'string' ? input : input.url
    const pathname = new URL(url, 'http://mock.invalid').pathname
    const method = (init.method || 'GET').toUpperCase()
    if (!isLiveEndpoint(features, method, pathname)) return mockFetch(input, init)
    await ensureSession()
    return liveFetch(url, { ...init, credentials: 'include' })
  }
}
