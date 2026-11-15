import { clampPercent } from '../../../components/Charts/chartGeometry.js'
import { useState } from 'react'
import LoanFilter from './LoanFilter.jsx'
import { money } from '../data.js'
import { icons } from '../icons.js'

export default function MonthlyPayments({ loans, filter, onFilter, records, onRecord, summary }) {
  const [month, setMonth] = useState(10)
  const [day, setDay] = useState(9)
  const date = new Date(2026, month, 1)
  const year = date.getFullYear(), monthNumber = date.getMonth() + 1
  const count = new Date(year, monthNumber, 0).getDate()
  const visible = loans.toSorted((a,b)=>a.day-b.day).filter(loan => !loan.custom && (filter === 'all' || loan.id === filter))
  const isNovember = year === 2026 && monthNumber === 11
  const extraRows = [{ id: 'seed-extra', loanId: 'credit', amount: 100000, date: '2026-11-09', type: 'extra' }, ...records.filter(row => row.type === 'extra')].filter(row => (filter === 'all' || row.loanId === filter) && row.date.startsWith(`${year}-${String(monthNumber).padStart(2,'0')}`))
  const paid = loan => loan.paid ?? (loan.id === 'credit' || records.some(row => row.loanId === loan.id && row.type === 'regular' && row.date.startsWith('2026-11')))
  const dayLoans = isNovember ? visible.filter(loan => loan.day === day) : []
  const completed = summary?.completed ?? visible.reduce((sum, loan) => sum + (paid(loan) ? loan.payment : 0), 0)
  const total = summary?.total ?? visible.reduce((sum, loan) => sum + loan.payment, 0)
  return <div className="monthly-layout">
    <section className="lm-card repayment-calendar"><h2>상환 캘린더</h2><LoanFilter loans={loans.filter(loan => !loan.custom)} value={filter} onChange={onFilter} />
      <div className="calendar-heading"><strong>{year}년 {monthNumber}월</strong><div><button aria-label="이전 달" onClick={() => {setMonth(month - 1);setDay(1)}}><img src={icons.calendarPrevious} alt="" /></button><button aria-label="다음 달" onClick={() => {setMonth(month + 1);setDay(1)}}><img src={icons.calendarNext} alt="" /></button></div></div>
      <div className="calendar-weekdays">{['일','월','화','수','목','금','토'].map(d => <span key={d}>{d}</span>)}</div>
      <div className="calendar-days">{Array.from({ length: date.getDay() }, (_, i) => <span key={'blank'+i} />)}{Array.from({ length: count }, (_, i) => i + 1).map(d => <button key={d} className={`${day === d ? 'selected ' : ''}${(date.getDay()+d-1)%7 === 0 ? 'sunday' : ''}`} aria-label={`${monthNumber}월 ${d}일`} aria-pressed={day === d} onClick={() => setDay(d)}><span>{d}</span>{isNovember && ((d === 9 && filter !== 'mortgage') || visible.some(loan => loan.day === d)) && <img src={d === 9 ? icons.calendarExtra : icons.calendarPayment} alt={d === 9 ? '추가 상환' : '정기 납부'} />}</button>)}</div>
      <div className="calendar-legend">{[['regular','정기 납부'],['extra','추가 상환'],['overdue','미납']].map(([type,label]) => <span key={type}><img src={icons['legend'+type]} alt="" />{label}</span>)}</div>
      <div className="selected-day"><div><strong>{monthNumber}월 {day}일 ({['일','월','화','수','목','금','토'][new Date(year,month,day).getDay()]})</strong><span>일정 {dayLoans.length}건</span></div><div className="day-details">{dayLoans.length ? dayLoans.map(loan => <button className="lm-text" key={loan.id} onClick={() => onRecord({ type:'regular', loanId:loan.id })}>{loan.name} · {money(loan.payment)}원 · 납부 기록</button>) : <><p>이 날은 예정된 일정이 없어요</p><small>{isNovember ? '다음 일정 11.25 주택담보대출 정기 납부 약 700,000원' : '등록된 상환 일정이 없어요'}</small></>}</div></div>
    </section>
    <div className="monthly-schedule"><section className="lm-card monthly-progress"><strong>{isNovember ? `이번 달 정기 납부 약 ${money(total)}원 중 ${money(completed)}원 완료` : `${year}년 ${monthNumber}월 상환 일정`}</strong><div className="payment-stack"><span style={{ width: isNovember && total ? clampPercent(completed / total * 100) + '%' : '0%' }} /></div><p>추가 상환 {money(extraRows.reduce((sum,r)=>sum+r.amount,0))}원 기록</p></section><header className="monthly-schedule-heading"><h2>이번 달 상환 일정</h2><button className="lm-button outline small" onClick={() => onRecord({type:'regular',loanId:filter === 'all' ? 'credit' : filter})}>납부 기록하기</button></header>
      <section className="lm-card schedule-card"><header><strong>정기 납부</strong><span>매월 자동</span></header>{isNovember ? visible.map(loan => <button className="scheduled-payment" key={loan.id} onClick={() => onRecord({ type:'regular', loanId:loan.id })}><time>11.{loan.day} ({loan.day === 15 ? '일' : '수'})</time><span>{loan.name}</span><span className="lm-chip">원리금</span><strong>{paid(loan) ? `11.14 납부 ${money(loan.payment)}원` : `예정 약 ${money(loan.payment)}원`}</strong><span className={`payment-state ${paid(loan) ? 'paid' : ''}`}>{paid(loan) ? '납부 완료' : '납부 전'}</span></button>) : <p className="empty-schedule">등록된 정기 납부가 없어요</p>}
        <header className="extra-heading"><strong>추가 상환</strong><span>이번 달 목표 100,000원 · 기록 {money(extraRows.reduce((sum,r)=>sum+r.amount,0))}원</span></header>{extraRows.map(row => <div className="scheduled-payment" key={row.id}><time>{Number(row.date.slice(5,7))}.{Number(row.date.slice(8))} (월)</time><span>{loans.find(loan=>loan.id === row.loanId)?.name}</span><strong>{money(row.amount)}원</strong><span className="payment-state">기록됨</span></div>)}
      </section>
    </div>
  </div>
}
