// 온보딩 옵션/초기값. 코드값은 Notion API 상세 페이지(대출 종류·은행 목록, 대출 등록 전 월 상환액 계산 등) 기준.
// 대출 종류·은행·상품명 목록은 API(/api/loan-products/options/, /api/loan-products/)에서 받는다.

// 대출 종류 표시명(loan_type). 선택 목록은 API 가 주지만, 이미 등록한 대출을 표시할 때는 코드만 있어서 여기서 변환한다.
export const loanTypeLabels = { CREDIT: '신용대출', MORTGAGE: '주택담보대출', JEONSE: '전세자금대출', STUDENT: '학자금대출', AUTO: '자동차대출', OTHER: '기타' }

// S-01c 상환 방법 → repayment_method. (Figma 의 "변동금리" 화면은 상환 방법이 아니라 rate_type=VARIABLE)
export const repaymentMethods = [
  { value: 'EQUAL_PAYMENT', label: '원리금균등분할상환' },
  { value: 'EQUAL_PRINCIPAL', label: '원금균등분할상환' },
  { value: 'GRACE_INSTALLMENT', label: '거치 후 분할상환' },
  { value: 'BULLET', label: '만기일시상환' },
]
export const methodLabel = value => repaymentMethods.find(m => m.value === value)?.label ?? value
// 상품 기본 정보 카드에서 쓰는 짧은 이름(원리금균등 · 원금균등 · 만기일시)
export const methodShort = value => (value === 'GRACE_INSTALLMENT' ? '거치 후 분할' : methodLabel(value).replace('분할상환', '').replace('상환', ''))

// 거치 후 분할 방식(post_grace_method)
export const postGraceMethods = [
  { value: 'EQUAL_PAYMENT', label: '원리금균등' },
  { value: 'EQUAL_PRINCIPAL', label: '원금균등' },
]

// 추가 상환 후 약정 변경 방식(prepayment_policy). 분할형(원리금·원금균등·거치 후 분할)은 필수, 만기일시는 null.
export const prepaymentPolicies = [
  { value: 'KEEP_PAYMENT', label: '기간 단축형 — 월 납부액은 그대로, 완납일이 빨라져요' },
  { value: 'KEEP_MATURITY', label: '만기 유지형 — 만기일은 그대로, 이후 월 납부액이 줄어요' },
]
// 중도상환수수료. 화면 선택(feeChoice)을 요청의 prepayment_fee_method·fee_exempt 로 바꾼다(loanForm.js). 주택담보·전세자금만 묻는다.
export const feeChoices = [
  { value: 'HAS', label: '있음' },
  { value: 'EXEMPT', label: '면제' },
  { value: 'UNKNOWN', label: '잘 모르겠어요' },
]
export const feeMethods = [
  { value: 'FIXED', label: '고정 수수료율' },
  { value: 'LINEAR', label: '기간에 따라 감소' },
]
export const feeLoanTypes = ['MORTGAGE', 'JEONSE']

export const rateTypeLabel = { FIXED: '고정', VARIABLE: '변동' }
export const resetMonthOptions = [3, 6, 12].map(m => ({ value: m, label: `${m}개월` }))
export const paymentDayOptions = Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: `매월 ${i + 1}일` }))

// S-02A 소득. occupation 은 API 필드가 없어 화면에서만 쓴다(프로필 API 는 income_type 만 받는다).
export const occupationOptions = ['직장인·공무원', '자영업·사업자', '프리랜서', '학생', '무직', '기타']
export const incomeTypeOptions = [
  { value: 'REGULAR', label: '정기 소득(월급 등)' },
  { value: 'IRREGULAR', label: '비정기 소득(프리랜서 등)' },
]

// loan 의 키는 API 요청 본문(snake_case)과 같게 둔다. 그대로 /api/loans/preview/, /api/loans/ 에 보낼 수 있다.
export const initialForm = {
  loans: [], // 등록 완료된 대출 목록 (S-01d) — POST /api/loans/ 응답 그대로
  loan: { loan_type: null, product_id: null, institution_name: null, product_name: null }, // 지금 입력 중인 대출 (S-01b~c)
  // 요청 본문에 넣지 않는 화면 전용 값: 은행 ID, 선택한 카탈로그 상품, 직접 입력 여부, 대출 종류 표시명, 대출 기간(년·개월), 만기일 직접 수정 여부, 수정 중인 대출 ID, 중도상환수수료 선택·적용 기간(년)
  selection: { institution_id: null, product: null, manual: false, loan_type_label: null, term: { years: null, months: null }, maturityManual: false, editingLoanId: null, feeChoice: null, feeYears: null },
  income: { occupation: null, income_type: 'REGULAR', monthly_income: null, payday: null }, // S-02A (income_type·monthly_income·payday 는 프로필 API 필드)
  living: { fixed_essential_expenses: null, variable_essential_expenses: null, discretionary_expenses: null, savings: null, emergency_fund: null }, // S-02B (프로필 API 필드)
  goal: { activeLoanId: 'all', plans: {} }, // S-03: plans[loan_id] = planModel.emptyDraft 형태
}
