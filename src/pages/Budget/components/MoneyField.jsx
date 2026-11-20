import { useId, useState } from 'react'
import { fmt } from '../budgetModel.js'

// 금액 입력. 오른쪽 정렬에 천 단위 쉼표, 단위는 "원"이고 값은 number | null 이다.
export default function MoneyField({ label, value, onChange, hideLabel = false, placeholder = '0' }) {
  const id = useId()
  const [text, setText] = useState(() => (value == null ? '' : fmt(value)))
  function handle(e) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 12)
    setText(digits ? fmt(Number(digits)) : '')
    onChange(digits ? Number(digits) : null)
  }
  return <div className="bd-field">
    <label htmlFor={id} className={hideLabel ? 'bd-sr-only' : ''}>{label}</label>
    <div className="bd-money"><input id={id} type="text" inputMode="numeric" value={text} placeholder={placeholder} onChange={handle} /><span>원</span></div>
  </div>
}
