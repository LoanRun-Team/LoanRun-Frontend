// 온보딩 스텝 순서와 분기 규칙. 화면 컴포넌트는 steps/index.js 에서 id 로 연결한다.
// next(form) 이 null 을 반환하면 온보딩 종료(홈으로 이동).
// submit(form)(선택): "다음"을 누를 때 실행하는 API 호출. 폼을 바꿔야 하면 (form)=>newForm 함수를 돌려준다.
import { onboardingApi } from '../../api/index.js'
import { initialForm } from './data.js'
import { buildLoanBody } from './loanForm.js'
import { allPlansReady, draftOf, isLump, planPayload } from './planModel.js'

// 상단 Stepper(3단계). 재정 정보는 하위 라벨(2-1 소득 / 2-2 생활비·저축)을 가진다.
export const STEP_GROUPS = [
  { id: 'loan', label: '대출 정보' },
  { id: 'finance', label: '재정 정보', subs: [{ id: 'income', label: '2-1 소득' }, { id: 'living', label: '2-2 생활비·저축' }] },
  { id: 'goal', label: '상환 목표' },
]

export const FIRST_STEP = 'loan-type'

const isNumber = n => typeof n === 'number' && Number.isFinite(n)

// 등록한 대출이 여러 개면 대출별 목표(S-03m), 하나면 상환 유형에 따라 S-03a(분할) / S-03c(일시)
function afterLiving({ loans }) {
  if (loans.length > 1) return 'multi-loan'
  return isLump(loans[0]) ? 'target-date' : 'goal-direction'
}

// S-02 기본 재정정보 저장(PUT /api/budgets/profile/). 소득(S-02A)과 생활비·저축(S-02B)을 한 번에 보낸다.
const saveProfile = async ({ income, living }) => {
  await onboardingApi.saveBudgetProfile({
    monthly_income: income.monthly_income,
    income_type: income.income_type,
    payday: income.income_type === 'REGULAR' ? income.payday : null,
    discretionary_expenses: living.discretionary_expenses,
    savings: living.savings,
    emergency_fund: living.emergency_fund ?? null,
    fixed_essential_expenses: living.fixed_essential_expenses,
    variable_essential_expenses: living.variable_essential_expenses,
  })
}

// S-03 "이 계획으로 시작하기": 상환 계획 저장(PUT /api/repayment-plans/) → 온보딩 완료(POST /api/onboarding/complete/)
const finishOnboarding = async form => {
  const plans = form.loans.map(l => planPayload(l, draftOf(form.goal, l.loan_id)))
  await onboardingApi.saveRepaymentPlan({ plans })
  await onboardingApi.complete()
}

const goalStep = (eyebrow, heading, title) => ({
  group: 'goal', wide: true, footer: 'plan', title, eyebrow, heading, nextLabel: '이 계획으로 시작하기',
  next: () => null, valid: allPlansReady, submit: finishOnboarding,
})

// title: 탭 제목 / heading: 화면 제목(없으면 title) / eyebrow: 제목 위 작은 글씨 / inputStep: "n / 3" 대출 입력 단계(S-01a~c만)
// sub: 재정 정보 하위 단계 / bar: 하단 고정 이동 바 / hidePrev: 이전 버튼 숨김 / wide·footer: S-03 레이아웃
// valid(form): 다음 버튼 활성 조건(없으면 항상 가능)
export const STEPS = {
  'loan-type': { group: 'loan', inputStep: 1, title: '대출 형태', heading: '대출 형태를 선택해 주세요.', next: () => 'loan-product', valid: form => Boolean(form.loan.loan_form) },
  'loan-product': {
    group: 'loan', inputStep: 2, title: '대출 종류와 상품', heading: '대출 종류와 상품을 선택해 주세요.', next: () => 'repayment-info',
    // 카탈로그 상품을 골랐거나, 직접 입력 모드에서 은행명·상품명을 모두 적어야 다음으로 갈 수 있다.
    valid: ({ loan, selection }) => Boolean(loan.loan_type) && (selection.manual
      ? Boolean(loan.institution_name?.trim() && loan.product_name?.trim())
      : loan.product_id != null),
  },
  'repayment-info': {
    group: 'loan', inputStep: 3, title: '상환 정보', heading: '상환 정보를 입력해 주세요.', next: () => 'loan-summary',
    valid: form => buildLoanBody(form) !== null,
    // "다음"을 누르면 대출을 등록하고(POST /api/loans/), 다음 대출을 입력할 수 있게 입력 중이던 값을 비운다.
    // 등록된 대출을 수정하던 중이면 기존 대출을 지우고 새로 등록한다.
    submit: async form => {
      if (form.selection.editingLoanId) await onboardingApi.deleteLoan(form.selection.editingLoanId)
      const loan = await onboardingApi.createLoan(buildLoanBody(form))
      return f => ({ ...f, loans: [...f.loans.filter(l => l.loan_id !== f.selection.editingLoanId), loan], loan: initialForm.loan, selection: initialForm.selection })
    },
  },
  'loan-summary': {
    group: 'loan', eyebrow: 'STEP 01 · 대출 정보', title: '대출 요약', heading: '등록한 대출을 확인해 주세요.', bar: true, hidePrev: true,
    next: () => 'income', valid: form => form.loans.length > 0,
  },

  income: {
    group: 'finance', sub: 'income', eyebrow: 'STEP 02 · 소득', title: '소득', heading: '매달 들어오는 소득을 알려주세요.', bar: true, next: () => 'living',
    valid: ({ income }) => Boolean(income.occupation) && Boolean(income.income_type) && income.monthly_income > 0
      && (income.income_type === 'IRREGULAR' || income.payday != null),
  },
  living: {
    group: 'finance', sub: 'living', eyebrow: 'STEP 02 · 생활비·저축', title: '생활비·저축', heading: '생활비와 저축을 알려주세요.', bar: true, next: afterLiving,
    valid: ({ living }) => ['fixed_essential_expenses', 'variable_essential_expenses', 'discretionary_expenses', 'savings'].every(k => isNumber(living[k])),
    submit: async form => { await saveProfile(form) },
  },

  'goal-direction': goalStep('STEP 03 · 상환 목표', '대출을 언제까지 갚을지 정해 주세요.', '목표 방향 선택'),
  'early-repayment': goalStep('STEP 03 · 조기 상환 설정', '얼마나 일찍 갚을지 정해 주세요.', '조기 상환 설정'),
  'target-date': goalStep('STEP 03 · 목표 완납일', '언제까지 다 갚을지 정해 주세요.', '목표 완납일 설정'),
  'multi-loan': goalStep('STEP 03 · 상환 목표', '대출마다 상환 목표를 정해 주세요.', '다중채무'),
}

export const isStepId = id => Object.hasOwn(STEPS, id)
export const nextStep = (id, form) => STEPS[id].next(form)
export const isStepValid = (id, form) => (STEPS[id].valid ? STEPS[id].valid(form) : true)
