import LoanDialog from './LoanDialog.jsx'
import { v2Icons } from '../v2Icons.js'
import { won } from '../../../api/format.js'
export default function LoanConfirmationDialog({kind,loan,item,onClose,onConfirm,onHistory,pending,error}) {
  const title=kind==='payment'?loan?.name+' '+item?.due_date.slice(5).replace('-','.')+' 납부했나요?':kind==='archive'?'완납으로 보관 중이에요':'론런에서 이 대출을 삭제할까요?'
  return <LoanDialog title={title} onClose={onClose} closeIcon={v2Icons.close} className="v2-confirm-dialog">
    <p>{kind==='payment'?'원리금 · 예정 '+won(item?.required_amount):kind==='archive'?'완납한 대출은 삭제하지 않고 완납으로 보관해요. 상환 기록은 언제든 다시 볼 수 있어요':'실제 대출이 갚아지는 건 아니에요. 론런 관리 목록과 기록에서만 사라져요'}</p>
    {error&&<p className="field-error" role="alert">{error}</p>}
    <footer>{kind==='archive'?<><button className="lm-button outline" onClick={onHistory}>상환 기록 보기</button><button className="lm-button primary" onClick={onClose}>확인</button></>:kind==='payment'?<><button className="lm-button outline" onClick={()=>onConfirm(false)}>아직 납부하지 않았어요</button><button className="lm-button primary" onClick={()=>onConfirm(true)}>예, 납부했어요</button></>:<><button className="lm-button outline" disabled={pending} onClick={onClose}>취소</button><button className="lm-button danger-solid" disabled={pending} onClick={onConfirm}>{pending?'삭제 중…':'삭제'}</button></>}</footer>
  </LoanDialog>
}