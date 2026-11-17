import iconUpload from '../../../assets/reports/icon-upload.svg'
import { compareLabel, periodLabel, updatedLabel } from '../reportModel.js'

// Figma F4: 제목 + AI 리포트 칩 + PDF 저장, 아래에 리포트 메타(갱신일 · 분석 기간 · 비교 기준).
export default function ReportHeader({ report, onCompare }) {
  const compare = report ? compareLabel(report.comparison) : ''
  return <>
    <header className="rp-header">
      <div className="rp-title">
        <h1>상환 리포트</h1>
        <span className="rp-badge">AI 리포트</span>
      </div>
      {report && <button type="button" className="rp-button outline" onClick={() => window.print()}><img src={iconUpload} alt="" width="20" height="20" />PDF로 저장</button>}
    </header>
    {report && <p className="rp-meta">
      <span>{updatedLabel(report)}{report.pace_analysis?.observed_month_count > 0 ? ' · 납부 기록 반영' : ''}</span>
      <i aria-hidden="true" />
      <span>{periodLabel(report)}</span>
      {compare && <><i aria-hidden="true" /><span>비교 기준</span><button type="button" className="rp-pill" onClick={onCompare} aria-haspopup="dialog">{compare}</button></>}
    </p>}
  </>
}
