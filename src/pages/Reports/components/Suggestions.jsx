// Figma F4: 지금 하면 좋은 것 — 제안 카드 3개. 서버가 준 suggestions[] 의 action 에 따라 이동 버튼을 붙인다.
// action 값은 명세 예시(REPAYMENT_PLAN)만 확인돼 있고 나머지(BUDGET·RISK)는 화면 이동 대상으로 가정했다(REPORT_API.md).
const ACTIONS = {
  REPAYMENT_PLAN: { label: '상환 계획 수정하기', href: '/loans/plan' },
  BUDGET: { label: '예산·지출 보기', href: '/budget' },
  RISK: { label: '위험 분석에서 조절하기', href: '/risk' },
}

export default function Suggestions({ suggestions, navigate }) {
  if (!suggestions?.length) return null
  return <section className="rp-suggestions" aria-labelledby="rp-suggest-title">
    <h2 id="rp-suggest-title" className="rp-section-title">지금 하면 좋은 것</h2>
    <div className="rp-suggest-grid">
      {suggestions.map((item, i) => {
        const action = ACTIONS[item.action]
        return <article key={`${item.type}-${i}`} className="rp-card rp-suggest">
          <p className="rp-eyebrow">제안 {i + 1}</p>
          <div className="rp-suggest-title"><h3>{item.title}</h3><span className="rp-chip neutral small">전체 기준</span></div>
          <p className="rp-suggest-text">{item.description}</p>
          {action && <button type="button" className="rp-button outline" onClick={() => navigate(action.href)}>{action.label}</button>}
        </article>
      })}
    </div>
  </section>
}
