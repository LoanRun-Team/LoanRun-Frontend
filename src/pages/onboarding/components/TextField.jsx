import { useId } from 'react'

// 라벨 + 48px 입력. 직접 입력(수기) 모드의 은행명/상품명 등에 사용.
export default function TextField({ label, value, onChange, placeholder, maxLength = 50 }) {
  const id = useId()
  return <div className="ob-field">
    <label className="ob-label" htmlFor={id}>{label}</label>
    <input id={id} className="ob-input" type="text" value={value} placeholder={placeholder} maxLength={maxLength} onChange={e => onChange(e.target.value)} />
  </div>
}
