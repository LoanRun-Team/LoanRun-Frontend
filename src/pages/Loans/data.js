export const money = value => value == null ? '—' : Number(value).toLocaleString('ko-KR')
export const loanTabs = [
  { id: 'overview', label: '내 대출', href: '/loans' },
  { id: 'monthly', label: '이번 달 상환', href: '/loans/monthly' },
  { id: 'segments', label: '구간 기록', href: '/loans/segments' },
  { id: 'plan', label: '상환 계획', href: '/loans/plan' },
]
