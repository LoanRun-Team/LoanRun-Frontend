import { onboardingApi } from '../../../../api/index.js'
import { useRequest } from '../../useRequest.js'

const thisMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` }

// 이번 달 정기 배분 가능액(여유자금). 상환 성향 카드의 "여유자금의 80% · 월 N원" 문구에 쓴다.
// 조회 실패나 0 이하면 null 을 돌려주고, 화면은 기존 설명 문구를 그대로 보여준다.
export function useSurplus() {
  const { data } = useRequest(signal => onboardingApi.getBudgetMonth(thisMonth(), { signal }), [])
  const cap = data ? (data.recurring_capacity ?? Math.max(data.available_cash ?? 0, 0)) : null
  return cap > 0 ? cap : null
}
