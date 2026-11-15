import { segmentRows } from './data.js'

export const mockPlanData = {
  mortgage: { total:3500000, principal:1923501, interest:1576499, monthly:713000, base:700000, extra:13000, finish:'2044년 12월', expected:'2045.7', dday:'6,827', principalRows:[382730,383713,384698,385685,386675], interestRows:[317270,316287,315302,314315,313325], actual:[700000,700000,700000,700000,700000], planned:[720000,720000,720000,720000,713000], max:4000000 },
  credit: { total:1500000, principal:1091146, interest:408854, monthly:300000, base:200000, extra:100000, finish:'2033년 7월', expected:'2033.7', dday:'2,434', principalRows:[216322,217367,118418,218990,320049], interestRows:[83678,82633,81582,81010,79951], actual:[300000,300000,200000,300000,400000], planned:[300000,300000,300000,300000,300000], max:2000000 },
  all: { total:5000000, principal:3014647, interest:1985353, monthly:1013000, base:900000, extra:113000, finish:'2044년 12월', expected:'2045.7', dday:'6,827', principalRows:[599052,601080,503116,604675,706724], interestRows:[400948,398920,396884,395325,393276], actual:[1000000,1000000,900000,1000000,1100000], planned:[1020000,1020000,1020000,1020000,1013000], max:6000000 },
}

  export const mockSegmentData = {
    all: { target:1000000,max:1200000,rows:segmentRows,totals:[5000000,2514647,1985353,500000] },
    credit: { target:300000,max:450000,rows:segmentRows.map((r,i)=>({...r,actual:r.actual-700000,principal:[120049,118990,118418,117367,116322][i],interest:[79951,81010,81582,82633,83678][i]})),totals:[1500000,591146,408854,500000] },
    mortgage: { target:700000,max:900000,rows:segmentRows.map((r,i)=>({...r,actual:700000,principal:[386675,385685,384698,383713,382730][i],interest:[313325,314315,315302,316287,317270][i],extra:0})),totals:[3500000,1923501,1576499,0] },
  }

const periods = ['6월','7월','8월','9월','10월']
for (const [key,data] of Object.entries(mockPlanData)) {
  data.periods = periods
  data.paymentDifference = key === 'credit' ? 0 : -93000
  data.paceMessage = key === 'credit' ? '계획대로 달리고 있어요' : (key === 'all' ? '주택담보대출이 ' : '') + '계획보다 7개월 늦어요'
  if (key === 'mortgage') data.rateChange = { index: 4, label: '10월 금리 변경' }
}
for (const [key,data] of Object.entries(mockSegmentData)) {
  data.message = key === 'mortgage' ? '6~10월 매달 계획대로 갚았어요.' : '6~10월 계획만큼 갚았어요 · 8월 부족분은 10월에 채웠어요'
  data.periodLabel = '6~10월 합계'
}
export const mockProgressData = {
  mortgage: { actualPercent:18, plannedPercent:21, principalDifference:-4650000, goalDate:'2044.12' },
  credit: { actualPercent:20, plannedPercent:20, principalDifference:0, goalDate:'2033.7' },
}
export const mockPlanComparisons = {
  mortgage: {
    current:{ monthly:713000, principal:400667, interest:312333 },
    proposed:{ monthly:750000, principal:437667, interest:312333 },
  },
  credit: {
    current:{ monthly:300000, principal:203333, interest:96667 },
    proposed:{ monthly:350000, principal:253333, interest:96667 },
  },
  all: {
    current:{ monthly:1013000, principal:604000, interest:409000 },
    proposed:{ monthly:1050000, principal:641000, interest:409000 },
  },
}
export const mockLoanViewData = {
  plans: mockPlanData,
  segments: mockSegmentData,
  progress: mockProgressData,
  comparisons: mockPlanComparisons,
}
