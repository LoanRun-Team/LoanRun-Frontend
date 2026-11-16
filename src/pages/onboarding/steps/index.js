// 스텝 id → 화면 컴포넌트. id 목록은 ../steps.js 의 STEPS 와 맞춘다.
import LoanType from './loan/LoanType.jsx'
import LoanProduct from './loan/LoanProduct.jsx'
import RepaymentInfo from './loan/RepaymentInfo.jsx'
import LoanSummary from './loan/LoanSummary.jsx'
import Income from './income/Income.jsx'
import Living from './income/Living.jsx'
import GoalDirection from './goal/GoalDirection.jsx'
import EarlyRepayment from './goal/EarlyRepayment.jsx'
import TargetDate from './goal/TargetDate.jsx'
import MultiLoan from './goal/MultiLoan.jsx'

export const stepComponents = {
  'loan-type': LoanType,
  'loan-product': LoanProduct,
  'repayment-info': RepaymentInfo,
  'loan-summary': LoanSummary,
  income: Income,
  living: Living,
  'goal-direction': GoalDirection,
  'early-repayment': EarlyRepayment,
  'target-date': TargetDate,
  'multi-loan': MultiLoan,
}
