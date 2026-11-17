import { useEffect, useRef } from 'react'
import { icons } from '../icons.js'
export default function LoanDialog({ title, onClose, children, className='', closeIcon=icons.close, headerExtra }) {
  const ref=useRef(null)
  useEffect(()=>{const dialog=ref.current;dialog.showModal();return()=>dialog.close()},[])
  return <dialog ref={ref} className={`loan-dialog ${className}`} aria-labelledby="loan-dialog-title" onCancel={e=>{e.preventDefault();onClose()}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>{headerExtra}<header><h2 id="loan-dialog-title">{title}</h2><button type="button" className="lm-icon-button" aria-label="닫기" onClick={onClose}><img src={closeIcon} alt=""/></button></header>{children}</dialog>
}
