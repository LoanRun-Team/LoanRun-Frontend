export const won=value=>value==null?'—':Number(value).toLocaleString('ko-KR')+'원'
export const monthLabel=value=>value?Number(value.slice(0,4))+'년 '+Number(value.slice(5,7))+'월':'—'
export const dateLabel=value=>value?Number(value.slice(5,7))+'월 '+Number(value.slice(8,10))+'일':'—'
export const shortDate=value=>value?value.replaceAll('-','.'): '—'
export const seoulToday=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
export const incomeLabels={REGULAR:'정기 소득',IRREGULAR:'비정기 소득'}
export const trackLabels={ON_TRACK:'순항 중',BEHIND:'속도 조절 필요',AHEAD:'앞서 달리는 중',UNPAID:'미납'}
export const loanTypes={CREDIT:'신용대출',MORTGAGE:'주택담보대출',JEONSE:'전세자금대출',STUDENT:'학자금대출',AUTO:'자동차대출',OTHER:'기타'}

