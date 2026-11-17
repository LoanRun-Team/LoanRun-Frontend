// Figma: Stepper / 입력 단계 — "1 / 3" + 막대 3개. 온보딩 S-01b~c(대출 입력)에서 사용.
const TOTAL = 2

export default function InputStepper({ step }) {
  return <div className="ob-input-stepper" role="img" aria-label={`대출 입력 ${step} / ${TOTAL} 단계`}>
    <span className="ob-input-count"><strong>{step}</strong><span> / {TOTAL}</span></span>
    <span className="ob-input-bars">{Array.from({ length: TOTAL }, (_, i) => <i key={i} className={i < step ? 'on' : ''} />)}</span>
  </div>
}
