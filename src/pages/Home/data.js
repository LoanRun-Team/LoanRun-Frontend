export const homeScreens = {
  pro: { plan: 'Pro', example: false, rateChanged: false },
  free: { plan: 'Free', example: false, rateChanged: false },
  'seven-loans': { plan: 'Pro', example: true, rateChanged: false },
  'rate-change': { plan: 'Pro', example: false, rateChanged: true },
}
export const defaultLoans = [
  { name: '신용대출', percent: 20, before: 14.54, pace: 'steady' },
  { name: '주택담보대출', percent: 18, before: 16.7, pace: 'slow' },
]
export const exampleLoans = [
  { name: '마이너스통장', example: true, note: '한도 사용 40%' },
  { name: '자동차대출', example: true, percent: 45, before: 45, pace: 'ahead' },
  { name: '전세자금대출', example: true, note: '거치 중 · 2028.12까지 이자만 납부' },
  { name: '신용대출', percent: 20, before: 14.54, pace: 'steady' },
]

