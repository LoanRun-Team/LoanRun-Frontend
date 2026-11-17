import { useEffect,useRef,useState } from 'react'
import closeIcon from '../../../assets/common/close.svg'

const fields=[['fixed_essential_expenses','고정 필수 지출'],['variable_essential_expenses','변동 필수 지출'],['discretionary_expenses','선택 지출'],['savings','저축'],['emergency_fund','비상금']]
export default function ExpensesDialog({finance,onClose,onSave,pending,error}) {
  const ref=useRef(null),[values,setValues]=useState(()=>Object.fromEntries(fields.map(([key])=>[key,String(finance[key]??0)])))
  useEffect(()=>{const dialog=ref.current;dialog.showModal();return()=>dialog.close()},[])
  const valid=Object.values(values).every(v=>v!==''&&Number.isSafeInteger(Number(v))&&Number(v)>=0)
  return <dialog ref={ref} className="settings-expenses-dialog" aria-labelledby="expenses-title" onCancel={e=>{e.preventDefault();onClose()}}>
    <header><h2 id="expenses-title">지출 입력</h2><button aria-label="닫기" disabled={pending} onClick={onClose}><img src={closeIcon} alt=""/></button></header>
    <form onSubmit={e=>{e.preventDefault();if(valid&&!pending)onSave({...finance,...Object.fromEntries(Object.entries(values).map(([k,v])=>[k,Number(v)]))})}}>
      <fieldset disabled={pending}>{fields.map(([key,label])=><label key={key}><span>{label}</span><div><input aria-label={label} type="text" inputMode="numeric" required pattern="[0-9]+" value={values[key]} onChange={e=>setValues(prev=>({...prev,[key]:e.target.value.replace(/[^0-9]/g,'')}))}/><span>원</span></div></label>)}</fieldset>
      {error&&<p role="alert">{error}</p>}
      <footer><button type="button" className="settings-button" disabled={pending} onClick={onClose}>취소</button><button className="settings-button primary" disabled={pending||!valid}>{pending?'저장 중…':'저장'}</button></footer>
    </form>
  </dialog>
}
