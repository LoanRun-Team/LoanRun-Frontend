import StepCard from '../../components/StepCard.jsx'
import SelectField from '../../components/SelectField.jsx'
import NumberField from '../../components/NumberField.jsx'
import DateField from '../../components/DateField.jsx'
import PeriodField from '../../components/PeriodField.jsx'
import Chip from '../../components/Chip.jsx'
import ChoiceChip from '../../components/ChoiceChip.jsx'
import { onboardingApi } from '../../../../api/index.js'
import { useRequest } from '../../useRequest.js'
import { buildLoanBody, withDefaults } from '../../loanForm.js'
import { addMonths, fmtNumber, todayISO } from '../../format.js'
import { feeChoices, feeLoanTypes, feeMethods, methodShort, paymentDayOptions, postGraceMethods, prepaymentPolicies, rateTypeLabel, repaymentMethods, resetMonthOptions } from '../../data.js'

// Figma: S-01c 상환 방식 — 상품 기본 정보(참고용) + 내 대출 정보
// 상환 방식에 따라 보이는 필드가 달라진다: 분할형은 추가 상환 후 약정 변경 방식, 주택담보·전세자금은 중도상환수수료, 만기일시는 이자 납부일.
// 입력이 유효하면 기본 월 상환액을 /api/loans/preview/ 로 계산해 "다음 회차 납부 예정액"의 안내값으로 보여준다.
export default function RepaymentInfo({ form, setForm }) {
  const sel = form.selection
  const loan = withDefaults(form.loan, sel)
  const method = loan.repayment_method
  const grace = method === 'GRACE_INSTALLMENT'
  const bullet = method === 'BULLET'
  const variable = loan.rate_type === 'VARIABLE'
  const askFee = feeLoanTypes.includes(loan.loan_type)

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

  const catalogMethods = sel.product?.repayment_methods ?? []
  const methodOptions = repaymentMethods.filter(m => sel.manual || !sel.product || catalogMethods.includes(m.value))
  const body = buildLoanBody(form)
  const preview = useRequest(signal => (body ? onboardingApi.previewLoan(body, { signal }) : null), [JSON.stringify(body)])

  const rateChip = <Chip onClick={() => update({ rate_type: variable ? 'FIXED' : 'VARIABLE' })} title="누르면 고정/변동이 바뀌어요">{rateTypeLabel[loan.rate_type]}</Chip>
  const resetField = <SelectField label="금리 변동 주기" options={resetMonthOptions} value={loan.rate_reset_months} onChange={v => update({ rate_reset_months: v })} />
  const maturityToggle = <button type="button" className="ob-link-btn" onClick={() => update({}, { maturityManual: !sel.maturityManual })}>{sel.maturityManual ? '자동 계산' : '수정'}</button>
  const estimated = preview.data?.estimated_monthly_payment

  return <StepCard>
    {!sel.manual && sel.product && <dl className="ob-product-info" aria-label="상품 기본 정보">
      <dt className="ob-product-title">상품 기본 정보 · 참고용</dt>
      <div><dt>상품명</dt><dd>{loan.product_name}</dd></div>
      <div><dt>은행</dt><dd>{loan.institution_name}</dd></div>
      {catalogMethods.length > 0 && <div><dt>상환 방식</dt><dd>{catalogMethods.map(methodShort).join(' · ')}</dd></div>}
    </dl>}
    <div className="ob-section-head">
      <h2>내 대출 정보</h2>
      <p>실제 적용 금리와 조건은 대출 약정서 기준으로 확인해 주세요</p>
    </div>
    <SelectField label="상환 방식" options={methodOptions} value={method} onChange={v => update({ repayment_method: v })} />
    {grace && <div className="ob-row top">
      <NumberField label="거치 기간" value={loan.grace_months} unit="개월" onChange={v => update({ grace_months: v })} />
      <SelectField label="거치 후 분할 방식" options={postGraceMethods} value={loan.post_grace_method} onChange={v => update({ post_grace_method: v })} />
    </div>}
    <hr className="ob-divider" />
    <div className="ob-row top">
      <NumberField label="최초 대출 원금" value={loan.original_principal} unit="원" onChange={v => update({ original_principal: v })} />
      <NumberField label="현재 남은 원금" value={loan.remaining_principal} unit="원" helper="은행 앱의 대출 잔액을 입력해 주세요" onChange={v => update({ remaining_principal: v })} />
    </div>
    <div className="ob-row top">
      <NumberField label="적용 금리" labelExtra={rateChip} value={loan.annual_rate} decimals={2} unit="%" placeholder="예: 5.8" onChange={v => update({ annual_rate: v })} />
      {variable ? resetField : <div className="ob-row-spacer" />}
    </div>
    <div className="ob-row top">
      <DateField label="실행일" value={loan.start_date} max={todayISO()} onChange={v => update({ start_date: v })} />
      <PeriodField label="대출 기간" years={sel.term.years} months={sel.term.months} onChange={term => update({}, { term })} />
    </div>
    <div className="ob-row top">
      <DateField key={sel.maturityManual ? 'manual' : 'auto'} label="만기일" labelExtra={maturityToggle} value={loan.maturity_date} readOnly={!sel.maturityManual} onChange={v => update({ maturity_date: v }, { maturityManual: true })} />
      <SelectField label={bullet ? '이자 납부일' : '납부일'} options={paymentDayOptions} value={loan.payment_day} onChange={v => update({ payment_day: v })} />
    </div>

    {!bullet && <fieldset className="ob-group">
      <legend className="ob-label">추가 상환 후 약정 변경 방식</legend>
      <div className="ob-choice-stack" role="radiogroup" aria-label="추가 상환 후 약정 변경 방식">
        {prepaymentPolicies.map(o => <ChoiceChip key={o.value} name="prepayment-policy" selected={loan.prepayment_policy === o.value} onSelect={() => update({ prepayment_policy: o.value })}>{o.label}</ChoiceChip>)}
      </div>
      <p className="ob-helper">잘 모르면 대출 약정서나 은행 앱에서 확인할 수 있어요</p>
    </fieldset>}

    {askFee && <fieldset className="ob-group">
      <legend className="ob-label">중도상환수수료</legend>
      <div className="ob-choice-grid" role="radiogroup" aria-label="중도상환수수료">
        {feeChoices.map(o => <ChoiceChip key={o.value} name="fee-choice" selected={sel.feeChoice === o.value} onSelect={() => update({}, { feeChoice: o.value })}>{o.label}</ChoiceChip>)}
      </div>
      {sel.feeChoice === 'HAS' && <div className="ob-fee-box">
        <div className="ob-field"><span className="ob-label">계산 방식</span>
          <div className="ob-choice-grid two" role="radiogroup" aria-label="수수료 계산 방식">
            {feeMethods.map(o => <ChoiceChip key={o.value} name="fee-method" selected={loan.prepayment_fee_method === o.value} onSelect={() => update({ prepayment_fee_method: o.value })}>{o.label}</ChoiceChip>)}
          </div>
        </div>
        <div className="ob-row top">
          <NumberField label="수수료율" value={loan.prepayment_fee_rate} decimals={2} unit="%" placeholder="예: 1.2" onChange={v => update({ prepayment_fee_rate: v })} />
          <NumberField label="적용 기간" value={sel.feeYears} unit="년" helper={sel.feeYears ? `대출 실행일부터 ${sel.feeYears}년` : '대출 실행일부터 n년'} onChange={v => update({}, { feeYears: v })} />
        </div>
      </div>}
    </fieldset>}

    <NumberField label="다음 회차 납부 예정액 (선택)" value={loan.contractual_monthly_payment ?? null} unit="원" placeholder={!bullet && estimated ? fmtNumber(estimated) : '0'}
      helper={bullet ? '비워 두면 론런이 이자를 계산해요' : '비워 두면 론런이 계산해요'} onChange={v => update({ contractual_monthly_payment: v })} />
  </StepCard>
}
