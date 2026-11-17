import { seoulToday } from '../../api/format.js'
export function decorateLoan(loan,today=seoulToday()) {
  const dto=loan.dto||{}
  let graceEnd=null
  if(dto.repayment_method==='GRACE_INSTALLMENT'&&dto.start_date&&dto.grace_months){const end=new Date(dto.start_date+'T00:00:00Z');end.setUTCMonth(end.getUTCMonth()+dto.grace_months);graceEnd=end.toISOString().slice(0,10)}
  const stage=loan.balance===0||dto.status==='PAID'?'paid':graceEnd&&graceEnd>=today?'grace':'active'
  return {...loan,stage,graceEnd}
}
