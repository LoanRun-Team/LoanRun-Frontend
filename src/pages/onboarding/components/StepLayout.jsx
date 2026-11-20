import Stepper from './Stepper.jsx'
import InputStepper from './InputStepper.jsx'
import StepNav from './StepNav.jsx'

// 모든 온보딩 화면의 공통 틀(스텝 표시, 제목, 본문, 하단 이동).
// step.wide 는 넓은 본문, step.bar 는 하단 고정 이동 바, footer 는 화면이 직접 정하는 하단 바다.
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
