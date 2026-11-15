import { money } from '../data.js'
export default function PaymentHistory({ loans, history, filter }) {
  const rows = history.filter(row => filter === 'all' || row.loanId === filter)
  const sum = key => rows.reduce((total, row) => total + row[key], 0)
  return <>
    <section className="lm-card history-summary"><div className="summary-band"><div><p>총 납부</p><strong>{money(sum('amount'))}<small>원</small></strong></div><div><p>원금 합계</p><strong>{money(sum('principal'))}<small>원</small></strong></div><div><p>이자 합계</p><strong>{money(sum('interest'))}<small>원</small></strong></div></div><div className="payment-stack"><span style={{ width: (sum('amount') ? sum('principal') / sum('amount') * 100 : 0) + '%' }} /></div><div className="chart-legend"><span><i />원금 {money(sum('principal'))}원</span><span><i className="interest" />이자 {money(sum('interest'))}원</span></div></section>
    <section className="lm-card"><h2>대출별 납부 내역</h2><div className="lm-table-scroll"><table className="lm-table"><thead><tr>{['납부일', '대출', '납부액', '원금', '이자', '상환 후 잔액'].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{row.date}</td><td>{loans.find(loan => loan.id === row.loanId)?.name}</td><td>{money(row.amount)}원</td><td>{money(row.principal)}원</td><td>{money(row.interest)}원</td><td>{money(row.balance)}원</td></tr>)}</tbody><tfoot><tr><th>합계</th><td>{rows.length}건</td><td>{money(sum('amount'))}원</td><td>{money(sum('principal'))}원</td><td>{money(sum('interest'))}원</td><td>—</td></tr></tfoot></table></div></section>
  </>
}
