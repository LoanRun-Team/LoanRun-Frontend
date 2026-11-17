// Figma F4: Card / 한 줄 요약. 문장은 서버가 확정한 report.summary 를 그대로 보여 준다.
export default function SummaryCard({ report }) {
  return <section className="rp-card" aria-labelledby="rp-summary-title">
    <h2 id="rp-summary-title">한 줄 요약</h2>
    <p className="rp-summary">{report.summary}</p>
  </section>
}
