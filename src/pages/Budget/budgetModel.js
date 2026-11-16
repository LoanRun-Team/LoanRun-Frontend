// 예산·지출 화면의 계산과 표시용 값. 날짜는 'YYYY-MM'(월) / 'YYYY-MM-DD'(일) 문자열로 다룬다.
// 대출 목록과 기본 재정정보는 온보딩에서 쓰는 API(mock)에서 받는다.

export const fmt = n => Number(n).toLocaleString('ko-KR')
export const won = n => `${fmt(n)}원`

const pad = n => String(n).padStart(2, '0')
export const currentYM = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}` }
export const todayDay = () => new Date().getDate()
export const shiftYM = (ym, delta) => {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}
export const labelYM = ym => `${Number(ym.slice(0, 4))}년 ${Number(ym.slice(5, 7))}월`
export const monthName = ym => `${Number(ym.slice(5, 7))}월`
export const lastDayOf = ym => new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 0).getDate()
const WEEK = ['일', '월', '화', '수', '목', '금', '토']
export const dayLabel = (ym, day) => `${Number(ym.slice(5, 7))}.${pad(day)} (${WEEK[new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1, day).getDay()]})`

// 이번 달 기본 상환 일정(대출별 납부일·금액). 납부일이 그 달 말일보다 크면 말일로 맞춘다.
export function baseSchedule(loans, ym) {
  return loans
    .map(loan => ({ loan, day: Math.min(loan.payment_day, lastDayOf(ym)), amount: loan.estimated_monthly_payment }))
    .sort((a, b) => a.day - b.day)
}
export const baseTotal = schedule => schedule.reduce((s, r) => s + r.amount, 0)
// 오늘까지 납부일이 지난 기본 상환 합계(현재 상환액), 다음 납부일
export const paidSoFar = (schedule, today) => schedule.filter(r => r.day <= today).reduce((s, r) => s + r.amount, 0)
export const nextPayDay = (schedule, today) => schedule.find(r => r.day > today)?.day ?? null
