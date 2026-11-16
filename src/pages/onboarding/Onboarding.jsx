import { useEffect } from 'react'
import OnboardingHeader from './components/OnboardingHeader.jsx'
import StepLayout from './components/StepLayout.jsx'
import PlanFooter from './components/PlanFooter.jsx'
import { STEPS } from './steps.js'
import { stepComponents } from './steps/index.js'
import { useOnboarding } from './useOnboarding.js'
import { usePlanPreview } from './steps/goal/usePlanPreview.js'
import './Onboarding.scss'

export default function Onboarding({ location, navigate }) {
  const { stepId, form, setForm, next, back, jump, busy, error, canNext, isFirst } = useOnboarding({ location, navigate })
  const step = STEPS[stepId]
  const Step = stepComponents[stepId]
  // 상환 목표(S-03) 화면과 하단 요약 바가 같은 미리보기 결과를 쓴다.
  const preview = usePlanPreview(form, step.group === 'goal')
  const nav = { onBack: back, onNext: next, canNext, isFirst, busy, error, nextLabel: step.nextLabel }

  useEffect(() => { document.title = '론런 | 온보딩 · ' + step.title }, [step.title])

  return <div className="onboarding-shell">
    <OnboardingHeader />
    <main>
      <StepLayout step={step} heading={step.heading ?? step.title} nav={nav} footer={step.footer === 'plan' ? <PlanFooter form={form} preview={preview} nav={nav} /> : null}>
        <Step form={form} setForm={setForm} jump={jump} navigate={navigate} preview={preview} />
      </StepLayout>
    </main>
  </div>
}
