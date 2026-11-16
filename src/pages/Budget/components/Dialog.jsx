import { useEffect, useRef } from 'react'
import closeIcon from '../../../assets/home/close.svg'

// 공통 모달(native dialog). 바깥 영역 클릭·Esc 로 닫힌다.
export default function Dialog({ title, onClose, children, className = '' }) {
  const ref = useRef(null)
  useEffect(() => { const dialog = ref.current; dialog.showModal(); return () => dialog.close() }, [])
  return <dialog ref={ref} className={`bd-dialog ${className}`} aria-labelledby="bd-dialog-title" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
    <header><h2 id="bd-dialog-title">{title}</h2><button type="button" className="bd-icon-button" aria-label="닫기" onClick={onClose}><img src={closeIcon} alt="" width="16" height="16" /></button></header>
    {children}
  </dialog>
}
