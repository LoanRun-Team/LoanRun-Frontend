import { onboardingApi } from '../../../../api/index.js'
import { useRequest } from '../../useRequest.js'
import { draftOf, planPayload } from '../../planModel.js'

// 입력이 완성된 대출들의 상환 계획을 한 번에 미리 계산한다(POST /api/repayment-plans/preview/, DB 저장 없음).
// byLoan[loan_id] = 그 대출의 proposed_plans 항목. enabled=false 면 요청하지 않는다.
export function usePlanPreview(form, enabled) {
  const plans = enabled ? form.loans.map(l => planPayload(l, draftOf(form.goal, l.loan_id))).filter(Boolean) : []
  const state = useRequest(signal => (plans.length ? onboardingApi.previewRepaymentPlan({ plans }, { signal }) : null), [JSON.stringify(plans)])
  const byLoan = Object.fromEntries((state.data?.proposed_plans ?? []).map(p => [p.loan_id, p]))
  return { status: state.status, error: state.error, data: state.data, byLoan, pending: plans.length > 0 && state.status === 'loading' }
}

// 한 대출의 목표 draft 를 갱신하는 함수를 만든다.
export const planUpdater = (setForm, loanId, extra = {}) => patch => setForm(f => ({
  ...f,
  goal: { ...f.goal, plans: { ...f.goal.plans, [loanId]: { ...draftOf(f.goal, loanId), ...extra, ...patch } } },
}))
