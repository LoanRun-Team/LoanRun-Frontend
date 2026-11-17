import { useEffect, useRef } from 'react'

import closeIcon from '../../../assets/common/close.svg'
import './ProDialog.scss'

export default function DetailDialog({ title, onClose, onProStart }) {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    dialog.showModal()
    return () => dialog.close()
  }, [])
  if (title === 'PRO 시작하기') return <dialog ref={ref} className="pro-dialog" aria-labelledby="pro-dialog-title" onCancel={onClose}>
    <header><h2 id="pro-dialog-title">PRO로 더 안전하게 갚아보세요</h2><button aria-label="닫기" onClick={onClose}><img src={closeIcon} alt="" /></button></header>
    <ul><li>위험 분석: 재정에 어떤 위험 요소가 있는지 알 수 있어요. </li><li>지출 시나리오: 큰 지출이 생겼을 때 완납일 변화를 알아 보세요.</li><li>상환 리포트: 또래와 비교하고, 내 상환 속도와 완납 가능성을 알려드려요.</li></ul>
    <footer><button className="pro-later" onClick={onClose}>나중에</button><button className="pro-start" onClick={onProStart || (() => { window.location.href = '/settings/plan' })}>PRO 시작하기</button></footer>
  </dialog>
  return <dialog ref={ref} className="detail-dialog" aria-labelledby="dialog-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <header><h2 id="dialog-title">{title}</h2><button autoFocus className="outline-button" onClick={onClose}>닫기</button></header>
    <p>{['로그아웃', '회원 탈퇴'].includes(title) ? '계정 서비스 연결 후 이용할 수 있어요.' : `${title} 상세 화면은 준비 중이에요.`}</p>
  </dialog>
}

