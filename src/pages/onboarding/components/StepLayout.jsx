import Stepper from './Stepper.jsx'
import InputStepper from './InputStepper.jsx'
import StepNav from './StepNav.jsx'

// 모든 온보딩 화면의 공통 틀: Stepper wrap + Title block + 본문 + 하단 이동.
// step.wide: S-03 처럼 넓은 본문(1032) / step.bar: 하단 고정 바 형태의 이동 / footer: 화면이 직접 정하는 하단 바(S-03 요약 바)
export default function StepLayout({ step, heading, children, nav, footer }) {
  const navProps = { ...nav, hidePrev: step.hidePrev }
  return <>
    <div className={`ob-content${step.wide ? ' wide' : ''}`}>
      <div className="ob-stepper-wrap"><Stepper group={step.group} sub={step.sub} /></div>
      <div className="ob-title-block">
        {step.eyebrow && <p className="ob-eyebrow">{step.eyebrow}</p>}
        {step.inputStep && <InputStepper step={step.inputStep} />}
        <h1>{heading}</h1>
      </div>
      {children}
      {!footer && !step.bar && <StepNav {...navProps} />}
    </div>
    {footer}
    {!footer && step.bar && <div className="ob-bar"><div className="ob-bar-inner"><StepNav {...navProps} bar /></div></div>}
  </>
}
