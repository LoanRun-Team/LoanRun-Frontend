// 세그먼트 탭(상환 성향, 완납일 기준, 추가 상환액 기준). 선택된 탭은 흰 알약 모양이다.
export default function SegmentTabs({ tabs, value, onChange, label = '목표 설정 방식' }) {
  return <div className="ob-segment" role="tablist" aria-label={label}>
    {tabs.map(t => <button key={t.id} type="button" role="tab" aria-selected={t.id === value} className={t.id === value ? 'selected' : ''} onClick={() => onChange(t.id)}>{t.label}</button>)}
  </div>
}
