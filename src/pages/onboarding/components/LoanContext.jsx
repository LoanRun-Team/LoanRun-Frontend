import { loanChipLabel, loanContext } from '../planModel.js'

// 대출 종류 칩과 요약 한 줄.
export default function LoanContext({ loan }) {
  return <p className="ob-loan-context"><span className="ob-chip large">{loanChipLabel(loan)}</span><span>{loanContext(loan)}</span></p>
}
