// 대출 상품 mock 데이터. 응답 형태·코드값은 Notion 명세(대출 종류·은행 목록 조회, 은행별 대출상품 목록 조회) 기준이고,
// 은행·상품 이름은 개발용 가상값이다(명세도 "예시" 값이라고 밝힘).
export const loanTypes = [
  { code: 'CREDIT', label: '신용대출' },
  { code: 'MORTGAGE', label: '주택담보대출' },
  { code: 'JEONSE', label: '전세자금대출' },
  { code: 'STUDENT', label: '학자금대출' },
  { code: 'AUTO', label: '자동차대출' },
  { code: 'OTHER', label: '기타' },
]

export const institutions = [
  { institution_id: 1, name: '예시 은행' },
  { institution_id: 2, name: '샘플 은행' },
  { institution_id: 3, name: '테스트 저축은행' },
]

const names = {
  CREDIT: ['○○ 신용대출(예시)', '△△ 직장인 신용대출(예시)', '□□ 비상금 대출(예시)', '◇◇ 중금리 대출(예시)'],
  MORTGAGE: ['○○ 주택담보대출(예시)', '△△ 보금자리론(예시)'],
  JEONSE: ['○○ 전세자금대출(예시)'],
  STUDENT: ['○○ 학자금대출(예시)'],
  AUTO: ['○○ 자동차대출(예시)'],
  OTHER: ['○○ 기타대출(예시)'],
}
const methods = {
  CREDIT: ['EQUAL_PAYMENT', 'EQUAL_PRINCIPAL', 'BULLET'],
  MORTGAGE: ['EQUAL_PAYMENT', 'EQUAL_PRINCIPAL', 'GRACE_INSTALLMENT'],
  JEONSE: ['BULLET'],
  STUDENT: ['EQUAL_PAYMENT', 'GRACE_INSTALLMENT'],
  AUTO: ['EQUAL_PAYMENT', 'EQUAL_PRINCIPAL'],
  OTHER: ['EQUAL_PAYMENT', 'EQUAL_PRINCIPAL', 'BULLET'],
}

let nextId = 11
export const products = institutions.flatMap(inst => loanTypes.flatMap(type => names[type.code].map(name => ({
  product_id: nextId++,
  institution_id: inst.institution_id,
  name: inst.institution_id === 1 ? name : name.replace('○○', inst.name.slice(0, 2)),
  loan_type: type.code,
  loan_form: 'GENERAL',
  repayment_methods: methods[type.code],
  source: 'CATALOG',
}))))
// 한도대출(마이너스통장) 상품
for (const inst of institutions) {
  products.push({ product_id: nextId++, institution_id: inst.institution_id, name: `${inst.name.slice(0, 2)} 마이너스통장(예시)`, loan_type: 'CREDIT', loan_form: 'CREDIT_LINE', repayment_methods: ['CREDIT_LINE'], source: 'CATALOG' })
}
