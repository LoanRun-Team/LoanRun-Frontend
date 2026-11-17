import StepCard from '../../components/StepCard.jsx'
import SelectField from '../../components/SelectField.jsx'
import NumberField from '../../components/NumberField.jsx'
import DateField from '../../components/DateField.jsx'
import PeriodField from '../../components/PeriodField.jsx'
import Chip from '../../components/Chip.jsx'
import { onboardingApi } from '../../../../api/index.js'
import { useRequest } from '../../useRequest.js'
import { buildLoanBody, withDefaults } from '../../loanForm.js'
import { addMonths, fmtWon, todayISO } from '../../format.js'
import { paymentDayOptions, postGraceMethods, rateTypeLabel, repaymentMethods, resetMonthOptions } from '../../data.js'

// Figma: S-01c 상환 정보 — 원리금균등 / 거치 후 분할 / 만기일시 / 변동금리
// 상환 방식에 따라 보이는 필드가 달라지고, 입력이 유효하면 기본 월 상환액을 /api/loans/preview/ 로 계산해 보여준다.
export default function RepaymentInfo({ form, setForm }) {
  const sel = form.selection
  const loan = withDefaults(form.loan, sel)
  const method = loan.repayment_method
  const grace = method === 'GRACE_INSTALLMENT'
  const bullet = method === 'BULLET'
  const variable = loan.rate_type === 'VARIABLE'

  // 입력 값 갱신. 대출 기간·실행일이 바뀌면 만기일을 다시 계산하고, 납부일이 비어 있으면 실행일의 일(日)로 채운다.
  function update(loanPatch, selPatch = {}) {
    setForm(f => {
      const next = { ...f.loan, ...loanPatch }
      const nextSel = { ...f.selection, ...selPatch }
      if (!nextSel.maturityManual) {
        const total = (nextSel.term.years || 0) * 12 + (nextSel.term.months || 0)
        next.maturity_date = next.start_date && total > 0 ? addMonths(next.start_date, total) : null
      }
      if (loanPatch.start_date && next.payment_day == null) next.payment_day = Number(loanPatch.start_date.slice(8))
      return { ...f, loan: next, selection: nextSel }
    })
  }

  const methodOptions = repaymentMethods.filter(m => (sel.manual || !sel.product || sel.product.repayment_methods.includes(m.value)))
  const body = buildLoanBody(form)
  const preview = useRequest(signal => (body ? onboardingApi.previewLoan(body, { signal }) : null), [JSON.stringify(body)])

  const summary = [sel.loan_type_label, loan.institution_name, loan.product_name].filter(Boolean).join(' · ')
  const rateChip = <Chip onClick={() => update({ rate_type: variable ? 'FIXED' : 'VARIABLE' })} title="누르면 고정/변동이 바뀌어요">{rateTypeLabel[loan.rate_type]}</Chip>
  const resetField = <SelectField label="금리 변동 주기" options={resetMonthOptions} value={loan.rate_reset_months} onChange={v => update({ rate_reset_months: v })} />
  const maturityToggle = <button type="button" className="ob-link-btn" onClick={() => update({}, { maturityManual: !sel.maturityManual })}>{sel.maturityManual ? '자동 계산' : '수정'}</button>
  const maturityLabel = '만기일'

  const rateField = <NumberField label="적용 금리" labelExtra={rateChip} value={loan.annual_rate} decimals={2} unit="%" placeholder="예: 5.8" onChange={v => update({ annual_rate: v })} />
  const startField = <DateField label="실행일" value={loan.start_date} max={todayISO()} onChange={v => update({ start_date: v })} />
  const periodField = <PeriodField label="대출 기간" years={sel.term.years} months={sel.term.months} onChange={term => update({}, { term })} />
  const maturityField = <DateField key={sel.maturityManual ? 'manual' : 'auto'} label={maturityLabel} labelExtra={maturityToggle} value={loan.maturity_date} readOnly={!sel.maturityManual} onChange={v => update({ maturity_date: v }, { maturityManual: true })} />
  const dayField = <SelectField label={bullet ? '이자 납부일' : '납부일'} options={paymentDayOptions} value={loan.payment_day} onChange={v => update({ payment_day: v })} />

  return <StepCard>
    <div className="ob-summary">{summary}</div>
    <SelectField label="상환 방식" options={methodOptions} value={method} onChange={v => update({ repayment_method: v })} />
    {grace && <div className="ob-row">
      <NumberField label="거치 기간" value={loan.grace_months} unit="개월" onChange={v => update({ grace_months: v })} />
      <SelectField label="거치 후 분할 방식" options={postGraceMethods} value={loan.post_grace_method} onChange={v => update({ post_grace_method: v })} />
    </div>}
    <hr className="ob-divider" />
    <>
      <div className="ob-row">
        <NumberField label="현재 잔액" value={loan.remaining_principal} unit="원" onChange={v => update({ remaining_principal: v })} />
        {rateField}
      </div>
      {variable && <div className="ob-row">{resetField}<div className="ob-row-spacer" /></div>}
      <div className="ob-row">{startField}{periodField}</div>
      <div className="ob-row">{maturityField}{dayField}</div>
      {!bullet && <div className="ob-result">
        <span>{grace ? '기본 월 상환액 (거치 후)' : '기본 월 상환액'}</span>
        <strong>{body && preview.status === 'loading' ? '계산 중…' : preview.data ? fmtWon(preview.data.estimated_monthly_payment) : '—원'}</strong>
      </div>}
    </>
  </StepCard>
}
