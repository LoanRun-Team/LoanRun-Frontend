export default function LoanFilter({ loans, value, onChange }) {
  return <div className="loan-filter" role="group" aria-label="대출 선택">
    {[{ id: 'all', name: '전체' }, ...loans.toReversed()].map(loan => <button key={loan.id} type="button" className={value === loan.id ? 'selected' : ''} aria-pressed={value === loan.id} onClick={() => onChange(loan.id)}>{loan.name}{loan.id !== 'all' && ` · ${loan.bank}`}</button>)}
  </div>
}
