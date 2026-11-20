const levels={STABLE:{label:'안정',marker:16},CAUTION:{label:'주의',marker:50},DANGER:{label:'위험',marker:84}}

function threshold(value,kind){
  if(value==null||value===''||!Number.isFinite(Number(value)))return '—'
  const number=Number(value),text=Math.abs(number).toLocaleString('ko-KR',{maximumFractionDigits:2})
  const sign=number===0?'':kind==='income'?'−':'+'
  return sign+text+{rate:'%p',income:'%',expense:'원'}[kind]
}

export function homeRiskView(risk){
  const level=levels[risk?.level]
  return {label:level?.label||'자료 부족',markerPercent:level?.marker??null,rows:[
    ['rate','금리',risk?.rate_thresholds],['income','소득',risk?.income_thresholds],['expense','선택 지출',risk?.expense_thresholds],
  ].map(([key,label,values])=>({key,label,value:threshold(values?.basic_at_risk_from,key)+' / '+threshold(values?.reduce_extra_from,key)}))}
}

export function loadHomeRisk(api,plan,signal){
  return plan==='Pro'?api.risks(signal):Promise.resolve(null)
}
