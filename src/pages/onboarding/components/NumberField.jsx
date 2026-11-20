import { useId, useState } from 'react'
import { fmtNumber } from '../format.js'

const display = (value, decimals) => (value == null ? '' : decimals ? String(value) : fmtNumber(value))

// 오른쪽 정렬 숫자 입력과 단위. decimals>0 이면 소수 입력(금리), 아니면 천 단위 쉼표 정수(금액·개월).
// 값은 number | null 로 올린다. 입력 중에는 직접 친 문자열을 그대로 두고, 포커스가 없을 때 value 가 바뀌면(계산 결과 등) 표시를 맞춘다.
export default function NumberField({ label, labelExtra, hideLabel = false, value, onChange, unit, decimals = 0, placeholder = '0', disabled = false, helper, onCommit }) {
  const id = useId()
  const [text, setText] = useState(() => display(value, decimals))
  const [focused, setFocused] = useState(false)
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    if (!focused) setText(display(value, decimals))
  }

  function handle(e) {
    const raw = e.target.value
    if (decimals) {
      const m = raw.replace(/[^\d.]/g, '').match(new RegExp(`^(\\d*)(\\.\\d{0,${decimals}})?`))
      const next = m ? m[0] : ''
      setText(next)
      onChange(next === '' || next === '.' ? null : Number(next))
      return
    }
    const digits = raw.replace(/\D/g, '').slice(0, 15)
    setText(digits ? fmtNumber(Number(digits)) : '')
    onChange(digits ? Number(digits) : null)
  }

  return <div className={`ob-field${disabled ? ' disabled' : ''}`}>
    {hideLabel ? <label className="ob-sr-only" htmlFor={id}>{label}</label>
      : labelExtra ? <div className="ob-label-row"><label className="ob-label" htmlFor={id}>{label}</label>{labelExtra}</div>
        : <label className="ob-label" htmlFor={id}>{label}</label>}
    <div className="ob-number">
      <input id={id} type="text" inputMode={decimals ? 'decimal' : 'numeric'} value={text} placeholder={placeholder} disabled={disabled}
        onChange={handle} onFocus={() => setFocused(true)} onBlur={() => { setFocused(false); setText(display(value, decimals)); onCommit?.(value) }} />
      {unit && <span>{unit}</span>}
    </div>
    {helper && <p className="ob-helper">{helper}</p>}
  </div>
}
