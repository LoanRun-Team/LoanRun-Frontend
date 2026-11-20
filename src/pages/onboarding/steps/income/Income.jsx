import StepCard from '../../components/StepCard.jsx'
import ChoiceChip from '../../components/ChoiceChip.jsx'
import NumberField from '../../components/NumberField.jsx'
import SelectField from '../../components/SelectField.jsx'
import Banner from '../../components/Banner.jsx'
import { incomeTypeOptions, occupationOptions, paymentDayOptions } from '../../data.js'

// 소득 입력(정기, 비정기).
// 소득 유형이 정기면 월 실수령액 + 지급일, 비정기면 "예상 월 소득(최근 3개월 평균)"만 받는다. (income_type·monthly_income·payday 는 프로필 API 필드)
export default function Income({ form, setForm }) {
  const income = form.income
  const regular = income.income_type === 'REGULAR'
  const patch = p => setForm(f => ({ ...f, income: { ...f.income, ...p } }))

  return <StepCard>
    <div className="ob-field">
      <span className="ob-label" id="ob-occupation">소득 형태</span>
      <div className="ob-choice-grid" role="radiogroup" aria-labelledby="ob-occupation">
        {occupationOptions.map(o => <ChoiceChip key={o} name="occupation" selected={income.occupation === o} onSelect={() => patch({ occupation: o })}>{o}</ChoiceChip>)}
      </div>
    </div>
    <div className="ob-field">
      <span className="ob-label" id="ob-income-type">소득 유형</span>
      <div className="ob-choice-grid two" role="radiogroup" aria-labelledby="ob-income-type">
        {incomeTypeOptions.map(o => <ChoiceChip key={o.value} large name="income-type" selected={income.income_type === o.value} onSelect={() => patch({ income_type: o.value, payday: o.value === 'REGULAR' ? income.payday : null })}>{o.label}</ChoiceChip>)}
      </div>
    </div>
    <NumberField label={regular ? '월 실수령액' : '예상 월 소득 (최근 3개월 평균)'} value={income.monthly_income} unit="원" placeholder={regular ? '예: 3,500,000' : '예: 3,200,000'} onChange={v => patch({ monthly_income: v })} />
    {regular && <>
      <SelectField label="지급일" options={paymentDayOptions} value={income.payday} onChange={v => patch({ payday: v })} />
      <Banner>매월 자동 반영돼요. 추가 수령이 있을 때만 기록하세요</Banner>
    </>}
  </StepCard>
}
