import { useState } from 'react'
import { onboardingApi } from '../../../../api/index.js'
import { loanToBody } from '../../planModel.js'

// 만기일시 대출의 "마련한 상환자금"(initial_savings_balance)은 등록 때만 받는 값이다.
// 바꾸면 대출을 지우고 같은 내용으로 다시 등록한 뒤, 폼의 대출·목표 입력을 새 loan_id 로 옮긴다.
export function useSavingsBalance(setForm) {
  const [state, setState] = useState({ busy: false, error: '' })
  async function change(loan, value) {
    setState({ busy: true, error: '' })
    try {
      await onboardingApi.deleteLoan(loan.loan_id)
      const created = await onboardingApi.createLoan({ ...loanToBody(loan), initial_savings_balance: value })
      setForm(f => {
        const { [loan.loan_id]: moved, ...plans } = f.goal.plans
        return { ...f, loans: f.loans.map(l => (l.loan_id === loan.loan_id ? created : l)),
          goal: { ...f.goal, plans: moved ? { ...plans, [created.loan_id]: moved } : plans, activeLoanId: String(f.goal.activeLoanId) === String(loan.loan_id) ? created.loan_id : f.goal.activeLoanId } }
      })
      setState({ busy: false, error: '' })
    } catch (e) {
      setState({ busy: false, error: e?.message || '상환자금을 반영하지 못했어요. 잠시 후 다시 시도해 주세요.' })
    }
  }
  return { ...state, change }
}
