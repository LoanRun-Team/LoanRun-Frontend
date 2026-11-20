// Display rules only. Financial amounts and payment totals come from the API.
export function paymentStatus(item,today,{confirmedUnpaid=false}={}) {
  if(item.status==='PAID'||(item.required_amount>0&&item.paid_required_amount>=item.required_amount))return {key:'paid',label:'납부 완료'}
  if(item.paid_required_amount>0)return {key:'partial',label:'부분 납부'}
  if(item.unpaid_confirmed||confirmedUnpaid)return {key:'unpaid',label:'미납'}
  if(item.due_date<today)return {key:'unrecorded',label:'납부 미기록'}
  return {key:'upcoming',label:'납부 예정'}
}
export function extraStatus(item) {
  if(item.planned_extra_amount==null)return {key:'unknown',label:'목표 미확인'}
  if(!item.planned_extra_amount)return {key:'none',label:'목표 없음'}
  return item.paid_extra_amount>=item.planned_extra_amount?{key:'achieved',label:'달성'}:{key:'unachieved',label:'미달성'}
}
