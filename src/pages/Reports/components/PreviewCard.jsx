import { previewRows } from '../reportModel.js'

// 반영 미리보기. 고른 전략을 반영했을 때 현재 계획과 달라지는 값을 보여 주며 저장은 하지 않는다(POST preview).
export default function PreviewCard({ candidate, preview, loans, currentCode, onApply, onPlan, applying }) {
  return <section className="rp-card" aria-labelledby="rp-preview-title" aria-live="polite">
    <div className="rp-card-head">
      <h2 id="rp-preview-title">반영 미리보기</h2>
      <span className="rp-chip neutral">{candidate.label} 선택</span>
    </div>
    {preview.status === 'loading' && <p className="rp-loading" role="status">미리보기를 계산하는 중…</p>}
    {preview.status === 'error' && <p className="rp-banner danger" role="alert"><span>{preview.error?.message || '미리보기를 계산하지 못했어요.'}</span></p>}
    {preview.status === 'ready' && <>
      <table className="rp-table">
        <thead><tr><th scope="col">항목</th><th scope="col">현재 계획</th><th scope="col" className="after">{candidate.label}</th></tr></thead>
        <tbody>
          {previewRows(preview.data, loans, currentCode).map(row => <tr key={row.key}>
            <th scope="row">{row.label}</th>
            <td>{row.before}</td>
            <td className="after"><b>{row.after}</b>{row.note && <span>{row.note}</span>}</td>
          </tr>)}
        </tbody>
      </table>
      <div className="rp-cta">
        <button type="button" className="rp-button outline" onClick={onPlan}>전체 상환 계획 보기 →</button>
        <p>반영하기 전까지 지금 계획은 바뀌지 않아요</p>
        <button type="button" className="rp-button primary" onClick={onApply} disabled={applying}>이 전략으로 계획에 반영하기</button>
      </div>
    </>}
  </section>
}
