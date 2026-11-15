export const money = value => Number(value).toLocaleString('ko-KR')
export const loanTabs = [
  { id: 'overview', label: '내 대출', href: '/loans' },
  { id: 'monthly', label: '이번 달 상환', href: '/loans/monthly' },
  { id: 'segments', label: '구간 기록', href: '/loans/segments' },
  { id: 'plan', label: '상환 계획', href: '/loans/plan' },
]
export const initialLoans = [
  { id: 'mortgage', name: '주택담보대출', bank: '○○은행', product: '예시 은행 · ○○ 주택담보대출(예시)', balance: 121700000, original: 148400000, percent: 18, rate: 3.08, variable: true, interest: '약 5,145만원', principalPayment: 319107, interestPayment: 380893, payment: 700000, day: 25, finish: '2045년 7월' },
  { id: 'credit', name: '신용대출', bank: '○○은행', product: '예시 은행 · ○○ 신용대출(예시)', balance: 16000000, original: 20000000, percent: 20, rate: 5.8, variable: false, interest: '약 421만원', principalPayment: 203333, interestPayment: 96667, payment: 200000, day: 15, finish: '2033년 8월' },
]
export const initialHistory = [
  ['2026.10.25', 'mortgage', 700000, 318290, 381710, 148400000],
  ['2026.10.15', 'credit', 400000, 301874, 98126, 20000000],
  ['2026.09.25', 'mortgage', 700000, 317475, 382525, 148718290],
  ['2026.09.15', 'credit', 300000, 200903, 99097, 20301874],
  ['2026.08.25', 'mortgage', 700000, 316662, 383338, 149035765],
  ['2026.08.15', 'credit', 200000, 100418, 99582, 20502777],
  ['2026.07.25', 'mortgage', 700000, 315851, 384149, 149352427],
  ['2026.07.15', 'credit', 300000, 199454, 100546, 20603195],
  ['2026.06.25', 'mortgage', 700000, 315043, 384957, 149668278],
  ['2026.06.15', 'credit', 300000, 198494, 101506, 20802649],
].map(([date, loanId, amount, principal, interest, balance], index) => ({ id: 'payment-' + index, date, loanId, amount, principal, interest, balance }))
export const segmentRows = [
  { month: 10, actual: 1100000, principal: 506724, interest: 393276, extra: 200000 },
  { month: 9, actual: 1000000, principal: 504675, interest: 395325, extra: 100000 },
  { month: 8, actual: 900000, principal: 503116, interest: 396884, extra: 0 },
  { month: 7, actual: 1000000, principal: 501080, interest: 398920, extra: 100000 },
  { month: 6, actual: 1000000, principal: 499052, interest: 400948, extra: 100000 },
]
export const footnote = '모든 날짜와 금액은 예시 계산이에요 (주담대 연 3.08%, 신용대출 연 5.8% 가정).'
