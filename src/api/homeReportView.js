export async function loadHomeReport(api,plan,signal) {
  if(plan==='Free')return {locked:true,is_new:false,updated_at:null,status:'NOT_GENERATED'}
  const report=await api.latestReport(signal)
  return {...report,locked:false,updated_at:report.generated_at??report.updated_at??null,is_new:report.status==='COMPLETED'&&!report.stale}
}
