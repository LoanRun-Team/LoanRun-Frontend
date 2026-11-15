import { useEffect, useRef } from 'react'

export default function DetailDialog({ title, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    dialog.showModal()
    return () => dialog.close()
  }, [])
  return <dialog ref={ref} className="detail-dialog" aria-labelledby="dialog-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <header><h2 id="dialog-title">{title}</h2><button autoFocus className="outline-button" onClick={onClose}>닫기</button></header>
    <p>{title === 'PRO 시작하기' ? 'PRO에서는 재정 위험도와 상환 리포트를 확인할 수 있어요.' : `${title} 상세 화면은 준비 중이에요.`}</p>
  </dialog>
}

