import previous from '../../../assets/loans/calendar-previous.svg'
import next from '../../../assets/loans/calendar-next.svg'
import { labelYM } from '../budgetModel.js'

// 월 이동. 이전·다음 달 버튼으로 기록이 있는 가장 이른 달과 이번 달 사이에서만 이동한다.
export default function MonthSwitcher({ ym, canPrev, canNext, onPrev, onNext }) {
  return <div className="bd-month" role="group" aria-label="월 이동">
    <button type="button" onClick={onPrev} disabled={!canPrev} aria-label="이전 달"><img src={previous} alt="" width="16" height="16" /></button>
    <strong aria-live="polite">{labelYM(ym)}</strong>
    <button type="button" onClick={onNext} disabled={!canNext} aria-label="다음 달"><img src={next} alt="" width="16" height="16" /></button>
  </div>
}
