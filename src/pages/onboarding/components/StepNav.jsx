// Figma: Step nav — 이전(outline) / 다음(primary), 높이 52. 첫 스텝의 이전은 비활성(opacity 40%), hidePrev 면 이전 버튼을 숨긴다.
export default function StepNav({ onBack, onNext, canNext, isFirst, busy, error, nextLabel = '다음', hidePrev = false, bar = false }) {
  return <nav className={`ob-step-nav${bar ? ' in-bar' : ''}`} aria-label="단계 이동">
    {error && <p className="ob-error ob-nav-error" role="alert">{error}</p>}
    {hidePrev ? <span /> : <button type="button" className="ob-button outline" onClick={onBack} disabled={isFirst || busy}>이전</button>}
    <button type="button" className="ob-button primary" onClick={onNext} disabled={!canNext || busy}>{busy ? '저장 중…' : nextLabel}</button>
  </nav>
}
