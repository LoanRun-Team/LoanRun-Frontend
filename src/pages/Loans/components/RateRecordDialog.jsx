import { useState } from 'react'
import LoanDialog from './LoanDialog.jsx'
import { seoulToday } from '../../../api/format.js'

export default function RateRecordDialog({loan,onSave,onClose,pending,error}){
  const [date,setDate]=useState(seoulToday()),[rate,setRate]=useState(String(loan.rate))
  return <LoanDialog title="금리 변경 기록" onClose={onClose}><form onSubmit={event=>{event.preventDefault();if(!pending)onSave({effective_date:date,annual_rate:Number(rate)})}}>
    {error&&<p role="alert">{error}</p>}<fieldset className="v2-fieldset" disabled={pending}>
      <label className="lm-field"><span>적용일</span><input type="date" required max={seoulToday()} value={date} onChange={event=>setDate(event.target.value)}/></label>
      <label className="lm-field"><span>변경 금리 (%)</span><input type="text" inputMode="decimal" required pattern="[0-9]+([.][0-9]{1,2})?" value={rate} onChange={event=>setRate(event.target.value)}/></label>
      <footer><button type="button" className="lm-button outline" onClick={onClose}>취소</button><button className="lm-button primary" disabled={rate===''||Number(rate)<0||Number(rate)>=30}>저장</button></footer>
    </fieldset>
  </form></LoanDialog>
}
