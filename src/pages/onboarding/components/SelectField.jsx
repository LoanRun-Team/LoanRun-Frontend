import { useEffect, useId, useRef, useState } from 'react'
import chevronDown from '../../../assets/onboarding/icon-chevron-down.svg'
import check from '../../../assets/onboarding/icon-check.svg'
import chevronRight from '../../../assets/onboarding/icon-chevron-right.svg'

// Figma: Dropdown (closed / open / disabled) + Option (default / selected) + 메뉴 하단 직접 입력.
// options: [{ value, label }], value: 선택된 option.value, footerAction: { label, onClick }
export default function SelectField({ label, hideLabel = false, options = [], value, onChange, placeholder = '선택해 주세요', disabled = false, emptyText = '선택할 수 있는 항목이 없어요', footerAction, helper }) {
  const [openState, setOpen] = useState(false)
  const open = openState && !disabled // 비활성이 되면 메뉴도 닫힌 것으로 본다
  const rootRef = useRef(null)
  const labelId = useId()
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    if (!open) return
    const close = e => { if (!rootRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  function pick(option) { onChange(option.value); setOpen(false) }

  return <div className={`ob-field${disabled ? ' disabled' : ''}`} ref={rootRef} onKeyDown={e => { if (e.key === 'Escape') setOpen(false) }}>
    <span className={hideLabel ? 'ob-sr-only' : 'ob-label'} id={labelId}>{label}</span>
    <button type="button" className={`ob-control${open ? ' open' : ''}`} aria-labelledby={labelId} aria-haspopup="listbox" aria-expanded={open} disabled={disabled} onClick={() => setOpen(o => !o)}>
      <span className={`ob-control-value${selected ? '' : ' placeholder'}`}>{selected ? selected.label : placeholder}</span>
      <img src={chevronDown} alt="" width="20" height="20" />
    </button>
    {open && <div className="ob-menu">
      {options.length ? <ul role="listbox" aria-labelledby={labelId}>
        {options.map(o => <li key={o.value} role="option" aria-selected={o.value === value}>
          <button type="button" className={o.value === value ? 'selected' : ''} onClick={() => pick(o)}>
            <span>{o.label}</span>
            {o.value === value && <img src={check} alt="" width="20" height="20" />}
          </button>
        </li>)}
      </ul> : <p className="ob-menu-empty">{emptyText}</p>}
      {footerAction && <>
        <hr />
        <button type="button" className="ob-menu-footer" onClick={() => { setOpen(false); footerAction.onClick() }}>
          <span>{footerAction.label}</span>
          <img src={chevronRight} alt="" width="20" height="20" />
        </button>
      </>}
    </div>}
    {helper && <p className="ob-helper">{helper}</p>}
  </div>
}
