import target from '../../assets/onboarding/icon-target.svg'
import swap from '../../assets/onboarding/icon-swap.svg'
import shield from '../../assets/onboarding/icon-shield-check.svg'
import { fmtNumber } from './format.js'

export const PREFERENCES = [
  { value: 'FAST', title: '빠른 상환', description: '매달 더 갚아서 이자를 가장 많이 줄여요', icon: target },
  { value: 'BALANCED', title: '균형 상환', description: '상환과 생활비를 적당히 나눠요', icon: swap },
  { value: 'STABLE', title: '생활 안정 우선', description: '기본 상환만 하고 생활비 여유를 지켜요', icon: shield },
]

// 여유자금 기준 성향 설명. 여유자금을 모르면(null) 기본 설명을 쓴다.
export const preferenceText = (p, surplus) => {
  if (!surplus) return p.description
  const pct = { FAST: 80, BALANCED: 50 }[p.value]
  return pct ? `여유자금의 ${pct}% · 월 ${fmtNumber(Math.round(surplus * pct / 100))}원` : '추가 상환 없이 기본 상환만'
}
