import { useEffect, useState } from 'react'
import newBadge from '../../../assets/home/report-new-badge.svg'
import chevron from '../../../assets/home/report-chevron-right.svg'
export default function ReportEntry({report,onOpen,now}) {
  const [clock,setClock]=useState(Date.now)
  useEffect(()=>{
    const remaining=Date.parse(report.updated_at)+24*60*60*1000-Date.now()
    if(remaining<=0||!Number.isFinite(remaining))return
    const timer=setTimeout(()=>setClock(Date.now()),remaining)
    return()=>clearTimeout(timer)
  },[report.updated_at])
  const age=report.updated_at?(now??clock)-Date.parse(report.updated_at):Infinity
  const isNew=report.is_new&&age>=0&&age<24*60*60*1000
  const date=report.updated_at?new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(report.updated_at)).replaceAll('-','.') : null
  return <button className="card report-entry" onClick={onOpen}>
    <span className="report-entry-text"><span className="report-entry-title">상환 리포트 보기{isNew&&<img src={newBadge} alt="새 리포트"/>}</span><span className="report-entry-date">{report.locked?'PRO에서 확인할 수 있어요':date?'업데이트 '+date+(report.stale?' · 갱신 필요':''):'아직 생성된 리포트가 없어요'}</span></span><img src={chevron} alt="" />
  </button>
}
