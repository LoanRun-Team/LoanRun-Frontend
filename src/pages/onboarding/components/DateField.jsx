import { useId, useRef, useState } from 'react'
import calendar from '../../../assets/onboarding/icon-calendar.svg'
import { fmtDate, maskDate, parseMaskedDate } from '../format.js'

// 실행일·만기일 입력. "2023. 03. 15" 모양이고 달력 아이콘을 누르면 브라우저 기본 날짜 선택기를 연다.
// readOnly 는 자동 계산된 값(만기일)을 보여줄 때 쓰는 비활성 표시. 값은 'YYYY-MM-DD' | null.
export default function DateField({ label, labelExtra, value, onChange, max, readOnly = false, placeholder = 'YYYY. MM. DD' }) {
  const id = useId()
  const pickerRef = useRef(null)
  const [text, setText] = useState(() => fmtDate(value))

  const labelNode = <label className="ob-label" htmlFor={id}>{label}</label>
  const head = labelExtra ? <div className="ob-label-row">{labelNode}{labelExtra}</div> : labelNode

  if (readOnly) {
    return <div className="ob-field readonly">
      {head}
      <input id={id} className="ob-input" type="text" value={fmtDate(value)} placeholder="자동 계산" readOnly />
    </div>
  }

  function handleText(e) {
    const masked = maskDate(e.target.value)
    setText(masked)
    onChange(parseMaskedDate(masked))
  }
  function handlePicker(e) {
    const iso = e.target.value || null
    setText(fmtDate(iso))
    onChange(iso)
  }

  return <div className="ob-field">
    {head}
    <div className="ob-date">
      <input id={id} type="text" inputMode="numeric" value={text} placeholder={placeholder} onChange={handleText} />
      <button type="button" aria-label="달력 열기" onClick={() => pickerRef.current?.showPicker?.()}>
        <img src={calendar} alt="" width="20" height="20" />
      </button>
      <input ref={pickerRef} className="ob-date-native" type="date" tabIndex={-1} aria-hidden="true" max={max} value={value ?? ''} onChange={handlePicker} />
    </div>
  </div>
}
