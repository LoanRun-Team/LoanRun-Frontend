import PlanOptionCard from '../../components/PlanOptionCard.jsx'
import LoanContext from '../../components/LoanContext.jsx'
import PlanResult from '../../components/PlanResult.jsx'
import calendar from '../../../../assets/onboarding/icon-calendar.svg'
import target from '../../../../assets/onboarding/icon-target.svg'
import { fmtNumber } from '../../format.js'
import { draftOf, fmtYM } from '../../planModel.js'
import { planUpdater } from './usePlanPreview.js'

// Figma: S-03a 목표 방향 선택 / S-03a-1 만기까지 · 결과 확인
// "만기까지"를 고르면 오른쪽에 계획 요약이 나오고 바로 시작할 수 있다. "일찍 갚고 싶어요"는 조기 상환 설정(S-03b)으로 넘어간다.
export default function GoalDirection({ form, setForm, jump, preview }) {
  const loan = form.loans[0]
  const draft = draftOf(form.goal, loan.loan_id)
  const onDraft = planUpdater(setForm, loan.loan_id)

  return <>
    <LoanContext loan={loan} />
    <div className="ob-plan-cards">
      <section className="ob-plan-card">
        <h2>목표 방향</h2>
        <div className="ob-plan-options" role="radiogroup" aria-label="목표 방향">
          <PlanOptionCard name="direction" icon={calendar} title="만기까지 계획대로 갚아요" description={`만기 ${fmtYM(loan.maturity_date)} · 매달 기본 ${fmtNumber(loan.estimated_monthly_payment)}원만 내요`}
            selected={draft.direction === 'maturity'} onSelect={() => onDraft({ direction: 'maturity' })} />
          <PlanOptionCard name="direction" icon={target} title="만기보다 일찍 갚고 싶어요" description="매달 더 갚아서 완납일을 앞당겨요"
            selected={draft.direction === 'early'} onSelect={() => { onDraft({ direction: 'early' }); jump('early-repayment') }} />
        </div>
      </section>
      <PlanResult loan={loan} draft={draft} res={preview.byLoan[loan.loan_id]} pending={preview.pending} onDraft={onDraft} title={draft.direction === 'maturity' ? '계획 요약' : '계산 결과'} />
    </div>
  </>
}
