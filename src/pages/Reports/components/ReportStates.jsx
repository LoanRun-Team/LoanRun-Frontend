// 리포트 생성 중과 생성 실패 화면. 실패하면 다시 시도(POST force=true)와 홈으로 가기를 준다.
export function Generating() {
  return <section className="rp-card rp-state" role="status" aria-live="polite">
    <span className="rp-spinner" aria-hidden="true" />
    <h2>리포트를 만들고 있어요</h2>
    <p>대출과 납부 기록을 분석하는 중이에요. 잠시만 기다려 주세요.</p>
  </section>
}

export function Failed({ message, onRetry, onHome, retrying }) {
  return <section className="rp-card rp-state" role="alert">
    <h2>리포트를 만들지 못했어요</h2>
    <p>{message || '잠시 후 다시 시도해 주세요.'}</p>
    <div className="rp-actions">
      <button type="button" className="rp-button outline" onClick={onHome}>홈으로</button>
      <button type="button" className="rp-button primary" onClick={onRetry} disabled={retrying}>다시 시도</button>
    </div>
  </section>
}
