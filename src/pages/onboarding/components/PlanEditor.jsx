import SelectField from './SelectField.jsx'
import NumberField from './NumberField.jsx'
import PlanOptionCard from './PlanOptionCard.jsx'
import SegmentTabs from './SegmentTabs.jsx'
import PlanResult from './PlanResult.jsx'
import { PREFERENCES, preferenceText } from '../preferences.js'
import { fmtNumber } from '../format.js'
import { fmtYM, isLump, savingChips, tabsFor, targetYM } from '../planModel.js'

// 조기 상환 설정. 세그먼트 탭, 왼쪽 입력 카드, 오른쪽 계산 결과 카드로 이뤄진다.
const EXTRA_CHIPS = [50000, 100000, 200000]
const thisYear = new Date().getFullYear()
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: String(i + 1) }))

export default function PlanEditor({ loan, draft, onDraft, res, pending, surplus = null }) {
  const lump = isLump(loan)
  const maturityYear = Number(loan.maturity_date.slice(0, 4))
  const years = Array.from({ length: Math.max(1, maturityYear - thisYear + 1) }, (_, i) => ({ value: thisYear + i, label: String(thisYear + i) }))

  const left = {
    preference: { title: '상환 성향', body: <div className="ob-plan-options" role="radiogroup" aria-label="상환 성향">
      {PREFERENCES.map(p => <PlanOptionCard key={p.value} name={`pref-${loan.loan_id}`} icon={p.icon} title={p.title} description={preferenceText(p, lump ? null : surplus)}
        selected={draft.preference === p.value && draft.extra_override == null && draft.monthly_override == null}
        onSelect={() => onDraft({ preference: p.value, extra_override: null, monthly_override: null })} />)}
    </div> },
    date: lump
      ? { title: '목표 완납일', body: <>
        <div className="ob-row">
          <SelectField label="목표 완납일 (필수)" options={years} value={targetYM(loan, draft).y} onChange={v => onDraft({ target_year: v, target_month: targetYM(loan, draft).m })} />
          <SelectField label="월" hideLabel options={MONTHS} value={targetYM(loan, draft).m} onChange={v => onDraft({ target_month: v, target_year: targetYM(loan, draft).y })} />
        </div>
        <p className="ob-helper">계약 만기일 {loan.maturity_date.slice(0, 4)}.{loan.maturity_date.slice(5, 7)}까지 정할 수 있어요</p>
      </> }
      : { title: '희망 완납일', body: <>
        <div className="ob-row">
          <SelectField label="희망 완납 연도" hideLabel options={years} value={draft.target_year} onChange={v => onDraft({ target_year: v })} />
          <SelectField label="희망 완납 월" hideLabel options={MONTHS} value={draft.target_month} onChange={v => onDraft({ target_month: v })} />
        </div>
        <p className="ob-helper">만기 {fmtYM(loan.maturity_date)}보다 앞선 날짜를 골라요</p>
      </> },
    extra: { title: '월 추가 상환액', body: <>
      <NumberField label="월 추가 상환액" hideLabel value={draft.extra_monthly_payment} unit="원" placeholder="0" onChange={v => onDraft({ extra_monthly_payment: v })} />
      <div className="ob-quick">{EXTRA_CHIPS.map(n => <button key={n} type="button" className="ob-chip large" onClick={() => onDraft({ extra_monthly_payment: (draft.extra_monthly_payment ?? 0) + n })}>+{n / 10000}만원</button>)}</div>
    </> },
    // 만기일시: 월 적립액(이자는 별도). 칩은 만기까지 모으는 데 필요한 금액을 기준으로 만든다.
    monthly: { title: '월 적립액', body: <>
      <NumberField label="월 적립액" hideLabel value={draft.saving_amount} unit="원" placeholder="0" onChange={v => onDraft({ saving_amount: v })} />
      <div className="ob-quick">{savingChips(loan).map(n => <button key={n} type="button" className="ob-chip large" onClick={() => onDraft({ saving_amount: n })}>{fmtNumber(n)}원</button>)}</div>
    </> },
  }[draft.tab]

  return <>
    <SegmentTabs tabs={tabsFor(loan)} value={draft.tab} onChange={tab => onDraft({ tab })} />
    <div className="ob-plan-cards">
      <section className="ob-plan-card"><h2>{left.title}</h2>{left.body}</section>
      <PlanResult loan={loan} draft={{ ...draft, direction: lump ? draft.direction : 'early' }} res={res} pending={pending} onDraft={onDraft} />
    </div>
  </>
}
